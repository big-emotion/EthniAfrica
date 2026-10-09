import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, resolve } from "node:path";
import { parse } from "csv-parse/sync";
import ts from "typescript";

const PROJECT_ROOT = resolve(import.meta.dirname, "../..");

// @req REQ-178
export interface CopyUnit {
  file: string;
  location: string;
  text: string;
}

// @req REQ-178
export interface CopyFinding {
  unit: CopyUnit;
  rule: string;
  severity: "error" | "warning" | "suggestion";
  message: string;
}

// Source wording and technical metadata are not project-authored explanations.
const PROTECTED_KEYS = new Set([
  "en",
  "_meta",
  "quote",
  "quotation",
  "verbatim",
  "originalText",
  "rawText",
  "researchNotes",
  "formAsWritten",
  "author",
  "authors",
  "attestedBy",
  "url",
  "href",
  "src",
  "id",
  "tier",
  "source_kind",
  "sourceKind",
  "sourceRefs",
  "sourceKey",
  "fieldPath",
  "figureKey",
  "figureRefs",
  "sitePath",
  "languageOfOrigin",
  "entityType",
  "nameType",
  "usedIn",
  "nameText",
]);
const BIBLIOGRAPHIC_KEYS = new Set([
  "source",
  "sources",
  "reference",
  "references",
]);
const COPY_ATTRIBUTE =
  /^(?:alt|title|placeholder|label|description|aria-label|aria-description|children|content|text|subtitle|heading|message|hint)$/;

function jsonCopy(
  value: unknown,
  file: string,
  location = "$",
  bibliography = false
): CopyUnit[] {
  if (typeof value === "string")
    return bibliography ? [] : [{ file, location, text: value }];
  if (Array.isArray(value))
    return value.flatMap((v, i) =>
      jsonCopy(v, file, `${location}[${i}]`, bibliography)
    );
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    if (key.startsWith("_") || PROTECTED_KEYS.has(key)) return [];
    if (bibliography && key !== "notes") return [];
    return jsonCopy(
      child,
      file,
      `${location}.${key}`,
      BIBLIOGRAPHIC_KEYS.has(key)
    );
  });
}

function staticText(node: ts.Node): string | undefined {
  if (
    ts.isJsxElement(node) &&
    /^(blockquote|cite|style|script)$/.test(
      node.openingElement.tagName.getText()
    )
  )
    return " ";
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isJsxText(node)) return node.text.replace(/\s+/g, " ");
  if (ts.isJsxExpression(node))
    return node.expression ? (staticText(node.expression) ?? " … ") : "";
  if (ts.isParenthesizedExpression(node)) return staticText(node.expression);
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = staticText(node.left),
      right = staticText(node.right);
    return left !== undefined && right !== undefined ? left + right : undefined;
  }
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    const text = node.children
      .map((child) => staticText(child) ?? " … ")
      .join("");
    return ts.isJsxElement(node) &&
      /^(p|div|section|article|li|h[1-6])$/.test(
        node.openingElement.tagName.getText()
      )
      ? ` ${text} `
      : text;
  }
  return undefined;
}

