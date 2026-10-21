import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPeoples,
  getPeopleById,
  getPeoplesByLanguageFamily,
  getPeopleNameIndex,
} from "../peopleService";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/supabase/queries/afrik/peoples", () => ({
  getPaginatedAfrikPeoples: vi.fn(),
  getAfrikPeopleById: vi.fn(),
  getAfrikPeoplesByLanguageFamily: vi.fn(),
}));

import {
  getPaginatedAfrikPeoples,
  getAfrikPeopleById,
  getAfrikPeoplesByLanguageFamily,
} from "@/lib/supabase/queries/afrik/peoples";

describe("People Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPeoples", () => {
    // @req REQ-033
    it("should delegate pagination and filters to the database query", async () => {
      const mockPeoples = [
        {
          id: "PPL_SHONA",
          nameMain: "Shona",
          languageFamilyId: "FLG_BANTU",
          currentCountries: ["ZWE"],
          content: {},
        },
      ];
      vi.mocked(getPaginatedAfrikPeoples).mockResolvedValue({
        data: mockPeoples,
        total: 924,
      });

      const filters = {
        search: "shona",
        initialLetter: "S",
        languageFamilyId: "FLG_BANTU",
      };
      const result = await getPeoples(3, 25, filters);

      expect(getPaginatedAfrikPeoples).toHaveBeenCalledTimes(1);
      expect(getPaginatedAfrikPeoples).toHaveBeenCalledWith(3, 25, filters);
      expect(result).toEqual({ data: mockPeoples, total: 924 });
    });
  });

  describe("getPeopleById", () => {
    // @req REQ-019
    it("should return a people by PPL_ ID", async () => {
      const mockPeople = {
        id: "PPL_SHONA",
        nameMain: "Shona",
        languageFamilyId: "FLG_BANTU",
        currentCountries: ["ZWE"],
        content: {},
      };

      vi.mocked(getAfrikPeopleById).mockResolvedValue(mockPeople);

      const people = await getPeopleById("PPL_SHONA");

      expect(people).toBeDefined();
      expect(people?.id).toBe("PPL_SHONA");
      expect(people?.nameMain).toBe("Shona");
    });

    // @req REQ-019
    it("should return null for non-existent people", async () => {
      vi.mocked(getAfrikPeopleById).mockResolvedValue(null);

      const people = await getPeopleById("PPL_NONEXISTENT");

      expect(people).toBeNull();
    });
  });

  describe("getPeoplesByLanguageFamily", () => {
    // @req REQ-019
    it("should return peoples by language family", async () => {
      const mockPeoples = [
        {
          id: "PPL_SHONA",
          nameMain: "Shona",
          languageFamilyId: "FLG_BANTU",
          currentCountries: ["ZWE"],
          content: {},
        },
      ];

      vi.mocked(getAfrikPeoplesByLanguageFamily).mockResolvedValue(mockPeoples);

      const peoples = await getPeoplesByLanguageFamily("FLG_BANTU");

      expect(Array.isArray(peoples)).toBe(true);
      expect(peoples.length).toBe(1);
      expect(peoples[0].languageFamilyId).toBe("FLG_BANTU");
    });
  });

  describe("getPeopleNameIndex", () => {
    /**
     * A PostgREST builder stub that honours `range()` the way the server does,
     * including its silent cap on rows per answer.
     */
    function indexTable(
      response: {
        data?: Array<Record<string, unknown>> | null;
        error?: { message: string } | null;
      },
      serverCap = 1000
    ) {
      const rows = response.data ?? [];
      const range = vi.fn((start: number, end: number) =>
        Promise.resolve({
          data: response.error
            ? null
            : rows.slice(start, Math.min(end + 1, start + serverCap)),
          error: response.error ?? null,
        })
      );
      const select = vi.fn();
      const order = vi.fn();
      const builder = { select, order, range };
      select.mockReturnValue(builder);
      order.mockReturnValue(builder);
      return builder;
    }

    // @req REQ-150
    it("carries every people's id and name, and nothing else", async () => {
      fromMock.mockReturnValue(
        indexTable({
          data: [
            { id: "PPL_SHONA", name_main: "Shona" },
            { id: "PPL_BAMANA", name_main: "Bamana" },
          ],
        })
      );

      const index = await getPeopleNameIndex();

      expect(index).toEqual([
        { id: "PPL_SHONA", nameMain: "Shona" },
        { id: "PPL_BAMANA", nameMain: "Bamana" },
      ]);
    });

    // @req REQ-150
    it("skips a people whose name_main is missing or blank", async () => {
      fromMock.mockReturnValue(
        indexTable({
          data: [
            { id: "PPL_SHONA", name_main: "Shona" },
            { id: "PPL_NAMELESS", name_main: null },
            { id: "PPL_BLANK", name_main: "   " },
          ],
        })
      );

      const index = await getPeopleNameIndex();

      expect(index.map((entry) => entry.id)).toEqual(["PPL_SHONA"]);
    });

    // @req REQ-150
    it("returns every people when the corpus exceeds the 1000-row server cap", async () => {
      const everyPeople = Array.from({ length: 2300 }, (_, i) => ({
        id: `PPL_${i}`,
        name_main: `Name ${i}`,
      }));
      fromMock.mockReturnValue(indexTable({ data: everyPeople }));

      const index = await getPeopleNameIndex();

      expect(index).toHaveLength(2300);
      expect(index[2299]).toEqual({ id: "PPL_2299", nameMain: "Name 2299" });
    });

    // @req REQ-150
    it("degrades to an empty index when the read fails", async () => {
      fromMock.mockReturnValue(
        indexTable({ data: null, error: { message: "connection reset" } })
      );

      // The fiche renders its chips as plain text without the index, so a
      // failed read costs links rather than the chapter.
      await expect(getPeopleNameIndex()).resolves.toEqual([]);
    });
  });
});
