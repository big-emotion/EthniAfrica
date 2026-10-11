/**
 * Place service (REQ-196, migration 100) — the only layer that reads
 * afrik_places. A detail costs five queries, none per row: the place, its
 * people links, those peoples' names, its countries and their names. A list
 * page costs two: the places, then their countries (migration 106).
 */

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { logger } from "@/lib/api/logger";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/api/v2/schemas/pagination";

export interface PlaceListItem {
  id: string;
  placeType: string;
  nameMain: string;
  /** Null for a region that spans several countries. */
  countryId: string | null;
  countryIds: string[];
}

export interface PlaceRecord {
  id: string;
  placeType: string;
  nameMain: string;
  summary: string;
  /** Null for a region that spans several countries. */
  country: { id: string; name: string | null } | null;
  /** Every country, in the fiche's order. */
  countries: { id: string; name: string | null }[];
  associatedPeoples: {
    id: string;
    name: string | null;
    relation: string | null;
  }[];
  content: Record<string, unknown>;
  nameHistory: NameHistory | null;
}

// @req REQ-196
export async function listPlaces(
  page = 1,
  perPage = DEFAULT_PAGE_SIZE
): Promise<{ data: PlaceListItem[]; total: number }> {
  const from = (page - 1) * perPage;
  const { data, error, count } = await createServerClient()
    .from("afrik_places")
    .select("id, place_type, name_main, country_id", { count: "exact" })
    .order("name_main")
    .range(from, from + perPage - 1);

  if (error) {
    logger.error("Error listing places", error);
    throw error;
  }

  const rows = data ?? [];
  const countriesByPlace = new Map<string, string[]>();
  if (rows.length > 0) {
    const { data: links, error: linksError } = await createServerClient()
      .from("afrik_place_countries")
      .select("place_id, country_id, position")
      .in(
        "place_id",
        rows.map((row) => row.id as string)
      );
    if (linksError) throw linksError;
    for (const link of [...(links ?? [])].sort(
      (a, b) => (a.position as number) - (b.position as number)
    )) {
      const placeId = link.place_id as string;
      countriesByPlace.set(placeId, [
        ...(countriesByPlace.get(placeId) ?? []),
        link.country_id as string,
      ]);
    }
  }

  return {
    total: count ?? 0,
    data: rows.map((row) => ({
      id: row.id as string,
      placeType: row.place_type as string,
      nameMain: row.name_main as string,
      countryId: (row.country_id as string) ?? null,
      countryIds: countriesByPlace.get(row.id as string) ?? [],
    })),
  };
}

// @req REQ-196
export async function getPlaceById(id: string): Promise<PlaceRecord | null> {
  const supabase = createServerClient();

  const { data: place, error } = await supabase
    .from("afrik_places")
    .select(
      "id, place_type, name_main, country_id, summary, content, name_history"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logger.error("Error fetching place", error, { id });
    throw error;
  }
  if (!place) return null;

  const [links, countryLinks] = await Promise.all([
    supabase
      .from("afrik_place_peoples")
      .select("people_id, relation")
      .eq("place_id", id),
    supabase
      .from("afrik_place_countries")
      .select("country_id, position")
      .eq("place_id", id),
  ]);
  if (links.error) throw links.error;
  if (countryLinks.error) throw countryLinks.error;

  const countryIds = [...(countryLinks.data ?? [])]
    .sort((a, b) => (a.position as number) - (b.position as number))
    .map((link) => link.country_id as string);
  const countryNames = new Map<string, string>();
  if (countryIds.length > 0) {
    const { data: countryRows, error: countryError } = await supabase
      .from("afrik_countries")
      .select("id, name_fr")
      .in("id", countryIds);
    if (countryError) throw countryError;
    for (const country of countryRows ?? []) {
      countryNames.set(country.id as string, country.name_fr as string);
    }
  }
  const countries = countryIds.map((countryId) => ({
    id: countryId,
    name: countryNames.get(countryId) ?? null,
  }));

  const peopleIds = (links.data ?? []).map((link) => link.people_id as string);
  const peopleNames = new Map<string, string>();
  if (peopleIds.length > 0) {
    const { data: peoples, error: peoplesError } = await supabase
      .from("afrik_peoples")
      .select("id, name_main")
      .in("id", peopleIds);
    if (peoplesError) throw peoplesError;
    for (const people of peoples ?? []) {
      peopleNames.set(people.id as string, people.name_main as string);
    }
  }

  return {
    id: place.id as string,
    placeType: place.place_type as string,
    nameMain: place.name_main as string,
    summary: place.summary as string,
    country: countries.length === 1 ? countries[0] : null,
    countries,
    associatedPeoples: (links.data ?? []).map((link) => ({
      id: link.people_id as string,
      name: peopleNames.get(link.people_id as string) ?? null,
      relation: (link.relation as string) ?? null,
    })),
    content: (place.content as Record<string, unknown>) ?? {},
    nameHistory: (place.name_history as NameHistory | null) ?? null,
  };
}
