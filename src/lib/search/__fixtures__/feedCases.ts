import { z } from "zod";

import {
  searchCompanionsDataSchema,
  type SearchCompanionsData,
} from "@/api/v2/schemas/searchCompanions";
import type { SearchWithLeads } from "@/lib/afrikLoader";
import { formatProductionPosterAlt } from "@/lib/editorial/productionNameQuestion";
import {
  FEED_BLOCKS,
  FEED_ZONES,
  OWED_PARTS,
  type FeedBlockId,
  type FeedZone,
  type OwedPartId,
  type SearchResultState,
} from "@/lib/search/resultGrammar";
import type { SearchLead, SearchResult } from "@/types/afrik-frontend";

import boardAuthoring from "./feedBoardCases.json";

// @req REQ-180
export const FEED_CASE_IDS = [
  "mande",
  "peul",
  "fang",
  "bassa",
  "ekpeye",
  "nigeria",
  "lingala",
  "traore",
  "introuvable",
  "inconnu",
] as const;

export type FeedCaseId = (typeof FEED_CASE_IDS)[number];

const feedBoardAuthoringSchema = z
  .array(
    z
      .object({
        id: z.enum(FEED_CASE_IDS),
        file: z.string().min(1),
        name: z.string().min(1),
        name_plain: z.string().min(1),
        q: z.string().min(1),
        result_state: z.enum(["exact", "widened", "typo", "unknown"]),
        title: z.string().min(1),
        eyebrow: z.string().min(1).optional(),
        verdict: z.string().min(1),
        sub: z.string().min(1),
        lens: z.array(
          z.union([
            z.tuple([z.literal("Shorts"), z.number().int().nonnegative()]),
            z.tuple([z.literal("Images"), z.number().int().nonnegative()]),
            z.tuple([z.literal("Jeux"), z.boolean()]),
            z.tuple([z.literal("Fiches"), z.number().int().nonnegative()]),
          ])
        ),
        shorts: z
          .object({
            sub: z.string().nullable().optional(),
            empty: z
              .tuple([z.string().min(1), z.string().min(1), z.string().min(1)])
              .optional(),
            note: z.string().min(1).optional(),
            items: z.array(
              z.tuple([
                z.string().min(1),
                z.string().regex(/^\d+:\d{2}$/),
                z.string().nullable(),
              ])
            ),
          })
          .strict(),
        order: z.array(z.enum(FEED_BLOCKS)),
      })
      .passthrough()
  )
  .length(FEED_CASE_IDS.length);

export type FeedBoardAuthoring = z.infer<typeof feedBoardAuthoringSchema>;

// Complete test-only board content: every illustrative string and count.
// @req REQ-180
export const FEED_BOARD_AUTHORING =
  feedBoardAuthoringSchema.parse(boardAuthoring);

const assetRouteSchema = z
  .object({
    requestPath: z
      .string()
      .regex(
        /^\/(?:docs\/design\/mockups\/search-feed\/posters|public\/images)\//
      ),
    repositoryPath: z
      .string()
      .min(1)
      .refine((value) => !value.startsWith("/") && !value.includes("..")),
  })
  .strict();
const blockSchema = z
  .object({
    id: z.enum(FEED_BLOCKS),
    zone: z.enum(FEED_ZONES),
  })
  .strict();
const searchResultSchema = z
  .object({
    type: z.enum([
      "people",
      "country",
      "languageFamily",
      "language",
      "person",
      "patronyme",
    ]),
    id: z.string().min(1),
    name: z.string().min(1),
  })
  .passthrough();
const searchLeadSchema = z
  .object({
    type: z.enum(["people", "country", "languageFamily"]),
    id: z.string().min(1),
    name: z.string().min(1),
    similarity: z.number().min(0).max(1),
  })
  .strict();
const lensCountsSchema = z
  .object({
    all: z.number().int().nonnegative(),
    people: z.number().int().nonnegative(),
    country: z.number().int().nonnegative(),
    languageFamily: z.number().int().nonnegative(),
    language: z.number().int().nonnegative(),
    person: z.number().int().nonnegative(),
    patronyme: z.number().int().nonnegative(),
  })
  .strict();

