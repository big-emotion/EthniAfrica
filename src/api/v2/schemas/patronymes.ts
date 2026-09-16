/**
 * Zod schemas for `GET /v2/patronymes/{id}` (ETNI-1462, REQ-133 — DEC-038's
 * fifth corpus dimension, internally the patronyme; distinct from
 * `/v2/names` (name_records, the ethnonym dossier).
 *
 * `afrik_patronymes` (migration 053) pulls only `name_system` and
 * `caste_or_social_function` out of `content` as real columns; every other
 * DEC-039 field (attestedForms, origin, transmissionMode, ...) stays in
 * `content` until ETNI-1460's per-subtype strict shape lands, so `content`
 * is forwarded opaquely here rather than re-typed ahead of that ticket.
 *
 * Bearers (`afrik_patronyme_persons` -> `persons`, migration 063) are
 * deliberately a narrow summary — DEC-040 forbids any code path that takes a
 * family name and returns an ethnic origin for a named living person, so a
 * bearer entry never carries `peopleLinks`, `countryIds` or `content`.
 */

import { z } from "zod";

// @req REQ-133
export const patronymeIdParamSchema = z.object({
  id: z.string().regex(/^PAT_[A-Z0-9_]+$/, {
    message: "Invalid patronyme id format (expected PAT_*)",
  }),
});

// @req REQ-133
export const patronymeNameSystemSchema = z.enum([
  "clan_name",
  "non_hereditary_patronymic",
  "nisba",
  "praise_name",
  "totemic_clan",
]);

export type PatronymeNameSystem = z.infer<typeof patronymeNameSystemSchema>;

/** Lightweight people reference embedded in a patronyme dossier. */
// @req REQ-133
export const patronymePeopleSummarySchema = z.object({
  id: z.string(),
  nameMain: z.string(),
  autonym: z.string().nullable(),
  slug: z.string(),
});

export type PatronymePeopleSummary = z.infer<
  typeof patronymePeopleSummarySchema
>;

/** Lightweight country reference embedded in a patronyme dossier. */
// @req REQ-133
export const patronymeCountrySummarySchema = z.object({
  id: z.string(),
  nameFr: z.string(),
});

export type PatronymeCountrySummary = z.infer<
  typeof patronymeCountrySummarySchema
>;

/**
 * A name's bearer. Deliberately minimal (DEC-040): no `peopleLinks`, no
 * `countryIds`, no `content` — nothing that lets a reader derive this named
 * person's ethnic origin from the fact that they bear this patronyme.
 */
// @req REQ-133
export const patronymeBearerSummarySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  roleCategory: z.string(),
});

export type PatronymeBearerSummary = z.infer<
  typeof patronymeBearerSummarySchema
>;

/**
 * The bearer statuses a public payload may carry, and the only place that
 * list is written.
 *
 * DEC-040 and RGPD art. 9: a family name is an ethnic marker, so publishing
 * a living person under one publishes their ethnic origin. The strict fiche
 * model knows three statuses — deceased, aggregated, living_self_identified
 * — and only the first may be served by name. `afrik_patronyme_bearers`
 * (migration 092) stores the status as plain TEXT, so nothing below this
 * constant narrows it: the service filters its query and its projection on
 * this list, and widening the guarantee means editing this line, not a
 * `where` clause.
 */
// @req REQ-133
export const PUBLISHABLE_BEARER_STATUSES = ["deceased"] as const;

export type PublishableBearerStatus =
  (typeof PUBLISHABLE_BEARER_STATUSES)[number];

// @req REQ-133
export function isPublishableBearerStatus(
  status: string
): status is PublishableBearerStatus {
  return (PUBLISHABLE_BEARER_STATUSES as readonly string[]).includes(status);
}

/**
 * A bearer the corpus can only name.
 *
 * Kept apart from `bearers` rather than merged into it: a `PatronymeBearerSummary`
 * promises an `id` and a `roleCategory`, and this bearer has neither — no
 * person record exists for them (ARCH-018 defines no person model), which is
 * exactly why they need their own table and their own entry. Merging would
 * have meant minting an identifier the corpus never wrote and an empty role,
 * i.e. telling a consumer that a lookup exists when none does.
 */
// @req REQ-133
export const patronymeNamedBearerSchema = z.object({
  displayName: z.string().min(1),
  status: z.enum(PUBLISHABLE_BEARER_STATUSES),
});

export type PatronymeNamedBearer = z.infer<typeof patronymeNamedBearerSchema>;

/**
 * A name this name is allied with, resolved to something a reader can read.
 *
 * The corpus writes `alliances[].targetPatronymeId`. Forwarding the id alone
 * put "PAT_COULIBALY" on the Keïta fiche as link text — the raw corpus
 * identifier the reader-facing register forbids in prose, printed by the
 * view instead of by a curator. The target's name is resolved here, once per
 * fiche, so no surface has to look it up and none can fall back to the id.
 */
// Not exported: its type is, and nothing outside this file parses an
// alliance on its own — an unused export is what the dead-code ratchet counts.
const patronymeAllianceSummarySchema = z.object({
  targetId: z.string(),
  targetNameMain: z.string(),
  /** The attested term (sanankuya, …), never a category of our own. */
  allianceType: z.string().nullable(),
});

export type PatronymeAllianceSummary = z.infer<
  typeof patronymeAllianceSummarySchema
>;

// @req REQ-133
export const publicPatronymeSchema = z.object({
  id: z.string(),
  nameMain: z.string(),
  nameSystem: patronymeNameSystemSchema,
  casteOrSocialFunction: z.string().nullable(),
  content: z.record(z.string(), z.unknown()),
  associatedPeoples: z.array(patronymePeopleSummarySchema),
  associatedCountries: z.array(patronymeCountrySummarySchema),
  bearers: z.array(patronymeBearerSummarySchema),
  namedBearers: z.array(patronymeNamedBearerSchema),
  alliances: z.array(patronymeAllianceSummarySchema),
});

export type PublicPatronyme = z.infer<typeof publicPatronymeSchema>;
