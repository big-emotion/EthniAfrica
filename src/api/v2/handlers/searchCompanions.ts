import type {
  SearchCompanionsData,
  SearchCompanionsQuery,
} from "@/api/v2/schemas/searchCompanions";
import { searchCompanionsDataSchema } from "@/api/v2/schemas/searchCompanions";
import { getSearchCompanionSelections } from "@/api/v2/services/searchCompanions";
import { createApiResponse, type ApiEnvelope } from "@/api/v2/utils/response";
import { discoveryPath } from "@/lib/discoveries/catalog";
import {
  searchShortDiscoveryPublication,
  searchShortPosterAlt,
} from "@/lib/search/companionCatalogs";
import type { SourceKind } from "@/types/sources";

function source(source: {
  title: string;
  url?: string | null;
  tier: "official" | "referenced" | "unverified";
  notes?: string;
  source_kind?: SourceKind;
}) {
  return {
    title: source.title,
    url: source.url ?? null,
    tier: source.tier,
    ...(source.notes ? { notes: source.notes } : {}),
    ...(source.source_kind ? { sourceKind: source.source_kind } : {}),
  };
}

// @req REQ-180
export async function getSearchCompanionsHandler(
  query: SearchCompanionsQuery
): Promise<ApiEnvelope<SearchCompanionsData>> {
  const selections = await getSearchCompanionSelections(query);
  const data = searchCompanionsDataSchema.parse({
    subjects: selections.subjects.map(({ type, id }) => ({
      entityType: type,
      entityId: id,
    })),
    shorts: {
      count: selections.shorts.count,
      items: selections.shorts.items.map(({ item, match }) => {
        const publication = searchShortDiscoveryPublication(item.video);
        return {
          id: item.id,
          href: discoveryPath(query.lang, publication),
          name: item.video.name[query.lang],
          description: item.video.description[query.lang],
          publishedAt: item.video.publishedAt,
          durationSeconds: item.video.durationSeconds,
          watchUrl: item.video.watchUrl,
          poster: {
            ...item.video.poster,
            alt: searchShortPosterAlt(item.video, query.lang),
          },
          source: source(item.video.source),
          match,
        };
      }),
    },
    anecdotes: {
      count: selections.anecdotes.count,
      items: selections.anecdotes.items.map(({ item, match }) => {
        const { fact, illustration } = item;
        return {
          id: item.id,
          contentLanguage: "fr",
          headline: fact.headline,
          body: fact.body,
          tier: fact.tier,
          sources: (fact.sources ?? []).map(source),
          illustration,
          match,
        };
      }),
    },
    proverbs: {
      count: selections.proverbs.count,
      items: selections.proverbs.items.map(({ item, match }) => {
        const { proverb } = item;
        return {
          id: item.id,
          contentLanguage: "fr",
          text: proverb.text,
          meaning: proverb.meaning,
          original: proverb.original ?? null,
          origin: proverb.origin,
          sources: proverb.sources.map(source),
          match,
        };
      }),
    },
    quiz: {
      count: selections.quiz.count,
      item: selections.quiz.items[0]
        ? {
            id: selections.quiz.items[0].item.id,
            templateId: selections.quiz.items[0].item.templateId,
            contentLanguage: selections.quiz.items[0].item.contentLanguage,
            prompt: selections.quiz.items[0].item.prompt,
            stimulus: selections.quiz.items[0].item.stimulus,
            options: selections.quiz.items[0].item.options,
            correctOption: selections.quiz.items[0].item.correctOption,
            explanation: selections.quiz.items[0].item.explanation,
            assertionId: selections.quiz.items[0].item.assertionId,
            source: selections.quiz.items[0].item.source,
            entity: selections.quiz.items[0].item.entity,
            match: selections.quiz.items[0].match,
          }
        : null,
    },
  });

  return createApiResponse(data);
}
