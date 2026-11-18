/**
 * The address of a commentable block: `{subject}:{id}:{section}`.
 *
 * Anchored to the data rather than to the page (ARCH-032): a comment left on
 * the search result page under a people's names shows again on that people's
 * fiche, because both write `people:PPL_X:naming`. Migration 117 checks the
 * same shape on `flags.block_key`; `scripts/__tests__/blockCommentsMigration`
 * holds the two vocabularies together.
 *
 * Ids may not contain a colon, so a key always splits back into three parts.
 */

// @req REQ-212
export const BLOCK_SUBJECTS = [
  "people",
  "country",
  "language",
  "language_family",
  "patronyme",
  "place",
  "search-query",
] as const;

export type BlockSubject = (typeof BLOCK_SUBJECTS)[number];

/** `naming` is the fiches' existing `fieldPath: "naming"`. */
// @req REQ-212
export const BLOCK_SECTIONS = [
  "naming",
  "origin",
  "what",
  "where",
  "sources",
  "culture",
  "history",
  "verdict",
] as const;

export type BlockSection = (typeof BLOCK_SECTIONS)[number];

export interface BlockAddress {
  subject: BlockSubject;
  id: string;
  section: BlockSection;
}

// The search feed says `languageFamily`, the database `language_family`, the
// routes `language-family`. One key per family, whichever surface wrote it.
const LANGUAGE_FAMILY_SPELLINGS = new Set([
  "languageFamily",
  "language_family",
  "language-family",
]);

// @req REQ-212
export function normalizeBlockSubject(raw: string): BlockSubject | null {
  if (LANGUAGE_FAMILY_SPELLINGS.has(raw)) return "language_family";
  return (BLOCK_SUBJECTS as readonly string[]).includes(raw)
    ? (raw as BlockSubject)
    : null;
}

function isSection(raw: string): raw is BlockSection {
  return (BLOCK_SECTIONS as readonly string[]).includes(raw);
}

function isValidId(id: string): boolean {
  return id.length > 0 && !id.includes(":");
}

/** Null when a part is outside the vocabulary or would not split back. */
// @req REQ-212
export function buildBlockKey(parts: {
  subject: string;
  id: string;
  section: string;
}): string | null {
  const subject = normalizeBlockSubject(parts.subject);
  if (!subject || !isValidId(parts.id) || !isSection(parts.section)) {
    return null;
  }
  return `${subject}:${parts.id}:${parts.section}`;
}

/**
 * Strict: only the canonical spelling parses. A key is read from the
 * database or an API query, both of which only ever hold canonical keys.
 */
// @req REQ-212
export function parseBlockKey(key: string): BlockAddress | null {
  const parts = key.split(":");
  if (parts.length !== 3) return null;
  const [subject, id, section] = parts;
  if (!(BLOCK_SUBJECTS as readonly string[]).includes(subject)) return null;
  if (!isValidId(id) || !isSection(section)) return null;
  return { subject: subject as BlockSubject, id, section };
}
