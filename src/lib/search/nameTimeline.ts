/**
 * One name's history as the timeline reads it (REQ-198, DEC-073): the fiche's
 * `nameHistory` block regrouped into tiles, from today backwards.
 *
 * The fiche lists its accounts in the order its author wrote them, which is
 * not a date order (the lingala « before » accounts run 1882, 1882, 1901,
 * 1888). The timeline needs one, so this module fixes it, in three bands:
 *
 * 1. the name in use — undated accounts the author put above the birth (« Usage
 *    contemporain »), then dated accounts no older than the birth, latest first;
 * 2. the birth, then the competing origins, then what the author put below the
 *    birth (oral accounts of an older past, often undated) in the author's order;
 * 3. what existed before the name, latest first.
 *
 * Undated accounts never get a date guessed for them: their place comes from
 * where the author wrote them relative to the birth, and nothing else.
 */

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  answersToSearch,
  orderForSearch,
  selfNameLead,
} from "@/lib/search/searchedName";

type HistoryName = NameHistory["names"][number];
export type NameHistoryAccount = HistoryName["accounts"][number];

export type TimelineRegime = "polity" | "colonial" | "modern";

export interface TimelineTile {
  key: string;
  placement: "plain" | "birth" | "before";
  /** Undefined for a group whose hypotheses are dated differently. */
  periodLabel?: string;
  /** Undefined for an undated tile: its era is not ours to guess. */
  regime?: TimelineRegime;
  /** Several accounts only when they are competing origins of one group. */
  hypotheses: boolean;
  accounts: NameHistoryAccount[];
}

export interface TimelineName {
  nameText: string;
  former: boolean;
  selfGiven: boolean;
  searched: boolean;
  shortLine?: string;
  hasBirth: boolean;
  tiles: TimelineTile[];
}

export interface NameTimelineModel {
  summary: string;
  names: TimelineName[];
  selfLead?: { searched: string; self: string };
  /** Every name and written form the block records, set in italics by the UI. */
  italicForms: string[];
}

// Approximate cuts, since the block declares no era: the Berlin conference
// for the colonial period, 1960 for the independences. A tile is inked by the
// latest year it covers.
const COLONIAL_FROM = 1885;
const MODERN_FROM = 1960;

// @req REQ-198
export function regimeOfYear(year: number | null): TimelineRegime | undefined {
  if (year === null || year === undefined) return undefined;
  if (year >= MODERN_FROM) return "modern";
  if (year >= COLONIAL_FROM) return "colonial";
  return "polity";
}

function latestYear(account: NameHistoryAccount): number | null {
  return account.period.to ?? account.period.from ?? null;
}

const byLatestFirst = (a: NameHistoryAccount, b: NameHistoryAccount) =>
  (latestYear(b) ?? -Infinity) - (latestYear(a) ?? -Infinity);

function tileOf(
  accounts: NameHistoryAccount[],
  placement: TimelineTile["placement"],
  key: string
): TimelineTile {
  const labels = new Set(accounts.map(({ period }) => period.label));
  const years = accounts.map(latestYear).filter((year) => year !== null);
  return {
    key,
    placement,
    periodLabel: labels.size === 1 ? accounts[0].period.label : undefined,
    regime:
      years.length === accounts.length
        ? regimeOfYear(Math.max(...years))
        : undefined,
    hypotheses: accounts.length > 1,
    accounts,
  };
}

