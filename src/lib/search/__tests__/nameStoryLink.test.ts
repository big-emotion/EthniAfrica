/**
 * A fiche's « Suivre l'histoire du nom … » names a name only when the page it
 * opens answers that fiche (brief 10 §1: otherwise « the link would promise
 * what it cannot keep »). The review of PR #1828 found the link on PPL_FULA
 * opening a page that says « Nous avons trouvé des fiches liées sans établir
 * qu'elles répondent à ce nom », with no timeline.
 *
 * The page is judged here the way it judges itself: the fiche's search row,
 * projected as the search API projects it (`searchService.projectRows`, then
 * `mapSearchEnvelope`), goes through `selectNameSubject` with the name the
 * page reads. For a `?q=` link that is the query. For a name's own address
 * (REQ-200) it is the spelling the address service resolves the segment to,
 * from rows built out of the corpus the way the loader writes them — and a
 * segment it does not resolve is the 404 the layout answers.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeAll, describe, expect, it, vi } from "vitest";

// The service caches its walk for an hour; here, once per file.
vi.mock("next/cache", () => ({
  unstable_cache: <T>(read: () => Promise<T>) => {
    let held: Promise<T> | undefined;
    return () => (held ??= read());
  },
}));

vi.mock("@/lib/supabase/queries/afrik/nameAddressEntries", () => ({
  getAnsweredNameRows: vi.fn(),
}));

import { resolveNameAddress } from "@/api/v2/services/nameAddresses";
import { loadAllPatronymeDossiers } from "@/lib/afrik/loaders/patronymeJsonLoader";
import { loadAllWordFiches } from "@/lib/afrik/loaders/wordJsonLoader";
import { ficheNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { getLocalizedRoute } from "@/lib/routing";
import { nameStoryLink, type StorySubject } from "@/lib/search/nameClosing";
import { readNaming } from "@/lib/search/naming";
import { selectNameSubject } from "@/lib/search/nameSubject";
import { mapSearchEnvelope } from "@/lib/search/searchEnvelope";
import {
  getAnsweredNameRows,
  type AnsweredNameRow,
} from "@/lib/supabase/queries/afrik/nameAddressEntries";
import type { SearchResult } from "@/types/afrik-frontend";

const AFRIK = join(process.cwd(), "dataset/source/afrik");
const SEARCH = getLocalizedRoute("fr", "search");

type Kind = "people" | "languageFamily" | "language" | "country";

interface CorpusFiche {
  id: string;
  history: ReturnType<typeof ficheNameHistory>;
  /** The fiche as its view hands it to `nameStoryLink`. */
  subject: StorySubject;
  /** The fiche as the result page receives it from `/api/v2/search`. */
  searchResult: SearchResult;
}

const DIRECTORIES: Record<Kind, string> = {
  people: "peuples",
  languageFamily: "famille_linguistique",
  language: "langues",
  country: "pays",
};

const ENVELOPE_KEYS: Record<Kind, string> = {
  people: "peoples",
  languageFamily: "families",
  language: "languages",
  country: "countries",
};

/** The fiche field each kind's filed-name column is loaded from. */
const FILED_NAME_FIELDS: Record<Kind, "nameMain" | "nameFr"> = {
  people: "nameMain",
  languageFamily: "nameFr",
  language: "nameFr",
  country: "nameFr",
};

function jsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return jsonFiles(full);
      return entry.name.endsWith(".json") ? [full] : [];
    })
    .sort();
}

type RawFiche = Record<string, unknown> & {
  id: string;
  content?: Record<string, unknown>;
  nameHistory?: unknown;
};

function rawFiches(kind: Kind): RawFiche[] {
  return jsonFiles(join(AFRIK, DIRECTORIES[kind]))
    .map((file) => JSON.parse(readFileSync(file, "utf8")) as RawFiche)
    .filter((raw) => typeof raw.id === "string");
}

/**
 * The row the loader writes and the search RPC returns: the filed name under
 * its column's key, the `content` column (a language's holds its
 * `alternateNames`; its `spellingAliases` is a column the RPC leaves out),
 * and the history's names in history order (migration 109).
 */
function searchRowOf(kind: Kind, raw: RawFiche): Record<string, unknown> {
  const historyNames =
    ficheNameHistory(raw, raw.id)?.names.map((name) => name.nameText) ?? [];
  switch (kind) {
    case "people":
      return {
        id: raw.id,
        nameMain: raw.nameMain,
        content: raw.content,
        historyNames,
      };
    case "language":
      return {
        id: raw.isoCode639_3,
        name: raw.nameFr,
        content: { alternateNames: raw.alternateNames },
        historyNames,
      };
    default:
      return {
        id: raw.id,
        nameFr: raw.nameFr,
        content: raw.content,
        historyNames,
      };
  }
}

