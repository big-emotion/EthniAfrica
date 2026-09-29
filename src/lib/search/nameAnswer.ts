import { z } from "zod";

import type { SearchEvidence } from "@/lib/search/evidence";
import type { SearchEntityType } from "@/types/afrik-frontend";

/**
 * A reviewed, sourced answer to « where does this name come from? ».
 *
 * Written by an editor, never generated at request time: an answer that states
 * two rival accounts must reach the reader as two accounts. `term` is the name
 * as the reader searches it; `subjects` are the fiches it answers for — one for
 * a name that belongs to a single entry, several for a term shared by a
 * collective and its parts. Shared spelling is not a claim that the subjects
 * are related, so each answer names its own.
 */
export interface NameAnswer {
  term: string;
  subjects: Array<{ type: SearchEntityType; id: string }>;
  /** One or two complete paragraphs; a qualification is never cut for length. */
  paragraphs: string[];
  /** What the sources do not settle, stated where the answer is stated. */
  uncertainty?: string;
  sources: SearchEvidence[];
}

const evidenceShape = z.custom<SearchEvidence>(
  (value) =>
    Boolean(value) &&
    typeof value === "object" &&
    Array.isArray((value as SearchEvidence).sources) &&
    typeof (value as SearchEvidence).assertion?.statement === "string"
);

const nameAnswerSchema = z.object({
  term: z.string().min(1),
  subjects: z
    .array(
      z.object({
        type: z.enum([
          "people",
          "language",
          "country",
          "languageFamily",
          "person",
          "patronyme",
        ]),
        id: z.string().min(1),
      })
    )
    .min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  uncertainty: z.string().min(1).optional(),
  sources: z.array(evidenceShape),
});

/**
 * Reads `data.nameAnswers` off a search envelope. A malformed entry is dropped
 * rather than rendered half-shaped: the page then falls back to the ordinary
 * opening, which is honest, instead of showing a partial claim.
 */
// @req REQ-178
export function mapNameAnswers(envelope: unknown): NameAnswer[] {
  const data = (envelope as { data?: unknown })?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const { nameAnswers } = data as Record<string, unknown>;
  if (!Array.isArray(nameAnswers)) return [];
  return nameAnswers.flatMap((entry) => {
    const parsed = nameAnswerSchema.safeParse(entry);
    return parsed.success ? [parsed.data as NameAnswer] : [];
  });
}
