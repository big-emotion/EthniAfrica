// @req REQ-196
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PlaceRecord } from "@/api/v2/services/places";
import { PlaceRecordView } from "@/components/place/PlaceRecordView";
import { getNameAnswerRoute } from "@/lib/routing";
import type { NextStepCard } from "@/lib/search/nameClosing";

import yamoussoukroFiche from "../../../../dataset/source/afrik/lieux/LOC_YAMOUSSOUKRO.json";
import daloaFiche from "../../../../dataset/source/afrik/lieux/LOC_DALOA.json";
import baouleFiche from "../../../../dataset/source/afrik/peuples/FLG_KWA/PPL_BAOULE.json";
import civFiche from "../../../../dataset/source/afrik/pays/CIV.json";

const STORY = getNameAnswerRoute("fr", "Yamoussoukro");
const SOURCE_BOOK = yamoussoukroFiche.sources.find(
  (source) => source.title === "Mes premiers combats"
)!;
const SOURCE_COMMUNITY = yamoussoukroFiche.sources.find(
  (source) => source.title === "Biographie"
)!;
const YAMOUSSOUKRO = {
  id: yamoussoukroFiche.id,
  placeType: yamoussoukroFiche.placeType,
  nameMain: yamoussoukroFiche.nameMain,
  summary: yamoussoukroFiche.summary,
  country: { id: "CIV", name: "Côte d'Ivoire" },
  countries: [{ id: "CIV", name: "Côte d'Ivoire" }],
  associatedPeoples: yamoussoukroFiche.associatedPeoples.map((people) => ({
    id: people.peopleId,
    name: "Baoulé",
    relation: people.relation,
  })),
  content: {
    gaps: yamoussoukroFiche.gaps,
    sources: yamoussoukroFiche.sources,
  },
  nameHistory: yamoussoukroFiche.nameHistory,
} as unknown as PlaceRecord;
const DALOA = {
  id: daloaFiche.id,
  placeType: daloaFiche.placeType,
  nameMain: daloaFiche.nameMain,
  summary: daloaFiche.summary,
  country: { id: "CIV", name: "Côte d'Ivoire" },
  countries: [{ id: "CIV", name: "Côte d'Ivoire" }],
  associatedPeoples: [],
  content: { gaps: daloaFiche.gaps, sources: daloaFiche.sources },
  nameHistory: daloaFiche.nameHistory,
} as unknown as PlaceRecord;

const nextSteps: NextStepCard[] = [
  {
    relation: "country",
    kind: "Pays",
    name: "Côte d'Ivoire",
    reason: firstSentence(civFiche.nameHistory.summary),
  },
  {
    relation: "people",
    kind: "Peuple",
    name: "Baoulé",
    reason: firstSentence(baouleFiche.nameHistory.summary),
  },
];

function firstSentence(text: string): string {
  return text.match(/^.*?[.!?](?:\s|$)/u)?.[0].trim() ?? text;
}

function renderPlace(place: PlaceRecord, cards: NextStepCard[] = nextSteps) {
  return render(
    <PlaceRecordView place={place} language="fr" nextSteps={cards} />
  );
}

