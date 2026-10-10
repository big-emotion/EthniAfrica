import {
  getWordById,
  listWords,
  type WordListItem,
  type WordRecord,
} from "@/api/v2/services/words";
import { pageNumberedListEnvelope } from "@/api/v2/handlers/listEnvelope";
import { createApiResponse, type ApiEnvelope } from "@/api/v2/utils/response";

export interface PublicWord extends WordRecord {
  /** Every name the word answers to: the filed name, then its nameHistory's. */
  names: string[];
}

export type WordHandlerResult =
  | { ok: true; envelope: ApiEnvelope<PublicWord> }
  | { ok: false; code: "NOT_FOUND"; message: string };

// @req REQ-196
export async function getWordHandler(id: string): Promise<WordHandlerResult> {
  const word = await getWordById(id);
  if (!word) {
    return { ok: false, code: "NOT_FOUND", message: `Word not found: ${id}` };
  }

  const recorded = (word.nameHistory?.names ?? []).map((name) => name.nameText);
  return {
    ok: true,
    envelope: createApiResponse<PublicWord>({
      ...word,
      names: [...new Set([word.nameMain, ...recorded])],
    }),
  };
}

// @req REQ-196
export async function listWordsHandler(
  page?: number,
  perPage?: number
): Promise<ApiEnvelope<WordListItem[]>> {
  const { data, total } = await listWords(page, perPage);
  return pageNumberedListEnvelope(data, { total, page, perPage });
}
