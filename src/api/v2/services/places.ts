/**
 * Place service (REQ-196, migration 100) — the only layer that reads
 * afrik_places. A detail costs four queries, none per row: the place, its
 * people links, those peoples' names, and its country's name.
 */

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { logger } from "@/lib/api/logger";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/api/v2/schemas/pagination";

export interface PlaceListItem {
  id: string;
  placeType: string;
  nameMain: string;
  countryId: string;
}

export interface PlaceRecord {
  id: string;
  placeType: string;
  nameMain: string;
  summary: string;
  country: { id: string; name: string | null };
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

  return {
    total: count ?? 0,
    data: (data ?? []).map((row) => ({
      id: row.id as string,
      placeType: row.place_type as string,
      nameMain: row.name_main as string,
      countryId: row.country_id as string,
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

  const [links, country] = await Promise.all([
    supabase
      .from("afrik_place_peoples")
      .select("people_id, relation")
      .eq("place_id", id),
    supabase
      .from("afrik_countries")
      .select("id, name_fr")
      .eq("id", place.country_id)
      .maybeSingle(),
  ]);
  if (links.error) throw links.error;
  if (country.error) throw country.error;

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
    country: {
      id: place.country_id as string,
      name: (country.data?.name_fr as string) ?? null,
    },
    associatedPeoples: (links.data ?? []).map((link) => ({
      id: link.people_id as string,
      name: peopleNames.get(link.people_id as string) ?? null,
      relation: (link.relation as string) ?? null,
    })),
    content: (place.content as Record<string, unknown>) ?? {},
    nameHistory: (place.name_history as NameHistory | null) ?? null,
  };
}
