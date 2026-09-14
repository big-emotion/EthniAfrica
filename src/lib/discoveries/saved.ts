// @req REQ-159
export const DISCOVERIES_SAVED_KEY = "ethniafrica.discoveries.saved.v1";

type LocalStore = Pick<Storage, "getItem" | "setItem">;

export interface SavedRead {
  ids: string[];
  available: boolean;
}

// @req REQ-159
export function loadSaved(
  allowed: ReadonlySet<string>,
  storage: LocalStore | null
): SavedRead {
  if (!storage) return { ids: [], available: false };
  try {
    const raw = storage.getItem(DISCOVERIES_SAVED_KEY);
    if (!raw) return { ids: [], available: true };
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("version" in parsed) ||
      parsed.version !== 1 ||
      !("ids" in parsed) ||
      !Array.isArray(parsed.ids)
    ) {
      return { ids: [], available: true };
    }
    return {
      ids: [
        ...new Set(
          parsed.ids.filter(
            (id): id is string => typeof id === "string" && allowed.has(id)
          )
        ),
      ],
      available: true,
    };
  } catch {
    return { ids: [], available: false };
  }
}

// @req REQ-159
export function persistSaved(
  ids: readonly string[],
  allowed: ReadonlySet<string>,
  storage: LocalStore | null
): boolean {
  if (!storage) return false;
  try {
    const clean = [...new Set(ids.filter((id) => allowed.has(id)))];
    storage.setItem(
      DISCOVERIES_SAVED_KEY,
      JSON.stringify({ version: 1, ids: clean })
    );
    return true;
  } catch {
    return false;
  }
}
