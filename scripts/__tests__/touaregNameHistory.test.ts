import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Research for series 2, episode 1 (2026-10-15): Kel Tamasheq is written in
// 1967 (Bernus), not first in 1986; the three « abandoned » readings of
// « Touareg » belong to different speakers (Duveyrier's informants, Barth's
// own guess, Fischer's t-r-q reading) and stand apart; « Touareg » comes from
// Arabic and was spread by French, it is not a French name; the regional
// self-names follow Chaker 1986, § 6.

interface Account {
  period: { from: number | null; to: number | null; label: string };
  statement: string;
  hypothesisGroup?: string;
  birth?: true;
  sources: Array<{ title: string; author?: string; year?: number | null }>;
}
interface NameEntry {
  nameText: string;
  accounts: Account[];
}

const read = (path: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
const tuareg = read("dataset/source/afrik/peuples/FLG_BERBERE/PPL_TUAREG.json");
const nameOf = (text: string) =>
  (tuareg.nameHistory.names as NameEntry[]).find((n) => n.nameText === text);
const country = (iso: string) =>
  read(`dataset/source/afrik/pays/${iso}.json`).content.majorPeoples.find(
    (p: { peopleId?: string }) => p.peopleId === "PPL_TUAREG"
  );

describe("the name Kel Tamasheq", () => {
  // @req REQ-196
  it("is born in Bernus 1967, keeps Chaker 1986 and the 1990s debate", () => {
    const accounts = nameOf("Kel Tamasheq").accounts;
    const birth = accounts.find((a) => a.birth);
    expect(birth.period.from).toBe(1967);
    expect(birth.sources[0].author).toBe("Edmond Bernus");
    expect(accounts.some((a) => a.period.from === 1986)).toBe(true);
    expect(
      accounts.some((a) => a.statement.includes("Hélène Claudot-Hawad"))
    ).toBe(true);
  });
});

describe("the name Touareg", () => {
  const accounts = () => nameOf("Touareg").accounts;
  const origins = () =>
    accounts().filter((a) => a.hypothesisGroup === "origine du nom Touareg");

  // @req REQ-196
  it("keeps the « abandoned » readings apart, each with its own speaker", () => {
    const statements = origins().map((a) => a.statement);
    expect(
      statements.some((s) =>
        s.includes("Touareg du Nord interrogés par Henri Duveyrier")
      )
    ).toBe(true);
    expect(
      statements.some((s) =>
        s.includes("Heinrich Barth : pour lui, ils étaient chrétiens")
      )
    ).toBe(true);
    expect(statements.some((s) => s.includes("Anja Fischer"))).toBe(true);
    expect(statements.some((s) => s.includes("Pol Trousset"))).toBe(true);
    expect(statements.join(" ")).not.toContain(
      "Heinrich Barth propose la même origine"
    );
  });

  // @req REQ-196
  it("records the European forms, Leo Africanus and today's self-use", () => {
    const all = accounts()
      .map((a) => a.statement)
      .join(" ");
    expect(all).toContain("Terga, chez Léon l'Africain");
    expect(all).toContain("« Tuaricks » en 1802");
    expect(all).toContain("singulier Targui");
    expect(all).toContain("Nous entendons rester profondément touaregs");
    expect(accounts().filter((a) => a.birth)).toHaveLength(1);
  });

  // @req REQ-196
  it("locates the 1990s self-use quotation where Abrous 1993 prints it", () => {
    // Re-read on OpenEdition (2026-10-20): § 22 is about the Niger letters;
    // the association texts are listed in § 9 and the quotation stands
    // between § 24 and § 25.
    const account = nameOf("Touareg").accounts.find((a) =>
      a.statement.includes("Nous entendons rester profondément touaregs")
    );
    const abrous = account.sources.find(
      (s) => s.author === "Dahbia Abrous"
    ) as {
      page?: string;
    };
    expect(abrous.page).toBe("§ 9 et citation entre les § 24 et 25");
  });

  // @req REQ-196
  it("no longer cites al-Bakri through an unsourced page", () => {
    const text = tuareg.content.appellations.originOfExonyms as string;
    expect(text).not.toContain("al-Bakri");
    expect(text).toContain("écrit depuis 1967");
    const titles = tuareg.content.sources
      .map((s: { title: string }) => s.title)
      .join(" ");
    expect(titles).not.toContain("Culture d'Islam");
    expect(titles).not.toContain("Larousse");
  });
});

describe("the Tuareg in the country fiches", () => {
  // @req REQ-196
  it("never calls Touareg a French name, nor says it was never insulting", () => {
    for (const iso of ["DZA", "LBY", "MLI", "NER", "BFA"]) {
      const people = country(iso);
      const text = JSON.stringify(people);
      expect(text, iso).not.toContain("nom français donné de l'extérieur");
      expect(text, iso).not.toContain("pas insultant");
      expect(text, iso).not.toContain("ne signalent pas de sens insultant");
    }
  });

  // @req REQ-196
  it("gives each country the self-name of its own regions", () => {
    expect(country("NER").selfAppellation).toBe("Kel Tamasheq, Imajaghen");
    expect(country("MLI").selfAppellation).toBe(
      "Kel Tamasheq / Imushagh / Imajaghen"
    );
  });
});

describe("the Mozabites", () => {
  // @req REQ-196
  it("are not given the Tuareg form Imuhagh", () => {
    const fiche = read(
      "dataset/source/afrik/peuples/FLG_BERBERE/PPL_MOZABITE.json"
    );
    expect(JSON.stringify(fiche.content.appellations)).not.toContain("Imuhagh");
  });
});
