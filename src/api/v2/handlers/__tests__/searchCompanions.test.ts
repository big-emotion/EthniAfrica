import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/searchCompanions", () => ({
  getSearchCompanionSelections: vi.fn(),
}));

import { getSearchCompanionSelections } from "@/api/v2/services/searchCompanions";
import { searchCompanionsDataSchema } from "@/api/v2/schemas/searchCompanions";
import { getSearchCompanionsHandler } from "@/api/v2/handlers/searchCompanions";
import { generatedImagePublications } from "@/lib/discoveries/generatedImages";
import { DID_YOU_KNOW_FACTS } from "@/lib/home/didYouKnowFacts";
import { illustrationFor } from "@/lib/home/didYouKnowIllustrations";
import { PROVERBS } from "@/lib/proverbs/proverbs";

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
  it("localizes facts and projects every companion without UI labels or catalog internals", async () => {
    const fact = DID_YOU_KNOW_FACTS.find(({ id }) => id === "afrique")!;
    const illustration = illustrationFor(fact.id)!;
    const proverb = PROVERBS[0];
    const publication = generatedImagePublications()[0];

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
      images: {
        count: 1,
        items: [
          {
            item: { id: publication.id, publication, subjects: [] },
            match,
          },
        ],
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
              contentLanguage: "en",
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
      lang: "en",
      subjects: [{ type: "country", id: "NGA" }],
    });

    expect(getSearchCompanionSelections).toHaveBeenCalledWith({
      lang: "en",
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
      description: "A sourced production.",
      poster: {
        alt: "Cover: Where does the name “Nigeria” come from?",
      },
      match,
    });
    expect(envelope.data.anecdotes.items[0]).toMatchObject({
      contentLanguage: "en",
      match,
    });
    expect(envelope.data.proverbs.items[0]).toMatchObject({
      contentLanguage: "en",
      match,
    });
    expect(envelope.data.quiz).toMatchObject({
      count: 1,
      item: { prompt: "Which name?", match },
    });

    const payload = JSON.stringify(envelope);
    expect(payload).not.toContain("relationLabel");
    expect(payload).not.toContain('"status":"published"');
    expect(payload).not.toContain('"subjects":[{"kind"');
    expect(payload).not.toContain("jobId");
  });

  // @req REQ-180
  it("preserves a successful empty response", async () => {
    vi.mocked(getSearchCompanionSelections).mockResolvedValue({
      subjects: [],
      targets: [],
      shorts: { count: 0, items: [] },
      anecdotes: { count: 0, items: [] },
      proverbs: { count: 0, items: [] },
      images: { count: 0, items: [] },
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
      images: { count: 0, items: [] },
      quiz: { count: 0, item: null },
    });
    expect(envelope.errors).toEqual([]);
  });
});
