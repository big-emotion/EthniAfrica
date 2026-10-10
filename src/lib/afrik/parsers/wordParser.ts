/**
 * Word parser - Zod schema for the AFRIK word strict model
 * (public/modele-mot.json), REQ-196.
 *
 * The shape only: whether a related subject resolves to a fiche is a corpus
 * question, answered by checkWordFicheModel in validateAfrikData. Root
 * sources are kept as the fiche writes them: the model leaves them empty for
 * now, every claim being cited inside nameHistory.
 *
 * Unlike every other class, `nameHistory` is required: a word fiche exists
 * only to tell the history of the word.
 */

import { z } from "zod";
import { nameHistorySchema } from "./nameHistoryParser";

// @req REQ-196
const wordSchema = z
  .object({
    _meta: z
      .object({ format: z.string(), entity: z.literal("mot") })
      .passthrough()
      .optional(),
    id: z.string().regex(/^WRD_[A-Z0-9_]+$/, {
      message: "id must match ^WRD_[A-Z0-9_]+$",
    }),
    nameMain: z.string().min(1),
    wordLanguage: z.string().min(1),
    definition: z.string().min(1),
    relatedSubjects: z.array(
      z.object({ id: z.string().min(1), relation: z.string().min(1) })
    ),
    nameHistory: nameHistorySchema,
    gaps: z.array(z.string().min(1)),
    sources: z.array(z.record(z.string(), z.unknown())),
  })
  .strict();

type WordRecord = z.infer<typeof wordSchema>;

interface ParsedWordFile {
  success: boolean;
  data?: WordRecord;
  errors: string[];
}

// @req REQ-196
export function parseWordFile(raw: unknown): ParsedWordFile {
  const result = wordSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`
      ),
    };
  }
  // strictNullChecks is off project-wide (tsconfig), which widens zod's
  // inferred output; the cast is safe once safeParse has succeeded.
  return { success: true, data: result.data as WordRecord, errors: [] };
}
