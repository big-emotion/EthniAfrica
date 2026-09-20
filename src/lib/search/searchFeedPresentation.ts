import { z } from "zod";

const standingSchema = z.enum([
  "official",
  "referenced",
  "unverified",
  "needs_review",
]);
const appellationItemSchema = z
  .object({
    form: z.string().min(1),
    qualifier: z.string().optional(),
    selfGiven: z.boolean().nullable().optional(),
    problematic: z.literal("recorded").optional(),
    searched: z.boolean().optional(),
    subjectId: z.string().optional(),
  })
  .strict();
const originItemSchema = z
  .object({
    name: z.string().min(1),
    qualifier: z.string().optional(),
    description: z.string().min(1),
    currentUsage: z
      .object({ label: z.string().min(1), text: z.string().min(1) })
      .strict()
      .optional(),
    standing: standingSchema.optional(),
    style: z.enum(["you", "bad", "own"]).optional(),
  })
  .strict();
const namedBodyItemSchema = z
  .object({
    name: z.string().min(1),
    meta: z.string(),
    description: z.string().min(1),
    href: z.string().min(1),
  })
  .strict();
const tileItemSchema = z
  .object({
    title: z.string().min(1),
    meta: z.string(),
    href: z.string().min(1).optional(),
  })
  .strict();
const factItemSchema = z
  .object({ label: z.string().min(1), value: z.string().min(1) })
  .strict();
const feedFicheItemSchema = z
  .object({
    kind: z.string().min(1),
    name: z.string().min(1),
    meta: z.string(),
    href: z.string().min(1),
  })
  .strict();

// The API may attach a deterministic presentation to a search response. The
// normal corpus path omits it and SearchFeed derives its copy from structured
// naming facts; visual fixtures use it to exercise reviewed editorial cases
// through the same page and component boundary.
// @req REQ-180
export const searchFeedPresentationSchema = z
  .object({
    answer: z
      .object({
        name: z.string().min(1).optional(),
        eyebrow: z.string().min(1).optional(),
        kind: z.string().min(1).optional(),
        verdict: z.string().min(1),
        summary: z.string().min(1),
        tone: z.enum(["answer", "plain"]).optional(),
      })
      .strict()
      .optional(),
    appellations: z
      .object({
        title: z.string().min(1).optional(),
        subtitle: z.string().min(1).nullable().optional(),
        forms: z.array(appellationItemSchema),
      })
      .strict()
      .optional(),
    shorts: z
      .object({
        title: z.string().min(1).optional(),
        subtitle: z.string().min(1).nullable().optional(),
        wideningNote: z.string().min(1).optional(),
        emptySlot: z
          .object({
            name: z.string().min(1),
            question: z.string().min(1),
            body: z.string().min(1),
            action: z.string().min(1),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    origins: z
      .object({
        title: z.string().min(1),
        subtitle: z.string().min(1).nullable().optional(),
        lede: z.string().min(1).optional(),
        items: z.array(originItemSchema),
      })
      .strict()
      .optional(),
    peoples: z
      .object({
        title: z.string().min(1),
        subtitle: z.string().min(1).nullable().optional(),
        items: z.array(namedBodyItemSchema),
      })
      .strict()
      .optional(),
    prose: z
      .array(
        z
          .object({
            id: z.enum(["shared-name", "problem", "near-name"]),
            title: z.string().min(1),
            paragraphs: z.array(z.string().min(1)).min(1),
            standing: standingSchema.optional(),
          })
          .strict()
      )
      .optional(),
    tiles: z
      .object({
        title: z.string().min(1),
        subtitle: z.string().min(1).nullable().optional(),
        items: z.array(tileItemSchema),
        actionLabel: z.string().min(1).optional(),
        actionHref: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    facts: z
      .object({
        title: z.string().min(1),
        subtitle: z.string().min(1).nullable().optional(),
        items: z.array(factItemSchema),
      })
      .strict()
      .optional(),
    plates: z
      .object({
        title: z.string().min(1).optional(),
        subtitle: z.string().min(1).nullable().optional(),
        order: z.array(z.string().min(1)).optional(),
      })
      .strict()
      .optional(),
    quiz: z
      .object({ questionCountLabel: z.string().min(1) })
      .strict()
      .optional(),
    images: z
      .object({
        title: z.string().min(1).optional(),
        subtitle: z.string().min(1).nullable().optional(),
        licenceText: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    fiches: z
      .object({
        title: z.string().min(1).optional(),
        subtitle: z.string().min(1).nullable().optional(),
        items: z.array(feedFicheItemSchema),
      })
      .strict()
      .optional(),
    owed: z
      .object({
        silences: z.array(
          z
            .object({
              id: z.string().optional(),
              title: z.string().min(1),
              detail: z.string().min(1),
            })
            .strict()
        ),
        conviction: z
          .object({ title: z.string().min(1), body: z.string().min(1) })
          .strict(),
        invitation: z
          .object({
            title: z.string().min(1),
            body: z.string().min(1),
            action: z.string().min(1),
          })
          .strict(),
      })
      .strict()
      .optional(),
    further: z
      .object({
        links: z.array(
          z
            .object({ href: z.string().min(1), label: z.string().min(1) })
            .strict()
        ),
      })
      .strict()
      .optional(),
  })
  .strict();

export type SearchFeedPresentation = z.infer<
  typeof searchFeedPresentationSchema
>;

// @req REQ-178
export function mapSearchFeedPresentation(
  envelope: unknown
): SearchFeedPresentation | undefined {
  const data = (envelope as { data?: unknown })?.data;
  if (!data || typeof data !== "object" || Array.isArray(data))
    return undefined;
  const value = (data as Record<string, unknown>).feedPresentation;
  if (value === undefined) return undefined;
  const parsed = searchFeedPresentationSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
