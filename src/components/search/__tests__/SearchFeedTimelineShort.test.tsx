import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { getLocalizedRoute } from "@/lib/routing";
import type { SearchResult } from "@/types/afrik-frontend";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

const FULA = parseNameHistory(
  JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json"
      ),
      "utf8"
    )
  ).nameHistory
).data!;

const peul: SearchResult = {
  type: "people",
  id: "PPL_FULA",
  name: "Peul",
  nameEn: "Fula",
  exactMatch: true,
  naming: {
    forms: [],
    eras: [],
    presentation: { forms: [], eras: [], disagreements: [], evidence: [] },
  },
};

type Short = SearchCompanionsData["shorts"]["items"][number];
const short = (overrides: Partial<Short>): Short => ({
  id: "short-fulbe",
  href: "/fr/decouvertes/videos/fulbe",
  name: "Fulbe",
  description: "D'où vient le nom que les Peuls se donnent.",
  publishedAt: "2026-09-01",
  durationSeconds: 155,
  watchUrl: "https://www.youtube.com/watch?v=fulbe",
  poster: {
    src: "/media/shorts/fulbe.jpg",
    alt: "Affiche de la vidéo sur le nom Fulbe",
    width: 1080,
    height: 1920,
  },
  source: { title: "EthniAfrica", url: null, tier: "referenced" },
  match: { relation: "exact", entityType: "people", entityId: "PPL_FULA" },
  ...overrides,
});

function companionsWith(items: Short[]): SearchCompanionsData {
  return {
    subjects: [{ entityType: "people", entityId: "PPL_FULA" }],
    shorts: { count: items.length, items },
    anecdotes: { count: 0, items: [] },
    proverbs: { count: 0, items: [] },
    quiz: { count: 0, item: null },
  } as SearchCompanionsData;
}

function renderPeul(
  items: Short[],
  onResultNavigate?: (type: string, rank: number, surface?: string) => void
) {
  return render(
    <SearchFeed
      query="peul"
      language="fr"
      state="exact"
      results={[peul]}
      subjects={[peul]}
      leads={[]}
      companions={companionsWith(items)}
      nameHistories={[{ subject: peul, nameHistory: FULA }]}
      onResultNavigate={onResultNavigate}
    />
  );
}

const videoRow = () => screen.queryByRole("link", { name: /Une vidéo sur/ });
const follows = (first: Node, second: Node) =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  );

describe("SearchFeed — one video made on the subject, in « Histoire du nom » (brief 11 §2)", () => {
  // @req REQ-198
  it("places the collapsed lens summary after the timeline introduction and before the name choices", () => {
    const { container } = renderPeul([short({})]);
    const intro = container.querySelector("[data-timeline-summary]")!;
    const seeAlso = screen.getByRole("button", { name: /^Voir aussi :/ });
    const names = screen.getByRole("group", { name: "Les noms de Peul" });

    expect(follows(intro, seeAlso)).toBe(true);
    expect(follows(seeAlso, names)).toBe(true);
    expect(seeAlso).toHaveAttribute("aria-expanded", "false");
  });

  // @req REQ-180
  // @req REQ-181
  it("shows the first piece made on the subject once, after the hand-off and before the fiche link", () => {
    renderPeul([
      short({
        match: {
          relation: "linked-family",
          entityType: "languageFamily",
          entityId: "FLG_ATLANTIQUE",
        },
        id: "around",
        href: "/fr/decouvertes/videos/atlantique",
        name: "Atlantique",
      }),
      short({}),
      short({
        id: "second",
        href: "/fr/decouvertes/videos/peul",
        name: "Peul",
      }),
    ]);

    const row = videoRow()!;
    expect(screen.getAllByRole("link", { name: /Une vidéo sur/ })).toHaveLength(
      1
    );
    expect(row).toHaveAttribute("href", "/fr/decouvertes/videos/fulbe");
    expect(row).toHaveTextContent(
      // The title comes through formatProductionNameQuestion, as on the shelf.
      "Une vidéo sur ce peupleD’où vient le nom « Fulbe » ?2 min 35"
    );
    // The poster is decorative: the title names the link. Nothing plays
    // until the reader follows it (REQ-181).
    expect(row.querySelector("img")).toHaveAttribute("alt", "");
    expect(row.querySelector("video, iframe")).toBeNull();
    expect(
      follows(
        screen.getByRole("button", { name: "Lire l'histoire du nom Fulɓe" }),
        row
      )
    ).toBe(true);
    expect(
      follows(row, screen.getByRole("link", { name: /Voir la fiche complète/ }))
    ).toBe(true);
  });

  // An « Autour de ce nom » piece stays in the Shorts filter, and its
  // absence leaves no empty slot (charter « What left Tout », amended).
  // @req REQ-180
  it.each([
    ["linked-family", "languageFamily", "FLG_ATLANTIQUE"],
    ["linked-people", "people", "PPL_WOLOF"],
    ["linked-country", "country", "SEN"],
  ] as const)(
    "draws no row and no slot for a %s piece",
    (relation, entityType, entityId) => {
      renderPeul([short({ match: { relation, entityType, entityId } })]);

      expect(videoRow()).not.toBeInTheDocument();
      expect(document.body).not.toHaveTextContent(/Une vidéo sur/);
    }
  );

  // « 0 min 35 » and « 2 min 00 » are not how French says a duration
  // (reader-facing register); the brief's « 2 min 35 » stays as it is.
  // @req REQ-180
  it.each([
    [35, "35 s"],
    [120, "2 min"],
    [155, "2 min 35"],
  ])("writes a %i s piece as « %s »", (durationSeconds, spoken) => {
    renderPeul([short({ durationSeconds })]);

    expect(
      videoRow()!.querySelector(".afh-name-timeline-video-meta")
    ).toHaveTextContent(new RegExp(`^${spoken}$`));
  });

  // @req REQ-180
  it("draws no row when the subject has no short", () => {
    renderPeul([]);

    expect(videoRow()).not.toBeInTheDocument();
  });

  // @req REQ-180
  // @req REQ-046
  it("files a click on the row under its own surface", () => {
    const onResultNavigate = vi.fn();
    renderPeul([short({})], onResultNavigate);
    fireEvent.click(videoRow()!);

    expect(onResultNavigate).toHaveBeenCalledWith("short", 1, "timeline_short");
  });

  // Approval record, decision 2: the row belongs to the subject.
  // @req REQ-180
  it("keeps the row after the end line when the self-name is open", () => {
    renderPeul([short({})]);
    fireEvent.click(screen.getByRole("button", { name: "Fulɓe" }));

    expect(
      follows(
        screen.getByText(
          "Fin de ce que nos recherches retracent pour le nom Fulɓe."
        ),
        videoRow()!
      )
    ).toBe(true);
  });
});

