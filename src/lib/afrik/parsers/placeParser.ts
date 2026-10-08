/**
 * Place parser - Zod schema for the AFRIK place strict model
 * (public/modele-lieu.json), REQ-193 / DEC-069.
 *
 * The shape only: whether `countryId` and `peopleId` resolve to fiches is a
 * corpus question, answered by checkPlaceFicheModel in validateAfrikData.
 */

import { z } from "zod";
import { ficheSourceTierSchema } from "./ficheSourceTier";

const sourceSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  // Many local accounts carry no publication year; null says so.
  year: z.number().int().nullable(),
  url: z.string().min(1),
  tier: ficheSourceTierSchema,
  notes: z.string().optional(),
});

const citedSourcesSchema = z
  .array(sourceSchema)
  .min(1, { message: "at least one tiered source is required" });

const accountSchema = z.object({
  statement: z.string().min(1),
  periodLabel: z.string().nullable(),
  sources: citedSourcesSchema,
});

const attestationSchema = z.object({
  formAsWritten: z.string().min(1),
  year: z.number().int().nullable(),
  periodLabel: z.string().nullable(),
  attestedBy: z.string().min(1),
  source: sourceSchema.extend({ page: z.string().nullable() }),
});

const nameSchema = z.object({
  nameText: z.string().min(1),
  nameStatus: z.enum(["current", "former", "concurrent"]),
  languageOfOrigin: z.string().nullable(),
  meaning: z.string().nullable(),
  shortLine: z.string().min(1).max(120),
  namedBy: z.string().nullable(),
  originDebated: z.boolean(),
  periodLabel: z.string().nullable(),
  contemporaryUsage: z.string().nullable(),
  accounts: z.array(accountSchema),
  attestations: z.array(attestationSchema),
  sources: citedSourcesSchema,
});

// @req REQ-193
const placeSchema = z.object({
  _meta: z
    .object({ format: z.string(), entity: z.literal("lieu") })
    .passthrough(),
  id: z.string().regex(/^LOC_[A-Z0-9_]+$/, {
    message: "id must match ^LOC_[A-Z0-9_]+$",
  }),
  placeType: z.enum(["ville", "region", "site-historique", "autre"]),
  nameMain: z.string().min(1),
  countryId: z.string().regex(/^[A-Z]{3}$/, {
    message: "countryId must be an ISO 3166-1 alpha-3 code",
  }),
  associatedPeoples: z.array(
    z.object({ peopleId: z.string().min(1), relation: z.string().optional() })
  ),
  summary: z.string().min(1),
  names: z
    .array(nameSchema)
    .min(1, { message: "a place declares at least its current name" }),
  gaps: z.array(
    z.object({ field: z.string().min(1), reason: z.string().min(1) })
  ),
  sources: z.array(sourceSchema),
  _translation: z.unknown().optional(),
});

type PlaceRecord = z.infer<typeof placeSchema>;

interface ParsedPlaceFile {
  success: boolean;
  data?: PlaceRecord;
  errors: string[];
}

// @req REQ-193
export function parsePlaceFile(raw: unknown): ParsedPlaceFile {
  const result = placeSchema.safeParse(raw);
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
  return { success: true, data: result.data as PlaceRecord, errors: [] };
}
