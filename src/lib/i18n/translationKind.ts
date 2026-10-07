/**
 * How an English bank's entry was produced (REQ-142). The UI's English banks
 * declare it per entry so the reader is told when a text is a machine
 * translation not yet reviewed.
 */
export type TranslationKind = "human" | "machine_reviewed" | "machine";
