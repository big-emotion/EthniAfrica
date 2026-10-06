import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  formatCoverageReport,
  measureSearchAnswerCoverage,
  renderCoverageReport,
  type CoverageRow,
} from "../reportSearchAnswerCoverage";

let workspace: string;
let datasetRoot: string;
let productionsRoot: string;

function writeJson(relativePath: string, body: unknown, root = datasetRoot) {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(body));
}

function row(rows: CoverageRow[], field: string, cls: string): CoverageRow {
  const found = rows.find((r) => r.field === field && r.class === cls);
  if (!found) throw new Error(`no row for ${cls} ${field}`);
  return found;
}

beforeEach(() => {
  workspace = mkdtempSync(path.join(tmpdir(), "search-answer-coverage-"));
  datasetRoot = path.join(workspace, "afrik");
  productionsRoot = path.join(workspace, "mot");
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

describe("measureSearchAnswerCoverage", () => {
  // @req REQ-178
  it("counts a people's shortLine against the number of peoples", () => {
    writeJson("peuples/FLG_A/PPL_ONE.json", { id: "PPL_ONE", content: {} });
    writeJson("peuples/FLG_A/PPL_TWO.json", { id: "PPL_TWO", content: {} });
    writeJson("noms/PPL_ONE.json", {
      names: [{ nameText: "One" }, { nameText: "Un", shortLine: "Un nom." }],
    });
    writeJson("noms/PPL_TWO.json", {
      names: [{ nameText: "Two", shortLine: "  " }],
    });

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "names[].shortLine", "people")).toMatchObject({
      filled: 1,
      total: 2,
    });
  });

  // @req REQ-178
  it("reads searchAnswer under content, and at the root for patronymes", () => {
    writeJson("peuples/FLG_A/PPL_ONE.json", {
      content: { searchAnswer: { lead: "Lead", followUp: "" } },
    });
    writeJson("pays/AGO.json", { content: { searchAnswer: { lead: "L" } } });
    writeJson("pays/BDI.json", { content: {} });
    writeJson("langues/bam.json", { content: {} });
    writeJson("famille_linguistique/FLG_X.json", {
      content: { searchAnswer: { followUp: "F" } },
    });
    writeJson("patronymes/PAT_A.json", {
      searchAnswer: { lead: "L", followUp: "F" },
    });
    writeJson("patronymes/PAT_B.json", { origin: {} });

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "searchAnswer.lead", "people")).toMatchObject({
      filled: 1,
      total: 1,
    });
    expect(row(rows, "searchAnswer.followUp", "people").filled).toBe(0);
    expect(row(rows, "searchAnswer.lead", "country")).toMatchObject({
      filled: 1,
      total: 2,
    });
    expect(row(rows, "searchAnswer.lead", "language")).toMatchObject({
      filled: 0,
      total: 1,
    });
    expect(row(rows, "searchAnswer.followUp", "family").filled).toBe(1);
    expect(row(rows, "searchAnswer.lead", "patronyme")).toMatchObject({
      filled: 1,
      total: 2,
    });
    expect(row(rows, "searchAnswer.followUp", "patronyme").filled).toBe(1);
  });

  // @req REQ-178
  it("counts languages with a non-empty whyProblematic string only", () => {
    writeJson("langues/a.json", { whyProblematic: "Because." });
    writeJson("langues/b.json", { whyProblematic: "" });
    writeJson("langues/c.json", { whyProblematic: null });

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "whyProblematic", "language")).toMatchObject({
      filled: 1,
      total: 3,
    });
  });

  // @req REQ-178
  it("counts speakers.byCountry on languages and families when non-empty", () => {
    writeJson("langues/a.json", {
      content: { speakers: { byCountry: [{ country: "MLI" }] } },
    });
    writeJson("langues/b.json", { content: { speakers: { byCountry: [] } } });
    writeJson("famille_linguistique/FLG_X.json", {
      content: { speakers: { byCountry: [{ country: "MLI" }] } },
    });

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "speakers.byCountry", "language")).toMatchObject({
      filled: 1,
      total: 2,
    });
    expect(row(rows, "speakers.byCountry", "family")).toMatchObject({
      filled: 1,
      total: 1,
    });
  });

  // @req REQ-178
  it("counts a patronyme as having an origin when any of the four collections is filled", () => {
    writeJson("patronymes/PAT_A.json", {
      origin: { oralTraditions: [], historicalSyntheses: [{ claim: "c" }] },
    });
    writeJson("patronymes/PAT_B.json", {
      origin: { linguisticReconstructions: [{ claim: "c" }] },
    });
    writeJson("patronymes/PAT_C.json", {
      origin: { oralTraditions: [], writtenChronicles: [] },
    });
    writeJson("patronymes/PAT_D.json", {});
    writeJson("patronymes/_manifest.json", { skipped: true });

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "origin", "patronyme")).toMatchObject({
      filled: 2,
      total: 4,
    });
  });

  // @req REQ-178
  it("counts countries that list at least one people in their demographics", () => {
    writeJson("pays/AGO.json", {
      content: { demographics: { peoples: [{ name: "Ovimbundu" }] } },
    });
    writeJson("pays/BDI.json", { content: { demographics: { peoples: [] } } });

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "demographics.peoples", "country")).toMatchObject({
      filled: 1,
      total: 2,
    });
  });

  // @req REQ-178
  it("counts production records carrying an answer object", () => {
    writeJson("001.json", { word: "a", answer: { path: [] } }, productionsRoot);
    writeJson("002.json", { word: "b" }, productionsRoot);
    writeJson("003.json", { word: "c", answer: "text" }, productionsRoot);

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "answer", "word")).toMatchObject({ filled: 1, total: 3 });
  });

  // @req REQ-178
  it("reports a total of zero for missing directories without throwing", () => {
    const rows = measureSearchAnswerCoverage(
      path.join(workspace, "absent"),
      path.join(workspace, "also-absent")
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.total === 0 && r.filled === 0)).toBe(true);
  });

  // @req REQ-178
  it("skips an unparseable file instead of failing the report", () => {
    mkdirSync(path.join(datasetRoot, "langues"), { recursive: true });
    writeFileSync(path.join(datasetRoot, "langues", "bad.json"), "{nope");
    writeJson("langues/ok.json", { whyProblematic: "x" });

    const rows = measureSearchAnswerCoverage(datasetRoot, productionsRoot);

    expect(row(rows, "whyProblematic", "language")).toMatchObject({
      filled: 1,
      total: 1,
    });
  });
});

describe("report rendering", () => {
  const rows: CoverageRow[] = [
    { field: "origin", class: "patronyme", filled: 397, total: 808 },
    { field: "answer", class: "word", filled: 0, total: 0 },
  ];

  // @req REQ-178
  it("prints filled/total with a percentage, and n/a when nothing was found", () => {
    const text = formatCoverageReport(rows);

    expect(text).toContain("397/808");
    expect(text).toContain("49.1%");
    expect(text).toContain("0/0");
    expect(text).toContain("n/a");
  });

  // @req REQ-178
  it("emits parseable JSON under --json", () => {
    expect(JSON.parse(renderCoverageReport(rows, true))).toEqual(rows);
  });

  // @req REQ-178
  it("emits the text table otherwise", () => {
    expect(renderCoverageReport(rows, false)).toBe(formatCoverageReport(rows));
  });
});
