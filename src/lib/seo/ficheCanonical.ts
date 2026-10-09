import type { Metadata } from "next";

import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageRoute,
  getPatronymeRoute,
  getPeopleLinksRoute,
  getPeopleRoute,
  getPlaceRoute,
} from "@/lib/routing";
import { pageHead } from "@/lib/seo/pageHead";
import { parseVersionedSlug } from "@/lib/versioned-slug";
import type { Language } from "@/types/shared";

/**
 * The crawler-facing head of a fiche.
 *
 * Three things this settles, none of which the route files should each answer
 * for themselves:
 *
 * **Absolute, from `CANONICAL_DOMAIN`, never `metadataBase`.** The root
 * layout's base falls back to `localhost:3000`, and a canonical pointing at
 * localhost is worse than none — it tells a crawler the real page is one it
 * cannot fetch. `src/app/sitemap.ts` refuses `metadataBase` for the same
 * reason.
 *
 * **The version is dropped.** A pinned `PPL_YORUBA@v3` renders an archived
 * revision of the same fiche: near-identical prose at a second address, which
 * is the textbook shape of self-competing duplicate content. Its canonical is
 * the live fiche. The snapshot stays reachable and readable — it just stops
 * asking to be indexed in the live page's place.
 *
 * **It exists at all.** Until Lot 3 the three fiche routes declared no
 * canonical of any kind, which was survivable only while each fiche had
 * exactly one address. Moving all three under their hub gives every fiche a
 * second address for as long as the 308s stand, and a redirect window without
 * canonicals is the window in which the duplicate gets indexed.
 *
 * The same call also answers the Open Graph card, through `pageHead`.
 */
// @req REQ-091
export type FicheKind =
  | "country"
  | "people"
  | "family"
  | "language"
  | "name"
  | "peopleLinks"
  | "place";

/** What the fiche calls itself, when the caller has loaded enough to know. */
// @req REQ-091
export interface FicheHeadCopy {
  title?: string;
  description?: string;
}

const ROUTE_BY_KIND: Record<
  FicheKind,
  (language: Language, id: string) => string
> = {
  country: getCountryRoute,
  people: getPeopleRoute,
  family: getFamilyRoute,
  language: getLanguageRoute,
  name: getPatronymeRoute,
  peopleLinks: getPeopleLinksRoute,
  place: getPlaceRoute,
};

/**
 * The head of a fiche, or no metadata at all when the slug names no fiche —
 * the route answers that with a 404, and a 404 that claims a canonical is a
 * 404 asking to be indexed.
 */
// @req REQ-091
export async function ficheCanonical(
  kind: FicheKind,
  language: Language,
  slug: string,
  copy: FicheHeadCopy = {}
): Promise<Metadata> {
  const parsed = parseVersionedSlug(decodeURIComponent(slug));
  if (!parsed) return {};

  const id = encodeURIComponent(parsed.slug);
  const head = pageHead(ROUTE_BY_KIND[kind](language, id), copy);

  // `pageHead` carries the copy into the Open Graph card; the document's own
  // `<title>` and `<meta name="description">` are separate keys, and leaving
  // them unset is what let 3 242 fiches inherit the root layout's title while
  // their canonical was correct.
  return {
    ...(copy.title ? { title: copy.title } : {}),
    ...(copy.description ? { description: copy.description } : {}),
    ...head,
  };
}