function codeCopy(file: string, source: string): CopyUnit[] {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    /\.[jt]sx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const units: CopyUnit[] = [];
  const dictionary =
    /(?:i18n\/copy|translations|lib\/(?:home|games|dossiers|glossaire|doctrine|email)|brand)/.test(
      file
    );
  const add = (node: ts.Node, text: string) => {
    const { line, character } = ast.getLineAndCharacterOfPosition(
      node.getStart(ast)
    );
    units.push({ file, location: `${line + 1}:${character + 1}`, text });
  };
  const visit = (node: ts.Node, insideJsx = false): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (
      ts.isPropertyAssignment(node) &&
      PROTECTED_KEYS.has(node.name.getText(ast).replace(/['"]/g, ""))
    )
      return;
    if (
      ts.isJsxElement(node) &&
      /^(blockquote|cite|style|script)$/.test(
        node.openingElement.tagName.getText(ast)
      )
    )
      return;
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      if (!insideJsx) add(node, staticText(node) ?? "");
      ts.forEachChild(node, (child) => visit(child, true));
      return;
    }
    if (
      insideJsx &&
      ts.isJsxExpression(node) &&
      node.expression &&
      staticText(node.expression) === undefined
    ) {
      visit(node.expression, false);
      return;
    }
    if (ts.isJsxAttribute(node)) {
      if (COPY_ATTRIBUTE.test(node.name.getText(ast)) && node.initializer) {
        if (
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression &&
          staticText(node.initializer.expression) === undefined
        ) {
          visit(node.initializer.expression);
        } else {
          const value = staticText(node.initializer);
          if (value !== undefined) add(node, value);
        }
      }
      return;
    }
    if (!insideJsx && ts.isBinaryExpression(node)) {
      const value = staticText(node);
      if (value !== undefined) {
        add(node, value);
        return;
      }
    }
    if (
      !insideJsx &&
      (ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node))
    ) {
      const parent = node.parent;
      const key = ts.isPropertyAssignment(parent)
        ? parent.name.getText(ast).replace(/['"]/g, "")
        : ts.isVariableDeclaration(parent)
          ? parent.name.getText(ast)
          : "";
      if (ts.isPropertyAssignment(parent) && parent.name === node) return;
      if (
        (dictionary || COPY_ATTRIBUTE.test(key) || /\s/.test(node.text)) &&
        !/^(?:https?:|\/|[\w@.-]+\/)/.test(node.text)
      )
        add(node, node.text);
      return;
    }
    ts.forEachChild(node, (child) => visit(child, insideJsx));
  };
  visit(ast);
  return units;
}

function proseCopy(file: string, source: string): CopyUnit[] {
  let prose = source;
  if (/\.html?$/.test(file)) {
    prose = prose
      .replace(/<(script|style|blockquote|cite)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<\/(?:p|div|h[1-6]|li|section)>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
  } else if (/\.(srt|vtt)$/.test(file)) {
    prose = prose
      .replace(/^WEBVTT.*$|^\d+$|^.*-->.*$/gm, "")
      .replace(/\n(?=[^\n])/g, " ");
  } else {
    prose = prose
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
      .replace(/```[\s\S]*?```|~{3}[\s\S]*?~{3}/g, "")
      .replace(/^\s*>.*$/gm, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<!--[^]*?-->/g, "");
  }
  return prose
    .split(/\n\s*\n/)
    .map((text, i) => ({ file, location: `paragraph:${i + 1}`, text }));
}

/** Extract public prose before linting; never rewrite the source to make it pass. */
// @req REQ-178
export function extractCopy(file: string, source: string): CopyUnit[] {
  const extension = extname(file).toLowerCase();
  let units: CopyUnit[];
  if (extension === ".json") units = jsonCopy(JSON.parse(source), file);
  else if (extension === ".csv")
    units = jsonCopy(
      parse(source, { columns: true, skip_empty_lines: true, bom: true }),
      file
    );
  else if (/^\.[cm]?[jt]sx?$/.test(extension)) units = codeCopy(file, source);
  else if (
    [".md", ".mdx", ".txt", ".html", ".htm", ".srt", ".vtt"].includes(extension)
  )
    units = proseCopy(file, source);
  else
    throw new Error(
      `Unsupported editorial format: ${file}. Check its final text separately.`
    );
  return units
    .map((u) => ({
      ...u,
      text: u.text.normalize("NFC").replace(/\s+/g, " ").trim(),
    }))
    .filter((u) => u.text.length > 0);
}

/** All entry points use the same pinned local Vale and the same checked-in rules. */
// @req REQ-178
export function lintCopy(
  units: CopyUnit[],
  valeBin = resolve(
    PROJECT_ROOT,
    "node_modules/@vvago/vale/native",
    process.platform === "win32" ? "vale.exe" : "vale"
  )
): CopyFinding[] {
  const findings: CopyFinding[] = [];
  if (!units.length) return findings;
  // File input avoids intermittent stdin stalls in large local Vale runs.
  const scratch = mkdtempSync(resolve(tmpdir(), "ethniafrica-vale-"));
  const inputFile = resolve(scratch, "copy.txt");
  try {
    for (let start = 0; start < units.length; start += 2000) {
      const batch = units.slice(start, start + 2000);
      writeFileSync(
        inputFile,
        batch.map((u) => u.text.replace(/\s+/g, " ")).join("\n"),
        { mode: 0o600 }
      );
      const run = spawnSync(
        valeBin,
        [
          "--config",
          resolve(PROJECT_ROOT, ".vale.ini"),
          "--no-global",
          "--no-exit",
          "--output=JSON",
          inputFile,
        ],
        {
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
          timeout: 30_000,
        }
      );
      if (run.error || run.status !== 0)
        throw new Error(
          `Vale could not check the text: ${run.error?.message ?? run.stderr}`
        );
      let result: Record<
        string,
        Array<{
          Line: number;
          Check: string;
          Severity: CopyFinding["severity"];
          Message: string;
        }>
      >;
      try {
        result = JSON.parse(run.stdout);
      } catch {
        throw new Error(
          "Vale returned an unreadable report; no editorial approval was produced."
        );
      }
      for (const alerts of Object.values(result)) {
        if (!Array.isArray(alerts))
          throw new Error("Vale returned an invalid report.");
        for (const alert of alerts) {
          const unit = batch[alert.Line - 1];
          if (!unit || !alert.Check || !alert.Severity)
            throw new Error("Vale returned an unmapped alert.");
          findings.push({
            unit,
            rule: alert.Check,
            severity: alert.Severity,
            message: alert.Message,
          });
        }
      }
    }
    return findings;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** A correction cannot lend its old allowance to a new sentence or another field. */
// @req REQ-178
export function findingKey(finding: CopyFinding): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        finding.unit.file,
        finding.unit.location,
        finding.unit.text,
        finding.rule,
      ])
    )
    .digest("hex");
}

// @req REQ-178
export function classifyFindings(findings: CopyFinding[], baseline: string[]) {
  const known = new Set(baseline);
  return {
    errors: findings.filter(
      (f) => f.severity === "error" && !known.has(findingKey(f))
    ),
    legacy: findings.filter(
      (f) => f.severity === "error" && known.has(findingKey(f))
    ),
    warnings: findings.filter((f) => f.severity !== "error"),
  };
}

// @req REQ-178
export function readCopy(file: string, root = PROJECT_ROOT): CopyUnit[] {
  return extractCopy(file, readFileSync(resolve(root, file), "utf8"));
}
