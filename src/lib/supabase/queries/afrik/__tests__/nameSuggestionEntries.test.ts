// @req REQ-200
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromCalls, rangeCalls } = vi.hoisted(() => ({
  fromCalls: [] as string[],
  rangeCalls: [] as Array<{ table: string; from: number; to: number }>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: (table: string) => {
      fromCalls.push(table);
      return {
        select: (columns: string) => ({
          range: async (from: number, to: number) => {
            rangeCalls.push({ table, from, to });
            if (table === "afrik_places" && from === 0) {
              expect(columns).toBe("id, name:name_main, name_history");
              return {
                data: [
                  {
                    id: "PLC_MACINA",
                    name: "Macina",
                    name_history: {
                      summary: "Lieux du Macina.",
                      names: [{ nameText: "Macina" }],
                    },
                  },
                ],
                error: null,
              };
            }
            return { data: [], error: null };
          },
        }),
      };
    },
  }),
}));

import { getNameSuggestionRows } from "@/lib/supabase/queries/afrik/nameAddressEntries";

describe("getNameSuggestionRows", () => {
  beforeEach(() => {
    fromCalls.length = 0;
    rangeCalls.length = 0;
  });

  // @req REQ-200
  it("reads place IDs, names and name histories as the sixth suggestion kind", async () => {
    const rows = await getNameSuggestionRows();

    expect(rows).toContainEqual({
      id: "PLC_MACINA",
      type: "place",
      name: "Macina",
      nameHistory: {
        summary: "Lieux du Macina.",
        names: [{ nameText: "Macina" }],
      },
    });
    expect(fromCalls).toEqual(
      expect.arrayContaining([
        "afrik_peoples",
        "afrik_countries",
        "afrik_language_families",
        "afrik_languages",
        "afrik_patronymes",
        "afrik_places",
      ])
    );
    expect(fromCalls).not.toContain("afrik_words");
  });
});
