import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiscoveryReader } from "@/components/discoveries/DiscoveryReader";
import { PRODUCT_NAME } from "@/lib/brand";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import { getLocalizedRoute } from "@/lib/routing";
import { getTranslation } from "@/lib/translations";

const publications = getDiscoveryPublications().filter(
  (entry) => entry.kind === "anecdote"
);
const burkina = publications.find(
  (entry) => entry.id === "anecdote:burkina-faso"
)!;
const hubs = getTranslation("fr").hubs;

const renderReader = () =>
  render(
    <DiscoveryReader
      language="fr"
      publications={publications}
      initialId={burkina.id}
    />
  );

describe("Découvertes immersive frame", () => {
  // Two rows of buttons under the frame sent a reader below the fold to act on
  // what they were looking at. A Reel keeps every action on one column over
  // the picture.
  // @req REQ-156
  it("stands the publication's actions on one rail inside the frame", () => {
    renderReader();
    const rail = screen.getByRole("group", {
      name: "Actions de la découverte",
    });

    expect(
      within(rail)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["Garder", "Partager", "En savoir plus", "Mes découvertes"]);
  });

  // The route draws no masthead, so the reading has to carry the way out
  // itself — or a reader who arrived from a shared link is shut in the feed.
  // @req REQ-156
  it("names the site's destinations itself, since the masthead is not drawn", () => {
    renderReader();
    const nav = screen.getByRole("navigation", { name: "Parcourir" });

    expect(
      within(nav).getByRole("link", { name: new RegExp(`^${PRODUCT_NAME}`) })
    ).toHaveAttribute("href", "/fr");
    const axes = [
      [hubs.atlas.title, "atlasHub"],
      [hubs.dossiers.title, "dossiersHub"],
      [hubs.jeux.title, "jeuxHub"],
    ] as const;
    for (const [label, route] of axes) {
      expect(within(nav).getByRole("link", { name: label })).toHaveAttribute(
        "href",
        getLocalizedRoute("fr", route)
      );
    }
    expect(
      within(nav).getByRole("link", { name: "Découvertes" })
    ).toHaveAttribute("aria-current", "page");
  });

  // @req REQ-156
  it("opens the same destinations from the top bar on a narrow screen", () => {
    renderReader();
    expect(screen.getByRole("link", { name: "Accueil" })).toHaveAttribute(
      "href",
      "/fr"
    );

    fireEvent.click(screen.getByRole("button", { name: "Parcourir" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: hubs.atlas.title })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "atlasHub"));
  });

  // A Reel holds its caption to a couple of lines and keeps the rest one tap
  // away; the card did not show the opening line at all.
  // @req REQ-156
  it("gives each card its opening line under the headline", () => {
    renderReader();
    const card = screen.getAllByRole("article")[0];

    expect(within(card).getByText(burkina.description.fr)).toBeInTheDocument();
  });

  // The watermark sat bottom-right, exactly where the rail now stands; the
  // name travels with the reader's own navigation instead.
  // @req REQ-156
  it("draws no watermark over the picture", () => {
    renderReader();

    for (const card of screen.getAllByRole("article")) {
      expect(within(card).queryByText(PRODUCT_NAME)).not.toBeInTheDocument();
    }
  });
});
