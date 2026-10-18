/**
 * A fiche's « Suivre l'histoire du nom … » names a name only when the page it
 * opens answers that fiche (brief 10 §1: otherwise « the link would promise
 * what it cannot keep »). The review of PR #1828 found the link on PPL_FULA
 * opening a page that says « Nous avons trouvé des fiches liées sans établir
 * qu'elles répondent à ce nom », with no timeline.
 *
 * The page is judged here the way it judges itself: the fiche's search row,
 * projected as the search API projects it (`searchService.projectRows`, then
 * `mapSearchEnvelope`), goes through `selectNameSubject` with the `q` the
 * link's href carries.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ficheNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  nameStoryHref,
  storyLinkName,
  type StorySubject,
} from "@/lib/search/nameClosing";
import { readNaming } from "@/lib/search/naming";
import { selectNameSubject } from "@/lib/search/nameSubject";
import { mapSearchEnvelope } from "@/lib/search/searchEnvelope";
import type { SearchResult } from "@/types/afrik-frontend";

const AFRIK = join(process.cwd(), "dataset/source/afrik");

type Kind = "people" | "languageFamily" | "language" | "country";

interface CorpusFiche {
  id: string;
  history: ReturnType<typeof ficheNameHistory>;
  /** The fiche as its view hands it to `storyLinkName`. */
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

/**
 * The row the loader writes and the search RPC returns: the filed name under
 * its column's key, and the `content` column (a language's holds its
 * `alternateNames`; its `spellingAliases` is a column the RPC leaves out).
 */
function searchRowOf(kind: Kind, raw: RawFiche): Record<string, unknown> {
  switch (kind) {
    case "people":
      return { id: raw.id, nameMain: raw.nameMain, content: raw.content };
    case "language":
      return {
        id: raw.isoCode639_3,
        name: raw.nameFr,
        content: { alternateNames: raw.alternateNames },
      };
    default:
      return { id: raw.id, nameFr: raw.nameFr, content: raw.content };
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
  return jsonFiles(join(AFRIK, DIRECTORIES[kind]))
    .map((file) => JSON.parse(readFileSync(file, "utf8")) as RawFiche)
    .filter((raw) => typeof raw.id === "string")
    .map((raw) => toFiche(kind, raw));
}

function fiche(kind: Kind, id: string): CorpusFiche {
  const found = corpus(kind).find((entry) => entry.id === id);
  if (!found) throw new Error(`No ${kind} fiche ${id} in the corpus`);
  return found;
}

/** Whether the page the href opens counts this fiche among its subjects. */
function pageAnswers(entry: CorpusFiche, href: string): boolean {
  const q = new URL(href, "https://ethniafrica.test").searchParams.get("q");
  return selectNameSubject([entry.searchResult], q ?? "", "fr").some(
    (subject) => subject.id === entry.id
  );
}

describe("storyLinkName — the name a fiche's story link may promise", () => {
  // @req REQ-198
  it.each([
    ["people", "PPL_FULA", "Fulɓe"],
    ["people", "PPL_KONKOMBA", "Bikpakpaam"],
    ["languageFamily", "FLG_BERBERE", "Berbère"],
    ["language", "dyu", "Julakan"],
  ] as const)(
    "names nothing on %s %s, whose result page for « %s » does not answer it",
    (kind, id, leading) => {
      const entry = fiche(kind, id);

      expect(entry.history?.names[0].nameText).toBe(leading);
      expect(pageAnswers(entry, nameStoryHref("fr", leading))).toBe(false);
      expect(storyLinkName(entry.subject, entry.history, "fr")).toBeUndefined();
    }
  );

  // @req REQ-198
  it.each([
    ["people", "PPL_ZARMA", "Zarma"],
    ["languageFamily", "FLG_MANDE", "Mandé"],
    ["language", "hav", "Kihavu"],
    ["country", "CIV", "Côte d'Ivoire"],
  ] as const)(
    "names the leading name on %s %s, and the page behind « %s » answers it",
    (kind, id, leading) => {
      const entry = fiche(kind, id);
      const name = storyLinkName(entry.subject, entry.history, "fr");

      expect(name).toBe(leading);
      expect(pageAnswers(entry, nameStoryHref("fr", name))).toBe(true);
    }
  );

  // @req REQ-198
  it.each(["people", "languageFamily", "language", "country"] as const)(
    "draws a %s link exactly where the page behind it answers the fiche, across the corpus",
    (kind) => {
      const withHistory = corpus(kind).filter(
        (entry) => entry.history?.names[0]
      );
      const drawn = withHistory.filter((entry) =>
        storyLinkName(entry.subject, entry.history, "fr")
      );

      expect(drawn.length).toBeGreaterThan(0);
      for (const entry of withHistory) {
        const leading = entry.history.names[0].nameText;
        expect({
          id: entry.id,
          drawn: drawn.includes(entry),
        }).toEqual({
          id: entry.id,
          drawn: pageAnswers(entry, nameStoryHref("fr", leading)),
        });
      }
    }
  );

  // @req REQ-198
  it("names nothing on a fiche without a name history", () => {
    const { subject } = fiche("country", "CIV");

    expect(storyLinkName(subject, null, "fr")).toBeUndefined();
    expect(
      storyLinkName(subject, { summary: "", names: [] }, "fr")
    ).toBeUndefined();
  });
});
