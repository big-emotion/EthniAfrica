import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NameTimeline } from "@/components/search/timeline/NameTimeline";
import {
  parseNameHistory,
  type NameHistory,
} from "@/lib/afrik/parsers/nameHistoryParser";
import { getLocalizedRoute } from "@/lib/routing";
import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";

const historyOf = (path: string): NameHistory =>
  parseNameHistory(
    JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")).nameHistory
  ).data!;
const FULA = historyOf(
  "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json"
);
const BASSA_CAM = historyOf(
  "dataset/source/afrik/peuples/FLG_BANTU/PPL_BASSA_CAM.json"
);

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
      within(anchor).getByRole("button", { name: /voir les sources/ })
    ).toBeInTheDocument();
  });

  // « Ailleurs » stays elsewhere: a West African people meets an event from
  // East Africa, never one from its own region (Liberia, 1847).
  // @req REQ-198
  it("sets a subject against events from outside its own region", () => {
    render(
      <NameTimeline
        history={PEUL_HISTORY}
        searched="Peul"
        subjectType="people"
        countryIds={["SEN", "GIN"]}
        language="fr"
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Pendant ce temps, ailleurs" })
    );

    // The sentence's last word sits with its sources button, in a span.
    expect(document.body).toHaveTextContent(
      /l'Organisation de l'unité africaine, en 1963\./
    );
    expect(document.body).not.toHaveTextContent(/Liberia/);
  });
});

describe("NameTimeline — the sources behind a passage", () => {
  // @req REQ-194
  // @req REQ-198
  it("ends each sourced passage with a diamond named by its source type, never its tier", () => {
    renderLingala();
    const diamond = within(tiles()[1]).getByRole("button", {
      name: "Source : Archive, voir les sources",
    });

    expect(diamond).toHaveAttribute("data-family", "archive");
    expect(diamond.textContent).toBe("Source");
    expect(document.body).not.toHaveTextContent(
      /Référencée|Officielle|Non vérifiée|confiance/i
    );
  });

  // A no-break space alone lets the button wrap without the word (CSS Text
  // 3, 5.1): the last word and the button sit in one inline block.
  // @req REQ-198
  // @req REQ-194
  it("keeps the sources button with the passage's last word", () => {
    renderLingala();
    const diamond = within(tiles()[1]).getByRole("button", {
      name: /voir les sources/,
    });
    const tail = diamond.parentElement!;
    const statement = tail.closest("p")!;

    expect(diamond.previousSibling?.textContent?.endsWith("\u00a0")).toBe(true);
    expect(tail).toHaveClass("afh-source-tail");
    expect(tail.textContent).toMatch(/^\S+\u00a0Source$/);
    expect(statement.textContent).toBe(
      `${
        LINGALA_HISTORY.names[0].accounts.find((account) =>
          statement.textContent!.startsWith(account.statement.slice(0, 20))
        )!.statement
      }\u00a0Source`
    );
  });

  // @req REQ-194
  // @req REQ-198
  it("opens the sources of the passage, each with its type, and the colour key", async () => {
    renderLingala();
    fireEvent.click(
      within(tiles()[4]).getByRole("button", { name: /voir les sources/ })
    );

    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Lingala")).toBeInTheDocument();
    expect(
      within(sheet).getByText(
        "Grammaire et vocabulaire du lingala ou langue du Haut-Congo"
      )
    ).toBeInTheDocument();
    expect(
      within(sheet).getByRole("region", {
        name: "La couleur du losange indique le type de source",
      })
    ).toBeInTheDocument();
    expect(sheet).not.toHaveTextContent(/Référencée|Officielle/);
  });
});

