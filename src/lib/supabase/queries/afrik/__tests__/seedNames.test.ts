import { beforeEach, describe, expect, it, vi } from "vitest";
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from }),
}));
import { getSeedNameCandidates } from "../seedNames";

describe("home example names", () => {
  beforeEach(() => vi.clearAllMocks());
  // @req REQ-002
  it("projects self-given people names and locale-specific countries and languages", async () => {
    const selects: string[] = [];
    from.mockImplementation((table) => ({
      select: (columns: string) => {
        selects.push(columns);
        return {
          order: () => ({
            range: async (start: number) => ({
              data: start
                ? []
                : table === "afrik_peoples"
                  ? [{ name: "Iteso" }, { name_main: "Exonym only" }]
                  : [{ name: "Example" }],
            }),
          }),
        };
      },
    }));
    const result = await getSeedNameCandidates("en");
    expect(result.people).toEqual(["Iteso"]);
    expect(selects).toContain("name:content->appellations->>selfAppellation");
    expect(selects).toContain("name:name_en");
    expect(selects).toContain("name:content->>nameEn");
    expect(Object.keys(result)).toEqual([
      "patronyme",
      "language",
      "people",
      "country",
    ]);
  });
  // @req REQ-002
  it("isolates a failed table so the other kinds remain available", async () => {
    from.mockImplementation((table) => ({
      select: () => ({
        order: () => ({
          range: async (start: number) =>
            table === "afrik_peoples"
              ? { error: new Error("offline") }
              : { data: start ? [] : [{ name: "Available" }] },
        }),
      }),
    }));
    const result = await getSeedNameCandidates("fr");
    expect(result.people).toEqual([]);
    expect(result.country).toEqual(["Available"]);
  });
});
