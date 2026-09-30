import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  type Fiche,
  checkReaderFacingRegister,
  checkUnguardedProseCeiling,
  readerFacingProseFields,
  runEditorialRules,
} from "../checkEditorialRules";

const PEUPLE = "dataset/source/afrik/peuples/FLG_MANDE/PPL_DEMO.json";

const fichePeuple = {
  id: "PPL_DEMO",
  content: {
    appellations: {
      selfAppellation: "Demo",
      originOfExonyms: "Nom donné par les voisins.",
    },
    organization: {
      clanOrganization:
        "DOUBLON POTENTIEL de PPL_AUTRE : fusionner les fiches.",
    },
    sources: [
      {
        title: "Un ouvrage",
        url: "https://example.org/ouvrage",
        tier: "referenced",
        notes: "Édition de 1998.",
      },
    ],
  },
};

/**
 * The register gate used to read three fields. The fiche surface renders far
 * more prose than that, so a workshop note in a narrative chapter reached the
 * reader with no rule looking at it (audit finding C23). The set of rendered
 * prose is not restated here: it is the translation-class table, which already
 * says which leaves are narrative and which are names, identifiers or citations.
 */
describe("editorial rules — every rendered prose field", () => {
  // @req REQ-133
  it("adds the narrative chapters of a people fiche to the guarded fields", () => {
    const paths = readerFacingProseFields(fichePeuple, PEUPLE).map(
      (f) => f.path
    );

    expect(paths).toContain("content.organization.clanOrganization");
    expect(paths).toContain("content.appellations.originOfExonyms");
    expect(paths).toContain("content.sources[0].notes");
  });

  // @req REQ-133
  it("leaves names, identifiers and citation titles alone", () => {
    const paths = readerFacingProseFields(fichePeuple, PEUPLE).map(
      (f) => f.path
    );

    expect(paths).not.toContain("id");
    expect(paths).not.toContain("content.appellations.selfAppellation");
    expect(paths).not.toContain("content.sources[0].url");
    expect(paths).not.toContain("content.sources[0].tier");
  });

  // @req REQ-133
  it("reads a fiche the same as before when no file says which model it follows", () => {
    const paths = readerFacingProseFields({
      gaps: [{ reason: "a" }],
      content: { organization: { clanOrganization: "b" } },
    }).map((f) => f.path);

    expect(paths).toEqual(["gaps[0].reason"]);
  });

  // @req REQ-133
  it("reports a leak in a newly covered field as a warning, and keeps the three original fields as errors", () => {
    const findings = checkReaderFacingRegister(fichePeuple, PEUPLE);

    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("warning");
    expect(findings[0].message).toContain(
      "content.organization.clanOrganization"
    );

    const inGap = checkReaderFacingRegister(
      { ...fichePeuple, gaps: [{ reason: "Voir PPL_AUTRE." }] },
      PEUPLE
    ).filter((f) => f.severity === "error");
    expect(inGap).toHaveLength(1);
    expect(inGap[0].message).toContain("gaps[0].reason");
  });

  // @req REQ-133
  it("does not flag a raw identifier where it is the field's whole job", () => {
    const findings = checkReaderFacingRegister(
      {
        id: "PPL_DEMO",
        content: {
          ...fichePeuple.content,
          organization: { clanOrganization: "Clans patrilinéaires." },
        },
      },
      PEUPLE
    );

    expect(findings).toEqual([]);
  });

  // A name field is invariant — never translated, never a prose chapter — but
  // « Yoruba (PPL_YORUBA) - Nigeria » in it is still a corpus row shown to a
  // reader. Only a raw identifier is checked there, never the vocabulary.
  // @req REQ-133
  it("flags an identifier buried in a name or label, and nothing else about it", () => {
    const famille = "dataset/source/afrik/famille_linguistique/FLG_DEMO.json";
    const findings = checkReaderFacingRegister(
      {
        id: "FLG_DEMO",
        content: {
          associatedPeoples: [
            { name: "Yoruba (PPL_YORUBA) - Nigeria", peopleId: "PPL_YORUBA" },
            { name: "Cette passe de Bandiagara", peopleId: "PPL_AUTRE" },
          ],
        },
      },
      famille
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("warning");
    expect(findings[0].message).toContain("content.associatedPeoples[0].name");
  });

  // @req REQ-133
  it("keeps a value that is an identifier — that is what the field is for", () => {
    const structural = {
      id: "PPL_DEMO",
      languageFamilyId: "FLG_MANDE",
      content: {
        appellations: { linguisticFamily: "FLG_ATLANTIQUE" },
        associatedPeoples: [{ peopleId: "PPL_AUTRE" }],
      },
    } as unknown as Fiche;
    const findings = checkReaderFacingRegister(structural, PEUPLE);

    expect(findings).toEqual([]);
  });

  // The Bantu expansion has a first wave; a fiche's own « vague 1 » is a
  // research batch. Only the second is the workshop's vocabulary.
  // @req REQ-133
  it("lets a dated historical wave through and still refuses a workshop wave", () => {
    const dated = checkReaderFacingRegister(
      {
        id: "FLG_DEMO",
        content: {
          historyAndOrigins: {
            diffusion:
              "Expansion en vagues : Vague 1 (3000-2000 av. J.-C.) : vers le bassin du Congo.",
          },
        },
      },
      "dataset/source/afrik/famille_linguistique/FLG_DEMO.json"
    );
    expect(dated).toEqual([]);

    const workshop = checkReaderFacingRegister(
      {
        id: "PAT_DEMO",
        origin: {
          writtenChronicles: [{ claim: "Retirée de la fiche vague 1 du lot." }],
        },
      },
      "dataset/source/afrik/patronymes/PAT_DEMO.json"
    );
    expect(workshop).toHaveLength(1);
  });

  // @req REQ-133
  it("fails the ratchet in both directions and stays quiet on the ceiling", () => {
    expect(checkUnguardedProseCeiling(3, 3)).toBeNull();
    expect(checkUnguardedProseCeiling(4, 3)?.message).toMatch(/rose to 4/);
    expect(checkUnguardedProseCeiling(2, 3)?.message).toMatch(
      /lower UNGUARDED_PROSE_CEILING to 2/
    );
    expect(checkUnguardedProseCeiling(4, 3)?.severity).toBe("error");
  });
});

describe("editorial rules — rendered prose, end to end", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "c23-e2e-"));
    const dir = path.join(root, "dataset/source/afrik/peuples/FLG_MANDE");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "PPL_DEMO.json"),
      JSON.stringify({
        ...fichePeuple,
        autonym: "Demo",
        content: {
          ...fichePeuple.content,
          appellations: { ...fichePeuple.content.appellations, exonyms: [] },
        },
      })
    );
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  // @req REQ-133
  it("passes on the recorded count and fails when a new leak lifts it", () => {
    const armed = (ceiling: number) =>
      runEditorialRules({
        repoRoot: root,
        unguardedProseCeiling: ceiling,
      });

    expect(armed(1).exitCode).toBe(0);
    expect(armed(0).exitCode).toBe(1);
    expect(armed(2).exitCode).toBe(1);
  });
});