describe("NameTimeline — from the searched name to the self-name (brief 11)", () => {
  const originalScroll = HTMLElement.prototype.scrollIntoView;
  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = originalScroll;
  });

  function renderPeul(searched = "peul", history = FULA) {
    return render(
      <NameTimeline
        history={history}
        searched={searched}
        subjectType="people"
        language="fr"
      />
    );
  }
  const lead = () => screen.getByRole("button", { name: /Vous avez cherché/ });
  const handOff = () =>
    screen.queryByRole("button", { name: /^Lire l'histoire du nom/ });

  // @req REQ-197
  // @req REQ-198
  it("says in the lead how many explanations the self-name has, with Peul still open", () => {
    renderPeul();

    expect(lead()).toHaveTextContent(
      "Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe.D'où vient le nom Fulɓe ? Les sources proposent cinq explications, sans que l'une l'emporte.Voir"
    );
    expect(
      screen.getByRole("button", { name: "Peul · cherché" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  // Two to six in words, higher in figures (brief 11 §1a).
  // @req REQ-197
  it("writes a count above six in figures", () => {
    const history = structuredClone(FULA);
    const fulbe = history.names.find((name) => name.nameText === "Fulɓe")!;
    const group = fulbe.accounts.filter((account) => account.hypothesisGroup);
    fulbe.accounts.push(structuredClone(group[0]), structuredClone(group[1]));
    renderPeul("peul", history);

    expect(lead()).toHaveTextContent("Les sources proposent 7 explications");
  });

  // @req REQ-197
  it("draws no count line when the self-name has no explanations tile", () => {
    render(
      <NameTimeline
        history={BASSA_CAM}
        searched="bassa"
        subjectType="people"
        language="fr"
      />
    );

    expect(lead()).toHaveTextContent(
      /^Vous avez cherché Bassa\. Ce peuple se nomme lui-même Basaa\.Voir$/
    );
  });

  // @req REQ-198
  it("hands the reader on to the self-name after the searched name's end line, off the thread", () => {
    renderPeul();
    const end = screen.getByText(
      "Fin de ce que nos recherches retracent pour le nom Peul."
    );
    const tile = handOff()!.closest("[data-handoff]") as HTMLElement;

    expect(tile).toHaveTextContent(
      "Leur nomFulɓeCe peuple se nomme lui-même Fulɓe. Ce nom a aussi son histoire : les sources proposent cinq explications de son origine, sans que l'une l'emporte.Lire l'histoire du nom Fulɓe"
    );
    expect(
      end.compareDocumentPosition(tile) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(tile.closest("ol")).toBeNull();
  });

  // @req REQ-198
  it("hands on without a count when the self-name has no explanations tile", () => {
    render(
      <NameTimeline
        history={BASSA_CAM}
        searched="bassa"
        subjectType="people"
        language="fr"
      />
    );

    expect(handOff()!.closest("[data-handoff]")).toHaveTextContent(
      "Leur nomBasaaCe peuple se nomme lui-même Basaa. Ce nom a aussi son histoire.Lire l'histoire du nom Basaa"
    );
  });

  // The page introduces the name before it explains it (doctrine §1.1): the
  // reader lands on the chips and the intro line, never on the explanations.
  // @req REQ-198
  it.each([
    ["the hand-off", () => handOff()!],
    ["the lead", () => lead()],
  ])(
    "opens the self-name from %s and brings the top of its timeline into view",
    (_, action) => {
      const scroll = vi.fn();
      HTMLElement.prototype.scrollIntoView = scroll;
      renderPeul();
      fireEvent.click(action());

      const fulbe = screen.getByRole("button", { name: "Fulɓe" });
      expect(fulbe).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("button", { name: "Peul · cherché" })
      ).toHaveAttribute("aria-pressed", "false");
      expect(scroll).toHaveBeenCalledTimes(1);
      expect(scroll.mock.contexts[0]).toBe(
        screen.getByRole("group", { name: "Les noms de Peul" })
      );
      expect(fulbe).toHaveFocus();
      // The intro line, its names in italics, opens Fulɓe's timeline.
      expect(
        screen.getByText(
          (_, element) =>
            element?.tagName === "P" &&
            element.textContent ===
              "Ils se nomment Fulɓe au pluriel et Pullo au singulier."
        )
      ).toBeInTheDocument();
    }
  );

  // @req REQ-198
  it("hands on no more once the self-name is open", () => {
    renderPeul();
    fireEvent.click(screen.getByRole("button", { name: "Fulɓe" }));

    expect(handOff()).not.toBeInTheDocument();
  });

  // @req REQ-198
  it("has no lead and no hand-off when the reader typed the self-name", () => {
    renderPeul("Fulɓe");

    expect(
      screen.queryByRole("button", { name: /Vous avez cherché/ })
    ).not.toBeInTheDocument();
    expect(handOff()).not.toBeInTheDocument();
  });

  // The video row belongs to the subject: it follows the hand-off, and stays
  // after the end line when another name is open (approval record, decision 2).
  // @req REQ-180
  it("sets the subject's video after the hand-off, whichever name is open", () => {
    render(
      <NameTimeline
        history={FULA}
        searched="peul"
        subjectType="people"
        language="fr"
        video={<p>Une vidéo</p>}
      />
    );
    const video = () => screen.getByText("Une vidéo");

    expect(
      handOff()!.compareDocumentPosition(video()) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Fulɓe" }));
    const end = screen.getByText(
      "Fin de ce que nos recherches retracent pour le nom Fulɓe."
    );
    expect(
      end.compareDocumentPosition(video()) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // @req REQ-198
  it("reports the open name, so the closing band can speak of it", () => {
    const onOpenNameChange = vi.fn();
    render(
      <NameTimeline
        history={FULA}
        searched="peul"
        subjectType="people"
        language="fr"
        onOpenNameChange={onOpenNameChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Fulɓe" }));

    expect(onOpenNameChange).toHaveBeenLastCalledWith("Fulɓe");
  });
});

describe("NameTimeline — consecutive tiles of one period (brief 11 §4)", () => {
  // @req REQ-198
  it("prints « Usage contemporain » once over Peul's two statements, each with its own sources button", () => {
    render(
      <NameTimeline
        history={FULA}
        searched="peul"
        subjectType="people"
        language="fr"
      />
    );
    const chronology = screen.getByRole("list", {
      name: /Histoire du nom Peul/,
    });
    const stations = within(chronology).getAllByRole("listitem");
    const peul = FULA.names.find((name) => name.nameText === "Peul")!;

    expect(stations).toHaveLength(3);
    expect(within(chronology).getAllByText("Usage contemporain")).toHaveLength(
      1
    );
    expect(stations[0]).toHaveTextContent(peul.accounts[0].statement);
    expect(stations[0]).toHaveTextContent(peul.accounts[1].statement);
    expect(
      within(stations[0]).getAllByRole("button", { name: /voir les sources/ })
    ).toHaveLength(2);
    expect(stations[2]).toHaveAttribute("data-placement", "birth");
  });
});
