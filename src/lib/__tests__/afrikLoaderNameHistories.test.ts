import { afterEach, describe, expect, it, vi } from "vitest";

import { loadNextSteps, loadSubjectNameHistories } from "@/lib/afrikLoader";
import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";
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

/** A one-name history, valid for the parser, told by `summary`. */
const historyOf = (summary: string, nameText: string) => ({
  ...LINGALA_HISTORY,
  summary,
  names: [{ ...LINGALA_HISTORY.names[0], nameText }],
});

describe("loadNextSteps — « Poursuivre avec un autre nom »", () => {
  afterEach(() => vi.unstubAllGlobals());

  const fula: SearchResult = {
    type: "people",
    id: "PPL_FULA",
    name: "Fula (Fulbe / Peul)",
    languageFamilyId: "FLG_ATLANTIQUE" as SearchResult["languageFamilyId"],
    languageFamilyName: "Atlantique",
  };
  /** The Peul fiche files its French form as coming from `origin`. */
  const peulFrom = (origin: string) => [
    {
      subject: fula,
      nameHistory: {
        ...PEUL_HISTORY,
        names: PEUL_HISTORY.names.map((name) =>
          name.nameText === "Peul"
            ? { ...name, languageOfOrigin: origin }
            : name
        ),
      },
    },
  ];
  const wolofLanguage = (
    speakingPeoples: Array<{ id: string; name: string }>
  ) =>
    ok({
      id: "wol",
      name: "Wolof",
      speakingPeoples,
      nameHistory: historyOf(
        "Le nom wolof désigne une langue du Sénégal. D'autres noms existent.",
        "Wolof"
      ),
    });
  const fiches = (served: Record<string, () => Response>) =>
    vi.fn(async (url: string) =>
      served[url] ? served[url]() : new Response("{}", { status: 404 })
    );
  const atlantique = () =>
    ok({
      nameHistory: historyOf(
        "Le nom atlantique désigne un ensemble de langues. C'est un nom de savants.",
        "Atlantique"
      ),
    });

  // Brief 1, board search-peul-430: « Peuple · Wolof », then the family.
  // @req REQ-198
  it("offers the people whose language gave the searched name, then the family", async () => {
    vi.stubGlobal(
      "fetch",
      fiches({
        "/api/v2/languages/wol": () =>
          wolofLanguage([
            { id: "PPL_LEBOU", name: "Lébou" },
            { id: "PPL_WOLOF", name: "Wolof" },
          ]),
        "/api/v2/peoples/PPL_WOLOF": () =>
          ok({
            nameHistory: historyOf(
              "Le nom Wolof est celui que ce peuple se donne. Son histoire est présentée plus bas.",
              "Wolof"
            ),
          }),
        "/api/v2/language-families/FLG_ATLANTIQUE": atlantique,
      })
    );

    await expect(
      loadNextSteps([fula], "fr", undefined, peulFrom("wol"), "peul")
    ).resolves.toEqual([
      {
        relation: "namer",
        kind: "Peuple",
        name: "Wolof",
        reason: "Le nom Wolof est celui que ce peuple se donne.",
      },
      {
        relation: "family",
        kind: "Famille de langues",
        name: "Atlantique",
        reason: "Le nom atlantique désigne un ensemble de langues.",
      },
    ]);
  });

  // @req REQ-198
  it("offers the language itself when no people bears its name", async () => {
    vi.stubGlobal(
      "fetch",
      fiches({
        "/api/v2/languages/wol": () =>
          wolofLanguage([{ id: "PPL_LEBOU", name: "Lébou" }]),
        "/api/v2/language-families/FLG_ATLANTIQUE": atlantique,
      })
    );

    const [namer] = await loadNextSteps(
      [fula],
      "fr",
      undefined,
      peulFrom("wol"),
      "peul"
    );

    expect(namer).toEqual({
      relation: "namer",
      kind: "Langue",
      name: "Wolof",
      reason: "Le nom wolof désigne une langue du Sénégal.",
    });
  });

  // French has no fiche: a namer that cannot give its reason is left out.
  // @req REQ-198
  it("leaves out a namer whose language has no fiche", async () => {
    vi.stubGlobal(
      "fetch",
      fiches({ "/api/v2/language-families/FLG_ATLANTIQUE": atlantique })
    );

    const cards = await loadNextSteps(
      [fula],
      "fr",
      undefined,
      peulFrom("fra"),
      "peul"
    );

    expect(cards.map((card) => card.name)).toEqual(["Atlantique"]);
  });

  // @req REQ-198
  it("names a card by a form its history tells, never by its filed label", async () => {
    const zarma: SearchResult = {
      type: "people",
      id: "PPL_ZARMA",
      name: "Zarma",
      languageFamilyId: "FLG_SONGHAY" as SearchResult["languageFamilyId"],
      languageFamilyName: "Songhay / Sonrai",
    };
    vi.stubGlobal(
      "fetch",
      fiches({
        "/api/v2/language-families/FLG_SONGHAY": () =>
          ok({
            nameHistory: historyOf(
              "Le nom songhay désigne un ensemble de langues du fleuve Niger.",
              "Songhay"
            ),
          }),
      })
    );

    const [card] = await loadNextSteps([zarma], "fr");

    expect(card.name).toBe("Songhay");
  });

  // Brief 1 decision 3, boards search-unknown-*: Siwi and Tchad, each with a
  // reason taken from its own fiche rather than a shared template.
  // @req REQ-198
  it("offers Siwi then Tchad to a name the project does not know", async () => {
    vi.stubGlobal(
      "fetch",
      fiches({
        "/api/v2/peoples/PPL_SIWI": () =>
          ok({
            nameHistory: historyOf(
              "Le nom Siwi désigne un peuple berbère de l'oasis de Siwa. Ce peuple se nomme lui-même Isiwan.",
              "Isiwan"
            ),
          }),
        "/api/v2/countries/TCD": () =>
          ok({
            nameHistory: historyOf(
              "Le nom Tchad désigne un pays d'Afrique centrale, qui porte le nom d'un grand lac. Les Kanouri appellent ce lac Tsade.",
              "Tchad"
            ),
          }),
      })
    );

    const cards = await loadNextSteps([], "fr");

    expect(cards).toEqual([
      {
        relation: "seed",
        kind: "Peuple",
        name: "Siwi",
        reason: "Le nom Siwi désigne un peuple berbère de l'oasis de Siwa.",
      },
      {
        relation: "seed",
        kind: "Pays",
        name: "Tchad",
        reason:
          "Le nom Tchad désigne un pays d'Afrique centrale, qui porte le nom d'un grand lac.",
      },
    ]);
    expect(JSON.stringify(cards)).not.toContain("dont nous retraçons le nom");
  });
});
