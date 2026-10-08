/**
 * How a translated text was produced (REQ-142), so a reader is told when a
 * text is a machine translation not yet reviewed. No surface publishes a
 * translation while the site is French-only; the type remains for the
 * records that still carry the field.
 */
export type TranslationKind = "human" | "machine_reviewed" | "machine";
