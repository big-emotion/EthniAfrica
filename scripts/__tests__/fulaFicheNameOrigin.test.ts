import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { readNaming } from "../../src/lib/search/naming";

const TIERS = ["official", "referenced", "unverified"];

interface FulaSource {
  title: string;
  url: string | null;
  tier: string;
  notes?: string;
}

function readFula() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json"
      ),
      "utf8"
    )
  );
}

// What a reader of the result page is handed for the entry: the same
// projection the page reads, not the raw field.
function readerNaming() {
  return readNaming("people", readFula().content);
}

describe("PPL_FULA — where the names come from", () => {
  // @req REQ-178
  it("names every competing reading of Fulbe with its author, so none looks like the only one", () => {
    const origin = readerNaming().origin ?? "";

    for (const reading of [
      ["Hampâté Bâ", "fullude", "poussière"],
      ["Gaden", "Delafosse", "dispersés"],
      ["Delafosse", "Bible"],
      ["Barth", "Crozals", "brun-clair, rouge"],
      ["Niang", "Ba-fur"],
      ["Mathieu", "fullade"],
    ]) {
      for (const token of reading) {
        expect(origin, token).toContain(token);
      }
    }
  });

  // @req REQ-178
  it("says the sense of Fulbe is not settled and crowns no reading", () => {
    const origin = readerNaming().origin ?? "";

    expect(origin).toMatch(/n'a pas de sens établi/);
    expect(origin).toMatch(/Aucune de ces lectures n'est établie/);
    expect(origin).not.toMatch(/vient du verbe|signifie « /);
  });

  // @req REQ-178
  it("does not credit Lam, whose reading reached the atlas only through a search summary", () => {
    const fula = readFula();

    expect(JSON.stringify(fula.content)).not.toMatch(/\bLam\b/);
  });

  // @req REQ-178
  it("keeps « rouge » and the root of the name apart as a finding, not a refutation of Barth", () => {
    const origin = readerNaming().origin ?? "";

    expect(origin).toMatch(/boɗ-/);
    expect(origin).toMatch(/woɗ-/);
    expect(origin).toMatch(/aucun auteur lu n'en tire de réfutation/);
  });

  // @req REQ-178
  it("gives each exonym the language it comes from, and only as far as a source read says", () => {
    const origin = readerNaming().origin ?? "";

    expect(origin).toMatch(/Peul est la forme française[^.]*wolof/);
    expect(origin).toMatch(/Fulani[^.]*haoussa/);
    expect(origin).toMatch(/Fellata[^.]*kanouri[^.]*Arabes|Fellata[^.]*Arabes/);
    expect(origin).toMatch(/Mbororo[^.]*étrangers/);
    expect(origin).toMatch(/Toucouleur[^.]*Takrur/);
  });

  // @req REQ-178
  it("reports a first mention as read, never as first", () => {
    const origin = readerNaming().origin ?? "";

    expect(origin).toMatch(/1847/);
    expect(origin).toMatch(/lue pour la première fois/);
    expect(origin).not.toMatch(/première attestation|premier emploi/i);
  });

  // @req REQ-178
  it("attributes Fula to the Mandinka and the Susu through the sources that say so, and tells nothing of the fiche's own past", () => {
    const origin = readerNaming().origin ?? "";

    expect(origin).toMatch(/Fula[^.]*Mandinka[^.]*Susu[^.]*Arnott/);
    expect(origin).toMatch(/Britannica[^.]*1911[^.]*nom mandingue/);
    expect(origin).not.toMatch(/version antérieure|cette fiche/);
  });

  // @req REQ-178
  it("lists Mbororo among the forms the entry is known by", () => {
    const forms = readerNaming().forms.map((entry) => entry.form);

    expect(forms).toContain("Mbororo");
  });

  // @req REQ-178
  it("gives Haalpulaar'en as a self-designation whose date is unknown", () => {
    const usage = readerNaming().usageToday ?? "";

    expect(usage).toMatch(/Haalpulaar'en/);
    expect(usage).toMatch(/ceux qui parlent le pulaar/);
    expect(usage).toMatch(/depuis quand/);
  });

  // @req REQ-178
  it("says a reading known only through Wikipedia is known only through it", () => {
    const origin = readerNaming().origin ?? "";

    expect(origin).toMatch(/Mathieu[^.]*Wikipédia|Wikipédia[^.]*Mathieu/);
  });
});

describe("PPL_FULA — the sources behind the names", () => {
  // @req REQ-178
  it("cites the works the name claims rest on, each at an explicit tier", () => {
    const sources: FulaSource[] = readFula().content.sources;
    const titles = sources.map((source) => source.title).join("\n");

    for (const work of [
      "Breedveld",
      "Hampâté Bâ",
      "Tauxier",
      "TLFi",
      "Blench",
      "Barth",
      "Wane",
      "Humery",
      "Niang",
    ]) {
      expect(titles, work).toContain(work);
    }
    for (const source of sources) {
      expect(TIERS, source.title).toContain(source.tier);
    }
  });

  // @req REQ-178
  it("marks a work known only at second hand, and the encyclopaedias and blogs as unverified", () => {
    const sources: FulaSource[] = readFula().content.sources;
    const tierOf = (needle: string) =>
      sources.find((source) => source.title.includes(needle))?.tier;

    expect(tierOf("Niang")).toBe("unverified");
    expect(tierOf("Wikipédia")).toBe("unverified");
    expect(tierOf("Britannica 1911")).toBe("unverified");
    expect(tierOf("Breedveld")).toBe("referenced");

    const tauxier = sources.find((source) => source.title.includes("Tauxier"));
    expect(tauxier?.notes).toMatch(/pas été lus directement/);
  });

  // @req REQ-178
  it("cites the Britannica entry on Fula that the Mandinka attribution rests on, as unverified", () => {
    const sources: FulaSource[] = readFula().content.sources;
    const fula = sources.find(
      (source) =>
        source.url ===
        "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Fula"
    );

    expect(fula?.tier).toBe("unverified");
    expect(fula?.notes).toMatch(/nom mandingue|Mandingan/);
  });

  // @req REQ-178
  it("cites each locator once and carries no workshop vocabulary in what readers see", () => {
    const sources: FulaSource[] = readFula().content.sources;
    const urls = sources.map((source) => source.url).filter(Boolean);
    const published = sources
      .flatMap((source) => [source.title, source.notes ?? ""])
      .join("\n");

    expect(new Set(urls).size).toBe(urls.length);
    expect(published).not.toMatch(
      /file d'attente|\bpasse\b|protocole|tier hérité|PPL_|dataset\//i
    );
  });
});
