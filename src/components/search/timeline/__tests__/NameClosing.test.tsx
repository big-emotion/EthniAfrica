import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  NameClosingBand,
  NameFicheSourcesBlock,
  NameNextStep,
  NameSourcesBlock,
} from "@/components/search/timeline/NameClosing";
import { aboutCopy } from "@/lib/i18n/copy/about";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import { getLocalizedRoute, getNameAnswerRoute } from "@/lib/routing";
import { NameAddressProvider } from "@/components/search/NameAddressProvider";
import { PEUL_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import {
  groupAccountsBySourceFamily,
  sourceRowsForTimelineName,
  timelineTileAnchorId,
} from "@/lib/search/nameClosing";
import { buildNameTimeline } from "@/lib/search/nameTimeline";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

const timeline = buildNameTimeline(PEUL_HISTORY, "peul");
const name = timeline.names[0];

describe("NameSourcesBlock — « Les sources »", () => {
  // @req REQ-198
  it("does not repeat account prose from the timeline", () => {
    render(<NameSourcesBlock name={name} language="fr" />);

    for (const account of name.tiles.flatMap((tile) => tile.accounts)) {
      expect(screen.queryByText(account.statement)).toBeNull();
    }
  });

  // @req REQ-198
  it("keeps the block title, sentence, type strip, and lists source rows", () => {
    render(<NameSourcesBlock name={name} language="fr" />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: `Les sources du nom ${name.nameText}`,
      })
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("list", { name: "Types de sources" })
      ).getAllByRole("listitem").length
    ).toBeGreaterThan(0);
  });

  // @req REQ-198
  it("renders source rows without repeating account accordions", () => {
    const { container } = render(
      <NameSourcesBlock name={name} language="fr" />
    );
    expect(container.querySelectorAll("details[data-family]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-source-row]").length).toBe(
      sourceRowsForTimelineName(name).length
    );
  });

  // @req REQ-198
  it("links each source to its newest backed account and reveals folded accounts on click", () => {
    const reveal = vi.fn();
    const rows = sourceRowsForTimelineName(name);
    const row = rows.find(({ accounts }) => accounts.length > 1)!;
    const target = row.accounts[0];
    render(
      <NameSourcesBlock name={name} onRevealAccount={reveal} language="fr" />
    );

    const link = screen.getByRole("link", {
      name: `Voir les ${row.accounts.length} récits`,
    });
    expect(link).toHaveAttribute(
      "href",
      `#${timelineTileAnchorId(name.nameText, target.tileKey)}`
    );
    fireEvent.click(link);
    expect(reveal.mock.calls[0][0]).toBe(target.tileKey);
  });

  // @req REQ-161
  it("names each source by its type, never by a tier or a score", () => {
    const { container } = render(
      <NameSourcesBlock name={name} language="fr" />
    );

    expect(container.textContent).not.toMatch(
      /fiable|Officielle|Référencée|Non vérifiée|tier/i
    );
  });
});