// @req REQ-180
export const feedCaseFixturesSchema = z
  .array(
    z
      .object({
        fixture: z.literal(true),
        id: z.enum(FEED_CASE_IDS),
        stem: z.string().min(1),
        query: z.string().min(1),
        resultState: z.enum(["exact", "widened", "typo", "unknown"]),
        production: z
          .object({
            search: z
              .object({
                results: z.array(searchResultSchema),
                leads: z.array(searchLeadSchema),
                counts: lensCountsSchema,
                answered: z.literal(true),
              })
              .strict(),
            companions: searchCompanionsDataSchema,
          })
          .strict(),
        board: z
          .object({
            blocks: z
              .object({
                mobile: z.array(blockSchema),
                desktop: z.array(blockSchema),
              })
              .strict(),
            owedParts: z.array(z.enum(OWED_PARTS)),
            lenses: z
              .object({
                shorts: z.number().int().nonnegative(),
                images: z.number().int().nonnegative().optional(),
                quiz: z.boolean().optional(),
                fiches: z.number().int().nonnegative().optional(),
              })
              .strict(),
            copy: z
              .object({
                title: z.string().min(1),
                eyebrow: z.string().min(1).optional(),
                verdict: z.string().min(1),
                summary: z.string().min(1),
              })
              .strict(),
            shorts: z
              .object({
                items: z.array(
                  z
                    .object({
                      fixture: z.literal(true),
                      name: z.string().min(1),
                      durationSeconds: z.number().int().positive(),
                      label: z.string().min(1).optional(),
                      poster: assetRouteSchema,
                    })
                    .strict()
                ),
                emptySlot: z
                  .object({
                    name: z.string().min(1),
                    question: z.string().min(1),
                    body: z.string().min(1),
                    action: z.string().min(1),
                  })
                  .strict()
                  .optional(),
                wideningNote: z.string().min(1).optional(),
              })
              .strict(),
            editorialImages: z.array(assetRouteSchema),
          })
          .strict(),
      })
      .strict()
  )
  .length(FEED_CASE_IDS.length);

export interface FixtureAssetRoute {
  requestPath: string;
  repositoryPath: string;
}

export interface FeedCaseFixture {
  fixture: true;
  id: FeedCaseId;
  stem: string;
  query: string;
  resultState: Extract<
    SearchResultState,
    "exact" | "widened" | "typo" | "unknown"
  >;
  production: {
    search: SearchWithLeads;
    companions: SearchCompanionsData;
  };
  board: {
    blocks: Record<
      "mobile" | "desktop",
      Array<{ id: FeedBlockId; zone: FeedZone }>
    >;
    owedParts: OwedPartId[];
    lenses: {
      shorts: number;
      images?: number;
      quiz?: boolean;
      fiches?: number;
    };
    copy: {
      title: string;
      eyebrow?: string;
      verdict: string;
      summary: string;
    };
    shorts: {
      items: Array<{
        fixture: true;
        name: string;
        durationSeconds: number;
        label?: string;
        poster: FixtureAssetRoute;
      }>;
      emptySlot?: {
        name: string;
        question: string;
        body: string;
        action: string;
      };
      wideningNote?: string;
    };
    editorialImages: FixtureAssetRoute[];
  };
}

type Subject = SearchCompanionsData["subjects"][number];
type BoardShort = FeedCaseFixture["board"]["shorts"]["items"][number];
type Match = SearchCompanionsData["shorts"]["items"][number]["match"];

const FIXTURE_SOURCE = {
  title: "Approved search-feed board fixture",
  url: "https://example.org/search-feed-fixture",
  tier: "referenced" as const,
};

function block(id: FeedBlockId, zone: FeedZone) {
  return { id, zone };
}

const opening = [
  block("lenses", "first"),
  block("verdict", "first"),
  block("appellations", "first"),
  block("shorts", "first"),
];

function standardBlocks(
  mobile: FeedBlockId[],
  primary: FeedBlockId[],
  secondary: FeedBlockId[] = [],
  closing: FeedBlockId[] = ["owed"]
): FeedCaseFixture["board"]["blocks"] {
  return {
    mobile: [
      ...opening,
      ...mobile.map((id) => block(id, "primary")),
      ...closing.map((id) => block(id, "closing")),
    ],
    desktop: [
      ...opening,
      ...primary.map((id) => block(id, "primary")),
      ...secondary.map((id) => block(id, "secondary")),
      ...closing.map((id) => block(id, "closing")),
    ],
  };
}

