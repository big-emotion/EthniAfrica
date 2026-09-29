/**
 * The longest query reported. A question fits well under it; a pasted
 * paragraph — the likeliest carrier of a personal story — does not.
 */
const MAX_QUERY_LENGTH = 80;

/**
 * The text of a search, or nothing, as the `query` property of `search:submit`.
 *
 * The Plausible dashboard is public (operator decision, 2026-09-29), so what
 * this returns is readable by anyone and cannot be recalled once sent. The
 * function therefore refuses what looks like a person rather than a name being
 * looked up: an address, a link, a phone or account number, a paragraph. It
 * cannot recognise a personal name typed as a question, and does not pretend
 * to — that residual risk is the price of publishing the terms, and is stated
 * on the privacy page.
 *
 * Lowercased and whitespace-collapsed so « Peul » and « peul » are one row in
 * the report. Accents stay: « dembélé » against « dembele » is a spelling
 * the reader chose.
 */
// @req REQ-046
export function searchQueryProp(query: string): string | undefined {
  const normalised = query.trim().replace(/\s+/g, " ").toLowerCase();
  if (!normalised || normalised.length > MAX_QUERY_LENGTH) return undefined;
  if (normalised.includes("@")) return undefined;
  if (/https?:|www\./.test(normalised)) return undefined;
  // Spaces, dots and dashes are stripped first so "06 12 34 56 78" and
  // "06.12.34.56.78" count as the ten-digit number they are. A year stays.
  if (/\d{6,}/.test(normalised.replace(/[\s.\-+]/g, ""))) return undefined;
  return normalised;
}
