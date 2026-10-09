import {
  getPlaceById,
  listPlaces,
  type PlaceListItem,
  type PlaceRecord,
} from "@/api/v2/services/places";
import { pageNumberedListEnvelope } from "@/api/v2/handlers/listEnvelope";
import { createApiResponse, type ApiEnvelope } from "@/api/v2/utils/response";

export interface PublicPlace extends Omit<PlaceRecord, "content"> {
  /** Every name the place answers to: the filed name, then its nameHistory's. */
  names: string[];
  gaps: unknown[];
  sources: unknown[];
}

export type PlaceHandlerResult =
  | { ok: true; envelope: ApiEnvelope<PublicPlace> }
  | { ok: false; code: "NOT_FOUND"; message: string };

function namesOf(place: PlaceRecord): string[] {
  const recorded = (place.nameHistory?.names ?? []).map(
    (name) => name.nameText
  );
  return [...new Set([place.nameMain, ...recorded])];
}

// @req REQ-196
export async function getPlaceHandler(id: string): Promise<PlaceHandlerResult> {
  const place = await getPlaceById(id);
  if (!place) {
    return { ok: false, code: "NOT_FOUND", message: `Place not found: ${id}` };
  }

  const { content, ...rest } = place;
  return {
    ok: true,
    envelope: createApiResponse<PublicPlace>({
      id: rest.id,
      placeType: rest.placeType,
      nameMain: rest.nameMain,
      names: namesOf(place),
      summary: rest.summary,
      country: rest.country,
      associatedPeoples: rest.associatedPeoples,
      gaps: Array.isArray(content.gaps) ? content.gaps : [],
      sources: Array.isArray(content.sources) ? content.sources : [],
      nameHistory: rest.nameHistory,
    }),
  };
}

// @req REQ-196
export async function listPlacesHandler(
  page?: number,
  perPage?: number
): Promise<ApiEnvelope<PlaceListItem[]>> {
  const { data, total } = await listPlaces(page, perPage);
  return pageNumberedListEnvelope(data, { total, page, perPage });
}