describe("NameSourcesBlock — the plain title and its sentence", () => {
  // @req REQ-198
  it("titles the block « Les sources du nom … » with no eyebrow above it", () => {
    const { container } = render(
      <NameSourcesBlock name={name} language="fr" />
    );

    expect(container.querySelector("section > .afh-tile-label")).toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe(
      `Les sources du nom ${name.nameText}`
    );
  });

  // @req REQ-198
  it("counts the sources that explain the name, not its accounts", () => {
    const sources = groupAccountsBySourceFamily(name).reduce(
      (sum, group) => sum + group.sourceCount,
      0
    );
    const accounts = name.tiles.flatMap((tile) => tile.accounts).length;
    // The Peul fixture cites one source for several accounts: the sentence
    // must say so rather than count the accounts as sources.
    expect(sources).toBe(1);
    expect(accounts).toBeGreaterThan(1);
    const { container } = render(
      <NameSourcesBlock name={name} language="fr" />
    );

    expect(container.querySelector("h2 + p")?.textContent).toBe(
      `Une seule source explique ce nom pour l’instant. Voici ses ${accounts} récits.`
    );
  });

  // @req REQ-198
  it("keeps the sentence true when a single source explains the name", () => {
    const copy = nameClosingCopy.fr;

    expect(copy.sourcesLead(1, 1, "Kollo")).toBe(
      "Une seule source explique ce nom pour l’instant. Voici son récit."
    );
    expect(copy.sourcesLead(1, 2, "Kollo")).toBe(
      "Une seule source explique ce nom pour l’instant. Voici ses 2 récits."
    );
    expect(copy.sourceAccounts(1)).toBe("Voir le récit");
    expect(copy.sourceAccounts(2)).toBe("Voir les 2 récits");
    expect(copy.fiche.sourcesLead(1, 2, 2, "people")).toBe(
      "Une seule source explique les noms de ce peuple pour l’instant. Voici ses 2 récits, rangés par nom."
    );
    expect(copy.fiche.sourcesLead(3, 5, 2, "people")).toBe(
      "Plusieurs sources expliquent les noms de ce peuple. Voici leurs 5 récits, rangés par nom, puis par type de source."
    );
  });

  // @req REQ-198
  it("says when sources mention a family name without explaining it", () => {
    render(
      <NameFicheSourcesBlock
        history={{ ...PEUL_HISTORY, originExplained: false }}
        subjectType="patronyme"
        language="fr"
      />
    );

    expect(
      screen.getByText(
        /sources mentionnent ce nom, sans en expliquer l’origine/
      )
    ).toBeInTheDocument();
  });

  // @req REQ-196
  it("shows a claim status in the period line for patronyme accounts", () => {
    const history = {
      ...PEUL_HISTORY,
      names: PEUL_HISTORY.names.map((item, nameIndex) =>
        nameIndex === 0
          ? {
              ...item,
              accounts: item.accounts.map((account, accountIndex) =>
                accountIndex === 0
                  ? { ...account, claimStatus: "contested" as const }
                  : account
              ),
            }
          : item
      ),
    };
    const { container } = render(
      <NameFicheSourcesBlock
        history={history}
        subjectType="patronyme"
        language="fr"
      />
    );

    expect(container.textContent).toContain("Contestée");
    expect(container.textContent).toContain(" · Contestée");
  });

  // @req REQ-196
  it("does not add patronyme claim statuses to other subject types", () => {
    const history = {
      ...PEUL_HISTORY,
      names: PEUL_HISTORY.names.map((item, nameIndex) =>
        nameIndex === 0
          ? {
              ...item,
              accounts: item.accounts.map((account, accountIndex) =>
                accountIndex === 0
                  ? { ...account, claimStatus: "contested" as const }
                  : account
              ),
            }
          : item
      ),
    };
    const { container } = render(
      <NameFicheSourcesBlock
        history={history}
        subjectType="people"
        language="fr"
      />
    );

    expect(container.textContent).not.toContain("Contestée");
  });
});

describe("NameClosing copy — a family name", () => {
  // A family name is one name with several forms: « les noms de ce nom de
  // famille » doubles the word (found on the brief 6 boards, 2026-10-18).
  // @req REQ-198
  it("speaks of « ce nom de famille », never of « les noms de ce nom de famille »", () => {
    const copy = nameClosingCopy.fr;

    expect(copy.fiche.sourcesTitle("patronyme")).toBe(
      "Les sources de ce nom de famille"
    );
    expect(copy.fiche.sourcesLead(3, 14, 2, "patronyme")).toBe(
      "Plusieurs sources expliquent ce nom de famille. Voici leurs 14 récits, rangés par forme, puis par type de source."
    );
    expect(copy.fiche.noOral("patronyme")).toBe(
      "Aucun récit transmis oralement n’est enregistré pour ce nom de famille."
    );
    expect(copy.otherVoices("patronyme", ["archive"])).toBe(
      "Pour les autres formes de ce nom de famille, d’autres sources existent : des archives. Choisissez un nom plus haut pour les lire."
    );
  });
});

