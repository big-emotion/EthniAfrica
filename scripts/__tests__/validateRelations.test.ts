// @req REQ-032
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import {
  checkRelationModel,
  checkRelationReferences,
  checkRelationSources,
  checkRelationDuplicates,
  summarizeValidationRun,
} from "../validateAfrikData";

// ─── helpers ──────────────────────────────────────────────────────────────────

function writePpl(root: string, flgFolder: string, pplId: string) {
  const dir = join(root, "peuples", flgFolder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${pplId}.json`), JSON.stringify({ id: pplId }));
}

function validRelation(overrides: Record<string, unknown> = {}) {
  return {
    id: "REL_TEST_ONE",
    relationType: "migratory",
    peopleIdA: "PPL_A",
    peopleIdB: "PPL_B",
    direction: "bidirectional",
    period: { startYear: 1800, endYear: 1850, label: "XIXe siècle" },
    description: "Description factuelle en une phrase.",
    sources: [
      {
        title: "Titre",
        author: "Auteur",
        year: 2000,
        url: "https://www.un.org/en/x",
        tier: 1,
        notes: "",
      },
    ],
    ...overrides,
  };
}

function writeRelation(
  root: string,
  fileName: string,
  relation: Record<string, unknown>
) {
  const dir = join(root, "relations");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, fileName), JSON.stringify(relation));
}

function writeRelations(
  root: string,
  relations: Array<{ fileName: string; relation: Record<string, unknown> }>
) {
  for (const { fileName, relation } of relations) {
    writeRelation(root, fileName, relation);
  }
}

// ─── test suite ───────────────────────────────────────────────────────────────

describe("relation validator (REL-1..REL-7, Story 11.3)", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(
      __dirname,
      `tmp_test_rel_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(tmpDir, { recursive: true });
    writePpl(tmpDir, "FLG_TEST", "PPL_A");
    writePpl(tmpDir, "FLG_TEST", "PPL_B");
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe("empty/absent relations directory", () => {
    // @req REQ-032
    it("checkRelationModel passes when the directory does not exist", () => {
      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // @req REQ-032
    it("checkRelationReferences passes when the directory does not exist", () => {
      const result = checkRelationReferences(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // @req REQ-032
    it("checkRelationSources passes when the directory does not exist", () => {
      const result = checkRelationSources(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // @req REQ-032
    it("checkRelationDuplicates passes when the directory does not exist", () => {
      const result = checkRelationDuplicates(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    // @req REQ-032
    it("checkRelationModel passes for an empty relations directory", () => {
      mkdirSync(join(tmpDir, "relations"), { recursive: true });
      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(true);
    });
  });

  describe("a fully valid relation", () => {
    // @req REQ-032
    it("produces no errors across every check", () => {
      writeRelation(tmpDir, "REL_TEST_ONE.json", validRelation());

      expect(checkRelationModel(tmpDir).ok).toBe(true);
      expect(checkRelationReferences(tmpDir).ok).toBe(true);
      expect(checkRelationSources(tmpDir).ok).toBe(true);
      const dup = checkRelationDuplicates(tmpDir);
      expect(dup.ok).toBe(true);
      expect(dup.warnings).toHaveLength(0);
    });
  });

  describe("REL-1 — id format + uniqueness", () => {
    // @req REQ-032
    it("checkRelationModel fails on an id that does not match ^REL_[A-Z0-9_]+$", () => {
      writeRelation(
        tmpDir,
        "bad_id.json",
        validRelation({ id: "not-a-valid-id" })
      );

      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-1"))).toBe(true);
      expect(result.errors.some((e) => e.includes("bad_id.json"))).toBe(true);
    });

    // @req REQ-032
    it("checkRelationDuplicates fails when two files declare the same id", () => {
      writeRelations(tmpDir, [
        {
          fileName: "REL_TEST_ONE.json",
          relation: validRelation({ id: "REL_TEST_ONE" }),
        },
        {
          fileName: "REL_TEST_ONE_dup.json",
          relation: validRelation({
            id: "REL_TEST_ONE",
            peopleIdA: "PPL_B",
            peopleIdB: "PPL_A",
          }),
        },
      ]);

      const result = checkRelationDuplicates(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-1"))).toBe(true);
      expect(
        result.errors.some((e) => e.includes("REL_TEST_ONE_dup.json"))
      ).toBe(true);
    });
  });

  describe("REL-2 — peopleIdA/peopleIdB must exist in the PPL corpus", () => {
    // @req REQ-032
    it("checkRelationReferences fails when peopleIdA is unknown", () => {
      writeRelation(
        tmpDir,
        "REL_UNKNOWN_A.json",
        validRelation({ peopleIdA: "PPL_GHOST" })
      );

      const result = checkRelationReferences(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-2"))).toBe(true);
      expect(result.errors.some((e) => e.includes("PPL_GHOST"))).toBe(true);
    });

    // @req REQ-032
    it("checkRelationReferences fails when peopleIdB is unknown", () => {
      writeRelation(
        tmpDir,
        "REL_UNKNOWN_B.json",
        validRelation({ peopleIdB: "PPL_GHOST" })
      );

      const result = checkRelationReferences(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-2"))).toBe(true);
    });

    // @req REQ-032
    it("checkRelationReferences passes when both peopleIds resolve", () => {
      writeRelation(tmpDir, "REL_OK.json", validRelation());
      const result = checkRelationReferences(tmpDir);
      expect(result.ok).toBe(true);
    });
  });

  describe("REL-3 — peopleIdA ≠ peopleIdB; relationType enum", () => {
    // @req REQ-032
    it("checkRelationModel fails when peopleIdA equals peopleIdB", () => {
      writeRelation(
        tmpDir,
        "REL_SELF.json",
        validRelation({ peopleIdA: "PPL_A", peopleIdB: "PPL_A" })
      );

      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-3"))).toBe(true);
    });

    // @req REQ-032
    it("checkRelationModel fails when relationType is 'linguistic' (derived-only, never stored)", () => {
      writeRelation(
        tmpDir,
        "REL_LINGUISTIC.json",
        validRelation({ relationType: "linguistic" })
      );

      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-3"))).toBe(true);
    });
  });

  describe("REL-4 — period.startYear <= period.endYear, both integers", () => {
    // @req REQ-032
    it("checkRelationModel fails when startYear is after endYear", () => {
      writeRelation(
        tmpDir,
        "REL_BAD_PERIOD.json",
        validRelation({
          period: { startYear: 1900, endYear: 1800, label: "x" },
        })
      );

      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-4"))).toBe(true);
    });

    // @req REQ-032
    it("checkRelationModel passes with a null (open-ended) startYear/endYear", () => {
      writeRelation(
        tmpDir,
        "REL_OPEN_PERIOD.json",
        validRelation({
          period: { startYear: null, endYear: null, label: "x" },
        })
      );

      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(true);
    });
  });

  describe("REL-5 — a relation's standing is labelled, never a reason to refuse it (DEC-055)", () => {
    // A relation with no source has no standing to show, so it still fails.
    // @req REQ-169
    it("checkRelationSources still fails a relation that cites no source at all", () => {
      writeRelation(
        tmpDir,
        "REL_NO_SOURCE.json",
        validRelation({ sources: [] })
      );

      const result = checkRelationSources(tmpDir);
      expect(result.ok).toBe(false);
      expect(
        result.errors.some(
          (e) => e.includes("REL-5") && e.includes("REL_NO_SOURCE.json")
        )
      ).toBe(true);
    });

    // @req REQ-169
    it("checkRelationSources passes a relation known only from an unverified source, with one warning naming it and its standing", () => {
      writeRelation(
        tmpDir,
        "REL_COMMUNITY.json",
        validRelation({
          sources: [
            {
              title: "Récit communautaire",
              author: "A",
              year: 2020,
              url: "https://example.org/x",
              tier: "unverified",
              notes: "",
            },
          ],
        })
      );

      const result = checkRelationSources(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("REL_COMMUNITY.json");
      expect(result.warnings[0]).toContain("unverified");
      expect(result.warnings[0]).not.toMatch(/Tier [123]|forbidden/i);

      const summary = summarizeValidationRun(
        [],
        [{ name: "REL-5 Relation sources", result }]
      );
      expect(summary.failed).toBe(false);
      expect(summary.warningCount).toBe(1);
    });

    // @req REQ-169
    it("checkRelationSources asks a referenced source for no Wikipedia note", () => {
      writeRelation(
        tmpDir,
        "REL_REFERENCED_NO_NOTE.json",
        validRelation({
          sources: [
            {
              title: "T",
              author: "A",
              year: 2000,
              url: "https://www.persee.fr/x",
              tier: "referenced",
              notes: "",
            },
          ],
        })
      );

      const result = checkRelationSources(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    // @req REQ-169
    it("checkRelationSources fails a source that records no tier, naming the relation", () => {
      writeRelation(
        tmpDir,
        "REL_NO_TIER.json",
        validRelation({
          sources: [
            {
              title: "T",
              author: "A",
              year: 2000,
              url: "https://www.un.org/en/x",
              notes: "",
            },
          ],
        })
      );

      const result = checkRelationSources(tmpDir);
      expect(result.ok).toBe(false);
      expect(
        result.errors.some(
          (e) => e.includes("REL_NO_TIER.json") && e.includes("tier")
        )
      ).toBe(true);
    });
  });

  describe("REL-6 — same unordered pair + type + overlapping period → warning", () => {
    // @req REQ-032
    it("emits a warning (not an error) for overlapping duplicate-suspect relations", () => {
      writeRelations(tmpDir, [
        {
          fileName: "REL_OVERLAP_ONE.json",
          relation: validRelation({
            id: "REL_OVERLAP_ONE",
            period: { startYear: 1800, endYear: 1850, label: "x" },
          }),
        },
        {
          fileName: "REL_OVERLAP_TWO.json",
          relation: validRelation({
            id: "REL_OVERLAP_TWO",
            peopleIdA: "PPL_B",
            peopleIdB: "PPL_A",
            period: { startYear: 1820, endYear: 1870, label: "y" },
          }),
        },
      ]);

      const result = checkRelationDuplicates(tmpDir);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.some((w) => w.includes("REL-6"))).toBe(true);
    });

    // @req REQ-032
    it("does not warn when the periods do not overlap", () => {
      writeRelations(tmpDir, [
        {
          fileName: "REL_NO_OVERLAP_ONE.json",
          relation: validRelation({
            id: "REL_NO_OVERLAP_ONE",
            period: { startYear: 1700, endYear: 1750, label: "x" },
          }),
        },
        {
          fileName: "REL_NO_OVERLAP_TWO.json",
          relation: validRelation({
            id: "REL_NO_OVERLAP_TWO",
            peopleIdA: "PPL_B",
            peopleIdB: "PPL_A",
            period: { startYear: 1900, endYear: 1950, label: "y" },
          }),
        },
      ]);

      const result = checkRelationDuplicates(tmpDir);
      expect(result.warnings.some((w) => w.includes("REL-6"))).toBe(false);
    });

    // @req REQ-032
    it("does not warn when relationType differs", () => {
      writeRelations(tmpDir, [
        {
          fileName: "REL_DIFF_TYPE_ONE.json",
          relation: validRelation({
            id: "REL_DIFF_TYPE_ONE",
            relationType: "migratory",
            period: { startYear: 1800, endYear: 1850, label: "x" },
          }),
        },
        {
          fileName: "REL_DIFF_TYPE_TWO.json",
          relation: validRelation({
            id: "REL_DIFF_TYPE_TWO",
            relationType: "commercial",
            peopleIdA: "PPL_B",
            peopleIdB: "PPL_A",
            period: { startYear: 1800, endYear: 1850, label: "y" },
          }),
        },
      ]);

      const result = checkRelationDuplicates(tmpDir);
      expect(result.warnings.some((w) => w.includes("REL-6"))).toBe(false);
    });
  });

  describe("REL-7 — description non-empty; every source URL present + well-formed", () => {
    // @req REQ-032
    it("checkRelationModel fails on an empty description", () => {
      writeRelation(
        tmpDir,
        "REL_EMPTY_DESC.json",
        validRelation({ description: "" })
      );

      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-7"))).toBe(true);
    });

    // @req REQ-032
    it("checkRelationModel fails on a malformed source URL", () => {
      writeRelation(
        tmpDir,
        "REL_BAD_URL.json",
        validRelation({
          sources: [
            {
              title: "T",
              author: "A",
              year: 2000,
              url: "not a url",
              tier: 1,
              notes: "",
            },
          ],
        })
      );

      const result = checkRelationModel(tmpDir);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("REL-7"))).toBe(true);
    });
  });
});
