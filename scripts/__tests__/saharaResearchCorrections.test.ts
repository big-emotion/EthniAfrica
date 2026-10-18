import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The Sahara social piece (2026-10-11) re-read the sources behind five fiches
// and found page misreadings, a reversed quotation order, a truncated quotation
// and humid-period dates off by millennia. The operator approved the
// corrections on 13 October 2026; these assertions keep them from regressing.

interface Source {
  title: string;
  author?: string;
  page?: string;
  notes?: string;
}

interface Account {
  statement: string;
  sources: Source[];
}

const readFiche = (path: string) =>
  JSON.parse(
    readFileSync(resolve(process.cwd(), "dataset/source/afrik", path), "utf8")
  );

const sahara = readFiche("lieux/LOC_SAHARA.json");
const saharaAccounts: Account[] = sahara.nameHistory.names[0].accounts;
const libyeAccounts: Account[] = sahara.nameHistory.names[1].accounts;
const saharaSources: Source[] = sahara.sources;

const sourceTitled = (fragment: string) =>
  saharaSources.find((source) => source.title.includes(fragment));
const accountMentioning = (accounts: Account[], fragment: string) =>
  accounts.find((account) => account.statement.includes(fragment));

describe("the Sahara place fiche after the source re-reading", () => {
  // @req REQ-196
  it("cites Foucauld's ténéré and tănezrouft articles on their real pages", () => {
    const foucauld = sourceTitled("Dictionnaire abrégé touareg-français");

    expect(foucauld.page).toBe("p. 275 et p. 303");
    expect(foucauld.notes).toBe(
      "Articles ténéré, p. 275, et tănezrouft, p. 303."
    );
  });

  // @req REQ-196
  it("cites Masqueray's article Désert on its single page", () => {
    const masquerayPages = saharaSources
      .filter((source) => source.author?.includes("Masqueray"))
      .map((source) => source.page);

    expect(masquerayPages).toEqual(["p. 85"]);
  });

  // @req REQ-196
  it("puts Purchas's Zahara before his Sarra, and only Sarra after Leo", () => {
    const purchas = accountMentioning(saharaAccounts, "Samuel Purchas");

    expect(purchas.statement).toBe(
      "Le nom Sahara entre dans la langue anglaise en 1613, selon l'Oxford English Dictionary, chez Samuel Purchas. Celui-ci écrit « Zahara » dans un passage sur les écoles de droit musulman. Plus loin dans le même livre, il reprend Léon l'Africain et écrit « Sarra »."
    );
    const purchasCitations = [
      purchas.sources.find((source) => source.title.includes("Purchas")),
      sourceTitled("Purchas"),
    ];
    for (const citation of purchasCitations) {
      expect(citation.page).toBe("livre III, p. 228 ; livre VI, p. 535");
      expect(citation.notes).toBe(
        "« Zahara » au livre III, sur l'Asie ; « Sarra » au livre VI, sur l'Afrique."
      );
    }
  });

  // @req REQ-196
  it("translates Herodotus's ὀφρύη ψάμμης as a ridge of sand, not dunes", () => {
    const herodotus = accountMentioning(libyeAccounts, "Hérodote");

    expect(herodotus.statement).toContain("au-delà d'une crête de sable");
    expect(herodotus.statement).not.toContain("dunes");
  });

  // @req REQ-196
  it("quotes al-Idrīsī whole and names the Arabic word now read", () => {
    const idrisi = accountMentioning(saharaAccounts, "al-Idrīsī");

    expect(idrisi.statement).toContain(
      "« le grand désert (Sahara) qui sépare le Soudan du pays des Berbers »"
    );
    expect(idrisi.statement).toContain("al-ṣaḥrāʾ al-muttaṣila");
    expect(idrisi.sources[0].page).toBe(
      "traduction, p. 9 ; texte arabe, p. 7-8"
    );
    expect(sourceTitled("Description de l'Afrique et de l'Espagne").page).toBe(
      "traduction, p. 9 ; texte arabe, p. 7-8"
    );
    for (const notes of [
      idrisi.sources[0].notes,
      sourceTitled("Description de l'Afrique et de l'Espagne").notes,
    ]) {
      expect(notes).not.toContain("n'a pas été vérifié");
    }
    const idrisiGap = sahara.gaps.find((gap: { reason: string }) =>
      gap.reason.includes("al-Idrīsī")
    );
    expect(idrisiGap.reason).toContain(
      "Nous avons vérifié le mot arabe d'al-Idrīsī dans le texte original"
    );
  });

  // @req REQ-196
  it("cites Pory's Leo on p. 124 and says where Sarra was checked", () => {
    const leoCitations = [
      accountMentioning(saharaAccounts, "Sarra").sources[0],
      accountMentioning(libyeAccounts, "Léon l'Africain").sources[0],
      sourceTitled("The History and Description of Africa"),
    ];

    for (const citation of leoCitations) {
      expect(citation.page).toBe("livre I, p. 124");
      expect(citation.notes).toContain(
        "La graphie « Sarra » a été vérifiée dans l'édition italienne de 1583"
      );
    }
  });

  // @req REQ-196
  it("has Leo give Libye as the Latin name, not the European one", () => {
    const libye = accountMentioning(libyeAccounts, "Léon l'Africain");

    expect(libye.statement).toContain("qui le donne comme le nom latin");
    expect(libye.statement).not.toContain("nom européen");
  });
});

