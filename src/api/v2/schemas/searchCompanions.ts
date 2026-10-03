import { z } from "zod";

import {
  quizOptionValueSchema,
  quizSessionQuestionSchema,
} from "@/api/v2/schemas/quiz";

const SUBJECT_ID_PATTERNS = {
  people: /^PPL_[A-Z0-9_]+$/,
  country: /^[A-Z]{3}$/,
  languageFamily: /^FLG_[A-Z0-9_]+$/,
  language: /^[a-z]{3}$/,
  patronyme: /^PAT_[A-Z0-9_]+$/,
} as const;

// @req REQ-180
export const MAX_SEARCH_COMPANION_SUBJECTS = 20;

/** Longer than any name the corpus holds; a longer word is not one a production answers to. */
// @req REQ-180
export const MAX_SEARCH_COMPANION_WORD_LENGTH = 80;

// @req REQ-180
export const searchCompanionSubjectTypeSchema = z.enum([
  "people",
  "country",
  "languageFamily",
  "language",
  "patronyme",
]);

// @req REQ-180
export const searchCompanionSubjectSchema = z.object({
  entityType: searchCompanionSubjectTypeSchema,
  entityId: z.string().min(1),
});

export type SearchCompanionSubject = z.infer<
  typeof searchCompanionSubjectSchema
>;

type SearchCompanionQuerySubject = {
  type: z.infer<typeof searchCompanionSubjectTypeSchema>;
  id: string;
};

function parseSubjects(
  raw: string,
  context: z.RefinementCtx
): SearchCompanionQuerySubject[] {
  const unique = new Map<string, SearchCompanionQuerySubject>();

  for (const token of raw.split(",")) {
    const value = token.trim();
    if (!value) continue;
    const separator = value.indexOf(":");
    const type = value.slice(0, separator);
    const id = value.slice(separator + 1);
    const typeResult = searchCompanionSubjectTypeSchema.safeParse(type);
    if (separator <= 0 || !typeResult.success) {
      context.addIssue({
        code: "custom",
        message: `Invalid typed subject: ${value || "empty"}`,
        path: ["subjects"],
      });
      continue;
    }
    if (!SUBJECT_ID_PATTERNS[typeResult.data].test(id)) {
      context.addIssue({
        code: "custom",
        message: `Invalid ${typeResult.data} subject id: ${id || "empty"}`,
        path: ["subjects"],
      });
      continue;
    }
    unique.set(`${typeResult.data}:${id}`, { type: typeResult.data, id });
  }

  if (unique.size > MAX_SEARCH_COMPANION_SUBJECTS) {
    context.addIssue({
      code: "too_big",
      origin: "array",
      maximum: MAX_SEARCH_COMPANION_SUBJECTS,
      inclusive: true,
      message: `subjects accepts at most ${MAX_SEARCH_COMPANION_SUBJECTS} unique values`,
      path: ["subjects"],
    });
  }
  return [...unique.values()];
}

// @req REQ-180
export const searchCompanionsQuerySchema = z
  .object({
    subjects: z.string().optional().default(""),
    lang: z.enum(["en", "fr"]).default("fr"),
    word: z.string().trim().max(MAX_SEARCH_COMPANION_WORD_LENGTH).optional(),
  })
  .transform(({ subjects, lang, word }, context) => ({
    subjects: parseSubjects(subjects, context),
    lang,
    ...(word ? { word } : {}),
  }));

export type SearchCompanionsQuery = z.infer<typeof searchCompanionsQuerySchema>;

const sourceTierSchema = z.enum(["official", "referenced", "unverified"]);
const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().nullable(),
  tier: sourceTierSchema,
  notes: z.string().min(1).optional(),
});
const companionMatchSchema = z.object({
  relation: z.enum([
    "exact",
    "linked-family",
    "linked-people",
    "linked-country",
    "recent",
  ]),
  entityType: searchCompanionSubjectTypeSchema,
  entityId: z.string().min(1),
});
// A production about a word, not an entity: there is no subject to name, so
// the match carries the reader's word, folded as the search folds it.
const wordMatchSchema = z.object({
  relation: z.literal("word"),
  word: z.string().min(1),
});
const posterSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
const illustrationSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  credit: z.string().min(1),
  licenceUrl: z.string().url().optional(),
  filePage: z.string().url().optional(),
});