/** The fiche as each view describes it: its own props, not a search row. */
function subjectOf(kind: Kind, raw: RawFiche): StorySubject {
  const content = raw.content ?? {};
  switch (kind) {
    case "people":
      return {
        type: "people",
        id: raw.id,
        name: raw.nameMain as string,
        content: { appellations: content.appellations },
      };
    case "language":
      return {
        type: "language",
        id: raw.isoCode639_3 as string,
        name: raw.nameFr as string,
        content: { alternateNames: raw.alternateNames },
      };
    case "country":
      return {
        type: "country",
        id: raw.id,
        name: raw.nameFr as string,
        content: { historicalNames: content.historicalNames },
      };
    default:
      return {
        type: "languageFamily",
        id: raw.id,
        name: raw.nameFr as string,
        content,
      };
  }
}

function toFiche(kind: Kind, raw: RawFiche): CorpusFiche {
  const row = searchRowOf(kind, raw);
  const [searchResult] = mapSearchEnvelope({
    data: {
      [ENVELOPE_KEYS[kind]]: [
        { ...row, naming: readNaming(kind, row.content, row) },
      ],
    },
  });
  return {
    id: String(row.id),
    history: ficheNameHistory(raw, raw.id),
    subject: subjectOf(kind, raw),
    searchResult,
  };
}

function corpus(kind: Kind): CorpusFiche[] {
  return rawFiches(kind).map((raw) => toFiche(kind, raw));
}

function fiche(kind: Kind, id: string): CorpusFiche {
  const found = corpus(kind).find((entry) => entry.id === id);
  if (!found) throw new Error(`No ${kind} fiche ${id} in the corpus`);
  return found;
}

/**
 * Each answered subject's filed name and history, as `getAnsweredNameRows`
 * reads them back from the six tables the loader fills.
 */
function answeredNameRows(): AnsweredNameRow[] {
  const fiches = (Object.keys(DIRECTORIES) as Kind[]).flatMap((kind) =>
    rawFiches(kind).map((raw) => ({
      name: raw[FILED_NAME_FIELDS[kind]] as string,
      nameHistory: raw.nameHistory ?? null,
    }))
  );
  const patronymes = loadAllPatronymeDossiers().dossiers.map((dossier) => ({
    name: dossier.nameMain,
    nameHistory: dossier.nameHistory ?? null,
  }));
  const words = loadAllWordFiches().words.map((word) => ({
    name: word.nameMain,
    nameHistory: word.nameHistory,
  }));
  return [...fiches, ...patronymes, ...words].filter(
    (row) => typeof row.name === "string" && row.name.trim()
  );
}

/** The search page's reading of a name, the href a link without an address carries. */
function readingHref(name: string): string {
  return `${SEARCH}?${new URLSearchParams({ q: name })}`;
}

/**
 * The name the page behind an href reads, or null when that page is a 404:
 * an address segment the address service does not resolve.
 */
async function nameReadBy(href: string): Promise<string | null> {
  const url = new URL(href, "https://ethniafrica.test");
  if (url.pathname === SEARCH) return url.searchParams.get("q") ?? "";
  const segment = url.pathname.slice(`${SEARCH}/`.length);
  const address = await resolveNameAddress(segment);
  return address ? address.spelling : null;
}

/** Whether the page the href opens counts this fiche among its subjects. */
async function pageAnswers(entry: CorpusFiche, href: string): Promise<boolean> {
  const name = await nameReadBy(href);
  if (name === null) return false;
  return selectNameSubject([entry.searchResult], name, "fr").some(
    (subject) => subject.id === entry.id
  );
}

beforeAll(() => {
  vi.mocked(getAnsweredNameRows).mockResolvedValue(answeredNameRows());
});

