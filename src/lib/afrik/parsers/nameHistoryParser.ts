/**
 * The one schema for a fiche's `nameHistory` block (REQ-196, ARCH-028).
 *
 * Every named-subject model (people, language, family, country, family name,
 * place, free word) carries the block with this exact shape, so the timeline
 * and the validator read one structure instead of the five storage shapes
 * `src/lib/search/naming.ts` reconciles today.
 *
 * Every origin is a hypothesis (doctrine §1.1): competing origins are separate
 * accounts sharing a `hypothesisGroup`, never one crowned account.
 */

import { z } from "zod";

import { SOURCE_KINDS } from "@/types/sources";
import { ficheSourceTierSchema } from "./ficheSourceTier";

const yearSchema = z.number().int().nullable();

// An oral account is never refused for having no URL and no page (REQ-195,
// doctrine §1.1): `url` is nullable and `page` optional for every kind. An
// oral source names what it can of its narrative, carrier and place
// (REQ-162); each stays optional, because a carrier who asked not to be named
// must not force a field to be invented.
const nameHistorySourceSchema = z
  .object({
    title: z.string().trim().min(1),
    author: z.string().trim().min(1),
    year: yearSchema,
    url: z.string().min(1).nullable(),
    tier: ficheSourceTierSchema,
    source_kind: z.enum(SOURCE_KINDS, {
      error: `source_kind must be one of ${SOURCE_KINDS.join(", ")}`,
    }),
    page: z.string().trim().min(1).optional(),
    narrative: z.string().trim().min(1).optional(),
    carrier: z.string().trim().min(1).optional(),
    place: z.string().trim().min(1).optional(),
    notes: z.string().optional(),
  })
  .strict();

// The answer card reads this line on its own, without the paragraph around
// it, so it carries nothing a reader could not parse (REQ-191).
// @req REQ-196
export const shortLineSchema = z
  .string()
  .trim()
  .min(1)
  .max(120, { message: "a short line holds at most 120 characters" })
  .refine(
    (line) =>
      !/\b(PPL|FLG|PAT)_[A-Z0-9_]+|\w\/[\w.-]+\.(json|tsx?|md)\b|\b[a-z]+\.[a-z]+[A-Z]\w*/.test(
        line
      ),
    {
      message: "a short line carries no identifier, path or field path",
    }
  );

const periodSchema = z
  .object({
    from: yearSchema,
    to: yearSchema,
    label: z.string().trim().min(1),
  })
  .strict()
  .refine(
    (period) =>
      period.from === null || period.to === null || period.from <= period.to,
    { message: "period.from must be <= period.to" }
  );

// Actors are context for the reader, never the author of a name.
const actorSchema = z
  .object({
    name: z.string().trim().min(1),
    role: z.string().trim().min(1),
    personId: z.string().min(1).optional(),
  })
  .strict();

// What a folded name record said about the name as a whole, kept as a
// sourced account rather than a bare field so no statement escapes its
// citation (doctrine §1.1). The tag is what lets the answer card and the
// search sheet find the meaning, the imposition and today's usage again
// (REQ-190, REQ-191) without guessing from prose.
const ACCOUNT_ASPECTS = ["meaning", "imposition", "usage"] as const;

// The great era of the territory an account is about, at its period. A date
// alone cannot tell it: Saint-Louis was French long before 1885, and Ethiopia
// had no colonial era outside the Italian occupation. The contributor decides
// it from docs/editorial/strategy/colonial-periods.md and leaves it out when
// the account does not say where or when; the timeline then reads the date.
// @req REQ-196
export const NAME_HISTORY_ERAS = ["polity", "colonial", "modern"] as const;
export type NameHistoryEra = (typeof NAME_HISTORY_ERAS)[number];

const accountSchema = z
  .object({
    period: periodSchema,
    era: z
      .enum(NAME_HISTORY_ERAS, {
        error: `era must be one of ${NAME_HISTORY_ERAS.join(", ")}`,
      })
      .optional(),
    statement: z.string().trim().min(1),
    aspect: z
      .enum(ACCOUNT_ASPECTS, {
        error: `aspect must be one of ${ACCOUNT_ASPECTS.join(", ")}`,
      })
      .optional(),
    // A written trace of the name (REQ-189): the form exactly as the cited
    // document spells it, which can differ from `nameText`.
    formAsWritten: z.string().trim().min(1).optional(),
    hypothesisGroup: z.string().trim().min(1).optional(),
    birth: z.literal(true).optional(),
    before: z.literal(true).optional(),
    actors: z.array(actorSchema).optional(),
    sources: z
      .array(nameHistorySourceSchema)
      .min(1, { message: "an account cites at least one source" }),
  })
  .strict()
  .refine((account) => !(account.birth && account.before), {
    message: "an account is either the birth of the name or before it",
  })
  // A written trace is reread at its page (REQ-189); an oral account has no
  // page and is never refused for it (REQ-195).
  .refine(
    (account) =>
      account.formAsWritten === undefined ||
      account.sources.every(
        (source) => source.source_kind === "oral_tradition" || !!source.page
      ),
    {
      message: "a written trace cites its written source at a page",
      path: ["sources"],
    }
  );

