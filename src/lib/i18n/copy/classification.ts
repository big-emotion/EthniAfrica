import { CLASSIFICATION_LABELS } from "@/lib/glossaire/vocabularies";
import type { Language } from "@/types/shared";

/**
 * The `classification_status` labels are glossary vocabulary, not surface
 * copy: the glossary owns them so the three labels the site publishes
 * cannot fork per surface. This module only lends them the shape every other
 * dictionary has.
 */
const fr = CLASSIFICATION_LABELS.fr;

type ClassificationCopy = typeof fr;

// @req REQ-145
export const classificationCopy: Record<Language, ClassificationCopy> = {
  fr,
};
