import { getDossierBySlug } from "@/lib/dossiers/corpus";

/**
 * Whether the dossier reached by this slug may be served.
 *
 * Read off the dossier itself. It used to be read off the module registry:
 * every dossier declared a module, the module declared `editorialReadiness`,
 * and withdrawing a reading meant editing a TypeScript file that describes
 * menus. Readiness is a property of the dossier, so the dossier carries it.
 *
 * A slug the corpus does not know is withheld rather than
 * served — that is either a reader guessing at a URL or a dossier removed
 * from the corpus, and neither is a page to publish.
 */
// @req REQ-113
export function isDossierSlugPublished(slug: string): boolean {
  return getDossierBySlug(slug)?.readiness === "ready";
}