describe("nameStoryLink — the name a fiche's story link may promise", () => {
  // The search answers every name a history tells (ETNI-2093): these sixteen
  // named nothing while it answered the filed name alone.
  // @req REQ-198
  it.each([
    ["people", "PPL_FULA", "Fulɓe"],
    ["people", "PPL_KONKOMBA", "Bikpakpaam"],
    ["people", "PPL_DIAWAMBE", "Diawambé"],
    ["people", "PPL_BANTOUS_SOMALIENS", "Bantu"],
    ["people", "PPL_TOURA", "Wɛɛmɛɛbo"],
    ["languageFamily", "FLG_AUSTRONESIENNE", "Austronésien"],
    ["languageFamily", "FLG_BERBERE", "Berbère"],
    ["languageFamily", "FLG_CREOLE", "Créole"],
    ["languageFamily", "FLG_KHOISAN", "Khoïsan"],
    ["languageFamily", "FLG_NILOSAHARIENNE", "Nilo-saharien"],
    ["language", "dyu", "Julakan"],
    ["language", "egy", "Égyptien"],
    ["language", "kea", "Kriolu"],
    ["language", "tuq", "Tedaga"],
    ["language", "din", "Thuɔŋjäŋ"],
    ["language", "arb", "Al-ʿarabiyya al-fuṣḥā"],
  ] as const)(
    "names « %s » on %s %s, its history's leading name, and the page behind it answers it",
    async (kind, id, leading) => {
      const entry = fiche(kind, id);
      const link = nameStoryLink(entry.subject, entry.history, "fr");

      expect(link?.name).toBe(leading);
      expect(await pageAnswers(entry, link.href)).toBe(true);
    }
  );

  // The board people-fula draws « Suivre l'histoire du nom Fulɓe »; its
  // history sources the name, so the link leads to the name's own address.
  // @req REQ-198
  // @req REQ-200
  it("leads PPL_FULA to the address of « Fulɓe », filed « Peul »", async () => {
    const entry = fiche("people", "PPL_FULA");

    expect(nameStoryLink(entry.subject, entry.history, "fr")).toEqual({
      name: "Fulɓe",
      href: `${SEARCH}/ful%C9%93e`,
    });
    expect(await resolveNameAddress("ful%C9%93e")).toEqual({
      spelling: "Fulɓe",
      isAddress: true,
    });
  });

  // @req REQ-198
  // @req REQ-200
  it.each([
    ["people", "PPL_ZARMA", "Zarma", `${SEARCH}/zarma`],
    ["languageFamily", "FLG_MANDE", "Mandé", `${SEARCH}/mand%C3%A9`],
    ["language", "lin", "Lingala", `${SEARCH}/lingala`],
    ["country", "CIV", "Côte d'Ivoire", `${SEARCH}/c%C3%B4te%20d'ivoire`],
  ] as const)(
    "leads %s %s to the address of « %s », whose page answers it",
    async (kind, id, leading, href) => {
      const entry = fiche(kind, id);

      expect(nameStoryLink(entry.subject, entry.history, "fr")).toEqual({
        name: leading,
        href,
      });
      expect(await pageAnswers(entry, href)).toBe(true);
    }
  );

  // hav is filed « Havu (kihavu) » and its history opens on « Kihavu ». The
  // address directory holds every name a history sources (ETNI-2093), so
  // Kihavu has its address, filed name or not.
  // @req REQ-198
  // @req REQ-200
  it("leads hav to the address of « Kihavu », which its history sources", async () => {
    const entry = fiche("language", "hav");

    expect(await resolveNameAddress("kihavu")).toEqual({
      spelling: "Kihavu",
      isAddress: true,
    });
    expect(nameStoryLink(entry.subject, entry.history, "fr")).toEqual({
      name: "Kihavu",
      href: `${SEARCH}/kihavu`,
    });
    expect(await pageAnswers(entry, `${SEARCH}/kihavu`)).toBe(true);
  });

  // @req REQ-198
  // @req REQ-200
  it.each(["people", "languageFamily", "language", "country"] as const)(
    "draws a %s link exactly where the page behind it answers the fiche, and never to an address that answers 404, across the corpus",
    async (kind) => {
      const withHistory = corpus(kind).filter(
        (entry) => entry.history?.names[0]
      );
      const verdicts = await Promise.all(
        withHistory.map(async (entry) => {
          const link = nameStoryLink(entry.subject, entry.history, "fr");
          const href =
            link?.href ?? readingHref(entry.history.names[0].nameText);
          return {
            id: entry.id,
            drawn: link !== undefined,
            addressed: link !== undefined && !href.includes("?"),
            answered: await pageAnswers(entry, href),
          };
        })
      );

      expect(verdicts.some((verdict) => verdict.addressed)).toBe(true);
      expect(
        verdicts.filter((verdict) => verdict.drawn !== verdict.answered)
      ).toEqual([]);
    }
  );

  // @req REQ-198
  it("names nothing on a fiche without a name history", () => {
    const { subject } = fiche("country", "CIV");

    expect(nameStoryLink(subject, null, "fr")).toBeUndefined();
    expect(
      nameStoryLink(
        subject,
        { summary: "", originExplained: true, names: [] },
        "fr"
      )
    ).toBeUndefined();
  });
});
