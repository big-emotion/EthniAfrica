import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  NameClosingBand,
  NameNextStep,
  NameSourcesBlock,
} from "@/components/search/timeline/NameClosing";
import { aboutCopy } from "@/lib/i18n/copy/about";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import { getLocalizedRoute, getNameAnswerRoute } from "@/lib/routing";
import { NameAddressProvider } from "@/components/search/NameAddressProvider";
import { PEUL_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import { groupAccountsBySourceFamily } from "@/lib/search/nameClosing";
import { buildNameTimeline } from "@/lib/search/nameTimeline";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

const timeline = buildNameTimeline(PEUL_HISTORY, "peul");
const name = timeline.names[0];

describe("NameSourcesBlock — « Les sources »", () => {
  // @req REQ-198
  it("asks who tells the open name and lists its source families", () => {
    render(
      <NameSourcesBlock
        name={name}
        forms={timeline.italicForms}
        open
        language="fr"
      />
    );

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
  it("opens the first family on the first subject and folds the rest", () => {
    const { container } = render(
      <NameSourcesBlock
        name={name}
        forms={timeline.italicForms}
        open
        language="fr"
      />
    );
    const families = container.querySelectorAll("details[data-family]");

    expect((families[0] as HTMLDetailsElement).open).toBe(true);
    for (const family of Array.from(families).slice(1)) {
      expect((family as HTMLDetailsElement).open).toBe(false);
    }
  });

  // @req REQ-161
  it("names each source by its type, never by a tier or a score", () => {
    const { container } = render(
      <NameSourcesBlock
        name={name}
        forms={timeline.italicForms}
        open
        language="fr"
      />
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
      <NameSourcesBlock
        name={name}
        forms={timeline.italicForms}
        open
        language="fr"
      />
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
      <NameSourcesBlock
        name={name}
        forms={timeline.italicForms}
        open
        language="fr"
      />
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
    expect(copy.fiche.sourcesLead(1, 2, 2, "people")).toBe(
      "Une seule source explique les noms de ce peuple pour l’instant. Voici ses 2 récits, rangés par nom."
    );
    expect(copy.fiche.sourcesLead(3, 5, 2, "people")).toBe(
      "Plusieurs sources expliquent les noms de ce peuple. Voici leurs 5 récits, rangés par nom, puis par type de source."
    );
  });
});

describe("NameSourcesBlock — the other names' voices", () => {
  // @req REQ-198
  it("says who else speaks for the subject's other names, as on the Peul board", () => {
    const { container } = render(
      <NameSourcesBlock
        name={name}
        forms={timeline.italicForms}
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
      <NameSourcesBlock
        name={name}
        forms={timeline.italicForms}
        language="fr"
      />
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
