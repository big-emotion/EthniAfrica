import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import { normalizeString } from "@/lib/normalize";
import { getNameAnswerRoute } from "@/lib/routing";
import {
  foldNameForm,
  historyAddressSpelling,
  nameSearchHref,
} from "@/lib/search/nameAddress";
import { readNaming } from "@/lib/search/naming";
import { selectNameSubject } from "@/lib/search/nameSubject";
import type {
  NameHistoryAccount,
  TimelineName,
} from "@/lib/search/nameTimeline";
import { answersToSearch } from "@/lib/search/searchedName";
import {
  SOURCE_KIND_FAMILIES,
  sourceKindFamily,
  type SourceKindFamily,
} from "@/lib/sources/sourceKindFamily";
import type { SearchEntityType, SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";
import type { SourceKind } from "@/types/sources";

/**
 * The blocks under the timeline (brief 1, boards in
 * docs/design/mockups/site/search-peul-*.dc.html): who tells the open name,
 * what the project does not know, and where to go next. Pure functions; the
 * components only lay them out.
 */

export type NameHistorySource = NameHistoryAccount["sources"][number];

export interface SourceFamilyGroup {
  family: SourceKindFamily;
  /** Distinct sources of this family across the open name's accounts. */
  sourceCount: number;
  /** Each account this family backs, with only this family's sources. */
  accounts: Array<{
    account: NameHistoryAccount;
    sources: NameHistorySource[];
  }>;
}

/**
 * The open name's accounts, regrouped by the family of their sources, in the
 * fixed order of `SOURCE_KIND_FAMILIES`: an order of kinds, never of trust
 * (doctrine §1.1). An account two families back appears under both.
 */
// @req REQ-198
// @req REQ-161
export function groupAccountsBySourceFamily(
  name: TimelineName
): SourceFamilyGroup[] {
  return groupBySourceFamily(name.tiles.flatMap((tile) => tile.accounts));
}

/**
 * The written sources through which an account's oral tradition reaches the
 * project, when it reaches it no other way: an oral source with no carrier
 * named, beside the work that wrote it down (brief 4, the Manden traditions
 * Djibril Tamsir Niane reports). Empty when the account has no such source.
 */
// @req REQ-161
export function traditionReporters(
  account: NameHistoryAccount
): NameHistorySource[] {
  const reported = account.sources.some(
    (source) => source.source_kind === "oral_tradition" && !source.carrier
  );
  return reported
    ? account.sources.filter(
        (source) => sourceKindFamily(source.source_kind) !== "oral"
      )
    : [];
}

/**
 * Any list of accounts, regrouped the same way (a fiche's names, brief 2). A
 * work that only reports an oral tradition is named inside the tradition's
 * line, not counted again as a voice of its own (brief 4).
 */
// @req REQ-198
// @req REQ-161
export function groupBySourceFamily(
  accounts: readonly NameHistoryAccount[]
): SourceFamilyGroup[] {
  return SOURCE_KIND_FAMILIES.flatMap((family) => {
    const backed = accounts.flatMap((account) => {
      const reporters = traditionReporters(account);
      const sources = account.sources.filter(
        (source) =>
          sourceKindFamily(source.source_kind) === family &&
          !reporters.includes(source)
      );
      return sources.length > 0 ? [{ account, sources }] : [];
    });
    if (backed.length === 0) return [];
    const titles = new Set(
      backed.flatMap(({ sources }) => sources.map((source) => source.title))
    );
    return [{ family, sourceCount: titles.size, accounts: backed }];
  });
}

/**
 * The kinds of source the subject's other names cite and the open name does
 * not, in the families' fixed order. Provenance markers (the « other »
 * family) are not voices and are left out.
 */
// @req REQ-198
export function otherVoiceKinds(
  names: readonly TimelineName[],
  open: TimelineName
): SourceKind[] {
  const kindsOf = (name: TimelineName) =>
    name.tiles.flatMap((tile) =>
      tile.accounts.flatMap((account) =>
        account.sources.map((source) => source.source_kind as SourceKind)
      )
    );
  const own = new Set(kindsOf(open));
  const others = new Set(
    names
      .filter((name) => name !== open)
      .flatMap(kindsOf)
      .filter(
        (kind) => kind && !own.has(kind) && sourceKindFamily(kind) !== "other"
      )
  );
  return SOURCE_KIND_FAMILIES.flatMap((family) =>
    [...others].filter((kind) => sourceKindFamily(kind) === family)
  );
}

/** The first sentence of a summary: a reason line, not a paragraph. */
// @req REQ-198
export function firstSentence(text: string): string {
  const match = text.match(/^.+?[.!?](?=\s|$)/u);
  return (match ? match[0] : text).trim();
}

export interface UnwrittenSubject {
  /** The kind of the subject, as the page labels it (« Langue »). */
  label: string;
  name: string;
}

/**
 * What the page does not know, one line each, deduced from the data only: a
 * page never declares a silence its data does not support. An open name with
 * no oral source, a name with no dated origin (or what lies before its oldest
 * trace), a subject whose history is not written yet.
 */
// @req REQ-198
export function deduceSilences(
  subjects: ReadonlyArray<{ name: TimelineName }>,
  unwritten: readonly UnwrittenSubject[] = [],
  language: Language = "fr"
): string[] {
  const copy = nameClosingCopy[language].silence;
  const lines: string[] = [];
  for (const { name } of subjects) {
    const sources = name.tiles.flatMap((tile) =>
      tile.accounts.flatMap((account) => account.sources)
    );
    if (
      !sources.some((source) => sourceKindFamily(source.source_kind) === "oral")
    ) {
      lines.push(copy.noOral(name.nameText));
    }
    // A birth dated by a plain year is named; any other label (« Vers
    // 1505-1508 ») reads badly after « plus ancienne que ».
    const birth = name.tiles.find((tile) => tile.placement === "birth");
    const year = birth?.periodLabel?.match(/^\d{3,4}$/)?.[0];
    lines.push(
      !name.hasBirth
        ? copy.noBirth(name.nameText)
        : year
          ? copy.beforeYear(name.nameText, year)
          : copy.beforeBirth(name.nameText)
    );
  }
  for (const subject of unwritten) {
    lines.push(copy.unwritten(subject.label, subject.name));
  }
  return [...new Set(lines)];
}

/**
 * What a card's target is to the page, as analytics records it: a machine
 * value, never the French eyebrow, so one Plausible property holds one
 * vocabulary. The kinds a fiche links (`NextStepKind`), plus `namer` (the
 * language a searched outside name comes from) and `seed` (an unknown name's
 * invitation to read a name the project does know).
 */
export type NextStepKind =
  "family" | "patronyme" | "country" | "people" | "language" | "place";
export type NextStepRelation = NextStepKind | "namer" | "seed";

export interface NextStepTarget {
  type: SearchEntityType;
  id: string;
  name: string;
  relation: NextStepRelation;
  /**
   * A namer's card explains the naming, not the namer: these are the searched
   * name's accounts, where the fiche tells who gave the name (« Peul », from
   * Wolof). The namer's own summary only says what the namer is.
   */
  namingAccounts?: readonly string[];
}

/**
 * The next step of a name the project does not know (brief 1 decision 3,
 * boards search-unknown-*): nothing is related to it, so the page invites the
 * reader to a people and a country whose names it does tell.
 */
const UNKNOWN_NAME_TARGETS: readonly NextStepTarget[] = [
  { type: "people", id: "PPL_SIWI", name: "Siwi", relation: "seed" },
  { type: "country", id: "TCD", name: "Tchad", relation: "seed" },
];

type SubjectHistory = { subject: SearchResult; nameHistory: NameHistory };

/**
 * The language the searched name comes from, when others gave it: not a
 * self-name, and not from a language the subject names itself in (or is).
 */
function namerOf(
  { subject, nameHistory }: SubjectHistory,
  searched: string
): NextStepTarget | null {
  const name = nameHistory.names.find((candidate) =>
    answersToSearch(candidate.nameText, searched)
  );
  const origin = name?.languageOfOrigin;
  if (!origin || name.selfGiven) return null;
  const own = new Set([
    subject.id,
    subject.isoCode639_3,
    ...nameHistory.names
      .filter((candidate) => candidate.selfGiven)
      .map((candidate) => candidate.languageOfOrigin),
  ]);
  if (own.has(origin)) return null;
  // The name is the code until the loader reads the language's fiche.
  return {
    type: "language",
    id: origin,
    name: origin,
    relation: "namer",
    namingAccounts: name.accounts.map((account) => account.statement),
  };
}

function sentencesOf(text: string): string[] {
  return (text.match(/[\s\S]+?[.!?](?=\s|$)|[\s\S]+$/gu) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/**
 * Why a namer is offered, in the fiche's own words: the first account of the
 * searched name that names the namer, read up to the sentence that does, so a
 * pronoun keeps the sentence it points back to (« Forme française du nom. Les
 * sources consultées la font venir du wolof… »). Undefined when no account
 * names it; the card then says what the namer is.
 */
// @req REQ-198
export function namingReason(
  accounts: readonly string[],
  namer: string
): string | undefined {
  const word = normalizeString(namer).trim();
  if (!word) return undefined;
  const mentionsNamer = new RegExp(
    `(?<![\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`,
    "u"
  );
  for (const statement of accounts) {
    const sentences = sentencesOf(statement);
    const at = sentences.findIndex((sentence) =>
      mentionsNamer.test(normalizeString(sentence))
    );
    if (at >= 0) return sentences.slice(0, at + 1).join(" ");
  }
  return undefined;
}

/**
 * One or two names the data already links to the page's subjects: the
 * language a searched outside name comes from (« Peul », from Wolof), a
 * people's or a language's family, a family name's peoples. Never a subject
 * of the page itself, never more than two (brief 1, block 8). A page with no
 * subject is offered the unknown name's two invitations.
 */
// @req REQ-198
export function nextStepTargets(
  subjects: readonly SearchResult[],
  histories: readonly SubjectHistory[] = [],
  searched = "",
  limit = 2
): NextStepTarget[] {
  if (subjects.length === 0) return UNKNOWN_NAME_TARGETS.slice(0, limit);
  const onPage = new Set(subjects.map((subject) => subject.id));
  const targets: NextStepTarget[] = [];
  const add = (target: NextStepTarget | null) => {
    if (!target) return;
    if (onPage.has(target.id)) return;
    if (targets.some((known) => known.id === target.id)) return;
    targets.push(target);
  };
  for (const subject of subjects) {
    const history = histories.find((entry) => entry.subject === subject);
    if (history) add(namerOf(history, searched));
    if (
      (subject.type === "people" || subject.type === "language") &&
      subject.languageFamilyId &&
      subject.languageFamilyName
    ) {
      add({
        type: "languageFamily",
        id: subject.languageFamilyId,
        name: subject.languageFamilyName,
        relation: "family",
      });
    }
    if (subject.type === "patronyme") {
      for (const people of subject.associatedPeoples ?? []) {
        add({
          type: "people",
          id: people.id,
          name: people.name,
          relation: "people",
        });
      }
    }
  }
  return targets.slice(0, limit);
}

/** A card of the next step: the kind as eyebrow, the name, the reason. */
export interface NextStepCard {
  relation: NextStepRelation;
  kind: string;
  name: string;
  reason: string;
}

/**
 * The name a card shows and searches. A filed label is a workshop label
 * (« Songhay / Sonrai », « Lingala (locuteurs) »): put in `?q=` as is, it is
 * a name no reader types. Its first part that the target's own history tells
 * is kept, spelled as the history spells it; otherwise its lead part. A
 * plain name stays whole.
 */
// @req REQ-198
export function nameFormOf(
  filedLabel: string,
  toldNames: readonly string[] = []
): string {
  const parts = filedLabel
    .split(/\s*[()/]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const told = new Map(toldNames.map((name) => [normalizeString(name), name]));
  const toldPart = parts.find((part) => told.has(normalizeString(part)));
  return toldPart
    ? told.get(normalizeString(toldPart))
    : (parts[0] ?? filedLabel);
}

/**
 * A fiche as its search row describes it: the name it is filed under and the
 * `content` the search API reads its forms from (`readNaming`). A view passes
 * what that column holds, no more: a language's `spellingAliases` is a column
 * of its own the search RPC does not return, so it is left out.
 */
export interface StorySubject {
  type: SearchEntityType;
  id: string;
  name: string;
  content: unknown;
}

/** What a fiche's « Suivre l'histoire du nom … » names, and where it leads. */
export interface NameStoryLink {
  /** The history's first name, spelt as the history spells it. */
  name: string;
  href: string;
}

/**
 * The address of the fiche's story name (REQ-200), when the address
 * directory holds one for it — or nothing.
 *
 * The directory is keyed on each subject's filed name (`getAnsweredNameRows`)
 * and spelt as that subject's history tells it (`getNameAddressSpellings`).
 * So through this fiche the story name has an address only when it is the
 * filed name, accents and case aside, and the history tells that form with a
 * source above unverified. The history alone is not enough: hav's tells
 * « Kihavu », but hav is filed « Havu (kihavu) » and
 * `/fr/atlas/recherche/kihavu` answers 404.
 *
 * A fiche route mounts no directory (`NameAddressProvider`), so this applies
 * the directory's rule rather than reading its list. When another subject
 * spells the same form differently, the directory may keep that spelling
 * (the language yor's history writes « Yoruba », the people's « Yorùbá »):
 * the link then reaches the address through one permanent redirect, never a
 * 404.
 */
function storyAddressSpelling(
  subject: StorySubject,
  history: NameHistory,
  name: string
): string | undefined {
  return foldNameForm(name) === foldNameForm(subject.name)
    ? historyAddressSpelling(history, subject.name)
    : undefined;
}

/**
 * A fiche's « Suivre l'histoire du nom … », or nothing (brief 10 §1).
 *
 * The name is the history's first, and it is named only when the page the
 * link opens counts this fiche among its subjects. Without that the page says
 * « Nous avons trouvé des fiches liées sans établir qu'elles répondent à ce
 * nom » and tells no timeline, so the link would promise what it cannot keep
 * — the brief's own reason for drawing none without a history.
 *
 * The page's own selection decides it (`selectNameSubject`), run on the fiche
 * shaped as its search hit, so the two cannot drift apart. If the selection
 * later answers more of the forms this hit carries (Fulɓe on PPL_FULA,
 * Berbère on FLG_BERBERE), the link follows with no change here; a fix that
 * reads what the hit does not carry, such as the name history, has to pass it
 * here too. It assumes the search returns the fiche among its hits for its
 * own filed name or forms, which an exact name match does.
 *
 * The link leads to the name's own address when it has one, and otherwise to
 * the search page's reading of the name. Neither picks a subject, so
 * « Congo » opens the page where both countries answer. Both pages read the
 * same name through the same selection, accents and case aside.
 */
// @req REQ-198
// @req REQ-200
export function nameStoryLink(
  subject: StorySubject,
  history: NameHistory | null | undefined,
  language: Language
): NameStoryLink | undefined {
  const name = history?.names[0]?.nameText;
  if (!name) return undefined;
  const hit: SearchResult = {
    type: subject.type,
    id: subject.id,
    name: subject.name,
    naming: readNaming(subject.type, subject.content),
  };
  if (selectNameSubject([hit], name, language).length === 0) return undefined;
  const address = storyAddressSpelling(subject, history, name);
  return {
    name,
    href: address
      ? getNameAnswerRoute(language, address)
      : nameSearchHref(language, name),
  };
}
