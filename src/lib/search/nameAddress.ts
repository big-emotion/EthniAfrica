/**
 * Which name forms have a permanent address (REQ-200, DEC-074), decided once
 * for the three places that must agree on it: the address page, the sitemap
 * and the links that point at a form.
 *
 * A form has an address when the corpus answers it exactly and one account of
 * it cites a source above `unverified` — the crawler threshold of REQ-147.
 * The accounts read are the name history's (REQ-196): every one of its
 * sources carries a tier, and it is the only account of a name the sitemap
 * can read without the whole dossier. The threshold decides what crawlers are
 * offered; a reader still sees every source, by its type.
 *
 * Pure, so the client links and the server page call the same code.
 */

import { getLocalizedRoute, getNameAnswerRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

/** A name of a history, read only as far as the threshold needs. */
interface ToldName {
  nameText: string;
  accounts: ReadonlyArray<{
    sources: ReadonlyArray<{ tier?: string | null }>;
  }>;
}

/**
 * The fold two spellings of one address share: accents and case.
 *
 * Only combining marks go. ɓ, ɛ and ŋ have no decomposition, so they stay —
 * they are letters of the names, and « Fulbe » is not an accented « Fulɓe ».
 */
// @req REQ-200
export function foldNameForm(form: string): string {
  return form
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("fr");
}

const ABOVE_UNVERIFIED = new Set(["referenced", "official"]);

/** Whether one of these sources is tiered above `unverified`. */
// @req REQ-200
export function citesAboveUnverified(
  sources: ReadonlyArray<{ tier?: string | null }>
): boolean {
  return sources.some((source) => ABOVE_UNVERIFIED.has(source.tier ?? ""));
}

/**
 * The names of a subject's history that meet the crawler threshold, in
 * history order and spelt as the history spells them.
 *
 * Every name a history tells is an exact answer for its subject (REQ-135,
 * migration 109), so each one sourced above `unverified` has an address:
 * « Fulɓe » on the fiche filed « Peul », « Bikpakpaam » on the one filed
 * « Konkomba ». The spelling is the history's, not the filed name's: the
 * family name filed « Traore » tells its story as « Traoré », and that is what
 * its address and its page heading say. A filed name the history does not
 * tell has no account to read, so it has no address.
 */
// @req REQ-200
export function addressedHistoryNames(
  history: { names: readonly ToldName[] } | null | undefined
): string[] {
  return (history?.names ?? [])
    .filter((name) =>
      name.accounts.some((account) => citesAboveUnverified(account.sources))
    )
    .map((name) => name.nameText);
}

const markCount = (spelling: string): number =>
  spelling.normalize("NFD").match(/\p{M}/gu)?.length ?? 0;

const capitalCount = (spelling: string): number =>
  spelling.match(/\p{Lu}/gu)?.length ?? 0;

/**
 * Two subjects may spell one form differently. The more accented writing is
 * kept — an unaccented one is usually a filing label — then the capitalised
 * one, a proper name's, then code-point order, so the choice never depends on
 * which subject came first.
 */
function preferred(left: string, right: string): string {
  const byMarks = markCount(left) - markCount(right);
  if (byMarks !== 0) return byMarks > 0 ? left : right;
  const byCapitals = capitalCount(left) - capitalCount(right);
  if (byCapitals !== 0) return byCapitals > 0 ? left : right;
  return left <= right ? left : right;
}

/** Each addressed form under its fold, spelled once. */
export type NameAddressDirectory = ReadonlyMap<string, string>;

/** One spelling per folded form, chosen the same way wherever it is built. */
// @req REQ-200
export function buildNameAddressDirectory(
  spellings: Iterable<string>
): NameAddressDirectory {
  const directory = new Map<string, string>();
  for (const spelling of spellings) {
    const key = foldNameForm(spelling);
    if (!key) continue;
    const held = directory.get(key);
    directory.set(
      key,
      held === undefined ? spelling : preferred(held, spelling)
    );
  }
  return directory;
}

/** The spelling a form is addressed by, or nothing when it has no address. */
// @req REQ-200
export function addressSpellingOf(
  directory: NameAddressDirectory,
  form: string
): string | undefined {
  return directory.get(foldNameForm(form));
}

/**
 * Where a link naming a form leads: its address when it has one, spelled as
 * the corpus writes it so the link never spends the redirect; otherwise the
 * search page's reading of it. Without a directory every form is read.
 */
// @req REQ-200
export function nameSearchHref(
  language: Language,
  form: string,
  directory: NameAddressDirectory | null = null
): string {
  const spelling = directory ? addressSpellingOf(directory, form) : undefined;
  return spelling
    ? getNameAnswerRoute(language, spelling)
    : `${getLocalizedRoute(language, "search")}?${new URLSearchParams({ q: form })}`;
}
