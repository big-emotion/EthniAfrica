import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveAfrikFiche } from "../resolveAfrikFiche";

// Read from the ledger rather than written out: the fold tests hold every
// test file to naming no retired id, and the ledger is the list to follow.
const RETIRED_PATRONYMES: Array<{
  retiredId: string;
  successorId: string | null;
}> = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "dataset/source/afrik/patronymes/_retired-identifiers.json"
    ),
    "utf8"
  )
);
// One of each: every call reads the whole corpus, so a loop over the ledger
// outlasts the test timeout on a loaded machine.
const MERGED = RETIRED_PATRONYMES.find(({ successorId }) => successorId);
const WITHDRAWN = RETIRED_PATRONYMES.find(({ successorId }) => !successorId);

describe("resolveAfrikFiche", () => {
  // The curator skill's first phase is "turn what the user typed into a fiche
  // identifier". It used to do that through searchAfrikAll, which no longer
  // exists, so the phase raised before the skill read anything. Resolution now
  // reads the corpus in git — the same files the curator goes on to edit — so it
  // needs no credentials and does not depend on a database being loaded.
  // @req REQ-032
  it("resolves a French exonym to the people it names", () => {
    const matches = resolveAfrikFiche("Zoulou");

    expect(matches[0]).toMatchObject({ id: "PPL_ZULU", kind: "people" });
  });

  // Accents are the common case in French and the corpus is inconsistent about
  // them: the Zulu fiche's own prose writes "Zoulou" while other fiches carry
  // unaccented transcriptions.
  // @req REQ-032
  it("folds accents and case rather than requiring the exact spelling", () => {
    expect(resolveAfrikFiche("afrique du sud")[0]).toMatchObject({
      id: "ZAF",
      kind: "country",
    });
    expect(resolveAfrikFiche("AFRIQUE DU SUD")[0]).toMatchObject({ id: "ZAF" });
  });

  // The endonym is the decolonial posture's load-bearing field, so a reader who
  // types it must reach the fiche as directly as one who types the exonym.
  // @req REQ-032
  it("resolves an autonym as readily as an exonym", () => {
    expect(resolveAfrikFiche("amaZulu")[0]).toMatchObject({ id: "PPL_ZULU" });
  });

  // @req REQ-032
  it("resolves families and languages, not only peoples and countries", () => {
    expect(resolveAfrikFiche("Bantou")).toContainEqual(
      expect.objectContaining({ id: "FLG_BANTU", kind: "family" })
    );
    expect(resolveAfrikFiche("Bambara")).toContainEqual(
      expect.objectContaining({ id: "bam", kind: "language" })
    );
  });

  // An identifier typed straight in must short-circuit, so the curator can be
  // handed "PPL_ZULU" and not have to disambiguate a name it never asked about.
  // @req REQ-032
  it("returns a single match when handed an identifier", () => {
    const matches = resolveAfrikFiche("PPL_ZULU");

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ id: "PPL_ZULU", matchedOn: "id" });
  });

  // Ranking is the whole value: a partial hit must never outrank an exact one,
  // or the curator confirms the wrong fiche and edits it.
  // @req REQ-032
  it("ranks an exact name above a fiche that merely contains it", () => {
    const matches = resolveAfrikFiche("Zulu");

    expect(matches[0].id).toBe("PPL_ZULU");
    expect(matches[0].matchType).toBe("exact");
  });

  // French plurals are the everyday way of naming a people, and the corpus
  // declares families in the singular. "Bantous" is the skill's own worked
  // example, and it reached nothing until containment worked both ways.
  // @req REQ-032
  it("resolves a French plural onto the singular the corpus declares", () => {
    expect(resolveAfrikFiche("Bantous")).toContainEqual(
      expect.objectContaining({ id: "FLG_BANTU", matchType: "partial" })
    );
  });

  // The looser direction must stay strictly below the tighter ones, or a
  // fiche whose name is merely contained in the query outranks the fiche the
  // query names outright.
  // @req REQ-032
  it("ranks a plural fallback below every exact match", () => {
    const matches = resolveAfrikFiche("Zulu");

    expect(matches[0].matchType).toBe("exact");
    const firstPartial = matches.findIndex(
      ({ matchType }) => matchType === "partial"
    );
    const lastExact = matches
      .map(({ matchType }) => matchType)
      .lastIndexOf("exact");
    if (firstPartial !== -1) {
      expect(firstPartial).toBeGreaterThan(lastExact);
    }
  });

  // Silence would be read as "no such people". Saying nothing matched is what
  // sends the curator to ask rather than to invent.
  // @req REQ-032
  it("returns nothing rather than a guess when no declared name matches", () => {
    expect(resolveAfrikFiche("Nechercherienducorpus")).toEqual([]);
  });

  // @req REQ-032
  it("reports which declared name produced the match", () => {
    const [zulu] = resolveAfrikFiche("amaZulu");

    expect(zulu.matchedOn).toBe("selfAppellation");
    expect(zulu.matchedValue).toBe("amaZulu");
  });

  // The nightly demand journal of 2026-10-17 listed these three as searched
  // names without a fiche, although all three were filed on 2026-09-02: the
  // resolver never read the family names.
  // @req REQ-032
  it("resolves a family name to its patronyme fiche", () => {
    for (const [typed, id] of [
      ["mulumba", "PAT_MULUMBA"],
      ["Mutombo", "PAT_MUTOMBO"],
    ]) {
      expect(resolveAfrikFiche(typed)[0]).toMatchObject({
        id,
        kind: "patronyme",
        matchType: "exact",
      });
    }
  });

  // A merged family name keeps its identifier in old journals and links; it
  // must lead to the fiche that took it in, and say that it did.
  // @req REQ-032
  it("follows a retired family-name identifier to its successor", () => {
    expect(resolveAfrikFiche(MERGED.retiredId)).toEqual([
      {
        id: MERGED.successorId,
        kind: "patronyme",
        matchedOn: "retiredId",
        matchedValue: MERGED.retiredId,
        matchType: "retired",
      },
    ]);
  });

  // A withdrawn fiche has no successor, so there is nothing to send the
  // curator to.
  // @req REQ-032
  it("resolves a withdrawn family-name identifier to nothing", () => {
    expect(resolveAfrikFiche(WITHDRAWN.retiredId)).toEqual([]);
  });

  // « tchikaya » is how readers type PAT_TCHICAYA. Each of the four respellings
  // the search fold leaves apart reaches the fiche, labelled as a neighbour so
  // the curator confirms it rather than taking it for the name itself. tch/ch
  // is tested with c/k: a leading « t » dropped or added on its own already
  // reaches the fiche by containment (« chicaya » is inside « tchicaya »).
  // @req REQ-032
  it("offers a spelling neighbour when no declared name matches exactly", () => {
    for (const [typed, id, rule] of [
      ["tchikaya", "PAT_TCHICAYA", "c/k"],
      ["chikaya", "PAT_TCHICAYA", "tch/ch with c/k"],
      ["moutombo", "PAT_MUTOMBO", "ou/u"],
      ["tchicaia", "PAT_TCHICAYA", "i/y"],
    ]) {
      expect(resolveAfrikFiche(typed)[0], rule).toMatchObject({
        id,
        matchType: "neighbour",
      });
    }
  });

  // An exact answer is the answer: neighbours would only add fiches the
  // reader did not type.
  // @req REQ-032
  it("offers no neighbour once a declared name matches exactly", () => {
    expect(
      resolveAfrikFiche("Zoulou").map(({ matchType }) => matchType)
    ).not.toContain("neighbour");
  });

  // « chad » reached the country through its name « Tchad » before neighbours
  // existed, and must still say so: a line the routine has already compared
  // across journals does not change its kind of match.
  // @req REQ-032
  it("keeps the match a fiche had before neighbours existed", () => {
    expect(resolveAfrikFiche("chad")).toContainEqual(
      expect.objectContaining({ id: "TCD", matchType: "contains" })
    );
  });

  // The routine reads the printed lines, not the function: the id first, then
  // the kind, then how it was found, then the name or identifier it came from.
  // Three tsx processes each read the whole corpus, which outlasts the default
  // 5 s while the full suite loads the machine.
  // @req REQ-032
  it("prints the fiche found and how, one tab-separated line per fiche", () => {
    const cli = (typed: string) =>
      execFileSync(
        process.execPath,
        [
          join(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
          join(process.cwd(), "scripts/resolveAfrikFiche.ts"),
          typed,
        ],
        { encoding: "utf8" }
      ).split("\n")[0];

    expect(cli(MERGED.retiredId)).toBe(
      `${MERGED.successorId}\tpatronyme\tretired\tretiredId=${MERGED.retiredId}`
    );
    expect(cli("tchikaya")).toBe(
      "PAT_TCHICAYA\tpatronyme\tneighbour\tnameMain=Tchicaya"
    );
    expect(cli("amaZulu")).toBe(
      "PPL_ZULU\tpeople\texact\tselfAppellation=amaZulu"
    );
  }, 30_000);
});
