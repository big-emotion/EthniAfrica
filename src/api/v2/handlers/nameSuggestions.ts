import {
  suggestNamesByPrefix,
  type NameSuggestion,
} from "../services/nameSuggestions";
import { createApiResponse, type ApiEnvelope } from "../utils/response";

export interface NameSuggestionsData {
  query: string;
  suggestions: NameSuggestion[];
}

// @req REQ-200
export async function nameSuggestionsHandler(
  query: string,
  limit = 8
): Promise<ApiEnvelope<NameSuggestionsData>> {
  return createApiResponse({
    query,
    suggestions: await suggestNamesByPrefix(query, limit),
  });
}