describe("the humid period and the 4.2 ka event in the family and people fiches", () => {
  const nilo = readFiche("famille_linguistique/FLG_NILOSAHARIENNE.json").content
    .historyAndOrigins;

  // @req REQ-196
  it("ends the African Humid Period about 3500-3000 BCE in FLG_NILOSAHARIENNE", () => {
    expect(nilo.emergencePeriod).toContain(
      "qui commence entre 13 000 et 9000 av. J.-C. environ et prend fin vers 3500-3000 av. J.-C."
    );
    expect(nilo.emergencePeriod).not.toContain("~8000-5500 av. J.-C.");
    expect(nilo.majorEvents).toContain(
      "**~13000-3000 av. J.-C. (dates selon les études) :**"
    );
    expect(nilo.majorEvents).not.toContain("~11000-5500");
  });

  // @req REQ-196
  it("dates the 4.2 ka event about 2200 BCE, after the Eastern Sudanic split", () => {
    expect(nilo.majorEvents).toContain(
      "**Vers 2200 av. J.-C. :** Événement dit « de 4,2 ka »"
    );
    expect(nilo.majorEvents).not.toContain("~4200-4000 av. J.-C.");
    expect(nilo.majorEvents.indexOf("Vers 5000-4000 av. J.-C.")).toBeLessThan(
      nilo.majorEvents.indexOf("Vers 2200 av. J.-C.")
    );
  });

  // @req REQ-196
  it("ends the humid period about 3000 BCE in FLG_SAHARIEN", () => {
    const emergence = readFiche("famille_linguistique/FLG_SAHARIEN.json")
      .content.historyAndOrigins.emergencePeriod;

    expect(emergence).toContain(
      "surtout au début et au milieu de l'Holocène, entre 13 000 et 3000 av. J.-C. environ selon les études"
    );
    expect(emergence).not.toContain("environ 10 000-5 000 av. J.-C.");
  });

  // @req REQ-196
  it("no longer places the whole Berber expansion inside the humid phase", () => {
    const diffusion = readFiche("famille_linguistique/FLG_BERBERE.json").content
      .historyAndOrigins.diffusion;

    expect(diffusion).not.toContain(
      "pendant la phase humide du Sahara néolithique, une expansion"
    );
    expect(diffusion).toContain(
      "qui prend fin vers 3500-3000 av. J.-C. selon les études du climat, et plus tard vers le sud"
    );
  });

  // @req REQ-196
  it("drops the unsourced humid western Sahara of the 7th century BCE from PPL_FULA", () => {
    const ancientOrigins = readFiche("peuples/FLG_ATLANTIQUE/PPL_FULA.json")
      .content.origins.ancientOrigins;

    // The accents were restored on 2026-10-18 (unaccented French prose).
    expect(ancientOrigins).not.toMatch(
      /plus humide vers le VIIe si[eè]cle av\. J\.-C\./
    );
    expect(ancientOrigins).toContain(
      "Leurs ancêtres auraient migré du Sahara occidental vers la vallée du Sénégal"
    );
  });
});
