import { basename, join } from "node:path";

import { parseNameHistory } from "../../src/lib/afrik/parsers/nameHistoryParser";
import { jsonFilesRecursively, readJson } from "./afrikCorpusFiles";

/**
 * The order of the long tail of name-history work (ETNI-2011).
 *
 * A wave is six batches of ten subjects, as waves 4 to 13 were. Real search
 * demand is thin and mostly unreadable from the repository (see
 * docs/editorial/strategy/name-history-priority-core.md, « The long tail:
 * wave order »), so the order rests on three proxies that anyone can
 * re-derive from git: fiche visits in a committed Plausible snapshot, the
 * population a people's fiche states, and how many countries a subject spans.
 * Inside a demand tier the subjects are grouped by linguistic family
 * (peoples) or by country (family names), because neighbours share sources.
 */
export const WAVE_SIZE = 60;

export type TailKind = "people" | "family-name";

export interface TailSubject {
  id: string;
  kind: TailKind;
  /** Linguistic family for a people, first country for a family name. */
  group: string;
  /** Unique visitors on the fiche page in the committed snapshot. */
  visitors: number;
  /** Total population stated on a people's fiche; null when it states none. */
  population: number | null;
  /** Countries the subject is attested in. */
  spread: number;
}

export interface Wave {
  number: number;
  kind: TailKind;
  subjects: TailSubject[];
}

export interface FolderCoverage {
  folder: string;
  fiches: number;
  complete: number;
}

const LARGE_PEOPLE = 1_000_000;
const MID_PEOPLE = 100_000;

/** Lower is more in demand. A family name has no population to band. */
function demandTier(subject: TailSubject): number {
  if (subject.visitors > 0) return 1;
  if (subject.kind === "family-name") return subject.spread >= 2 ? 2 : 3;
  const population = subject.population ?? 0;
  if (population >= LARGE_PEOPLE) return 2;
  if (population >= MID_PEOPLE) return 3;
  return 4;
}

const bySubject = (a: TailSubject, b: TailSubject) =>
  b.visitors - a.visitors ||
  (b.population ?? 0) - (a.population ?? 0) ||
  b.spread - a.spread ||
  a.id.localeCompare(b.id);

function weight(members: TailSubject[]) {
  return {
    visitors: members.reduce((sum, m) => sum + m.visitors, 0),
    population: members.reduce((sum, m) => sum + (m.population ?? 0), 0),
    spread: members.reduce((sum, m) => sum + m.spread, 0),
  };
}

export function orderTail(subjects: TailSubject[]): TailSubject[] {
  const tiers = new Map<number, TailSubject[]>();
  for (const subject of subjects) {
    const tier = demandTier(subject);
    tiers.set(tier, [...(tiers.get(tier) ?? []), subject]);
  }

  return [...tiers.keys()]
    .sort((a, b) => a - b)
    .flatMap((tier) => {
      const groups = new Map<string, TailSubject[]>();
      for (const subject of tiers.get(tier) ?? []) {
        groups.set(subject.group, [
          ...(groups.get(subject.group) ?? []),
          subject,
        ]);
      }
      return [...groups.entries()]
        .map(([group, members]) => ({
          group,
          members: members.sort(bySubject),
          weight: weight(members),
        }))
        .sort(
          (a, b) =>
            b.weight.visitors - a.weight.visitors ||
            b.weight.population - a.weight.population ||
            b.weight.spread - a.weight.spread ||
            a.group.localeCompare(b.group)
        )
        .flatMap(({ members }) => members);
    });
}

/**
 * Peoples and family names alternate, as waves 10 and 11 did, from
 * `firstWave`; when one kind runs out the other carries on alone.
 */
export function cutWaves(
  people: TailSubject[],
  familyNames: TailSubject[],
  firstWave: number
): Wave[] {
  const queues: Record<TailKind, TailSubject[]> = {
    people: [...people],
    "family-name": [...familyNames],
  };
  const waves: Wave[] = [];
  let turn: TailKind = "people";

  while (queues.people.length + queues["family-name"].length > 0) {
    const kind = queues[turn].length > 0 ? turn : otherKind(turn);
    waves.push({
      number: firstWave + waves.length,
      kind,
      subjects: queues[kind].splice(0, WAVE_SIZE),
    });
    turn = otherKind(kind);
  }
  return waves;
}

function otherKind(kind: TailKind): TailKind {
  return kind === "people" ? "family-name" : "people";
}