const shortSchema = z.object({
  id: z.string().min(1),
  href: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1).optional(),
  description: z.string().min(1),
  publishedAt: z.union([
    z.string().date(),
    z.string().datetime({ offset: true }),
  ]),
  durationSeconds: z.number().int().positive(),
  watchUrl: z.string().url(),
  poster: posterSchema,
  source: sourceSchema,
  match: z.union([companionMatchSchema, wordMatchSchema]),
});
const anecdoteSchema = z.object({
  id: z.string().min(1),
  contentLanguage: z.enum(["en", "fr"]),
  headline: z.string().min(1),
  about: z.string().min(1).optional(),
  body: z.array(z.string().min(1)).min(1).max(2),
  tier: sourceTierSchema,
  sources: z.array(sourceSchema).min(1),
  illustration: illustrationSchema,
  match: companionMatchSchema,
});
const proverbSchema = z.object({
  id: z.string().min(1),
  contentLanguage: z.enum(["en", "fr"]),
  text: z.string().min(1),
  meaning: z.string().min(1),
  original: z
    .object({
      text: z.string().min(1),
      lang: z.string().min(2),
      language: z.string().min(1),
    })
    .nullable(),
  origin: z.object({
    status: z.literal("attested"),
    note: z.string(),
  }),
  sources: z.array(sourceSchema).min(1),
  match: companionMatchSchema,
});
const imageSchema = z.object({
  id: z.string().min(1),
  href: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  caption: z.string().min(1),
  image: z.object({
    src: z.string().min(1),
    alt: z.string().min(1),
    credit: z.string().min(1),
    licence: z.enum(["public-domain", "cc0", "cc-by", "cc-by-sa"]),
    licenceUrl: z.string().url().optional(),
    filePage: z.string().url().optional(),
  }),
  generation: z.object({
    tool: z.string().min(1),
    model: z.string().min(1),
    generatedOn: z.string().min(1),
    sourceKind: z.literal("ai_generated"),
  }),
  source: sourceSchema,
  match: companionMatchSchema,
});
const quizSchema = z
  .object({
    id: z.string().min(1),
    templateId: quizSessionQuestionSchema.shape.templateId,
    contentLanguage: z.enum(["en", "fr"]),
    prompt: z.string().min(1),
    stimulus: z.string().nullable(),
    options: z.array(quizOptionValueSchema).min(2),
    correctOption: quizSessionQuestionSchema.shape.correctOption,
    explanation: z.string().min(1),
    assertionId: z.string().min(1),
    source: sourceSchema,
    entity: z.object({
      type: z.enum(["people", "country"]),
      id: z.string().min(1),
    }),
    match: companionMatchSchema,
  })
  .refine(({ correctOption, options }) => correctOption < options.length, {
    message: "correctOption must identify an available option",
    path: ["correctOption"],
  });

function selectionSchema<Item extends z.ZodType>(item: Item, maximum: number) {
  return z.object({
    count: z.number().int().min(0),
    items: z.array(item).max(maximum),
  });
}

// @req REQ-180
export const searchCompanionsDataSchema = z.object({
  subjects: z
    .array(searchCompanionSubjectSchema)
    .max(MAX_SEARCH_COMPANION_SUBJECTS),
  shorts: selectionSchema(shortSchema, 6),
  anecdotes: selectionSchema(anecdoteSchema, 3),
  proverbs: selectionSchema(proverbSchema, 2),
  images: selectionSchema(imageSchema, 1),
  quiz: z.object({
    count: z.number().int().min(0),
    item: quizSchema.nullable(),
  }),
});

export type SearchCompanionsData = z.infer<typeof searchCompanionsDataSchema>;
