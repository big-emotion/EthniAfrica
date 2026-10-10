/**
 * Place loader — reads dataset/source/afrik/lieux/*.json and writes each
 * fiche to afrik_places + afrik_place_peoples (migration 100, REQ-196).
 *
 * Only the fields the place model keeps after ETNI-2023 are persisted: the
 * legacy names[] block is ignored whether a fiche still carries it or not,
 * because the nameHistory block is where a place's names now live.
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

import { supabaseErrorMessage } from "@/lib/afrik/loaders/provenanceWriter";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { parsePlaceFile } from "@/lib/afrik/parsers/placeParser";
import type { createAdminClient } from "@/lib/supabase/admin";

const AFRIK_ROOT = join(process.cwd(), "dataset/source/afrik");

type AdminClient = ReturnType<typeof createAdminClient>;

export interface PlaceFiche {
  id: string;
  placeType: string;
  nameMain: string;
  countryId: string;
  associatedPeoples: { peopleId: string; relation?: string }[];
  summary: string;
  /** What the reader is served beyond the typed columns. */
  content: { gaps: unknown[]; sources: unknown[] };
  nameHistory: NameHistory | null;
}

export interface PlaceBatch {
  places: PlaceFiche[];
  /** One line per fiche that could not be read, naming its file. */
  errors: string[];
}

export interface PlaceLoadReport {
  total: number;
  inserted: number;
  errors: string[];
}

// @req REQ-196
export function loadAllPlaceFiches(
  datasetRoot: string = AFRIK_ROOT
): PlaceBatch {
  const dir = join(datasetRoot, "lieux");
  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort();
  } catch {
    return { places: [], errors: [] };
  }

  const batch: PlaceBatch = { places: [], errors: [] };
  for (const file of files) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, file), "utf-8"));
    } catch (error) {
      batch.errors.push(`${file}: ${(error as Error).message}`);
      continue;
    }

    const parsed = parsePlaceFile(raw);
    if (!parsed.success || !parsed.data) {
      batch.errors.push(`${file}: ${parsed.errors.join("; ")}`);
      continue;
    }

    const fiche = parsed.data;
    batch.places.push({
      id: fiche.id,
      placeType: fiche.placeType,
      nameMain: fiche.nameMain,
      countryId: fiche.countryId,
      associatedPeoples: fiche.associatedPeoples,
      summary: fiche.summary,
      content: { gaps: fiche.gaps, sources: fiche.sources },
      nameHistory: (fiche.nameHistory as NameHistory | undefined) ?? null,
    });
  }
  return batch;
}

/** Why a fiche cannot be written, or null when every link resolves. */
function unresolvedLink(
  place: PlaceFiche,
  references: LoadPlacesOptions["references"]
): string | null {
  if (!references.countryIds.has(place.countryId)) {
    return `${place.id}: countryId ${place.countryId} does not resolve to a country fiche`;
  }
  const missing = place.associatedPeoples.find(
    ({ peopleId }) => !references.peopleIds.has(peopleId)
  );
  return missing
    ? `${place.id}: peopleId ${missing.peopleId} does not resolve to a people fiche`
    : null;
}

async function writePlace(
  supabase: AdminClient,
  place: PlaceFiche
): Promise<string | null> {
  const { error: placeError } = await supabase.from("afrik_places").upsert(
    {
      id: place.id,
      place_type: place.placeType,
      name_main: place.nameMain,
      country_id: place.countryId,
      summary: place.summary,
      content: place.content,
      name_history: place.nameHistory,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (placeError) {
    return `afrik_places — ${supabaseErrorMessage(placeError)}`;
  }

  // Replaced rather than upserted, so a people the fiche no longer names
  // stops being served with it.
  const { error: clearError } = await supabase
    .from("afrik_place_peoples")
    .delete()
    .eq("place_id", place.id);
  if (clearError) {
    return `afrik_place_peoples — ${supabaseErrorMessage(clearError)}`;
  }
  if (place.associatedPeoples.length === 0) return null;

  const { error: joinError } = await supabase
    .from("afrik_place_peoples")
    .insert(
      place.associatedPeoples.map(({ peopleId, relation }) => ({
        place_id: place.id,
        people_id: peopleId,
        relation: relation ?? null,
      }))
    );
  return joinError
    ? `afrik_place_peoples — ${supabaseErrorMessage(joinError)}`
    : null;
}

export interface LoadPlacesOptions {
  dryRun?: boolean;
  /** The ids already loaded, which a place's links must point at. */
  references: { countryIds: Set<string>; peopleIds: Set<string> };
}

// @req REQ-196
export async function loadPlaces(
  supabase: AdminClient,
  places: PlaceFiche[],
  { dryRun = false, references }: LoadPlacesOptions
): Promise<PlaceLoadReport> {
  const report: PlaceLoadReport = { total: 0, inserted: 0, errors: [] };

  for (const place of places) {
    report.total += 1;
    const refusal = unresolvedLink(place, references);
    if (refusal) {
      report.errors.push(refusal);
      continue;
    }
    if (dryRun) continue;

    const failure = await writePlace(supabase, place);
    if (failure) {
      report.errors.push(`${place.id}: ${failure}`);
      continue;
    }
    report.inserted += 1;
  }

  return report;
}
