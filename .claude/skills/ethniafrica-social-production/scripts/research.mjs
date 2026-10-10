#!/usr/bin/env node
// @req REQ-186
// Evidence bookkeeping, not an automated historical judgement or deployment tool.
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  realpathSync,
  renameSync,
  rmSync,
} from "node:fs";
import { resolve, relative, isAbsolute, join, dirname, sep } from "node:path";
import { pathToFileURL } from "node:url";
const CORPUS = "dataset/source/afrik/";
const fail = (message) => {
  throw new Error(message);
};
const need = (value, label) =>
  typeof value === "string" && value.trim()
    ? value
    : fail(`${label} is required`);
const list = (value, label, empty = false) =>
  Array.isArray(value) && (empty || value.length)
    ? value
    : fail(`${label} must be an array${empty ? "" : " with entries"}`);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function inside(root, file) {
  need(file, "File");
  const abs = resolve(root, file);
  const rel = relative(resolve(root), abs);
  if (isAbsolute(file) || rel === ".." || rel.startsWith(`..${sep}`))
    fail("File must stay inside the project");
  if (file.replace(/\/$/, "") !== rel.split(sep).join("/"))
    fail("File path must be canonical inside the project");
  let ancestor = abs;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const real = relative(realpathSync(root), realpathSync(ancestor));
  if (real === ".." || real.startsWith(`..${sep}`))
    fail("File must resolve inside the project");
  return abs;
}
function url(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || !u.hostname) throw Error();
    return value;
  } catch {
    fail("HTTPS URL is required");
  }
}
function unique(items, label) {
  const ids = items.map((x) => need(x.id, `${label} id`));
  if (new Set(ids).size !== ids.length) fail(`Duplicate ${label} id`);
}
function pointer(document, path) {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    /~(?![01])/u.test(path)
  )
    fail("Invalid JSON pointer");
  const parts = path
    .slice(1)
    .split("/")
    .map((s) => s.replaceAll("~1", "/").replaceAll("~0", "~"));
  if (parts.some((s) => ["__proto__", "prototype", "constructor"].includes(s)))
    fail("Unsafe JSON pointer");
  let parent = document;
  for (const key of parts.slice(0, -1)) {
    if (
      parent === null ||
      typeof parent !== "object" ||
      !Object.hasOwn(parent, key)
    )
      fail("Missing pointer parent");
    parent = parent[key];
  }
  if (parent === null || typeof parent !== "object")
    fail("Missing pointer parent");
  const key = parts.at(-1);
  if (
    Array.isArray(parent) &&
    (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= parent.length)
  )
    fail("Array pointer must address an existing item");
  return {
    parent,
    key,
    exists: Object.hasOwn(parent, key),
    value: parent[key],
  };
}
export function discoverCorpus(root, terms) {
  list(terms, "Search terms");
  const normalize = (s) =>
    s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const needles = terms.map((t) => normalize(need(t, "Search term")));
  const found = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      if (entry.name.startsWith("_") || entry.isSymbolicLink()) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".json")) {
        const file = relative(resolve(root), path).split(sep).join("/");
        inside(root, file);
        const raw = readFileSync(path, "utf8");
        const data = JSON.parse(raw);
        const text = normalize(raw);
        const matches = terms.filter((_, i) => text.includes(needles[i]));
        if (matches.length)
          found.push({
            file,
            id: data.id ?? null,
            terms: matches,
            sha256: sha(raw),
          });
      }
    }
  }
  walk(inside(root, CORPUS));
  return found;
}
export function assessResearch(root, inputFile, { forDelivery = false } = {}) {
  const dependencies = {};
  const read = (file) => {
    const bytes = readFileSync(inside(root, file));
    dependencies[file] = sha(bytes);
    return bytes.toString("utf8");
  };
  const input = JSON.parse(read(inputFile));
  if (input.schema !== 1) fail("Unsupported research schema");
  need(input.subject, "Subject");
  const records = list(input.records, "Records", true);
  const matches = discoverCorpus(root, input.search?.terms);
  const excluded = list(input.search?.excluded, "Excluded matches", true);
  excluded.forEach((e) => {
    need(e.reason, "Exclusion reason");
    read(e.file);
  });
  const files = records.map((r) => r.file);
  if (new Set(files).size !== files.length) fail("Duplicate record");
  if (
    matches.some(
      (m) => !files.includes(m.file) && !excluded.some((e) => e.file === m.file)
    )
  )
    fail("Search has unreviewed corpus matches");
  if (!records.length) need(input.noCorpusReason, "No-corpus reason");
  const documents = new Map();
  for (const r of records) {
    if (!r.file.startsWith(CORPUS) || !r.file.endsWith(".json"))
      fail("Record must be a corpus JSON file");
    const text = read(r.file);
    if (sha(text) !== r.sha256) fail(`Corpus record changed: ${r.file}`);
    documents.set(r.file, JSON.parse(text));
  }
  const sources = list(input.sources, "Sources");
  unique(sources, "source");
  for (const s of sources) {
    need(s.citation, "Source citation");
    need(s.locator, "Source locator");
    need(s.passage, "Source passage");
    if (!["written", "oral"].includes(s.kind))
      fail("Source kind must be written or oral");
    if (
      ![
        "attestation",
        "creation",
        "adoption",
        "context",
        "hypothesis",
        "unknown",
      ].includes(s.basis)
    )
      fail("Source basis is required");
    if (s.kind === "oral") need(s.consent, "Oral consent");
    if (!read(s.recordFile).includes(s.passage))
      fail("Source passage is absent from its evidence record");
  }
  const claims = list(input.claims, "Claims");
  unique(claims, "claim");
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  for (const c of claims) {
    need(c.text, "Claim text");
    need(c.limits, "Claim limits");
    list(c.sources, "Claim sources");
    if (
      new Set(c.sources).size !== c.sources.length ||
      c.sources.some((id) => !sourceMap.has(id))
    )
      fail("Claim sources must identify distinct known sources");
    if (
      !["supported", "hypothesis", "unknown", "contested"].includes(c.certainty)
    )
      fail("Claim certainty is required");
    if (c.certainty === "contested" && c.sources.length < 2)
      fail("Contested claims require multiple sources");
    if (c.certainty === "unknown" && (c.date != null || c.actor != null))
      fail("An unknown origin cannot have a known date or actor");
    if (
      c.certainty === "supported" &&
      !c.sources.some(
        (id) => !["unknown", "hypothesis"].includes(sourceMap.get(id).basis)
      )
    )
      fail("Claim lacks supporting evidence");
    if (c.event !== undefined) {
      if (
        !["attestation", "creation", "adoption", "antecedent"].includes(c.event)
      )
        fail("Invalid name event");
      if (!Object.hasOwn(c, "date") || !Object.hasOwn(c, "actor"))
        fail(
          "Name events require date and actor, explicitly null when unknown"
        );
      if (
        c.event === "creation" &&
        c.certainty === "supported" &&
        !c.sources.some((id) => sourceMap.get(id).basis === "creation")
      )
        fail("An attestation is not evidence of creation");
    }
  }
  const findings = list(input.findings, "Findings", records.length === 0);
  unique(findings, "finding");
  const corrections = [];
  const targets = [];
  for (const f of findings) {
    if (Object.hasOwn(f, "status"))
      fail("Finding status cannot assert integration or live publication");
    const c = claims.find((c) => c.id === f.claim);
    if (!c) fail("Finding must reference a claim");
    if (!documents.has(f.file)) fail("Finding file was not reviewed");
    if (
      !["confirmation", "missing", "contradiction", "uncertain"].includes(
        f.kind
      )
    )
      fail("Invalid finding kind");
    need(f.rationale, "Finding rationale");
    const p = pointer(documents.get(f.file), f.pointer);
    if (
      !f.before ||
      f.before.exists !== p.exists ||
      (p.exists && !equal(f.before.value, p.value))
    )
      fail("Finding before value does not match the corpus");
    if (f.proposal) {
      if (f.kind === "confirmation")
        fail("A confirmation cannot carry a correction");
      if (f.proposal.certainty !== c.certainty)
        fail("Proposal must retain the claim certainty");
      if (
        !Object.hasOwn(f.proposal, "value") ||
        equal(f.proposal.value, p.value)
      )
        fail("Correction needs a changed value");
      if (
        f.kind === "contradiction" ||
        c.certainty === "contested" ||
        c.certainty === "hypothesis"
      )
        need(f.proposal.retainedAccounts, "Retained accounts");
      const target = `${f.file}#${f.pointer}`;
      if (
        targets.some(
          (t) =>
            t === target ||
            t.startsWith(target + "/") ||
            target.startsWith(t + "/")
        )
      )
        fail("Correction pointers overlap");
      targets.push(target);
      corrections.push({
        id: f.id,
        file: f.file,
        pointer: f.pointer,
        before: f.before,
        value: f.proposal.value,
        claim: f.claim,
        status: "prepared",
      });
    }
  }
  if (records.some((r) => !findings.some((f) => f.file === r.file)))
    fail("Every reviewed record needs a finding");
  for (const image of list(input.images, "Images", true)) {
    for (const k of [
      "file",
      "creator",
      "description",
      "reuseBasis",
      "credit",
      "crop",
    ])
      need(image[k], `Image ${k}`);
    url(image.sourcePage);
    read(image.file);
    read(need(image.rightsEvidence, "Image rights evidence"));
  }
  const d = input.destination;
  if (!d || !["no-link", "pending", "verified"].includes(d.status))
    fail("Destination status is required");
  need(d.invitation, "Destination invitation");
  if (d.status === "no-link") need(d.reason, "No-link reason");
  else url(d.url);
  if (d.status === "verified") {
    need(d.checkedAt, "Destination verification date");
    if (!Number.isFinite(Date.parse(d.checkedAt)))
      fail("Invalid destination verification date");
    need(d.support, "Destination supporting observation");
    read(need(d.evidence, "Destination evidence"));
  }
  if (d.status === "pending" && forDelivery)
    fail(
      "The destination is not verified; resolve it or revise the invitation"
    );
  const proposed = {};
  for (const correction of corrections) {
    proposed[correction.file] ??= structuredClone(
      documents.get(correction.file)
    );
    const p = pointer(proposed[correction.file], correction.pointer);
    p.parent[p.key] = correction.value;
  }
  return {
    schema: 1,
    subject: input.subject,
    inputFile,
    dependencies,
    searchTerms: input.search.terms,
    matchedFiles: matches.map((m) => m.file),
    findings,
    corrections,
    proposed,
    destination: d,
  };
}
export function prepareResearch(root, inputFile, output) {
  const report = assessResearch(root, inputFile);
  const target = inside(root, output);
  if (existsSync(target)) fail("Output already exists");
  mkdirSync(dirname(target), { recursive: true });
  const staging = target + `.tmp-${randomUUID()}`;
  const lock = target + ".lock";
  mkdirSync(lock);
  try {
    if (existsSync(target)) fail("Output already exists");
    mkdirSync(staging);
    writeFileSync(
      join(staging, "report.json"),
      JSON.stringify(report, null, 2) + "\n"
    );
    const sections = report.findings.map(
      (f) =>
        `## ${f.id}: ${f.kind}\n\nFile: ${f.file}\nField: ${f.pointer}\nClaim: ${f.claim}\n\n${f.rationale}\n\nBefore:\n\n\`\`\`json\n${JSON.stringify(f.before, null, 2)}\n\`\`\`\n\nProposed:\n\n\`\`\`json\n${JSON.stringify(f.proposal ?? null, null, 2)}\n\`\`\``
    );
    writeFileSync(
      join(staging, "corpus.md"),
      `# Corpus comparison — ${report.subject}\n\nPrepared only. Review evidence and meaning at approval 2. No source fiche or live page has been changed.\n\n${sections.join("\n\n")}\n`
    );
    for (const [file, data] of Object.entries(report.proposed)) {
      const dest = join(staging, "proposed", file);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, JSON.stringify(data, null, 2) + "\n");
    }
    // The lock serializes writers; a single rename exposes the complete revision.
    renameSync(staging, target);
    return report;
  } finally {
    rmSync(staging, { recursive: true, force: true });
    rmSync(lock, { recursive: true, force: true });
  }
}
export function verifyProgress(root, report, event, previous) {
  const c = report.corrections.find((c) => c.id === event.correction);
  if (!c) fail("Unknown prepared correction");
  const steps = [
    "prepared",
    "locally-checked",
    "proposed",
    "integrated",
    "verified-live",
  ];
  const last =
    previous.filter((p) => p.correction === c.id).at(-1)?.status ?? "prepared";
  if (steps.indexOf(event.status) !== steps.indexOf(last) + 1)
    fail("Corpus statuses must advance in order");
  const evidence = need(event.evidence, "Progress evidence");
  const evidenceHash = sha(readFileSync(inside(root, evidence)));
  if (event.status === "locally-checked") {
    const data = JSON.parse(readFileSync(inside(root, c.file), "utf8"));
    if (!equal(pointer(data, c.pointer).value, c.value))
      fail("Local corpus does not match the prepared correction");
  }
  if (event.status === "proposed") url(event.url);
  if (event.status === "integrated") need(event.commit, "Integration commit");
  if (event.status === "verified-live") {
    url(event.url);
    need(event.checkedAt, "Live verification date");
    need(event.observation, "Live supporting observation");
    if (!Number.isFinite(Date.parse(event.checkedAt)))
      fail("Invalid live verification date");
  }
  return {
    ...event,
    evidenceHash,
    recordedAt: new Date().toISOString(),
    verification:
      "Agent-recorded evidence; not an automatic remote verification",
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [command, input, output, ...terms] = process.argv.slice(2);
    const root = process.cwd();
    const result =
      command === "discover"
        ? discoverCorpus(root, [input, output, ...terms].filter(Boolean))
        : command === "check"
          ? assessResearch(root, input, {
              forDelivery: output === "--delivery",
            })
          : command === "prepare"
            ? prepareResearch(root, input, output)
            : fail(
                "Usage: research.mjs discover TERM... | check INPUT [--delivery] | prepare INPUT OUTPUT"
              );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
