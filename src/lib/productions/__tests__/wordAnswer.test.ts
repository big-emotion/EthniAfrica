import { describe, expect, it } from "vitest";

import type { LedgerEntry } from "../ledger";
import { findWordAnswer } from "../wordAnswer";

// A test fixture, not the registry's data: the real record gets its `answer`
// in a separate data session.
const pharaoh: LedgerEntry = {
  campaign: "pharaon-d-ou-vient-le-nom",
  typologie: "mot",
  episode: 18,
  question: { fr: "D'où vient le nom pharaon ?" },
  myth: null,
  subjects: [],
  sitePath: "/fr/about",
  word: {
    label: { fr: "pharaon", en: "pharaoh" },
    queries: ["pharaon", "pharaons", "pharaoh"],
  },
  answer: {
    lead: {
      fr: "Au départ, « pharaon » désignait le palais.",
      en: "At first, “pharaoh” meant the palace.",
    },
    origin: [
      {
        text: {
          fr: "De l'égyptien per-aa, « la grande maison ».",
          en: "From Egyptian per-aa, “the great house”.",
        },
        attribution: "linguistic",
      },
    ],
    path: [
      { form: "per-aa", language: "égyptien" },
      { form: "pharaon", language: "français" },
    ],
    followUp: { fr: "Comment le palais est-il devenu le roi ?" },
  },
  publications: [
    {
      network: "tiktok",
      format: "carrousel",
      url: "https://www.tiktok.com/@x/photo/1",
      publishedAt: "2026-10-03",
    },
    { network: "instagram", format: "carrousel" },
  ],
  sources: [
    {
      title: "TLFi, « pharaon »",
      url: "https://www.cnrtl.fr/etymologie/pharaon",
      tier: "referenced",
    },
  ],
};

const withoutAnswer: LedgerEntry = {
  ...pharaoh,
  campaign: "zombie",
  answer: undefined,
  word: { label: { fr: "zombi" }, queries: ["zombi"] },
};

describe("findWordAnswer", () => {
  // @req REQ-184
  it.each(["pharaoh", "Pharaons", " PHARAON ", "d'où vient pharaon ?"])(
    "finds the published word for %s",
    (query) => {
      expect(findWordAnswer(query, "fr", [pharaoh])).toHaveLength(1);
    }
  );

  // @req REQ-184
  it("finds nothing for a word that carries no answer, or no word at all", () => {
    expect(findWordAnswer("zombi", "fr", [withoutAnswer])).toEqual([]);
    expect(
      findWordAnswer("pharaon", "fr", [{ ...pharaoh, word: undefined }])
    ).toEqual([]);
  });

  // @req REQ-184
  it("projects the record into the answer contract", () => {
    const [fr] = findWordAnswer("pharaon", "fr", [pharaoh]);
    expect(fr).toMatchObject({
      kind: "word",
      title: "pharaon",
      queries: ["pharaon", "pharaons", "pharaoh"],
      what: { lead: "Au départ, « pharaon » désignait le palais.", facts: {} },
      origin: { debated: false },
      next: { question: "Comment le palais est-il devenu le roi ?" },
      path: [
        { form: "per-aa", language: "égyptien" },
        { form: "pharaon", language: "français" },
      ],
      sources: { count: 1 },
    });
    expect(fr.origin?.accounts[0]).toMatchObject({
      text: "De l'égyptien per-aa, « la grande maison ».",
      attribution: "linguistic",
    });
  });

  // @req REQ-184
  it("never matches on a part of a query", () => {
    expect(findWordAnswer("pharaon egypte", "fr", [pharaoh])).toEqual([]);
    expect(findWordAnswer("", "fr", [pharaoh])).toEqual([]);
  });

  // @req REQ-184
  it("lists the word's forms without crowning one, and links only published occurrences", () => {
    const [answer] = findWordAnswer("pharaon", "fr", [pharaoh]);
    expect(answer.names.map((name) => name.form)).toEqual([
      "pharaon",
      "pharaoh",
    ]);
    expect(answer.names.every((name) => name.selfGiven === null)).toBe(true);
    expect(answer.publications).toEqual([
      expect.objectContaining({
        network: "tiktok",
        url: "https://www.tiktok.com/@x/photo/1",
        format: expect.any(String),
      }),
    ]);
  });

  // @req REQ-184
  it("attaches the record's sources to an account only when there is one account to carry them", () => {
    const [single] = findWordAnswer("pharaon", "fr", [pharaoh]);
    expect(single.origin?.accounts[0].evidence[0].sources[0]).toMatchObject({
      title: "TLFi, « pharaon »",
      tier: "referenced",
    });

    const twoAccounts: LedgerEntry = {
      ...pharaoh,
      answer: {
        ...pharaoh.answer!,
        origin: [
          { text: { fr: "Une première explication." } },
          { text: { fr: "Une seconde explication." } },
        ],
      },
    };
    const [several] = findWordAnswer("pharaon", "fr", [twoAccounts]);
    expect(several.origin?.accounts.every((a) => a.evidence.length === 0)).toBe(
      true
    );
    expect(several.origin?.debated).toBe(true);
    // The count still says how many sources the piece rests on.
    expect(several.sources.count).toBe(1);
  });
});
