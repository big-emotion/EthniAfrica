/**
 * The link from a fiche to the story of its own name (brief 10 §1, boards
 * docs/design/mockups/site/*-430.dc.html, `Main` « lien vers l'histoire du
 * nom »). The result page is the site's central surface; before this link the
 * only result-page links on a fiche led to other names.
 *
 * Which name it may name, and where it leads, are decided on the server
 * (`nameStoryLink`, tested in src/lib/search/__tests__/nameStoryLink.test.ts):
 * the link only lays out the name and the href it is given.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FicheStoryLink } from "@/components/fiche/FicheStoryLink";
import { getLocalizedRoute } from "@/lib/routing";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.plausible;
});

const SEARCH = getLocalizedRoute("fr", "search");

/** Côte d'Ivoire's story, as `nameStoryLink` hands it to the CIV fiche. */
const CIV_STORY = {
  name: "Côte d'Ivoire",
  href: `${SEARCH}/c%C3%B4te%20d'ivoire`,
};

describe("FicheStoryLink", () => {
  // @req REQ-198
  it("names the fiche's leading name and leads where the server says its story is told", () => {
    render(<FicheStoryLink story={CIV_STORY} from="country" language="fr" />);

    const link = screen.getByRole("link", {
      name: /^Suivre l'histoire du nom Côte d'Ivoire/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}/c%C3%B4te%20d'ivoire`);
    expect(
      screen.getByText(
        "La page du nom présente ce que disent les sources : qui l'a donné, à qui, quand et pourquoi, en remontant le temps."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-198
  it("writes the arrow once, through the action link", () => {
    render(<FicheStoryLink story={CIV_STORY} from="country" language="fr" />);

    expect(screen.getAllByTestId("action-link-arrow")).toHaveLength(1);
  });

  // @req REQ-198
  it("renders nothing without a story the result page answers", () => {
    const { container: none } = render(
      <FicheStoryLink story={undefined} from="people" language="fr" />
    );
    expect(none).toBeEmptyDOMElement();
    cleanup();

    const { container: empty } = render(
      <FicheStoryLink story={null} from="people" language="fr" />
    );
    expect(empty).toBeEmptyDOMElement();
  });

  // @req REQ-046
  it("counts the click as a step to the fiche's own name, once, under consent", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<FicheStoryLink story={CIV_STORY} from="country" language="fr" />);

    fireEvent.click(screen.getByRole("link", { name: /Suivre l'histoire/ }));

    expect(plausible).toHaveBeenCalledTimes(1);
    expect(plausible).toHaveBeenCalledWith("fiche:related_click", {
      props: { from: "country", to: "name_story" },
    });
  });

  // @req REQ-046
  it("sends nothing and throws nothing without consent", () => {
    // Without consent the Plausible script never loads, so nothing defines
    // `window.plausible`. An event could still leave the page as a request or
    // a beacon; neither may.
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: beacon,
    });
    render(<FicheStoryLink story={CIV_STORY} from="country" language="fr" />);

    expect(() =>
      fireEvent.click(screen.getByRole("link", { name: /Suivre l'histoire/ }))
    ).not.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
  });
});
