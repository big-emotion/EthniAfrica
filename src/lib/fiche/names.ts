import type {
  PatronymeLinkSummary,
  PatronymeReachSummary,
} from "@/api/v2/services/patronymeFicheLinks";
import type { PatronymeNameSystem } from "@/lib/afrik/parsers/patronymeTypes";
import { getTranslation } from "@/lib/translations";
import type { Language } from "@/types/shared";

export type FicheName = PatronymeLinkSummary | PatronymeReachSummary;

/**
 * An alphabet of 26 letters is longer than a list of 24 names. Nine countries
 * and one people pass this; below it the index costs more than it saves.
 */
// @req REQ-154
export const NAME_INDEX_THRESHOLD = 24;

/** Long personal-name lists fold before they need an alphabetical index. */
// @req REQ-153
export const NAME_FOLD_THRESHOLD = 12;

// @req REQ-133
export function namesChapterTitle(
  scope: "people" | "country" | "language",
  language: Language
): string {
  return getTranslation(language).patronymes.onFiche.namesTitle[scope];
}

// @req REQ-133
export function sortNames<T extends FicheName>(
  names: readonly T[],
  language: Language
): T[] {
  return [...names].sort((a, b) =>
    a.nameMain.localeCompare(b.nameMain, language, { sensitivity: "base" })
  );
}

interface NameGroup {
  system: PatronymeNameSystem;
  names: FicheName[];
}

/** Names filed under their system, the largest group first, each A–Z. */
// @req REQ-133
export function groupNamesBySystem(
  names: readonly FicheName[],
  language: Language
): NameGroup[] {
  const labels = getTranslation(language).patronymes.nameSystemLabels;
  const groups = new Map<PatronymeNameSystem, FicheName[]>();
  for (const name of sortNames(names, language)) {
    groups.set(name.nameSystem, [...(groups.get(name.nameSystem) ?? []), name]);
  }
  return Array.from(groups, ([system, entries]) => ({
    system,
    names: entries,
  })).sort(
    (a, b) =>
      b.names.length - a.names.length ||
      labels[a.system].localeCompare(labels[b.system], language)
  );
}

/** A–Z, or "#" for a name that opens on anything else. */
// @req REQ-133
export function initialOf(name: string): string {
  return (
    name
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .match(/^[A-Z]/)?.[0] ?? "#"
  );
}
