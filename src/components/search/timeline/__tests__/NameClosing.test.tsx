import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  NameClosingBand,
  NameNextStep,
  NameSourcesBlock,
} from "@/components/search/timeline/NameClosing";
import { aboutCopy } from "@/lib/i18n/copy/about";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import { getLocalizedRoute } from "@/lib/routing";
import { PEUL_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import { buildNameTimeline } from "@/lib/search/nameTimeline";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

const timeline = buildNameTimeline(PEUL_HISTORY, "peul");
const name = timeline.names[0];

describe("NameSourcesBlock — « Les sources parlent »", () => {
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
        name: `Qui raconte le nom ${name.nameText} ?`,
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
      "Pour les autres noms de ce peuple, d’autres voix parlent aussi : des références linguistiques, des articles de presse, des organisations intergouvernementales et des archives. Choisissez un nom plus haut pour les lire."
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
  // @req REQ-198
  it("links each name to its own result page, with its reason", () => {
    render(
      <NameNextStep
        cards={[
          {
            kind: "Famille de langues",
            name: "Atlantique",
            reason: "Le nom atlantique désigne un ensemble de langues.",
          },
        ]}
        language="fr"
      />
    );

    const link = screen.getByRole("link", { name: /Atlantique/ });
    expect(link).toHaveAttribute(
      "href",
      `${getLocalizedRoute("fr", "search")}?q=Atlantique`
    );
    expect(
      screen.getByText("Le nom atlantique désigne un ensemble de langues.")
    ).toBeInTheDocument();
  });

  // @req REQ-198
  it("draws nothing when there is no name to offer", () => {
    const { container } = render(<NameNextStep cards={[]} language="fr" />);
    expect(container).toBeEmptyDOMElement();
  });
});
