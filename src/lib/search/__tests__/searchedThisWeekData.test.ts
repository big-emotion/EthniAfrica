import { describe, expect, it, vi } from "vitest";
import { readSearchedThisWeek } from "../searchedThisWeekData";
import { getNameAnswerRoute, getLocalizedRoute } from "@/lib/routing";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

import { readFile } from "node:fs/promises";

const readFileMock = vi.mocked(readFile);

describe("readSearchedThisWeek", () => {
  // @req REQ-200
  it("returns only usable form links from the generated list", async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify({
        generatedAt: "2026-10-18T00:00:00.000Z",
        names: [
          {
            form: "Peul",
            href: getNameAnswerRoute("fr", "Peul"),
            subject: { type: "people", id: "PPL_FULA" },
            summary: "...",
          },
          { form: "  ", href: `${getLocalizedRoute("fr", "search")}/empty` },
          { form: "Yoruba", href: null },
          null,
        ],
      })
    );

    await expect(readSearchedThisWeek()).resolves.toEqual([
      {
        form: "Peul",
        href: getNameAnswerRoute("fr", "Peul"),
        subject: { type: "people", id: "PPL_FULA" },
        summary: "...",
      },
    ]);
  });

  // @req REQ-200
  it("returns an empty list when the generated file is missing", async () => {
    readFileMock.mockRejectedValueOnce(
      Object.assign(new Error("missing"), { code: "ENOENT" })
    );

    await expect(readSearchedThisWeek()).resolves.toEqual([]);
  });

  // @req REQ-200
  it("returns an empty list for invalid JSON or an invalid document", async () => {
    readFileMock
      .mockResolvedValueOnce("not json")
      .mockResolvedValueOnce(JSON.stringify({ names: "not a list" }));

    await expect(readSearchedThisWeek()).resolves.toEqual([]);
    await expect(readSearchedThisWeek()).resolves.toEqual([]);
  });
});