describe("NameSourcesBlock — the other names' voices", () => {
  // @req REQ-198
  it("says who else speaks for the subject's other names, as on the Peul board", () => {
    const { container } = render(
      <NameSourcesBlock
        name={name}
        otherKinds={[
          "linguistic_reference",
          "press",
          "intergovernmental",
          "archive",
        ]}
        subjectType="people"
        language="fr"
      />
    );

    expect(container.querySelector("[data-other-voices]")?.textContent).toBe(
      "Pour les autres noms de ce peuple, d’autres sources existent : des références linguistiques, des articles de presse, des organisations intergouvernementales et des archives. Choisissez un nom plus haut pour les lire."
    );
  });

  // @req REQ-198
  it("draws no note when no other name brings another voice", () => {
    const { container } = render(
      <NameSourcesBlock name={name} language="fr" />
    );

    expect(container.querySelector("[data-other-voices]")).toBeNull();
  });
});

describe("NameClosingBand — silences, conviction, invitation", () => {
  const target = { type: "people", id: "PPL_FULA", name: "Peul" };

  // @req REQ-198
  it("lists the silences one per line, then the about page's conviction", () => {
    render(
      <NameClosingBand
        silences={["Première absence.", "Seconde absence."]}
        contributionTarget={target}
        language="fr"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Ce que nous ne savons pas encore" })
    ).toBeInTheDocument();
    expect(screen.getByText("Première absence.")).toBeInTheDocument();
    expect(screen.getByText("Seconde absence.")).toBeInTheDocument();
    expect(
      screen.getByText(aboutCopy.fr.conviction.paragraphs[0])
    ).toBeInTheDocument();
  });

  // @req REQ-198
  it("sets quoted name forms in italics and leaves unnamed silences alone", () => {
    const { container } = render(
      <NameClosingBand
        silences={[
          "Aucune trace du nom Fulɓe plus ancienne que 1842 n'est connue du projet.",
          "Aucun récit transmis oralement n'est enregistré pour les noms de ce peuple.",
        ]}
        italicForms={["Fulɓe"]}
        language="fr"
      />
    );

    const band = container.querySelector("[data-name-closing]");
    expect(band).toHaveTextContent(
      "Aucune trace du nom Fulɓe plus ancienne que 1842 n'est connue du projet."
    );
    expect(band?.querySelector("li:first-child em")?.textContent).toBe("Fulɓe");
    expect(band?.querySelector("li:last-child em")).toBeNull();
  });

  // @req REQ-198
  it("keeps every silence plain when no italic forms are provided", () => {
    const { container } = render(
      <NameClosingBand
        silences={["Aucune trace du nom Peul plus ancienne que 1842."]}
        language="fr"
      />
    );

    const band = container.querySelector("[data-name-closing]");
    expect(band?.querySelector("em")).toBeNull();
    expect(band).toHaveTextContent(
      "Aucune trace du nom Peul plus ancienne que 1842."
    );
  });

  // @req REQ-198
  it("draws no thesis line while its wording is not fixed", () => {
    const { container } = render(
      <NameClosingBand silences={["Une absence."]} language="fr" />
    );

    expect(nameClosingCopy.fr.thesis).toBe("");
    expect(container.querySelector("[data-name-thesis]")).toBeNull();
  });

  // @req REQ-198
  it("invites the reader to correct, unless the page already does", () => {
    const { rerender } = render(
      <NameClosingBand
        silences={["Une absence."]}
        contributionTarget={target}
        language="fr"
      />
    );
    expect(
      screen.getByRole("button", { name: "Signaler une erreur" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Proposer une source" })
    ).toBeInTheDocument();

    rerender(<NameClosingBand silences={["Une absence."]} language="fr" />);
    expect(
      screen.queryByRole("button", { name: "Signaler une erreur" })
    ).toBeNull();
  });

  // The accent tint stays light at night while --afh-text turns light: the
  // report button sat at 1.12:1 there. Text on the tint takes the ink
  // color.css keeps dark in both themes.
  // @req REQ-198
  it("writes the report button in the ink that stays readable on its tint at night", () => {
    render(
      <NameClosingBand
        silences={["Une absence."]}
        contributionTarget={target}
        language="fr"
      />
    );

    const report = screen.getByRole("button", { name: "Signaler une erreur" });
    expect(report).toHaveClass("bg-[color:var(--accent-tint)]");
    expect(report).toHaveClass("text-[color:var(--accent-foreground)]");
    expect(report).not.toHaveClass("text-afh-text");
  });
});

describe("NameNextStep — the next names", () => {
  const atlantique = {
    relation: "family" as const,
    kind: "Famille de langues",
    name: "Atlantique",
    reason: "Le nom atlantique désigne un ensemble de langues.",
  };

  // @req REQ-198
  it("links each name to its own result page, with its reason", () => {
    render(<NameNextStep cards={[atlantique]} language="fr" />);

    const link = screen.getByRole("link", { name: /Atlantique/ });
    expect(link).toHaveAttribute(
      "href",
      `${getLocalizedRoute("fr", "search")}?q=Atlantique`
    );
    expect(
      screen.getByText("Le nom atlantique désigne un ensemble de langues.")
    ).toBeInTheDocument();
  });

  // A name with an address is linked there, spelled as the corpus writes
  // it; one without stays a reading of the search page (REQ-200).
  // @req REQ-200
  it("links a name that has an address to that address", () => {
    const wolof = { ...atlantique, name: "Wolof", relation: "namer" as const };
    render(
      <NameAddressProvider spellings={["Wolof", "Traoré"]}>
        <NameNextStep
          cards={[wolof, { ...atlantique, name: "Traore" }, atlantique]}
          language="fr"
        />
      </NameAddressProvider>
    );

    expect(screen.getByRole("link", { name: /Wolof/ })).toHaveAttribute(
      "href",
      getNameAnswerRoute("fr", "Wolof")
    );
    expect(screen.getByRole("link", { name: /Traore/ })).toHaveAttribute(
      "href",
      getNameAnswerRoute("fr", "Traoré")
    );
    expect(screen.getByRole("link", { name: /Atlantique/ })).toHaveAttribute(
      "href",
      `${getLocalizedRoute("fr", "search")}?q=Atlantique`
    );
  });

  // @req REQ-198
  it("draws nothing when there is no name to offer", () => {
    const { container } = render(<NameNextStep cards={[]} language="fr" />);
    expect(container).toBeEmptyDOMElement();
  });

  // On a fiche the next step replaced FicheOnward, the only emitter of
  // fiche:related_click: without this, the fiches that gained a next step
  // stopped counting their onward clicks.
  // @req REQ-046
  it("counts a click from a fiche under the card's machine relation", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(
      <NameNextStep cards={[atlantique]} language="fr" trackFrom="country" />
    );

    fireEvent.click(screen.getByRole("link", { name: /Atlantique/ }));

    expect(plausible).toHaveBeenCalledWith("fiche:related_click", {
      props: { from: "country", to: "family" },
    });
    delete window.plausible;
  });

  // The result page counts its own clicks, through `onNavigate`.
  // @req REQ-046
  it("sends no fiche event when it does not serve a fiche", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    const onNavigate = vi.fn();
    render(
      <NameNextStep
        cards={[atlantique]}
        language="fr"
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByRole("link", { name: /Atlantique/ }));

    expect(plausible).not.toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledWith(atlantique, 1);
    delete window.plausible;
  });
});
