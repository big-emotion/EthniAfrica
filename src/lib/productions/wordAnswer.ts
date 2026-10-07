import { normalizeString } from "@/lib/normalize";
import type {
  AnswerAccount,
  AnswerName,
  WordAnswer,
} from "@/lib/search/answer";
import {
  strongestSearchSourceStanding,
  type SearchEvidenceSource,
} from "@/lib/search/evidence";
import { normaliseSearchQuery } from "@/lib/search/queryNormalisation";
import type { Language } from "@/types/shared";

import { loadProductionLedger, type LedgerEntry } from "./ledger";

type Localized = { fr: string; en?: string };

const localize = (text: Localized, language: Language): string =>
  (language === "en" ? text.en : text.fr) ?? text.fr;

function sourcesOf(entry: LedgerEntry): SearchEvidenceSource[] {
  return (entry.sources ?? []).map((source, index) => ({
    id: `${entry.campaign}:${index}`,
    title: source.title,
    url: source.url,
    tier: source.tier as SearchEvidenceSource["tier"],
  }));
}

function accountsOf(entry: LedgerEntry, language: Language): AnswerAccount[] {
  const origin = entry.answer?.origin ?? [];
  const sources = sourcesOf(entry);
  return origin.map((account): AnswerAccount => {
    const text = localize(account.text, language);
    // The ledger lists a piece's sources once, not per account. With one
    // account they can only be its sources; with several, assigning them would
    // invent which source backs which reading, so the accounts carry none and
    // `sources.count` still reports the piece's total.
    const evidence =
      origin.length === 1 && sources.length > 0
        ? [
            {
              assertion: {
                statement: text,
                sourceCount: sources.length,
                lastHumanAuditAt: null,
              },
              sources,
              standing: strongestSearchSourceStanding(sources),
            },
          ]
        : [];
    return {
      text,
      ...(account.attribution ? { attribution: account.attribution } : {}),
      evidence,
    };
  });
}

function formsOf(entry: LedgerEntry, language: Language): AnswerName[] {
  const label = entry.word!.label;
  const ordered =
    language === "en" ? [label.en, label.fr] : [label.fr, label.en];
  const forms = [...new Set(ordered.filter((form): form is string => !!form))];
  // A word has no people to say which form is its own: none is marked.
  return forms.map((form) => ({ form, selfGiven: null }));
}

function project(entry: LedgerEntry, language: Language): WordAnswer {
  const answer = entry.answer!;
  const publications = entry.publications.flatMap(
    ({ network, url, format, publishedAt }) =>
      url
        ? [{ network, url, format, ...(publishedAt ? { publishedAt } : {}) }]
        : []
  );
  return {
    kind: "word",
    title: localize(entry.word!.label, language),
    queries: entry.word!.queries,
    what: {
      ...(answer.lead ? { lead: localize(answer.lead, language) } : {}),
      facts: {},
    },
    origin: {
      accounts: accountsOf(entry, language),
      debated: answer.origin.length > 1,
    },
    names: formsOf(entry, language),
    ...(answer.followUp
      ? { next: { question: localize(answer.followUp, language) } }
      : {}),
    sources: { count: entry.sources?.length ?? 0 },
    ...(publications.length > 0 ? { publications } : {}),
    ...(answer.path?.length ? { path: answer.path } : {}),
  };
}

function termsOf(entry: LedgerEntry): string[] {
  const { label, queries } = entry.word!;
  return [...queries, label.fr, label.en ?? ""]
    .filter(Boolean)
    .map(normalizeString);
}

/**
 * The published words whose answer the page should give for a query, matched
 * on the whole query — never on a part of it, because a word that is merely
 * contained in a longer search has not been asked about. It is read from the
 * production registry, not from a second store, so publishing a piece and
 * answering its word are one act. `ledger` is a parameter so a test can supply
 * a record without filing one.
 * @req REQ-184
 */
export function findWordAnswer(
  query: string | undefined,
  language: Language = "fr",
  ledger: readonly LedgerEntry[] = loadProductionLedger()
): WordAnswer[] {
  const wanted = normaliseSearchQuery(query ?? "").candidates.map(
    normalizeString
  );
  if (wanted.length === 0) return [];
  return ledger
    .filter((entry) => entry.word && entry.answer)
    .filter((entry) => termsOf(entry).some((term) => wanted.includes(term)))
    .map((entry) => project(entry, language));
}
