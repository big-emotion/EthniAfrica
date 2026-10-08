import { z } from "zod";

const localizedText = z
  .object({ fr: z.string().min(1), en: z.string().min(1).optional() })
  .strict();

const sourceSchema = z
  .object({
    title: z.string().min(1),
    author: z.string().min(1).optional(),
    year: z.number().int().optional(),
    page: z.string().min(1).optional(),
    url: z.string().url().optional(),
    tier: z.enum(["official", "referenced", "unverified"]),
  })
  .strict();

const evidenceSchema = z
  .object({
    statement: localizedText,
    sources: z.array(sourceSchema).min(1),
  })
  .strict();

/**
 * One reviewed answer on disk. A file is one term.
 */
// @req REQ-178
export const reviewedNameAnswerSchema = z
  .object({
    term: localizedText,
    /** Other spellings of the term that reach this answer, besides accents and case. */
    aliases: z.array(z.string().min(1)).default([]),
    subjects: z
      .array(
        z
          .object({
            type: z.enum([
              "people",
              "language",
              "country",
              "languageFamily",
              "patronyme",
            ]),
            id: z.string().min(1),
          })
          .strict()
      )
      .min(1),
    paragraphs: z
      .object({
        fr: z.array(z.string().min(1)).min(1).max(2),
        en: z.array(z.string().min(1)).min(1).max(2).optional(),
      })
      .strict(),
    /** What the sources leave unsettled, said where the answer is said. */
    uncertainty: localizedText.optional(),
    evidence: z.array(evidenceSchema).min(1),
  })
  .strict();

export type ReviewedNameAnswer = z.infer<typeof reviewedNameAnswerSchema>;