describe("PlaceRecordView", () => {
  // @req REQ-196
  it("renders the approved Yamoussoukro story, open readings, and attributed family account", () => {
    const { container } = renderPlace(YAMOUSSOUKRO);
    const yamoussoukroAccounts =
      yamoussoukroFiche.nameHistory.names[0].accounts;
    const ngokroAccounts = yamoussoukroFiche.nameHistory.names[1].accounts;
    expect(yamoussoukroFiche.gaps).toHaveLength(4);
    expect(yamoussoukroFiche.sources).toHaveLength(9);
    expect(yamoussoukroAccounts).toHaveLength(5);
    expect(ngokroAccounts).toHaveLength(4);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "L’histoire des noms",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Lire l’histoire du nom Yamoussoukro" })
    ).toHaveAttribute("href", STORY);
    expect(
      screen.getByText(
        "La page du nom présente ce que disent les sources : qui l’a donné, à qui, quand et pourquoi, du plus récent au plus ancien."
      )
    ).toBeInTheDocument();

    const changeAccounts = yamoussoukroAccounts.filter((account) =>
      ["1904", "Après 1909 ; 1910 selon la Fondation"].includes(
        account.period.label
      )
    );
    expect(changeAccounts).toHaveLength(2);
    const readings = container.querySelector("[data-readings]");
    expect(readings).not.toBeNull();
    expect(readings).toHaveTextContent(
      "Deux explications existent du passage du nom N'Gokro au nom Yamoussoukro, sans que l'une l'emporte."
    );
    for (const account of changeAccounts) {
      expect(readings).toHaveTextContent(account.statement);
      expect(account.sources.length).toBeGreaterThan(0);
    }
    expect(
      within(readings as HTMLElement).getAllByRole("button", {
        name: /sources/i,
      })
    ).toHaveLength(2);
    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Hypothèse 1 · 1904"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent ===
          "Hypothèse 2 · Après 1909 ; 1910 selon la Fondation"
      )
    ).toBeInTheDocument();

    const otherAccounts = yamoussoukroAccounts.filter(
      (account) => !changeAccounts.includes(account)
    );
    expect(otherAccounts).toHaveLength(3);
    for (const account of otherAccounts) {
      expect(container).toHaveTextContent(account.statement);
      expect(readings).not.toHaveTextContent(account.statement);
    }
    const familyAccount = otherAccounts.find((account) =>
      account.statement.includes("Yaha M'so")
    );
    expect(familyAccount).toBeDefined();
    expect(container).toHaveTextContent(familyAccount!.statement);
    expect(
      screen.getByText("Récit de famille · Début du XXe siècle")
    ).toBeInTheDocument();
  });

  // @req REQ-196
  it("uses Daloa's own contested-name wording on another place fiche", () => {
    const { container } = renderPlace(DALOA, []);
    const readings = container.querySelector("[data-readings]");

    expect(readings).not.toBeNull();
    expect(readings).toHaveTextContent(
      "D'où vient le nom Daloa ? Les sources proposent plusieurs explications, sans que l'une l'emporte."
    );
    expect(readings).not.toHaveTextContent("N'Gokro");
  });

  // @req REQ-196
  it("groups sources by name and type, includes community sources, and hides tiers", () => {
    const { container } = renderPlace(YAMOUSSOUKRO);

    const sourceChapter = screen.getByRole("region", {
      name: /Les sources des noms de ce lieu/i,
    });
    expect(
      within(sourceChapter).getByText(
        /rangés par nom, puis par type de source/i
      )
    ).toBeInTheDocument();
    expect(
      within(sourceChapter)
        .getAllByRole("link", { name: "Mes premiers combats" })
        .some((link) => link.getAttribute("href") === SOURCE_BOOK.url)
    ).toBe(true);
    expect(
      within(sourceChapter)
        .getAllByRole("link", { name: "Biographie" })
        .some((link) => link.getAttribute("href") === SOURCE_COMMUNITY.url)
    ).toBe(true);
    expect(sourceChapter).toHaveTextContent("Tradition orale ou communauté");
    expect(container.querySelectorAll("#sources a")).toHaveLength(9);
    expect(container.textContent).not.toMatch(
      /\b(?:referenced|unverified|official|tier)\b/i
    );

    const firstNameGroup = sourceChapter.querySelector("[data-name-group]");
    const nameGroups = [...sourceChapter.querySelectorAll("[data-name-group]")]
      .filter((group) => group.parentElement === firstNameGroup?.parentElement)
      .map((group) => group.querySelector("summary"))
      .filter((summary): summary is HTMLElement => summary !== null);
    expect(nameGroups).toHaveLength(2);
    expect(nameGroups[0]).toHaveTextContent("Yamoussoukro");
    expect(nameGroups[1]).toHaveTextContent("N'Gokro");
  });

  // @req REQ-196
  it("ends with the fiche gaps and onward cards led by each target summary", () => {
    const { container } = renderPlace(YAMOUSSOUKRO);

    expect(
      screen.getByRole("heading", { name: "Ce que nous ne savons pas encore" })
    ).toBeInTheDocument();
    const gaps = yamoussoukroFiche.gaps.map((gap) => gap.reason);
    expect(gaps).toHaveLength(4);
    for (const gap of gaps) {
      expect(screen.getByText(gap)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: "Signaler une erreur" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Proposer une source" })
    ).toBeInTheDocument();
    const onward = container.querySelector("[data-name-next]");
    expect(onward).not.toBeNull();
    expect(
      within(onward as HTMLElement).getByRole("heading", {
        name: "Poursuivre avec un autre nom",
      })
    ).toBeInTheDocument();
    expect(
      within(onward as HTMLElement).getByText("Côte d'Ivoire")
    ).toBeInTheDocument();
    expect(
      within(onward as HTMLElement).getByText(nextSteps[0].reason)
    ).toBeInTheDocument();
    expect(
      within(onward as HTMLElement).getByText("Baoulé")
    ).toBeInTheDocument();
    expect(
      within(onward as HTMLElement).getByText(nextSteps[1].reason)
    ).toBeInTheDocument();
  });

  // @req REQ-196
  it.each([
    ["LOC_AFRIQUE", "Afrique"],
    ["LOC_DALOA", "Daloa"],
    ["LOC_GAGNOA", "Gagnoa"],
    ["LOC_SAHARA", "Sahara"],
    ["LOC_YAMOUSSOUKRO", "Yamoussoukro"],
  ])(
    "omits empty gaps and sources for %s while keeping links and folded sources",
    (id, name) => {
      const place: PlaceRecord = {
        ...YAMOUSSOUKRO,
        id,
        nameMain: name,
        summary: "",
        countries: [{ id: "CIV", name: "Côte d'Ivoire" }],
        associatedPeoples: [],
        content: { gaps: [], sources: [] },
        nameHistory: null,
      };
      const { container } = renderPlace(place, []);

      expect(
        container.querySelector(
          '[data-fiche-section="Ce que nous ne savons pas encore"]'
        )
      ).toBeNull();
      expect(
        container.querySelector('[data-fiche-section="Sources"]')
      ).toBeNull();
      expect(
        container.querySelector(
          '[data-fiche-section="Les sources des noms de ce lieu"]'
        )
      ).toBeNull();
      expect(
        screen.getByRole("link", { name: "Côte d'Ivoire" })
      ).toHaveAttribute("href", "/fr/atlas/pays/CIV");
    }
  );

  // @req REQ-196
  it("keeps a long source list folded when empty chapters are omitted", () => {
    const place = {
      ...YAMOUSSOUKRO,
      content: {
        gaps: [],
        sources: yamoussoukroFiche.sources,
      },
    } as PlaceRecord;
    const { container } = renderPlace(place, []);

    expect(
      container.querySelector(
        '[data-fiche-section="Ce que nous ne savons pas encore"]'
      )
    ).toBeNull();
    expect(
      container.querySelector('[data-fiche-section="Sources"]')
    ).not.toBeNull();
    expect(container.querySelector("details")).not.toBeNull();
  });
});