function tilesOf(name: HistoryName): TimelineTile[] {
  const { accounts } = name;
  const birthIndex = accounts.findIndex((account) => account.birth);
  const birth = birthIndex >= 0 ? accounts[birthIndex] : undefined;
  const birthYear = birth ? latestYear(birth) : null;

  const groups = new Map<string, NameHistoryAccount[]>();
  for (const account of accounts) {
    if (!account.hypothesisGroup || account.before || account.birth) continue;
    groups.set(account.hypothesisGroup, [
      ...(groups.get(account.hypothesisGroup) ?? []),
      account,
    ]);
  }
  const competing = (account: NameHistoryAccount) =>
    !account.before &&
    !account.birth &&
    !!account.hypothesisGroup &&
    groups.get(account.hypothesisGroup)!.length > 1;

  const plain = accounts.filter(
    (account) => !account.birth && !account.before && !competing(account)
  );
  const isOlderThanBirth = (account: NameHistoryAccount) => {
    const year = latestYear(account);
    if (!birth) return false;
    if (year === null) return accounts.indexOf(account) > birthIndex;
    return birthYear !== null && year < birthYear;
  };

  const inUse = plain.filter((account) => !isOlderThanBirth(account));
  const olderAccounts = plain.filter(isOlderThanBirth);
  const before = accounts.filter((account) => account.before);

  const key = (account: NameHistoryAccount) =>
    `${name.nameText}:${accounts.indexOf(account)}`;
  const single =
    (placement: TimelineTile["placement"]) => (account: NameHistoryAccount) =>
      tileOf([account], placement, key(account));

  return [
    ...inUse.filter((account) => latestYear(account) === null),
    ...inUse
      .filter((account) => latestYear(account) !== null)
      .sort(byLatestFirst),
  ]
    .map(single("plain"))
    .concat(birth ? [single("birth")(birth)] : [])
    .concat(
      [...groups.values()]
        .filter((members) => members.length > 1)
        .map((members) => tileOf(members, "plain", key(members[0])))
    )
    .concat(olderAccounts.map(single("plain")))
    .concat([...before].sort(byLatestFirst).map(single("before")));
}

/**
 * The block as the timeline shows it, for the name the reader typed: that
 * name first, the self-given ones next, the rest in the fiche's order
 * (REQ-197), and a lead to the self-name when the reader typed another one.
 */
// @req REQ-198
export function buildNameTimeline(
  history: NameHistory,
  searched: string
): NameTimelineModel {
  const isSearched = (name: HistoryName) =>
    answersToSearch(name.nameText, searched);
  const ordered = orderForSearch(history.names, isSearched);

  return {
    summary: history.summary,
    names: ordered.map((name) => {
      const tiles = tilesOf(name);
      return {
        nameText: name.nameText,
        former: name.nameStatus === "former",
        selfGiven: name.selfGiven,
        searched: isSearched(name),
        shortLine: name.shortLine,
        hasBirth: tiles.some(({ placement }) => placement === "birth"),
        tiles,
      };
    }),
    selfLead: ordered.some(isSearched)
      ? selfNameLead(
          history.names.map(({ nameText, selfGiven }) => ({
            form: nameText,
            selfGiven,
          })),
          ordered.find(isSearched)!.nameText
        )
      : undefined,
    italicForms: [
      ...new Set(
        history.names.flatMap((name) => [
          name.nameText,
          ...name.accounts.flatMap((account) =>
            account.formAsWritten ? [account.formAsWritten] : []
          ),
        ])
      ),
    ],
  };
}

export interface NamedTextPart {
  text: string;
  name?: true;
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Cuts a sentence around the names it cites, so the UI can set them in
 * italics (operator ruling 2026-10-09) while the fiche text stays plain.
 * Longest form first, so « Congo français » is one name and not « Congo »
 * plus prose; whole words only, so « Congolais » is not « Congo ».
 */
// @req REQ-198
export function splitNamedText(
  text: string,
  forms: readonly string[]
): NamedTextPart[] {
  const alternatives = [...new Set(forms)]
    .filter((form) => form.trim())
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (alternatives.length === 0) return [{ text }];

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${alternatives.join("|")})(?![\\p{L}\\p{N}])`,
    "giu"
  );
  const parts: NamedTextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) {
      parts.push({ text: text.slice(cursor, match.index) });
    }
    parts.push({ text: match[0], name: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