function poster(slug: string): FixtureAssetRoute {
  return {
    requestPath: `/docs/design/mockups/search-feed/posters/${slug}.jpg`,
    repositoryPath: `docs/design/mockups/search-feed/posters/${slug}.jpg`,
  };
}

function posterSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function editorial(relativePath: string): FixtureAssetRoute {
  return {
    requestPath: `/public/images/${relativePath}`,
    repositoryPath: `public/images/${relativePath}`,
  };
}

function durationSeconds(duration: string): number {
  const [minutes, seconds] = duration.split(":").map(Number);
  return minutes * 60 + seconds;
}

function countsFor(results: readonly SearchResult[]) {
  const counts: SearchWithLeads["counts"] = {
    all: results.length,
    people: 0,
    country: 0,
    languageFamily: 0,
    language: 0,
    person: 0,
    patronyme: 0,
  };
  for (const result of results) counts[result.type] += 1;
  return counts;
}

function search(
  results: SearchResult[],
  leads: SearchLead[] = []
): SearchWithLeads {
  return { results, leads, counts: countsFor(results), answered: true };
}

function match(subject: Subject, relation: Match["relation"] = "exact"): Match {
  return { ...subject, relation };
}

function companions(
  subjects: Subject[],
  shorts: BoardShort[],
  matches: Match[]
): SearchCompanionsData {
  return {
    subjects,
    shorts: {
      count: shorts.length,
      items: shorts.map((item, index) => ({
        id: `fixture-short-${item.poster.repositoryPath.split("/").at(-1)!.replace(".jpg", "")}`,
        href: `/fr/decouvertes/${item.poster.repositoryPath.split("/").at(-1)!.replace(".jpg", "")}`,
        name: item.name,
        description: `Illustrative board fixture for ${item.name}.`,
        publishedAt: "2026-09-01",
        durationSeconds: item.durationSeconds,
        watchUrl: "https://www.youtube.com/watch?v=fixture",
        poster: {
          src: item.poster.requestPath,
          alt: formatProductionPosterAlt(item.name, "fr"),
          width: 270,
          height: 480,
        },
        source: FIXTURE_SOURCE,
        match: matches[index] ?? matches[0],
      })),
    },
    anecdotes: { count: 0, items: [] },
    proverbs: { count: 0, items: [] },
    images: { count: 0, items: [] },
    quiz: { count: 0, item: null },
  };
}

function caseFixture(
  value: Pick<FeedCaseFixture, "id"> & {
    results: SearchResult[];
    leads?: SearchLead[];
    subjects: Subject[];
    matches: Match[];
    board: Pick<
      FeedCaseFixture["board"],
      "blocks" | "owedParts" | "editorialImages"
    >;
  }
): FeedCaseFixture {
  const { results, leads, subjects, matches, ...fixture } = value;
  const authoring = FEED_BOARD_AUTHORING.find(({ id }) => id === fixture.id);
  if (!authoring) {
    throw new Error(`Missing board authoring for feed case: ${fixture.id}`);
  }
  const boardShorts = authoring.shorts.items.map(
    ([name, duration, label]): BoardShort => ({
      fixture: true,
      name,
      durationSeconds: durationSeconds(duration),
      ...(label ? { label } : {}),
      poster: poster(posterSlug(name)),
    })
  );
  const lens = Object.fromEntries(authoring.lens);
  if (typeof lens.Shorts !== "number") {
    throw new Error(`Missing Shorts lens for feed case: ${fixture.id}`);
  }
  const board: FeedCaseFixture["board"] = {
    ...fixture.board,
    lenses: {
      shorts: lens.Shorts,
      ...(typeof lens.Images === "number" ? { images: lens.Images } : {}),
      ...(typeof lens.Jeux === "boolean" ? { quiz: lens.Jeux } : {}),
      ...(typeof lens.Fiches === "number" ? { fiches: lens.Fiches } : {}),
    },
    copy: {
      title: authoring.title,
      ...(authoring.eyebrow ? { eyebrow: authoring.eyebrow } : {}),
      verdict: authoring.verdict,
      summary: authoring.sub,
    },
    shorts: {
      items: boardShorts,
      ...(authoring.shorts.empty
        ? {
            emptySlot: {
              name: authoring.name,
              question: authoring.shorts.empty[0],
              body: authoring.shorts.empty[1],
              action: authoring.shorts.empty[2],
            },
          }
        : {}),
      ...(authoring.shorts.note ? { wideningNote: authoring.shorts.note } : {}),
    },
  };

  return {
    fixture: true,
    id: fixture.id,
    stem: authoring.file,
    query: authoring.q,
    resultState: authoring.result_state,
    board,
    production: {
      search: search(results, leads),
      companions: companions(subjects, boardShorts, matches),
    },
  };
}

