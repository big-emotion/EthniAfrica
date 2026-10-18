// @req REQ-200
import { beforeEach, describe, expect, it, vi } from "vitest";

const { readSearchedThisWeekMock } = vi.hoisted(() => ({
  readSearchedThisWeekMock: vi.fn(),
}));

vi.mock("@/lib/search/searchedThisWeekData", () => ({
  readSearchedThisWeek: readSearchedThisWeekMock,
}));

import { getAtlasWeeklyNames } from "../atlasWeeklyNames";
import { getLocalizedRoute, getNameAnswerRoute } from "@/lib/routing";

describe("getAtlasWeeklyNames", () => {
  beforeEach(() => readSearchedThisWeekMock.mockReset());

  // @req REQ-200
  it("labels linguistic-family entries from the generated weekly data", async () => {
    readSearchedThisWeekMock.mockResolvedValue([
      {
        form: "Bantou",
        href: `${getLocalizedRoute("fr", "search")}?q=Bantou`,
        subject: { type: "languageFamily", id: "FLG_BANTU" },
        summary: "Le nom bantou désigne une famille de langues.",
      },
    ]);

    await expect(getAtlasWeeklyNames(["Bantou"])).resolves.toEqual([
      {
        kind: "Famille de langues",
        name: "Bantou",
        summary: "Le nom bantou désigne une famille de langues.",
        href: getNameAnswerRoute("fr", "Bantou"),
      },
    ]);
  });

  // @req REQ-200
  it("labels place entries from the generated weekly data", async () => {
    readSearchedThisWeekMock.mockResolvedValue([
      {
        form: "Tombouctou",
        href: getNameAnswerRoute("fr", "Tombouctou"),
        subject: { type: "place", id: "PLC_TOMBOUCTOU" },
        summary: "Le nom Tombouctou désigne une ville du Mali.",
      },
    ]);

    await expect(getAtlasWeeklyNames()).resolves.toEqual([
      {
        kind: "Lieu",
        name: "Tombouctou",
        summary: "Le nom Tombouctou désigne une ville du Mali.",
        href: `${getLocalizedRoute("fr", "search")}?q=Tombouctou`,
      },
    ]);
  });
});
