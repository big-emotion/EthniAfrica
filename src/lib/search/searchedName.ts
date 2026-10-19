/**
 * Where the reader searched, the name they searched comes first.
 *
 * Operator decision 2026-10-08 (docs/editorial/doctrine.md §1.1): « The name
 * searched comes first where the reader searched; elsewhere the name a people
 * gives itself does. » A reader who typed « Peul » and met « Fulɓe » first
 * thought they were on the wrong page. So on the search answer the searched
 * form leads, the self-given form follows right after it, and the page says
 * in words which name the people gives itself.
 *
 * Only the search answer calls this. Every surface without a query — fiche
 * headings, people cards, relations, the ego graph, the quiz — keeps the
 * self-given form first, the order `readNaming` builds.
 */

import { normalizeString } from "@/lib/normalize";
import { foldNameForm } from "@/lib/search/nameAddress";

type Fold = (text: string) => string;

/**
 * The shared comparison fold, so « Fulbe » finds « Fulɓe » here as it does in
 * the subject selection. A form leads because the reader searched it; the
 * fold compares and never decides which form comes first.
 */
const comparisonFold: Fold = (text) => normalizeString(text).trim();

/**
 * Whether a form answers to what the reader typed. A fiche files one name in
 * several shapes — « Fulɓe · Pullo », « Fulbe (pluriel), Pullo (singulier) » —
 * so each part is compared, without its parenthesised gloss.
 *
 * It judges one form alone, so the fold makes « Kono » answer to « Kɔnɔ ». To
 * tell which of a subject's forms the reader searched, use `searchedAmong`.
 */
// @req REQ-178
export function answersToSearch(form: string, searched?: string): boolean {
  return searchedFormIn([{ form }], searched) !== undefined;
}

/**
 * The part of a recorded form the reader typed, spelled as the fiche spells
 * it: « Fulani » for « fulani ». Where the reader searched, it titles the
 * page rather than the filed label (doctrine §1.1). A part spelt as typed, up
 * to accents and case, wins over one only the comparison fold reaches.
 */
// @req REQ-178
export function searchedFormIn(
  forms: ReadonlyArray<{ form: string }>,
  searched?: string
): string | undefined {
  return (
    partIn(forms, searched, foldNameForm) ??
    partIn(forms, searched, comparisonFold)
  );
}

function partIn(
  forms: ReadonlyArray<{ form: string }>,
  searched: string | undefined,
  fold: Fold
): string | undefined {
  const target = searched ? fold(searched) : "";
  if (!target) return undefined;
  for (const { form } of forms) {
    const part = form
      .replace(/\([^)]*\)/g, "")
      .split(/[·,/]/)
      .map((piece) => piece.trim())
      .find((piece) => fold(piece) === target);
    if (part) return part;
  }
  return undefined;
}

/**
 * Which of one subject's forms the reader searched. A form spelt as typed, up
 * to accents and case, is the one; the comparison fold decides only when the
 * subject writes no such form. So « Fulbe » still reaches « Fulɓe » on a
 * subject that writes no « Fulbe », but « Kono » marks « Kono » alone and
 * leaves « Kɔnɔ » a spelling of its own: the fold reaches a name, it never
 * stands in for the spelling the reader typed (REQ-135, doctrine §1.1).
 */
// @req REQ-135
export function searchedAmong(
  forms: readonly string[],
  searched?: string
): (form: string) => boolean {
  const fold = forms.some(
    (form) => partIn([{ form }], searched, foldNameForm) !== undefined
  )
    ? foldNameForm
    : comparisonFold;
  return (form) => partIn([{ form }], searched, fold) !== undefined;
}

/**
 * A stable partition: the searched forms, then the self-given ones, then every
 * other form in its incoming order. With nothing searched it is the old
 * self-given-first order, so a searched self-name changes nothing.
 */
// @req REQ-178
export function orderForSearch<T extends { selfGiven?: boolean | null }>(
  forms: readonly T[],
  isSearched: (form: T) => boolean
): T[] {
  const searched = forms.filter(isSearched);
  const rest = forms.filter((form) => !isSearched(form));
  return [
    ...searched,
    ...rest.filter((form) => form.selfGiven === true),
    ...rest.filter((form) => form.selfGiven !== true),
  ];
}

/**
 * What the page says under its heading when the reader searched another name
 * than the self-given one: the query as typed, and the first self-given form.
 * Nothing when the fiche records no self-given form or the reader typed it.
 * « Typed it » follows `searchedAmong`, as the names block does: « Kɔnɔ »
 * still leads to the self-given « Kono » on a fiche that writes both.
 */
// @req REQ-178
export function selfNameLead(
  names: ReadonlyArray<{ form: string; selfGiven?: boolean | null }>,
  searched?: string
): { searched: string; self: string } | undefined {
  const query = searched?.trim();
  if (!query) return undefined;
  const selfGiven = names.filter((name) => name.selfGiven === true);
  if (selfGiven.length === 0) return undefined;
  const isSearched = searchedAmong(
    names.map(({ form }) => form),
    query
  );
  if (selfGiven.some((name) => isSearched(name.form))) return undefined;
  return { searched: query, self: selfGiven[0].form };
}