describe("SearchFeed — the closing band follows the open name (brief 11 §1d)", () => {
  // @req REQ-198
  it("speaks of Peul with Peul open, and of Fulɓe once Fulɓe is open", () => {
    renderPeul([]);

    expect(document.body).toHaveTextContent(
      /Aucun récit transmis oralement n.est enregistré pour le nom Peul\./
    );

    fireEvent.click(screen.getByRole("button", { name: "Fulɓe" }));

    expect(document.body).toHaveTextContent(
      /Aucun récit transmis oralement n.est enregistré pour le nom Fulɓe\./
    );
    expect(document.body).toHaveTextContent(
      /Avant sa plus ancienne trace connue du projet, l.histoire du nom Fulɓe reste à écrire\./
    );
    expect(document.body).not.toHaveTextContent(
      /enregistré pour le nom Peul\./
    );
  });

  // @req REQ-198
  it("sets the open timeline name in italics inside the closing band", () => {
    const { container } = renderPeul([]);

    expect(container.querySelector("[data-name-closing] em")).toHaveTextContent(
      "Peul"
    );

    fireEvent.click(screen.getByRole("button", { name: "Fulɓe" }));

    expect(container.querySelector("[data-name-closing] em")).toHaveTextContent(
      "Fulɓe"
    );
  });

  // @req REQ-198
  it("sets an unwritten subject name in italics in the shared timeline closing", () => {
    const unwritten: SearchResult = {
      ...peul,
      id: "PPL_WOLOF",
      name: "Wolof",
      nameEn: "Wolof",
    };
    const { container } = render(
      <SearchFeed
        query="peul"
        language="fr"
        state="exact"
        results={[peul, unwritten]}
        subjects={[peul, unwritten]}
        leads={[]}
        companions={companionsWith([])}
        nameHistories={[{ subject: peul, nameHistory: FULA }]}
      />
    );

    expect(
      Array.from(container.querySelectorAll("[data-name-closing] em")).some(
        (name) => name.textContent === "Wolof"
      )
    ).toBe(true);
  });

  // @req REQ-198
  it("sets the unknown searched name in italics in the standalone closing", () => {
    const { container } = render(
      <SearchFeed
        query="zzqxv"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={companionsWith([])}
      />
    );

    expect(container.querySelector("[data-name-closing] em")).toHaveTextContent(
      "zzqxv"
    );
  });

  // @req REQ-198
  it("sets the unknown searched name in italics in the owed closing", () => {
    const { container } = render(
      <SearchFeed
        query="zzqxv"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={companionsWith([])}
        wordAnswers={[
          {
            kind: "word",
            title: "zzqxv",
            what: { facts: {} },
            names: [],
            sources: { count: 0 },
            queries: ["zzqxv"],
          },
        ]}
      />
    );

    expect(container.querySelector("[data-name-closing] em")).toHaveTextContent(
      "zzqxv"
    );
  });

  // « Tout » unmounts the timeline: the page keeps the reader's choice, so
  // that coming back the chips and the band still name the same name.
  // @req REQ-198
  it("keeps the open name through « Tout » and back, in the chips and in the band", () => {
    renderPeul([]);
    fireEvent.click(screen.getByRole("button", { name: "Fulɓe" }));
    fireEvent.click(screen.getByRole("button", { name: /^Voir aussi/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tout" }));
    fireEvent.click(screen.getByRole("button", { name: "Histoire du nom" }));

    expect(screen.getByRole("button", { name: "Fulɓe" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /^Peul/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(document.body).toHaveTextContent(
      /Aucun récit transmis oralement n.est enregistré pour le nom Fulɓe\./
    );
    expect(document.body).not.toHaveTextContent(
      /enregistré pour le nom Peul\./
    );
  });
});