/** The folders whose fiches carry a `nameHistory` block. */
const NAME_HISTORY_FOLDERS = [
  "peuples",
  "langues",
  "famille_linguistique",
  "pays",
  "patronymes",
  "lieux",
  "mots",
] as const;

type Fiche = Record<string, unknown>;

/** Fiches only: no V1 archive, no `_manifest`-style helper files. */
function ficheFiles(datasetRoot: string, folder: string): string[] {
  return jsonFilesRecursively(join(datasetRoot, folder)).filter(
    (file) => !basename(file).startsWith("_") && !file.includes("/V1/")
  );
}

// « Complete » is the validator's own test (checkNameHistoryBlocks, REQ-196):
// the block is present and the shared nameHistory schema accepts it.
function hasCompleteNameHistory(fiche: Fiche): boolean {
  return "nameHistory" in fiche && parseNameHistory(fiche.nameHistory).success;
}

export function nameHistoryCoverage(datasetRoot: string): FolderCoverage[] {
  return NAME_HISTORY_FOLDERS.map((folder) => {
    const fiches = ficheFiles(datasetRoot, folder).map((file) =>
      readJson<Fiche>(file)
    );
    return {
      folder,
      fiches: fiches.length,
      complete: fiches.filter(hasCompleteNameHistory).length,
    };
  });
}

interface PeopleFiche extends Fiche {
  id: string;
  languageFamilyId?: string;
  currentCountries?: string[];
  content?: { demography?: { totalPopulation?: unknown } };
}

interface FamilyNameFiche extends Fiche {
  id: string;
  countries?: { countryId: string }[];
}

export function readTail(
  datasetRoot: string,
  visitors: Record<string, number>
): TailSubject[] {
  const people = ficheFiles(datasetRoot, "peuples")
    .map((file) => readJson<PeopleFiche>(file))
    .filter((fiche) => !hasCompleteNameHistory(fiche))
    .map((fiche): TailSubject => {
      const stated = fiche.content?.demography?.totalPopulation;
      return {
        id: fiche.id,
        kind: "people",
        group: fiche.languageFamilyId ?? "none",
        visitors: visitors[fiche.id] ?? 0,
        population: typeof stated === "number" && stated > 0 ? stated : null,
        spread: fiche.currentCountries?.length ?? 0,
      };
    });

  const familyNames = ficheFiles(datasetRoot, "patronymes")
    .map((file) => readJson<FamilyNameFiche>(file))
    .filter((fiche) => !hasCompleteNameHistory(fiche))
    .map((fiche): TailSubject => ({
      id: fiche.id,
      kind: "family-name",
      group: fiche.countries?.[0]?.countryId ?? "none",
      visitors: visitors[fiche.id] ?? 0,
      population: null,
      spread: fiche.countries?.length ?? 0,
    }));

  return [...people, ...familyNames];
}

function groupCounts(subjects: TailSubject[]): [string, TailSubject[]][] {
  const groups = new Map<string, TailSubject[]>();
  for (const subject of subjects) {
    groups.set(subject.group, [...(groups.get(subject.group) ?? []), subject]);
  }
  return [...groups.entries()];
}

// The summary names the largest groups only; the full list has the rest.
const MIX_SHOWN = 4;

export function renderWaveSummary(waves: Wave[]): string {
  const rows = waves.map(({ number, kind, subjects }) => {
    const groups = groupCounts(subjects).sort(
      (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
    );
    const shown = groups
      .slice(0, MIX_SHOWN)
      .map(([group, members]) => `\`${group}\` ${members.length}`);
    const others = groups.length - MIX_SHOWN;
    const mix = (others > 0 ? [...shown, `${others} more`] : shown).join(", ");
    const first = subjects[0].id;
    const last = subjects[subjects.length - 1].id;
    return `| ${number} | ${kind} | ${subjects.length} | ${mix} | \`${first}\` | \`${last}\` |`;
  });
  return [
    "| Wave | Kind | Subjects | Family or country mix | First id | Last id |",
    "| ---- | ---- | -------- | --------------------- | -------- | ------- |",
    ...rows,
  ].join("\n");
}

export function renderWaveList(waves: Wave[]): string {
  return waves
    .map(({ number, kind, subjects }) => {
      const lines = groupCounts(subjects).map(
        ([group, members]) =>
          `- \`${group}\`: ${members.map((m) => `\`${m.id}\``).join(", ")}`
      );
      return `## Wave ${number} (${kind}, ${subjects.length})\n\n${lines.join("\n")}`;
    })
    .join("\n\n");
}
