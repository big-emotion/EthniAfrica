import type { FicheEntityType } from "@/types/fiche";

/**
 * Accent scope per entity type (src/styles/tokens/color.css) — one class on
 * the sequence root rebinds --accent for everything below it.
 *
 * Terre is deliberately absent: it is reserved as the colonial-marker accent
 * for imposed exonyms. A fiche scoped to terre would paint that marker in the
 * page's own accent and it would stop reading as a marker at all.
 *
 * `language` (ETNI-1507) reads under its family's pervenche hue rather than
 * opening a fifth accent: the four categorical accents are CVD-validated as
 * a set and terre is off-limits for a fiche scope for the reason above. It is
 * a distinct class, `afh-accent-language`, so scope-leak checks can tell a
 * language fiche from its family even though they share a hue.
 *
 * `name` (REQ-133) reads under `ocre` rather than allocating a fourth accent:
 * a patronyme is a naming fact about a people, the closest kinship of the
 * existing scopes. It likewise keeps its own `afh-accent-name` class so the
 * same scope-leak checks can distinguish the two entity types.
 */
// @req REQ-091
export const ACCENT_CLASS_BY_ENTITY: Record<FicheEntityType, string> = {
  people: "afh-accent-ocre",
  country: "afh-accent-teal",
  "language-family": "afh-accent-perv",
  language: "afh-accent-language",
  name: "afh-accent-name",
};
