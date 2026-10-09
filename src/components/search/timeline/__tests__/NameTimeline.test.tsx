import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NameTimeline } from "@/components/search/timeline/NameTimeline";
import { getLocalizedRoute } from "@/lib/routing";
import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

function renderLingala() {
  return render(
    <NameTimeline
      history={LINGALA_HISTORY}
      searched="lingala"
      subjectType="language"
      language="fr"
    />
  );
}

const tiles = () =>
  within(
    screen.getByRole("list", { name: /Histoire du nom Lingala/ })
  ).getAllByRole("listitem");

describe("NameTimeline — the head", () => {
  // @req REQ-198
  it("opens on where the name comes from, with the summary under the name", () => {
    renderLingala();

    expect(screen.getByText("D'où vient le nom · Langue")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Lingala" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/désigne une langue du bassin du Congo/)
    ).toBeInTheDocument();
  });

  // Operator ruling 2026-10-09: the UI sets the names in italics, from the
  // block's own names and written forms; the data stays plain.
  // @req REQ-198
  it("sets the names the summary cites in italics", () => {
    const { container } = renderLingala();
    const summary = container.querySelector("[data-timeline-summary]")!;

    expect(
      Array.from(summary.querySelectorAll("em"), (em) => em.textContent)
    ).toEqual(["lingala", "mangala", "Bangala"]);
  });

  // @req REQ-197
  it("shows one name at a time, the searched one first and marked", () => {
    renderLingala();
    const chips = within(
      screen.getByRole("group", { name: "Les noms de Lingala" })
    ).getAllByRole("button");

    expect(chips.map((chip) => chip.textContent)).toEqual([
      "Lingala · cherché",
      "Mangala",
      "Bangala",
    ]);
    expect(chips[0]).toHaveAttribute("aria-pressed", "true");
    expect(chips[1]).toHaveAttribute("aria-pressed", "false");
  });

  // @req REQ-197
  it("leads visibly from the searched name to the self-name", () => {
    render(
      <NameTimeline
        history={PEUL_HISTORY}
        searched="Peul"
        subjectType="people"
        language="fr"
      />
    );

    const lead = screen.getByRole("button", {
      // The names are <em>; happy-dom pads inline elements with spaces.
      name: /Vous avez cherché\s*Peul\s*\.\s*Ce peuple se nomme lui-même\s*Fulɓe/,
    });
    fireEvent.click(lead);

    expect(screen.getByRole("button", { name: "Fulɓe" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.getByRole("list", { name: /Histoire du nom Fulɓe/ })
    ).toBeInTheDocument();
  });

  // @req REQ-198
  it("switches the tiles when another name is chosen", () => {
    renderLingala();
    fireEvent.click(screen.getByRole("button", { name: "Bangala" }));

    expect(
      screen.getByRole("list", { name: /Histoire du nom Bangala/ })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Fin de ce que nos recherches retracent pour le nom Bangala."
      )
    ).toBeInTheDocument();
  });
});

describe("NameTimeline — the tiles", () => {
  // @req REQ-198
  it("goes back in time from today, the period set on each tile", () => {
    renderLingala();

    expect(screen.getByText("On remonte le temps")).toBeInTheDocument();
    expect(tiles().map((tile) => tile.getAttribute("data-placement"))).toEqual([
      "plain",
      "plain",
      "birth",
      "plain",
      "before",
      "before",
    ]);
    expect(tiles()[0]).toHaveTextContent(/^Depuis 2006/);
  });

  // The birth is marked by a pill and a frame, never by colour alone.
  // @req REQ-198
  it("marks the birth of the name in words", () => {
    renderLingala();
    const birth = tiles()[2];

    expect(birth).toHaveTextContent(
      "Naissance du nom Lingala · origine la plus ancienne connue du projet"
    );
    expect(birth).toHaveTextContent("1902");
  });

  // @req REQ-198
  it("marks what existed before the name", () => {
    renderLingala();

    for (const tile of tiles().slice(4)) {
      expect(tile).toHaveTextContent("Avant le nom Lingala");
    }
  });

  // @req REQ-198
  it("groups competing origins, numbered and unranked", () => {
    renderLingala();
    const group = tiles()[3];

    expect(group).toHaveTextContent("D'où vient le nom Lingala ?");
    expect(
      within(group)
        .getAllByText(/^Hypothèse \d$/)
        .map((tag) => tag.textContent)
    ).toEqual(["Hypothèse 1", "Hypothèse 2", "Hypothèse 3"]);
  });

  // Every sentence of a tile opens on the name; the name is in italics.
  // @req REQ-198
  it("sets every name a tile cites in italics", () => {
    renderLingala();

    expect(
      Array.from(tiles()[4].querySelectorAll("em"), (em) => em.textContent)
    ).toContain("Bangala");
  });

  // Actors are context for the reader, never the author of a name.
  // @req REQ-198
  it("names the people a story cites as context", () => {
    renderLingala();

    expect(tiles()[1]).toHaveTextContent(
      "Personnes citées dans ce récit : Le père De Boeck, auteur de la grammaire"
    );
  });

  // @req REQ-198
  it("says so when a name has no dated origin, and closes the history", () => {
    renderLingala();
    fireEvent.click(screen.getByRole("button", { name: "Mangala" }));

    expect(
      screen.getByText(
        "L'origine du nom Mangala n'est pas datée dans le projet pour l'instant."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Fin de ce que nos recherches retracent pour le nom Mangala."
      )
    ).toBeInTheDocument();
  });
});

describe("NameTimeline — « Pendant ce temps, ailleurs »", () => {
  // @req REQ-198
  it("keeps the anchors hidden until the reader asks for them", () => {
    renderLingala();
    const toggle = screen.getByRole("button", {
      name: "Pendant ce temps, ailleurs",
    });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/la loi de séparation/)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    const anchor = screen
      .getAllByText(/la loi de séparation des Églises et de l'État/)[0]
      .closest("[data-elsewhere]") as HTMLElement;
    expect(anchor).toHaveTextContent(
      "Le nom Lingala est alors en usage. En France, la loi de séparation des Églises et de l'État est votée, en 1905."
    );
    expect(
      within(anchor).getByRole("button", { name: /Voir les sources/ })
    ).toBeInTheDocument();
  });
});

describe("NameTimeline — the sources behind a passage", () => {
  // @req REQ-194
  it("names each passage's source by its type, never its tier", () => {
    renderLingala();
    const marker = within(tiles()[1]).getByRole("button", {
      name: "Voir les sources de ce passage (Archive)",
    });

    expect(marker).toHaveTextContent("Archive");
    expect(document.body).not.toHaveTextContent(
      /Référencée|Officielle|Non vérifiée|confiance/i
    );
  });

  // @req REQ-194
  it("opens the sources of the passage, each with its type", async () => {
    renderLingala();
    fireEvent.click(
      within(tiles()[4]).getByRole("button", { name: /Voir les sources/ })
    );

    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Lingala")).toBeInTheDocument();
    expect(
      within(sheet).getByText(
        "Grammaire et vocabulaire du lingala ou langue du Haut-Congo"
      )
    ).toBeInTheDocument();
    expect(sheet).not.toHaveTextContent(/Référencée|Officielle/);
  });
});
