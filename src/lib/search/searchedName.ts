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

const fold = (text: string): string =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * Whether a form answers to what the reader typed. A fiche files one name in
 * several shapes — « Fulɓe · Pullo », « Fulbe (pluriel), Pullo (singulier) » —
 * so each part is compared, without its parenthesised gloss.
 */
// @req REQ-178
export function answersToSearch(form: string, searched?: string): boolean {
  const target = searched ? fold(searched) : "";
  if (!target) return false;
  return form
    .replace(/\([^)]*\)/g, "")
    .split(/[·,/]/)
    .some((part) => fold(part) === target);
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
  if (selfGiven.some((name) => answersToSearch(name.form, query)))
    return undefined;
  return { searched: query, self: selfGiven[0].form };
}
