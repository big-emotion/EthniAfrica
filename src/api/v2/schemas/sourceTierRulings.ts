/**
 * Zod schema for POST /v2/admin/source-tier-rulings — one moderator decision.
 *
 * The decision rules are stated here and again in migration 090's
 * `source_tier_ruling_drafts_shape_check`, on purpose: the handler answers a
 * readable 400 rather than surfacing a constraint violation as a 500.
 */

import { z } from "zod";

import { SOURCE_TIERS, SOURCE_TIER_RULING_DECISIONS } from "@/types/sources";

/** The three fiche kinds that carry `needs_review` citations. */
const FICHE_PATH =
  /^(peuples|pays|famille_linguistique)\/[A-Za-z0-9_\-/]+\.json$/;

// @req REQ-092
export const sourceTierRulingDraftSchema = z
  .object({
    fiche_path: z.string().regex(FICHE_PATH, {
      error: "fiche_path must name a people, country or family fiche",
    }),
    // Not trimmed: a ruling matches the citation's title exactly.
    source_title: z.string().min(1).max(2000),
    source_url: z.string().max(2000).nullable(),
    decision: z.enum(SOURCE_TIER_RULING_DECISIONS),
    tier: z.enum(SOURCE_TIERS).nullable().optional(),
    repaired_url: z.string().trim().pipe(z.url()).nullable().optional(),
    rationale: z
      .string()
      .trim()
      .min(1, { error: "A decision states its rationale" })
      .max(5000),
  })
  .superRefine((draft, context) => {
    if (draft.decision !== "remove" && !draft.tier) {
      context.addIssue({
        code: "custom",
        path: ["tier"],
        message: `A ${draft.decision} decision states a tier`,
      });
    }
    if (draft.decision === "remove" && draft.tier) {
      context.addIssue({
        code: "custom",
        path: ["tier"],
        message: "A removal states no tier",
      });
    }
    if (draft.decision === "repair" && !draft.repaired_url) {
      context.addIssue({
        code: "custom",
        path: ["repaired_url"],
        message: "A repair states the corrected address",
      });
    }
    if (draft.decision !== "repair" && draft.repaired_url) {
      context.addIssue({
        code: "custom",
        path: ["repaired_url"],
        message: "Only a repair states a corrected address",
      });
    }
  });

export type SourceTierRulingDraftInput = z.infer<
  typeof sourceTierRulingDraftSchema
>;
