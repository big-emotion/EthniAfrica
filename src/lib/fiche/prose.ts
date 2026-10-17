/**
 * Cutting corpus prose for a tile: a lead a reader decides on, and the rest
 * behind the disclosure.
 *
 * The split waits for twenty characters before it accepts a terminator, so an
 * abbreviation near the start ("S. M. le roi…") does not end the lead. It is
 * the rule the culture tiles already used, moved here so the chronology and
 * the culture chapter cannot drift into two splitting rules.
 *
 * Two stops are refused further on: a lone capital before the full stop is an
 * initial (« l'historien N. G. Kodjo », « J.-C. »), and a stop inside an open
 * parenthesis is an abbreviation (« (fondé ca. 1750 …) », « (146 av. J.-C.) »).
 * Refusing them can make a lead two sentences long when a sentence really does
 * end on « J.-C. »; a longer lead is a smaller fault than a name cut in two.
 */
// @req REQ-153
export function splitLeadSentence(text: string): {
  lead: string;
  rest: string | null;
} {
  const trimmed = text.trim();
  const stops = Array.from(
    trimmed.matchAll(/[.!?](?=\s+\S)/g),
    (match) => match.index + 1
  ).filter((end) => end > 20);

  for (const end of stops) {
    const lead = trimmed.slice(0, end);
    if (LONE_INITIAL.test(lead) || openParenthesisAt(lead) >= 0) continue;
    return { lead, rest: trimmed.slice(end).trimStart() };
  }

  // A parenthesis that never closes refuses every stop after it; waiting for
  // it would put the whole text in the closed tile.
  const unclosed = openParenthesisAt(trimmed);
  if (unclosed > 0 && stops.some((end) => end > unclosed)) {
    return {
      lead: trimmed.slice(0, unclosed).trimEnd(),
      rest: trimmed.slice(unclosed),
    };
  }
  return { lead: trimmed, rest: null };
}

const LONE_INITIAL = /(?<![\p{L}\p{N}])\p{Lu}\.$/u;

/** Where the outermost parenthesis still open at the end of `text` opened. */
function openParenthesisAt(text: string): number {
  const opened: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "(") opened.push(index);
    else if (text[index] === ")") opened.pop();
  }
  return opened.length ? opened[0] : -1;
}

/** The sentences of a paragraph, for comparing two fields that overlap. */
// @req REQ-154
export function sentencesOf(text: string): string[] {
  return text
    .trim()
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/**
 * Two sentences are the same when they differ only in case, spacing or the
 * kind of quotation mark — the corpus writes « », " " and “ ” for one quote.
 */
// @req REQ-154
export function sameSentence(left: string, right: string): boolean {
  const normalise = (value: string) =>
    value
      .replace(/[«»“”"]/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  return normalise(left) === normalise(right);
}
