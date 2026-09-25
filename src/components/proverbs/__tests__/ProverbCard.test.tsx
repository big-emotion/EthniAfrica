import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProverbCard } from "@/components/proverbs/ProverbCard";
import type { ProverbPicture } from "@/lib/proverbs/proverbImages";
import type { Proverb } from "@/lib/proverbs/proverbs";
import { getCountryRoute, getFamilyRoute, getPeopleRoute } from "@/lib/routing";

const attested: Proverb = {
  id: "test-attested",
  text: "La main qui donne est au-dessus de celle qui reçoit.",
  original: { text: "Owo ti a fi n fun ni", lang: "yor", language: "yoruba" },
  meaning: "Donner place celui qui donne en position d'honneur.",
  origin: { status: "attested", note: "" },
  entities: [
    { kind: "country", id: "NGA", label: "Nigeria" },
    { kind: "people", id: "PPL_YORUBA", label: "Yoruba" },
    {
      kind: "family",
      id: "FLG_NIGERCONGO",
      label: "Langues nigéro-congolaises",
    },
  ],
  sources: [
    {
      title: "Yoruba Proverbs",
      url: "https://example.org/yoruba-proverbs",
      tier: "referenced",
      notes: "Recueil publié ; donne le texte original.",
    },
  ],
};

const picture: ProverbPicture = {
  src: "/images/proverbs/test.jpg",
  filePage: "https://commons.wikimedia.org/wiki/File:Test.jpg",
  credit: "Auteur Test, CC BY-SA 4.0",
  shortCredit: { fr: "Auteur Test, CC BY-SA", en: "Author Test, CC BY-SA" },
  alt: { fr: "Un marché au crépuscule.", en: "A market at dusk." },
  licence: "cc-by-sa",
  licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
};

const unestablished: Proverb = {
  id: "test-unestablished",
  text: "Seul on va plus vite, ensemble on va plus loin.",
  meaning: "La coopération porte plus loin que l'effort isolé.",
  origin: {
    status: "unestablished",
    note: "Aucune source ne rattache ce proverbe à un peuple.",
  },
  entities: [],
  sources: [
    {
      title: "Quote Investigator",
      url: "https://example.org/qi",
      tier: "referenced",
    },
  ],
};

describe("ProverbCard", () => {
  // @req REQ-113
  it("files itself as a proverb and titles itself with the proverb", () => {
    render(<ProverbCard language="fr" proverb={attested} />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("id", "test-attested");
    expect(within(card).getByText("Proverbe")).toBeInTheDocument();
    expect(
      within(card).getByRole("heading", { name: attested.text })
    ).toBeInTheDocument();
  });

  // Declared in its own language, or a screen reader pronounces Yoruba with
  // French phonetics.
  // @req REQ-113
  it("prints the original text under its own lang attribute", () => {
    render(<ProverbCard language="fr" proverb={attested} />);

    const original = screen.getByText("Owo ti a fi n fun ni");
    expect(original).toHaveAttribute("lang", "yor");
    expect(screen.getByText("En yoruba")).toBeInTheDocument();
  });

  // @req REQ-113
  it("links each chip to its fiche and states what kind of entry it is", () => {
    render(<ProverbCard language="fr" proverb={attested} />);

    const people = screen.getByRole("link", { name: /Peuple\s*Yoruba/ });
    expect(people).toHaveAttribute("href", getPeopleRoute("fr", "PPL_YORUBA"));
    expect(people.className).toContain("afh-accent-ocre");
    expect(
      screen.getByRole("link", { name: /Pays\s*Nigeria/ })
    ).toHaveAttribute("href", getCountryRoute("fr", "NGA"));
    expect(
      screen.getByRole("link", {
        name: /Famille linguistique\s*Langues nigéro-congolaises/,
      })
    ).toHaveAttribute("href", getFamilyRoute("fr", "FLG_NIGERCONGO"));
  });

  // @req REQ-113
  it("states the origin status and prints every source with its tier", () => {
    render(<ProverbCard language="fr" proverb={attested} />);

    expect(screen.getByText("attestée par une source")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Yoruba Proverbs" })
    ).toHaveAttribute("href", "https://example.org/yoruba-proverbs");
    expect(screen.getByText("Source référencée")).toBeInTheDocument();
    expect(
      screen.getByText("Recueil publié ; donne le texte original.")
    ).toBeInTheDocument();
  });

  // No chip, and the reason there is none, rather than a blank row.
  // @req REQ-113
  it("gives an unestablished proverb no chip and says why", () => {
    render(<ProverbCard language="fr" proverb={unestablished} />);

    expect(screen.getByText("non établie")).toBeInTheDocument();
    expect(
      screen.getByText("Aucune source ne rattache ce proverbe à un peuple.")
    ).toBeInTheDocument();
    expect(
      screen.queryAllByRole("link", { name: /Peuple|Pays|Famille/ })
    ).toEqual([]);
  });

  // @req REQ-113
  it("draws no picture layer for a proverb without a photograph", () => {
    render(<ProverbCard language="fr" proverb={attested} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/Photo/)).not.toBeInTheDocument();
  });

  // The licence is only satisfied by an attribution the reader can see, so
  // the credit is a link to the original file, not a line filed elsewhere.
  // @req REQ-113
  it("shows a proverb's photograph and links its credit to the original file", () => {
    render(<ProverbCard language="fr" proverb={attested} picture={picture} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "alt",
      "Un marché au crépuscule."
    );
    expect(
      screen.getByRole("link", { name: /Auteur Test, CC BY-SA/ })
    ).toHaveAttribute("href", picture.filePage);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "La main qui donne"
    );
  });

  // @req REQ-145
  it("credits the photograph in English on /en", () => {
    render(<ProverbCard language="en" proverb={attested} picture={picture} />);

    expect(screen.getByRole("img")).toHaveAttribute("alt", "A market at dusk.");
    expect(
      screen.getByRole("link", { name: /Author Test, CC BY-SA/ })
    ).toBeInTheDocument();
  });

  // @req REQ-145
  it("speaks English on /en", () => {
    render(<ProverbCard language="en" proverb={attested} />);

    expect(screen.getByText("Proverb")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /People\s*Yoruba/ })
    ).toHaveAttribute("href", getPeopleRoute("en", "PPL_YORUBA"));
  });
});
