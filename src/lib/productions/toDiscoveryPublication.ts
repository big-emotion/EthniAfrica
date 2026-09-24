import type {
  DiscoveryPublication,
  DiscoverySubjectKind,
} from "@/lib/discoveries/catalog";
import {
  formatProductionNameQuestion,
  formatProductionPosterAlt,
} from "@/lib/editorial/productionNameQuestion";
import type { Language } from "@/types/shared";

import type { LedgerEntry } from "./ledger";

const KNOWN_KINDS: readonly DiscoverySubjectKind[] = [
  "country",
  "family",
  "people",
  "language",
  "patronyme",
];

const YOUTUBE_VIDEO_ID = /(?:shorts\/|[?&]v=|youtu\.be\/)([\w-]{11})/;

function isKnownKind(kind: string): kind is DiscoverySubjectKind {
  return (KNOWN_KINDS as readonly string[]).includes(kind);
}

/**
 * Projects one ledger subject into its `video` `DiscoveryPublication`, per
 * `docs/plans/production-history-plan.md` §6.
 *
 * A production the ledger has not yet finished data-entry for is still
 * projected — never skipped — carrying whatever fields the ledger has and
 * empty-string/zero sentinels for the ones it does not. `eligiblePublications`
 * (`src/lib/discoveries/catalog.ts`) is the single place that decides
 * visibility from those fields (`isHttpsUrl`, `durationSeconds > 0`,
 * `hasText(poster.src)`); duplicating that judgement here would be a second
 * copy of the eligibility rule, which is exactly what this repository's own
 * doctrine warns drifts.
 *
 * The carousel branch is deliberately absent: no ledger subject yet carries
 * the rendered local frames DEC-059 requires for a self-hosted carousel
 * (that is asset-export work, not this function's job), so projecting one
 * today would either be empty or invented. `docs/plans/production-history-
 * plan.md` §6 accepts exactly this: "produced by the same function but not
 * wired into any reader yet."
 */
// @req REQ-184
export function toDiscoveryPublication(
  entry: LedgerEntry
): DiscoveryPublication[] {
  const subject = entry.subjects[0];
  if (!subject || !isKnownKind(subject.kind)) return [];

  const entities = entry.subjects.flatMap((candidate) =>
    isKnownKind(candidate.kind)
      ? [
          {
            kind: candidate.kind,
            id: candidate.id,
            label: {
              fr: candidate.label.fr,
              en: candidate.label.en ?? candidate.label.fr,
            },
          },
        ]
      : []
  );

  const videoRows = entry.publications.filter(
    (row) => row.format === "video" && row.url
  );
  // YouTube is the one player the site may frame, so its row wins when a
  // production is filed on several networks.
  const videoRow =
    videoRows.find((row) => row.network === "youtube") ?? videoRows[0];
  const youtubeId = videoRow?.url?.match(YOUTUBE_VIDEO_ID)?.[1];

  const name: Record<Language, string> = {
    fr: subject.label.fr,
    en: subject.label.en ?? subject.label.fr,
  };

  return [
    {
      id: `video:${entry.campaign}`,
      kind: "video",
      status: "published",
      slug: { fr: entry.campaign, en: entry.campaign },
      title: {
        fr: formatProductionNameQuestion(name.fr, "fr"),
        en: formatProductionNameQuestion(name.en, "en"),
      },
      description: {
        fr: entry.myth?.fr ?? entry.question.fr,
        en: entry.myth?.en ?? entry.question.en ?? entry.question.fr,
      },
      source:
        entry.sources && entry.sources.length > 0
          ? {
              title: entry.sources[0].title,
              url: entry.sources[0].url,
              tier: entry.sources[0].tier as
                "official" | "referenced" | "unverified",
            }
          : undefined,
      detail: {
        body: {
          fr: [entry.myth?.fr ?? entry.question.fr],
          en: [entry.myth?.en ?? entry.question.en ?? entry.question.fr],
        },
        entities,
        sources: (entry.sources ?? []).map(({ title, url }) => ({
          title,
          url,
        })),
      },
      video: {
        name,
        publishedAt: videoRow?.publishedAt ?? "",
        durationSeconds: entry.durationSeconds ?? 0,
        watchUrl: videoRow?.url ?? "",
        embed: youtubeId
          ? { provider: "youtube" as const, id: youtubeId }
          : undefined,
        poster: {
          src: entry.poster?.src ?? "",
          width: entry.poster?.width ?? 0,
          height: entry.poster?.height ?? 0,
          alt: {
            fr: formatProductionPosterAlt(name.fr, "fr"),
            en: formatProductionPosterAlt(name.en, "en"),
          },
        },
      },
    },
  ];
}
