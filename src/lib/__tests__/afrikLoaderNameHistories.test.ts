import { afterEach, describe, expect, it, vi } from "vitest";

import { loadSubjectNameHistories } from "@/lib/afrikLoader";
import { LINGALA_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import type { SearchResult } from "@/types/afrik-frontend";

const subject = (type: SearchResult["type"], id: string) =>
  ({ type, id, name: id }) as SearchResult;

const ok = (data: unknown) =>
  new Response(JSON.stringify({ data }), { status: 200 });

describe("loadSubjectNameHistories", () => {
  afterEach(() => vi.unstubAllGlobals());

  // @req REQ-198
  it("reads each subject's name history from its own /api/v2 fiche", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/languages/lin")
        ? ok({ id: "lin", nameHistory: LINGALA_HISTORY })
        : ok({ id: "PPL_FULA" })
    );
    vi.stubGlobal("fetch", fetchMock);
    const lin = subject("language", "lin");

    const histories = await loadSubjectNameHistories([
      subject("people", "PPL_FULA"),
      lin,
    ]);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v2/peoples/PPL_FULA",
      "/api/v2/languages/lin",
    ]);
    expect(histories).toEqual([{ subject: lin, nameHistory: LINGALA_HISTORY }]);
  });

  // @req REQ-198
  it("asks each kind's own endpoint", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () =>
      ok({})
    );
    vi.stubGlobal("fetch", fetchMock);

    await loadSubjectNameHistories([
      subject("country", "MLI"),
      subject("languageFamily", "FLG_BANTU"),
      subject("patronyme", "PAT_TRAORE"),
      subject("person", "PRS_X"),
    ]);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v2/countries/MLI",
      "/api/v2/language-families/FLG_BANTU",
      "/api/v2/patronymes/PAT_TRAORE",
    ]);
  });

  // A missing timeline leaves the answer as the default; it never fails the
  // search it accompanies.
  // @req REQ-198
  it("drops a subject whose fiche fails or holds an unreadable block", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("MLI")
          ? new Response("{}", { status: 500 })
          : ok({ nameHistory: { summary: "", names: [] } })
      )
    );

    await expect(
      loadSubjectNameHistories([
        subject("country", "MLI"),
        subject("country", "CIV"),
      ])
    ).resolves.toEqual([]);
  });
});
