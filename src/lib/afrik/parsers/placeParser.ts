/**
 * Place parser - Zod schema for the AFRIK place strict model
 * (public/modele-lieu.json), REQ-193 / DEC-069.
 *
 * The shape only: whether `countryId`/`countryIds` and `peopleId` resolve to
 * fiches is a corpus question, answered by checkPlaceFicheModel in
 * validateAfrikData.
 *
 * A town lies in one country (`countryId`). A region such as the Sahara spans
 * several (`countryIds`, two or more, in the fiche's order). A fiche carries
 * exactly one of the two, so no place has to pretend to belong to a single
 * country, and no town grows a list of one.
 *
 * A place's names live in `nameHistory` alone (REQ-196, DEC-071). The schema
 * is strict so a retired `names` / `accounts` / `attestations` key is refused
 * rather than silently dropped: kept beside the block, it would be a second
 * source of truth for the same names, free to drift from the first.
 */

import { z } from "zod";
import { SOURCE_KINDS } from "@/types/sources";
import { ficheSourceTierSchema } from "./ficheSourceTier";
import { nameHistorySchema } from "./nameHistoryParser";

const sourceSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  // Many local accounts carry no publication year; null says so.
  year: z.number().int().nullable(),
  url: z.string().min(1),
  tier: ficheSourceTierSchema,
  // The type the reader sees (doctrine §1.1). Without it here, zod's default
  // strip removed it and the place page could show no type at all. Optional
  // while ETNI-2007 gives every source one.
  source_kind: z
    .enum(SOURCE_KINDS, {
      error: `source_kind must be one of ${SOURCE_KINDS.join(", ")}`,
    })
    .optional(),
  notes: z.string().optional(),
});

const countryCode = z.string().regex(/^[A-Z]{3}$/, {
  message: "countryId must be an ISO 3166-1 alpha-3 code",
});

// @req REQ-193
const placeSchema = z
  .object({
    _meta: z
      .object({ format: z.string(), entity: z.literal("lieu") })
      .passthrough(),
    id: z.string().regex(/^LOC_[A-Z0-9_]+$/, {
      message: "id must match ^LOC_[A-Z0-9_]+$",
    }),
    placeType: z.enum(["ville", "region", "site-historique", "autre"]),
    nameMain: z.string().min(1),
    countryId: countryCode.optional(),
    countryIds: z
      .array(countryCode)
      .min(2, {
        message:
          "countryIds lists two countries or more; use countryId for one",
      })
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "countryIds lists each country once",
      })
      .optional(),
    associatedPeoples: z.array(
      z.object({ peopleId: z.string().min(1), relation: z.string().optional() })
    ),
    summary: z.string().min(1),
    gaps: z.array(
      z.object({ field: z.string().min(1), reason: z.string().min(1) })
    ),
    sources: z.array(sourceSchema),
    nameHistory: nameHistorySchema,
  })
  .strict()
  .refine(
    (place) =>
      (place.countryId === undefined) !== (place.countryIds === undefined),
    {
      message:
        "a place carries either countryId (one country) or countryIds (several), not both",
      path: ["countryId"],
    }
  );

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
