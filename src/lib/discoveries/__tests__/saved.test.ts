import { describe, expect, it, vi } from "vitest";

import { loadSaved, persistSaved } from "../saved";

const allowed = new Set(["anecdote:burkina-faso", "anecdote:guere-wobe"]);

describe("Découvertes on-device keeping", () => {
  // @req REQ-159
  it("stores stable IDs and reads them back in catalogue order", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    };
    expect(persistSaved(["anecdote:guere-wobe"], allowed, storage)).toBe(true);
    expect(loadSaved(allowed, storage)).toEqual({
      ids: ["anecdote:guere-wobe"],
      available: true,
    });
  });

  // @req REQ-159
  it("discards corrupt, duplicate and withdrawn identifiers", () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          ids: ["withdrawn", "anecdote:burkina-faso", "anecdote:burkina-faso"],
        }),
      setItem: vi.fn(),
    };
    expect(loadSaved(allowed, storage).ids).toEqual(["anecdote:burkina-faso"]);
    expect(
      loadSaved(allowed, { ...storage, getItem: () => "{bad" }).ids
    ).toEqual([]);
  });

  // @req REQ-159
  it("reports unavailable storage without claiming a durable save", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadSaved(allowed, storage)).toEqual({ ids: [], available: false });
    expect(persistSaved(["anecdote:burkina-faso"], allowed, storage)).toBe(
      false
    );
  });
});
