import { describe, expect, it } from "vitest";

import { validateEntry, type ValidationDeps } from "../checkProductionLedger";

const deps: ValidationDeps = {
  corpusIdExists: () => true,
  networkAcceptsFormat: () => true,
};

const PHARAON_ANSWER = {
  lead: {
    fr: "Au départ, « pharaon » ne désignait pas le roi.",
    en: "At first, “pharaoh” did not mean the king.",
  },
  origin: [
    {
      text: { fr: "De l'égyptien per-aa, « la grande maison »." },
      attribution: "linguistic",
    },
  ],
  path: [
    { form: "per-aa", language: "égyptien" },
    { form: "pharaō", language: "grec" },
  ],
  followUp: { fr: "Quel mot disaient les Égyptiens pour « roi » ?" },
};

function wordEntry(answer?: unknown) {
  return {
    campaign: "pharaon-d-ou-vient-le-nom",
    typologie: "mot",
    episode: 18,
    question: { fr: "D'où vient le nom pharaon ?" },
    myth: { fr: "Pharaon était-il un nom adopté en devenant roi ?" },
    subjects: [],
    sitePath: "/fr/about",
    word: { label: { fr: "pharaon" }, queries: ["pharaon", "pharaoh"] },
    publications: [],
    ...(answer === undefined ? {} : { answer }),
  };
}

describe("production ledger — the answer of a published word", () => {
  // @req REQ-184
  it("accepts a word piece without an answer, as before", () => {
    expect(validateEntry(wordEntry(), deps)).toEqual([]);
  });

  // @req REQ-184
  it("accepts a complete answer", () => {
    expect(validateEntry(wordEntry(PHARAON_ANSWER), deps)).toEqual([]);
  });

  // @req REQ-184
  it("requires at least one account of the origin", () => {
    const errors = validateEntry(
      wordEntry({ ...PHARAON_ANSWER, origin: [] }),
      deps
    );
    expect(errors.join("\n")).toMatch(/answer\.origin/);
  });

  // @req REQ-184
  it("refuses an answer on a piece that is not about a word", () => {
    const entry = { ...wordEntry(PHARAON_ANSWER), word: undefined };
    expect(validateEntry(entry, deps).join("\n")).toMatch(/answer.*word piece/);
  });

  // @req REQ-178
  it("holds the lead and the follow-up to the limits the fiches obey", () => {
    const errors = validateEntry(
      wordEntry({
        ...PHARAON_ANSWER,
        lead: { fr: "a".repeat(221) },
        followUp: { fr: "Les Égyptiens disaient autre chose." },
      }),
      deps
    );
    expect(errors.some((error) => /answer\.lead\.fr.*220/.test(error))).toBe(
      true
    );
    expect(errors.some((error) => /answer\.followUp\.fr.*\?/.test(error))).toBe(
      true
    );
  });

  // @req REQ-178
  it("holds the English follow-up to a question too", () => {
    const errors = validateEntry(
      wordEntry({
        ...PHARAON_ANSWER,
        followUp: { fr: "Quel autre mot ?", en: "Another word." },
      }),
      deps
    );
    expect(errors.join("\n")).toMatch(/answer\.followUp\.en/);
  });

  // @req REQ-178
  it("keeps the reader-facing register in every sentence", () => {
    const errors = validateEntry(
      wordEntry({
        ...PHARAON_ANSWER,
        origin: [
          { text: { fr: "Voir PPL_FULA, fiche de la passe de recherche." } },
        ],
      }),
      deps
    );
    expect(errors.join("\n")).toMatch(
      /answer\.origin\[0\]\.text\.fr.*register/
    );
  });

  // @req REQ-184
  it("rejects an unknown attribution and an unknown key", () => {
    const errors = validateEntry(
      wordEntry({
        ...PHARAON_ANSWER,
        origin: [{ text: { fr: "Un récit." }, attribution: "rumour" }],
        verdict: "x",
      }),
      deps
    );
    expect(errors.join("\n")).toMatch(/attribution/);
    expect(errors.join("\n")).toMatch(/unknown field "verdict"/);
  });

  // @req REQ-184
  it("requires each step of the path to name a form and a language", () => {
    const errors = validateEntry(
      wordEntry({ ...PHARAON_ANSWER, path: [{ form: "pharaō" }] }),
      deps
    );
    expect(errors.join("\n")).toMatch(/answer\.path\[0\]\.language/);
  });
});