type NameHistoryAccount = z.infer<typeof accountSchema>;

// A period's position on the timeline: its start, or its end when only that
// is known. Undated periods do not sort and are not compared.
function sortYear(account: NameHistoryAccount): number | null {
  return account.period.from ?? account.period.to;
}

const pronunciationSchema = z
  .object({
    respelling: z.string().trim().min(1),
    // A recording is a person's voice: no stated consent, no recording.
    audio: z
      .object({
        url: z.string().min(1),
        consent: z.string().trim().min(1, {
          message: "a recording states the speaker's consent",
        }),
      })
      .strict()
      .nullable(),
    source: nameHistorySourceSchema,
  })
  .strict();

const nameSchema = z
  .object({
    nameText: z.string().trim().min(1),
    nameStatus: z.enum(["current", "former"]),
    selfGiven: z.boolean(),
    // The rule the retired name records held (FR55-iso): a `lang` attribute
    // is derived from it, so it must be a code, not a language's name.
    languageOfOrigin: z
      .string()
      .regex(/^[a-z]{3}$/, {
        message: "languageOfOrigin must be an ISO 639-3 code",
      })
      .nullable(),
    namedBy: z.string().trim().min(1).nullable(),
    // What the answer card reads (REQ-191, moved here by REQ-196).
    shortLine: shortLineSchema.optional(),
    usedIn: z.array(z.string().min(1)).optional(),
    pronunciation: pronunciationSchema.optional(),
    // When the name is or was in use, as the reader reads it.
    periodLabel: z.string().trim().min(1).optional(),
    // Another spelling of a name rather than a name of its own (Masai for
    // Maasai): the distinction the retired `historical_spelling` type made.
    variantSpelling: z.literal(true).optional(),
    accounts: z.array(accountSchema),
  })
  .strict()
  .superRefine((name, ctx) => {
    const births = name.accounts.filter((account) => account.birth);
    if (births.length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["accounts"],
        message: `name "${name.nameText}" has ${births.length} birth accounts; a name has at most one birth`,
      });
      return;
    }

    const birthYear = births.length === 1 ? sortYear(births[0]) : null;
    if (birthYear === null) return;

    name.accounts.forEach((account, index) => {
      const year = account.before ? sortYear(account) : null;
      if (year !== null && year > birthYear) {
        ctx.addIssue({
          code: "custom",
          path: ["accounts", index],
          message: `name "${name.nameText}": a before account (${year}) is dated after the birth (${birthYear})`,
        });
      }
    });
  });

// @req REQ-196
export const nameHistorySchema = z
  .object({
    summary: z.string().trim().min(1),
    names: z
      .array(nameSchema)
      .min(1, { message: "a name history holds at least one name" }),
  })
  .strict();

export type NameHistory = z.infer<typeof nameHistorySchema>;

interface ParsedNameHistory {
  success: boolean;
  data?: NameHistory;
  errors: string[];
}

// @req REQ-196
export function parseNameHistory(raw: unknown): ParsedNameHistory {
  const result = nameHistorySchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        (issue) =>
          `nameHistory${issue.path.length ? "." : ""}${issue.path.join(".")}: ${issue.message}`
      ),
    };
  }
  // strictNullChecks is off project-wide (tsconfig), which widens zod's
  // inferred output; the cast is safe once safeParse has succeeded.
  return { success: true, data: result.data as NameHistory, errors: [] };
}

/**
 * The block a fiche loader keeps, read through the one schema (ARCH-028).
 *
 * Every fiche loader calls this rather than passing the raw JSON through, so
 * the database and the API never hold a block the validator would refuse.
 * An invalid block throws instead of being dropped: losing a name's history
 * silently would look like a fiche that never had one.
 */
// @req REQ-196
export function ficheNameHistory(
  fiche: { nameHistory?: unknown },
  ficheId: string
): NameHistory | undefined {
  if (fiche.nameHistory === undefined) return undefined;
  const parsed = parseNameHistory(fiche.nameHistory);
  if (!parsed.success) {
    throw new Error(`${ficheId}: ${parsed.errors.join("; ")}`);
  }
  return parsed.data;
}
