import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/searchCompanions", () => ({
  getSearchCompanionSelections: vi.fn(),
}));

import { getSearchCompanionSelections } from "@/api/v2/services/searchCompanions";
import { searchCompanionsDataSchema } from "@/api/v2/schemas/searchCompanions";
import { getSearchCompanionsHandler } from "@/api/v2/handlers/searchCompanions";
import { DID_YOU_KNOW_FACTS } from "@/lib/home/didYouKnowFacts";
import { illustrationFor } from "@/lib/home/didYouKnowIllustrations";
import { PROVERBS } from "@/lib/proverbs/proverbs";
import { getLocalizedRoute } from "@/lib/routing";

const match = {
  relation: "linked-country" as const,
  entityType: "country" as const,
  entityId: "NGA",
};

describe("search companions handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-180
  it("projects every companion without UI labels or catalog internals", async () => {
    const fact = DID_YOU_KNOW_FACTS.find(({ id }) => id === "afrique")!;
    const illustration = illustrationFor(fact.id)!;
    const proverb = PROVERBS[0];

    vi.mocked(getSearchCompanionSelections).mockResolvedValue({
      subjects: [{ type: "country", id: "NGA" }],
      targets: [match],
      shorts: {
        count: 1,
        items: [
          {
            item: {
              id: "short-nigeria",
              publishedAt: "2026-09-01",
              subjects: [{ entityType: "country", entityId: "NGA" }],
              video: {
                id: "short-nigeria",
                status: "published",
                slug: { fr: "nigeria", en: "nigeria" },
                name: { fr: "Nigeria", en: "Nigeria" },
                description: {
                  fr: "Une production sourcée.",
                  en: "A sourced production.",
                },
                publishedAt: "2026-09-01",
                durationSeconds: 47,
                poster: {
                  src: "/posters/nigeria.jpg",
                  width: 270,
                  height: 480,
                },
                watchUrl: "https://www.youtube.com/watch?v=test",
                source: {
                  title: "Source",
                  url: "https://example.org/source",
                  tier: "referenced",
                },
                subjects: [
                  {
                    kind: "country",
                    id: "NGA",
                    label: { fr: "Nigeria", en: "Nigeria" },
                  },
                ],
              },
            },
            match,
          },
        ],
      },
      anecdotes: {
        count: 1,
        items: [
          { item: { id: fact.id, fact, illustration, subjects: [] }, match },
        ],
      },
      proverbs: {
        count: 1,
        items: [{ item: { id: proverb.id, proverb, subjects: [] }, match }],
      },
      quiz: {
        count: 1,
        items: [
          {
            item: {
              id: "quiz-nigeria",
              eligible: true,
              difficulty: 1,
              templateId: "T1",
              subjects: [{ entityType: "country", entityId: "NGA" }],
              contentLanguage: "fr",
              prompt: "Which name?",
              stimulus: null,
              options: ["Nigeria", "Niger"],
              correctOption: 0,
              explanation: "The answer is Nigeria.",
              assertionId: "AST_NGA_NAME",
              source: {
                title: "Source",
                url: "https://example.org/source",
                tier: "referenced",
              },
              entity: { type: "country", id: "NGA" },
            },
            match,
          },
        ],
      },
    } as never);

    const envelope = await getSearchCompanionsHandler({
      lang: "fr",
      subjects: [{ type: "country", id: "NGA" }],
    });

    expect(getSearchCompanionSelections).toHaveBeenCalledWith({
      lang: "fr",
      subjects: [{ type: "country", id: "NGA" }],
    });
    expect(searchCompanionsDataSchema.parse(envelope.data)).toEqual(
      envelope.data
    );
    expect(envelope.data.subjects).toEqual([
      { entityType: "country", entityId: "NGA" },
    ]);
    expect(envelope.data.shorts.items[0]).toMatchObject({
      name: "Nigeria",
      description: "Une production sourcée.",
      poster: {
        alt: "Couverture : D’où vient le nom «\xa0Nigeria\xa0» ?",
      },
      match,
    });
    expect(envelope.data.anecdotes.items[0]).toMatchObject({
      contentLanguage: "fr",
      match,
    });
    expect(envelope.data.proverbs.items[0]).toMatchObject({
      contentLanguage: "fr",
      match,
    });
    expect(envelope.data.quiz).toMatchObject({
      count: 1,
      item: { prompt: "Which name?", match },
    });
    // The generated illustrations were withdrawn; no image shelf is offered.
    expect(envelope.data).not.toHaveProperty("images");

    const payload = JSON.stringify(envelope);
    expect(payload).not.toContain("relationLabel");
    expect(payload).not.toContain('"status":"published"');
    expect(payload).not.toContain('"subjects":[{"kind"');
  });

  // A word has no entity to point at: the match carries the word itself, and
  // the piece still leads to its own Découvertes entry.
  // @req REQ-194
  it("carries each anecdote and proverb source's type onto the wire", async () => {
    const fact = DID_YOU_KNOW_FACTS.find(({ id }) => id === "cameroun")!;
    const proverb = PROVERBS[0];

    vi.mocked(getSearchCompanionSelections).mockResolvedValue({
      subjects: [{ type: "country", id: "CMR" }],
      targets: [match],
      shorts: { count: 0, items: [] },
      anecdotes: {
        count: 1,
        items: [
          {
            item: {
              id: fact.id,
              fact,
              illustration: illustrationFor(fact.id)!,
              subjects: [],
            },
            match,
          },
        ],
      },
      proverbs: {
        count: 1,
        items: [{ item: { id: proverb.id, proverb, subjects: [] }, match }],
      },
      quiz: { count: 0, items: [] },
    } as never);

    const envelope = await getSearchCompanionsHandler({
      lang: "fr",
      subjects: [{ type: "country", id: "CMR" }],
    });

    // The Cameroonian foreign ministry, and Rattray's 1916 Clarendon Press
    // collection.
    expect(envelope.data.anecdotes.items[0].sources[0].sourceKind).toBe(
      "government"
    );
    expect(envelope.data.proverbs.items[0].sources[0].sourceKind).toBe(
      "academic"
    );
    expect(searchCompanionsDataSchema.parse(envelope.data)).toEqual(
      envelope.data
    );
  });

  // @req REQ-180
  it("projects a production found by a word, with the word as its match", async () => {
    const wordMatch = { relation: "word" as const, word: "zombie" };
    vi.mocked(getSearchCompanionSelections).mockResolvedValue({
      subjects: [],
      targets: [],
      shorts: {
        count: 1,
        items: [
          {
            item: {
              id: "video:zombie",
              publishedAt: "2026-09-12",
              subjects: [],
              video: {
                id: "video:zombie",
                status: "published",
                slug: { fr: "zombie", en: "zombie" },
                name: { fr: "zombie", en: "zombie" },
                description: { fr: "Une question.", en: "A question." },
                publishedAt: "2026-09-12",
                durationSeconds: 65,
                poster: { src: "/posters/z.jpg", width: 540, height: 960 },
                watchUrl: "https://www.youtube.com/shorts/abcdefghijk",
                source: {
                  title: "Source",
                  url: "https://example.org/source",
                  tier: "referenced",
                },
                subjects: [],
                word: { queries: ["zombie"] },
              },
            },
            match: wordMatch,
          },
        ],
      },
      anecdotes: { count: 0, items: [] },
      proverbs: { count: 0, items: [] },
      quiz: { count: 0, items: [] },
    } as never);

    const envelope = await getSearchCompanionsHandler({
      lang: "fr",
      subjects: [],
      word: "zombie",
    });

    expect(envelope.data.shorts.items[0]).toMatchObject({
      id: "video:zombie",
      match: wordMatch,
    });
    expect(envelope.data.shorts.items[0].href).toBe(
      `${getLocalizedRoute("fr", "discoveries")}/zombie`
    );
  });

  // @req REQ-180
  it("preserves a successful empty response", async () => {
    vi.mocked(getSearchCompanionSelections).mockResolvedValue({
      subjects: [],
      targets: [],
      shorts: { count: 0, items: [] },
      anecdotes: { count: 0, items: [] },
      proverbs: { count: 0, items: [] },
      quiz: { count: 0, items: [] },
    });

    const envelope = await getSearchCompanionsHandler({
      lang: "fr",
      subjects: [],
    });

    expect(envelope.data).toEqual({
      subjects: [],
      shorts: { count: 0, items: [] },
      anecdotes: { count: 0, items: [] },
      proverbs: { count: 0, items: [] },
      quiz: { count: 0, item: null },
    });
    expect(envelope.errors).toEqual([]);
  });
});
