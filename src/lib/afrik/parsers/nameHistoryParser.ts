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

const accountSchema = z
  .object({
    period: periodSchema,
    statement: z.string().trim().min(1),
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
  });

type NameHistoryAccount = z.infer<typeof accountSchema>;

// A period's position on the timeline: its start, or its end when only that
// is known. Undated periods do not sort and are not compared.
function sortYear(account: NameHistoryAccount): number | null {
  return account.period.from ?? account.period.to;
}

const nameSchema = z
  .object({
    nameText: z.string().trim().min(1),
    nameStatus: z.enum(["current", "former"]),
    selfGiven: z.boolean(),
    languageOfOrigin: z.string().min(1).nullable(),
    namedBy: z.string().trim().min(1).nullable(),
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
