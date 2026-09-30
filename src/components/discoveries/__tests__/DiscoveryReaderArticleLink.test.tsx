import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiscoveryReader } from "@/components/discoveries/DiscoveryReader";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";

const publications = getDiscoveryPublications().filter(
  (entry) => entry.kind === "anecdote"
);
const initialId = "anecdote:burkina-faso";

const openDetail = () =>
  fireEvent.click(screen.getByRole("button", { name: "En savoir plus" }));

describe("Découvertes — the matching article", () => {
  // @req REQ-157
  it("points the open publication at its article when one is published", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId={initialId}
        articleLinks={{ [initialId]: "/fr/dossiers/un-article" }}
      />
    );
    openDetail();

    expect(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: "Lire l'article",
      })
    ).toHaveAttribute("href", "/fr/dossiers/un-article");
  });

  // @req REQ-157
  it("shows no article link, and no empty promise, when none is published", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId={initialId}
      />
    );
    openDetail();

    expect(
      within(screen.getByRole("dialog")).queryByRole("link", {
        name: "Lire l'article",
      })
    ).toBeNull();
  });
});
