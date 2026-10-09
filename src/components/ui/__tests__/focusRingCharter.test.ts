// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import { describe, expect, it } from "vitest";

import tailwindConfig from "../../../../tailwind.config";
import { CHARTER_FOCUS_RING } from "../charter-motion";

/**
 * The shared focus ring drew nothing: Tailwind 3 reads an untyped arbitrary
 * var() on the shadow utility as a shadow *colour*, so the utility only set
 * `--tw-shadow-color` and never a `box-shadow`. A string assertion on the
 * class could not see that; compiling it through the project's own Tailwind
 * config can.
 */
async function compileUtilities(classNames: string): Promise<string> {
  const result = await postcss([
    tailwindcss({
      ...tailwindConfig,
      content: [
        { raw: `<div class="${classNames}"></div>`, extension: "html" },
      ],
      corePlugins: { preflight: false },
    }),
  ]).process("@tailwind utilities;", { from: undefined });
  return result.css;
}

const ROOT = process.cwd();

// Spelled in pieces: this file sits under Tailwind's content globs, and the
// literal class here would be compiled into the site's stylesheet.
const UNTYPED_SHADOW_VAR = new RegExp(
  ["shadow-", "\\[", "var\\("].join(""),
  "g"
);
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : listSourceFiles(path);
    }
    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

function hexLuminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255
  );
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = [hexLuminance(a), hexLuminance(b)].sort(
    (x, y) => y - x
  );
  return (light + 0.05) / (dark + 0.05);
}

const COLOR_CSS = readFileSync(
  join(ROOT, "src/styles/tokens/color.css"),
  "utf8"
);

/** Follows `var(--x)` through color.css until it reaches a hex. */
function resolveHex(value: string): string {
  const alias = value.match(/^var\((--[\w-]+)\)$/);
  if (!alias) return value;
  const declared = COLOR_CSS.match(new RegExp(`${alias[1]}:\\s*([^;]+);`));
  if (!declared) throw new Error(`${alias[1]} is not declared in color.css`);
  return resolveHex(declared[1].trim());
}

/** The value a property takes inside the first rule whose selector starts so. */
function declaredIn(selectorStart: string, property: string): string {
  const ruleStart = COLOR_CSS.indexOf(`\n${selectorStart}`);
  if (ruleStart < 0) throw new Error(`no rule starting with ${selectorStart}`);
  const body = COLOR_CSS.slice(ruleStart, COLOR_CSS.indexOf("\n}", ruleStart));
  const declared = body.match(new RegExp(`${property}:\\s*([^;]+);`));
  if (!declared)
    throw new Error(`${property} is not set under ${selectorStart}`);
  return declared[1].trim();
}

describe("charter focus ring (WCAG 2.2 focus appearance)", () => {
  // @req REQ-047
  it("compiles CHARTER_FOCUS_RING to a box-shadow drawn from --afh-ring-focus", async () => {
    const css = await compileUtilities(CHARTER_FOCUS_RING);
    const rule = css
      .split("}")
      .find(
        (block) => block.includes(":focus-visible") && block.includes("shadow")
      );

    expect(rule).toBeDefined();
    expect(rule).toContain("--tw-shadow: var(--afh-ring-focus)");
    expect(rule).toMatch(/box-shadow:[^;]*var\(--tw-shadow\)/);
  });

  // An untyped arbitrary var() on the shadow utility is a colour to Tailwind,
  // never a shadow, so it can only ever reproduce the invisible ring.
  // @req REQ-047
  it("leaves no untyped arbitrary var() on the shadow utility in src", () => {
    const offenders = listSourceFiles(join(ROOT, "src")).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(UNTYPED_SHADOW_VAR)].map(() =>
        relative(ROOT, file)
      )
    );

    expect(offenders).toEqual([]);
  });

  // The ring is a 2px band of the ink colour outside a 2px gap of the page
  // ground, so the band must clear 3:1 against every ground it can sit on.
  // @req REQ-047
  it("keeps the ring ink at 3:1 or more against the day and night grounds", () => {
    const dayInk = resolveHex(declaredIn(":root", "--afh-focus-ring"));
    const nightInk = resolveHex(declaredIn(".dark,", "--afh-focus-ring"));

    for (const ground of ["--afh-color-bg", "--afh-color-card"]) {
      expect(
        contrastRatio(dayInk, resolveHex(`var(${ground})`))
      ).toBeGreaterThanOrEqual(3);
    }
    for (const ground of [
      "--afh-night-ground",
      "--afh-night-surface",
      "--afh-night-surface-2",
    ]) {
      expect(
        contrastRatio(nightInk, resolveHex(`var(${ground})`))
      ).toBeGreaterThanOrEqual(3);
    }
  });

  // --afh-ring-focus embeds var(--afh-bg); declared on :root alone it would be
  // resolved once with the day ground and inherited as-is into a night subtree.
  // @req REQ-047
  it("re-resolves the ring in night scopes", () => {
    const elevation = readFileSync(
      join(ROOT, "src/styles/tokens/elevation.css"),
      "utf8"
    );
    const ringRule = elevation.match(
      /([^{}]+)\{[^}]*--afh-ring-focus:\s*([^;]+);/
    );

    expect(ringRule?.[1]).toMatch(/\.dark/);
    expect(ringRule?.[1]).toMatch(/\.afh-on-night/);
    expect(ringRule?.[2]).toMatch(/2px var\(--afh-bg\)/);
    expect(ringRule?.[2]).toMatch(/4px var\(--afh-focus-ring\)/);
  });
});
