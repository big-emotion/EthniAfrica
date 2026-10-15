import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import {
  firstSentence,
  traditionReporters,
  type NextStepCard,
} from "@/lib/search/nameClosing";
import { sourceKindFamily } from "@/lib/sources/sourceKindFamily";
import type { SearchEntityType } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * The closing of a fiche (brief 2, boards docs/design/mockups/site/
 * people-*.dc.html): the silences of all the subject's names and the next
 * names, deduced from the data only. A fiche never declares a silence its
 * data does not support.
 */

type FicheName = NameHistory["names"][number];

const hasDate = (name: FicheName) =>
  name.accounts.some((account) => account.period.from != null);
const birthOf = (name: FicheName) =>
  name.accounts.find((account) => account.birth);

/**
 * One line each: no oral account for any name, or oral traditions known only
 * through the authors who wrote them down; the names no account tells yet;
 * the names with neither a dated origin nor a dated trace; then what lies
 * before the first name's oldest trace (its self-name, first in the fiche).
 */
// @req REQ-198
export function ficheSilences(
  history: NameHistory,
  subject: SearchEntityType,
  language: Language = "fr"
): string[] {
  const copy = nameClosingCopy[language];
  const { names } = history;
  if (names.length === 0) return [];
  const lines: string[] = [];

  const oralOf = (name: FicheName) =>
    name.accounts.flatMap((account) =>
      account.sources.filter(
        (source) => sourceKindFamily(source.source_kind) === "oral"
      )
    );
  const oral = names.flatMap(oralOf);
  if (oral.length === 0) {
    lines.push(
      names.length > 1
        ? copy.fiche.noOral(subject)
        : copy.silence.noOral(names[0].nameText)
    );
  } else if (
    oral.every(
      (source) => source.source_kind === "oral_tradition" && !source.carrier
    )
  ) {
    // Brief 4: traditions the project reads only in a written work. The
    // reader is told who wrote them down, and that no carrier speaks yet.
    const told = names.find((name) => oralOf(name).length > 0);
    const reporters = names.flatMap((name) =>
      name.accounts.flatMap(traditionReporters)
    );
    const authors = [
      ...new Set(
        (reporters.length > 0 ? reporters : oral).map((source) => source.author)
      ),
    ];
    lines.push(copy.fiche.oralOnlyThrough(told.nameText, authors));
  }

  for (const name of names) {
    if (name.accounts.length === 0) {
      lines.push(copy.fiche.noAccount(name.nameText));
    }
  }

  const undated = names.filter(
    (name) => name.accounts.length > 0 && !birthOf(name) && !hasDate(name)
  );
  if (undated.length > 0) {
    lines.push(copy.fiche.undated(undated.map((name) => name.nameText)));
  }

  const [first] = names;
  const birth = birthOf(first);
  if (birth) {
    const label = birth.period.label;
    lines.push(
      /^\d{3,4}$/.test(label)
        ? copy.silence.beforeYear(first.nameText, label)
        : /siècle$/i.test(label)
          ? copy.fiche.beforeCentury(first.nameText, label)
          : copy.silence.beforeBirth(first.nameText)
    );
  } else if (hasDate(first)) {
    const year = Math.min(
      ...first.accounts.flatMap((account) =>
        account.period.from != null ? [account.period.from] : []
      )
    );
    lines.push(copy.fiche.firstWritten(first.nameText, year));
  }
  return lines;
}

/**
 * One line for each name whose competing readings carry no date at all
 * (brief 5, boards country-*.dc.html): « Les trois explications du nom Côte
 * de Quaqua ne sont pas datées. » Drawn on the country fiche only, the one
 * whose boards carry it.
 */
// @req REQ-198
export function undatedReadingsSilences(
  history: NameHistory,
  language: Language = "fr"
): string[] {
  const copy = nameClosingCopy[language].fiche;
  return history.names.flatMap((name) => {
    const groups = new Map<string, number[]>();
    for (const account of name.accounts) {
      if (!account.hypothesisGroup) continue;
      groups.set(account.hypothesisGroup, [
        ...(groups.get(account.hypothesisGroup) ?? []),
        account.period.from ?? Number.NaN,
      ]);
    }
    return [...groups.values()]
      .filter((dates) => dates.length > 1 && dates.every(Number.isNaN))
      .map((dates) => copy.undatedReadings(dates.length, name.nameText));
  });
}

/** A name the fiche links, with the summary of its own fiche when it has one. */
export interface FicheNextCandidate {
  kind: string;
  name: string;
  summary?: string | null;
}

/**
 * The next step of a fiche: the first candidates whose fiche has a summary,
 * each with that summary's first sentence as its reason. A candidate without
 * one is left out rather than shown without a reason.
 */
// @req REQ-198
export function ficheNextSteps(
  candidates: readonly FicheNextCandidate[],
  limit = 2
): NextStepCard[] {
  const cards: NextStepCard[] = [];
  for (const candidate of candidates) {
    if (cards.length === limit) break;
    if (!candidate.summary?.trim()) continue;
    if (cards.some((card) => card.name === candidate.name)) continue;
    cards.push({
      kind: candidate.kind,
      name: candidate.name,
      reason: firstSentence(candidate.summary),
    });
  }
  return cards;
}
