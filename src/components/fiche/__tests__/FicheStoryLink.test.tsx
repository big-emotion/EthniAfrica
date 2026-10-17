/**
 * The link from a fiche to the story of its own name (brief 10 §1, boards
 * docs/design/mockups/site/*-430.dc.html, `Main` « lien vers l'histoire du
 * nom »). The result page is the site's central surface; before this link the
 * only result-page links on a fiche led to other names.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FicheStoryLink } from "@/components/fiche/FicheStoryLink";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { getLocalizedRoute } from "@/lib/routing";
import { nameStoryHref } from "@/lib/search/nameClosing";

afterEach(() => {
  cleanup();
  delete window.plausible;
});

const SEARCH = getLocalizedRoute("fr", "search");

const CIV_HISTORY = {
  summary: "Le nom Côte d'Ivoire renvoie au commerce de l'ivoire.",
  names: [
    {
      nameText: "Côte d'Ivoire",
      nameStatus: "current",
      selfGiven: null,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [],
    },
    {
      nameText: "Côte des Dents",
      nameStatus: "historical",
      selfGiven: null,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [],
    },
  ],
} as NameHistory;

describe("FicheStoryLink", () => {
  // @req REQ-198
  it("names the fiche's leading name and leads to the page a reader gets by searching it", () => {
    render(
      <FicheStoryLink history={CIV_HISTORY} from="country" language="fr" />
    );

    const link = screen.getByRole("link", {
      name: /^Suivre l'histoire du nom Côte d'Ivoire/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}?q=C%C3%B4te+d%27Ivoire`);
    expect(link).toHaveAttribute("href", nameStoryHref("fr", "Côte d'Ivoire"));
    expect(
      screen.getByText(
        "La page du nom présente ce que disent les sources : qui l'a donné, à qui, quand et pourquoi, en remontant le temps."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-198
  it("writes the arrow once, through the action link", () => {
    render(
      <FicheStoryLink history={CIV_HISTORY} from="country" language="fr" />
    );

    expect(screen.getAllByTestId("action-link-arrow")).toHaveLength(1);
  });

  // @req REQ-198
  it("renders nothing for a fiche without a name story", () => {
    const { container: none } = render(
      <FicheStoryLink history={null} from="people" language="fr" />
    );
    expect(none).toBeEmptyDOMElement();
    cleanup();

    const { container: empty } = render(
      <FicheStoryLink
        history={{ summary: "", names: [] } as NameHistory}
        from="people"
        language="fr"
      />
    );
    expect(empty).toBeEmptyDOMElement();
  });

  // @req REQ-046
  it("counts the click as a step to the fiche's own name, once, under consent", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(
      <FicheStoryLink history={CIV_HISTORY} from="country" language="fr" />
    );

    fireEvent.click(screen.getByRole("link", { name: /Suivre l'histoire/ }));

    expect(plausible).toHaveBeenCalledTimes(1);
    expect(plausible).toHaveBeenCalledWith("fiche:related_click", {
      props: { from: "country", to: "name_story" },
    });
  });

  // @req REQ-046
  it("sends nothing and throws nothing without consent", () => {
    render(
      <FicheStoryLink history={CIV_HISTORY} from="country" language="fr" />
    );

    expect(() =>
      fireEvent.click(screen.getByRole("link", { name: /Suivre l'histoire/ }))
    ).not.toThrow();
    expect(window.plausible).toBeUndefined();
  });
});