const mandeSubject: Subject = {
  entityType: "languageFamily",
  entityId: "FLG_MANDE",
};
const peulSubject: Subject = { entityType: "people", entityId: "PPL_PEUL" };
const fangSubject: Subject = { entityType: "people", entityId: "PPL_FANG" };
const bassaSubjects: Subject[] = [
  { entityType: "people", entityId: "PPL_BASSA" },
  { entityType: "people", entityId: "PPL_BASAA" },
  { entityType: "people", entityId: "PPL_BASSA_NGE" },
];
const ekpeyeSubject: Subject = {
  entityType: "people",
  entityId: "PPL_EKPEYE",
};
const nigeriaSubject: Subject = { entityType: "country", entityId: "NGA" };
const lingalaSubject: Subject = { entityType: "language", entityId: "lin" };
const traoreSubject: Subject = {
  entityType: "patronyme",
  entityId: "PAT_TRAORE",
};
const mandinkaSubject: Subject = {
  entityType: "people",
  entityId: "PPL_MANDINKA",
};

// @req REQ-180
const FEED_CASE_VALUES: FeedCaseFixture[] = [
  caseFixture({
    id: "mande",
    results: [
      {
        type: "languageFamily",
        id: mandeSubject.entityId,
        name: "Mandé",
        exactMatch: true,
      },
    ],
    subjects: [mandeSubject],
    matches: [match(mandeSubject), match(mandeSubject, "linked-people")],
    board: {
      blocks: standardBlocks(
        ["origins", "tiles", "plates", "quiz", "images", "fiches"],
        ["origins", "plates", "fiches"],
        ["tiles", "quiz", "images"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [
        editorial("anecdotes/malinke-manden.jpg"),
        editorial("anecdotes/bambara-refus.jpg"),
        editorial("anecdotes/dioula-metier.jpg"),
        editorial("discoveries/generated/mansa-musa/4x5.jpg"),
      ],
    },
  }),
  caseFixture({
    id: "peul",
    results: [
      {
        type: "people",
        id: peulSubject.entityId,
        name: "Peul",
        autonym: "Fulbe",
        exactMatch: true,
      },
    ],
    subjects: [peulSubject],
    matches: [match(peulSubject)],
    board: {
      blocks: standardBlocks(
        ["origins", "plates", "quiz", "problem", "fiches"],
        ["origins", "plates", "fiches"],
        ["quiz", "problem"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [
        editorial("anecdotes/peul-dix-noms.jpg"),
        editorial("anecdotes/fulbe-quatre-noms.jpg"),
      ],
    },
  }),
  caseFixture({
    id: "fang",
    results: [
      {
        type: "people",
        id: fangSubject.entityId,
        name: "Fang",
        autonym: "Fang",
        exactMatch: true,
      },
    ],
    subjects: [fangSubject],
    matches: [match(fangSubject)],
    board: {
      blocks: standardBlocks(
        ["origins", "plates", "quiz", "problem", "fiches"],
        ["origins", "plates", "fiches"],
        ["quiz", "problem"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [editorial("anecdotes/fang-reputation.jpg")],
    },
  }),
  caseFixture({
    id: "bassa",
    results: bassaSubjects.map((subject, index) => ({
      type: "people" as const,
      id: subject.entityId,
      name: ["Bassa", "Basaa", "Bassa Nge"][index],
      exactMatch: true,
    })),
    subjects: bassaSubjects,
    matches: [match(bassaSubjects[1]), match(bassaSubjects[2])],
    board: {
      blocks: standardBlocks(
        ["peoples", "shared-name", "plates", "quiz", "near-name", "fiches"],
        ["peoples", "plates", "fiches"],
        ["shared-name", "quiz", "near-name"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [editorial("anecdotes/bassa-nge-distinction.jpg")],
    },
  }),
  caseFixture({
    id: "ekpeye",
    results: [
      {
        type: "people",
        id: ekpeyeSubject.entityId,
        name: "Ekpeye",
        autonym: "Ekpeye",
        exactMatch: true,
      },
    ],
    subjects: [ekpeyeSubject],
    matches: [
      {
        relation: "linked-family",
        entityType: "people",
        entityId: "PPL_IGBO",
      },
      {
        relation: "linked-family",
        entityType: "people",
        entityId: "PPL_YORUBA",
      },
    ],
    board: {
      blocks: standardBlocks(
        ["atlas-holds", "plates", "quiz", "fiches"],
        ["atlas-holds", "plates", "quiz", "fiches"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [editorial("anecdotes/nigeria-flora-shaw.jpg")],
    },
  }),
  caseFixture({
    id: "nigeria",
    results: [
      {
        type: "country",
        id: nigeriaSubject.entityId,
        name: "Nigeria",
        exactMatch: true,
      },
    ],
    subjects: [nigeriaSubject],
    matches: [match(nigeriaSubject)],
    board: {
      blocks: standardBlocks(
        ["origins", "tiles", "plates", "quiz", "problem", "fiches"],
        ["origins", "plates", "fiches"],
        ["tiles", "quiz", "problem"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [editorial("anecdotes/nigeria-flora-shaw.jpg")],
    },
  }),
  caseFixture({
    id: "lingala",
    results: [
      {
        type: "language",
        id: lingalaSubject.entityId,
        name: "Lingala",
        isoCode639_3: "lin",
        exactMatch: true,
      },
    ],
    subjects: [lingalaSubject],
    matches: [match(lingalaSubject)],
    board: {
      blocks: standardBlocks(
        ["origins", "plates", "quiz", "problem", "fiches"],
        ["origins", "plates", "fiches"],
        ["quiz", "problem"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [editorial("anecdotes/lingala.jpg")],
    },
  }),
  caseFixture({
    id: "traore",
    results: [
      {
        type: "patronyme",
        id: traoreSubject.entityId,
        name: "Traoré",
        exactMatch: true,
      },
    ],
    subjects: [traoreSubject],
    matches: [match(traoreSubject)],
    board: {
      blocks: standardBlocks(
        ["origins", "tiles", "plates", "quiz", "problem", "fiches"],
        ["origins", "plates", "fiches"],
        ["tiles", "quiz", "problem"]
      ),
      owedParts: ["silences", "conviction", "invitation"],
      editorialImages: [editorial("anecdotes/bambara-refus.jpg")],
    },
  }),
  caseFixture({
    id: "introuvable",
    results: [],
    leads: [
      {
        type: "people",
        id: mandinkaSubject.entityId,
        name: "Mandinka",
        similarity: 0.9,
      },
      { type: "people", id: "PPL_MALINKE", name: "Malinké", similarity: 0.8 },
      {
        type: "languageFamily",
        id: "FLG_MANDE",
        name: "Mandé",
        similarity: 0.7,
      },
    ],
    subjects: [mandinkaSubject],
    matches: [match(mandinkaSubject)],
    board: {
      blocks: standardBlocks(
        ["plates", "fiches"],
        ["plates", "fiches"],
        [],
        ["further"]
      ),
      owedParts: [],
      editorialImages: [editorial("anecdotes/malinke-manden.jpg")],
    },
  }),
  caseFixture({
    id: "inconnu",
    results: [],
    subjects: [],
    matches: [
      { relation: "recent", entityType: "country", entityId: "NGA" },
      { relation: "recent", entityType: "language", entityId: "lin" },
      {
        relation: "recent",
        entityType: "languageFamily",
        entityId: "FLG_AFRICAN",
      },
    ],
    board: {
      blocks: {
        mobile: [
          block("lenses", "first"),
          block("verdict", "first"),
          block("shorts", "first"),
          block("owed", "closing"),
          block("further", "closing"),
        ],
        desktop: [
          block("lenses", "first"),
          block("verdict", "first"),
          block("shorts", "first"),
          block("owed", "closing"),
          block("further", "closing"),
        ],
      },
      owedParts: ["conviction", "invitation"],
      editorialImages: [],
    },
  }),
];

// @req REQ-180
export const FEED_CASES = feedCaseFixturesSchema.parse(
  FEED_CASE_VALUES
) as FeedCaseFixture[];
