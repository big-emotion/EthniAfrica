import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { peopleRecord } from "@/components/fiche/__tests__/corpusRecords";
import { PeopleDetailViewV2 } from "@/components/people/PeopleDetailViewV2";
import { NameFicheSourcesBlock } from "@/components/search/timeline/NameClosing";
import {
  ficheNameHistory,
  type NameHistory,
} from "@/lib/afrik/parsers/nameHistoryParser";
import { getLocalizedRoute } from "@/lib/routing";
import { PEUL_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import type { PeopleDetail } from "@/types/afrik-frontend";

vi.mock("@/hooks/use-consent", () => ({
  useOptionalConsent: () => null,
  useConsent: () => ({
    consentState: {
      hasConsented: true,
      preferences: { essential: true, analytics: false, functional: true },
      consentDate: null,
    },
    acceptAll: vi.fn(),
    rejectAll: vi.fn(),
    updatePreferences: vi.fn(),
    showBanner: false,
    setShowBanner: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const SEARCH = getLocalizedRoute("fr", "search");

/** Bassa as the corpus tells it: one name, an oral account among four. */
const BASSA: NameHistory = {
  summary: "Le nom Bassa désigne un peuple de langue krou du Liberia.",
  names: [
    {
      nameText: "Bassa",
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: 1904, to: 1904, label: "1904" },
          statement: "Le nom Bassa figure chez Maurice Delafosse.",
          sources: [
            {
              title: "Vocabulaires comparatifs",
              author: "Maurice Delafosse",
              year: 1904,
              url: null,
              tier: "referenced",
              source_kind: "academic",
            },
          ],
        },
        {
          period: { from: 2013, to: 2013, label: "Rapporté en 2013" },
          statement: "Le nom Bassa viendrait de Bah Saw Nyohn Bey.",
          sources: [
            {
              title: "How the Bassa Got Their Name",
              author: "Heath Vogel",
              year: 2013,
              url: null,
              tier: "referenced",
              source_kind: "oral_tradition",
              narrative: "Comment les Bassa ont reçu leur nom",
              carrier: "Abba Karnga",
              place: "Liberia",
            },
          ],
        },
      ],
    },
  ],
} as NameHistory;

// Brief 2, approved 2026-10-15: docs/design/mockups/site/people-*.dc.html.
describe("NameFicheSourcesBlock — « Les sources » on a fiche", () => {
  // @req REQ-198
  it("groups accounts by name and keeps every source group closed initially", () => {
    const { container } = render(
      <NameFicheSourcesBlock
        history={PEUL_HISTORY}
        subjectType="people"
        language="fr"
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Les sources des noms de ce peuple",
      })
    ).toBeInTheDocument();
    const groups = container.querySelectorAll("details[data-name-group]");
    expect(groups.length).toBe(
      PEUL_HISTORY.names.filter((name) => name.accounts.length > 0).length
    );
    for (const group of Array.from(groups)) {
      expect((group as HTMLDetailsElement).open).toBe(false);
    }
    if (PEUL_HISTORY.names[0].selfGiven) {
      expect(
        within(groups[0] as HTMLElement).getByText("Leur nom")
      ).toBeTruthy();
    }
  });

  // @req REQ-161
  it("puts the oral voice first and names it by its carrier and place", () => {
    const { container } = render(
      <NameFicheSourcesBlock
        history={BASSA}
        subjectType="people"
        language="fr"
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Les sources du nom Bassa",
      })
    ).toBeInTheDocument();
    const families = container.querySelectorAll("details[data-family]");
    expect(families[0].getAttribute("data-family")).toBe("oral");
    expect(families[0].textContent).toContain(
      "Comment les Bassa ont reçu leur nom · récit porté par Abba Karnga, Liberia · Tradition orale · rapporté par Heath Vogel, 2013, « How the Bassa Got Their Name »"
    );
    expect(container.textContent).not.toMatch(/fiable|Référencée|tier/i);
  });
});

describe("PeopleDetailViewV2 — the end of the fiche (brief 2)", () => {
  const people: PeopleDetail = {
    id: "PPL_BASSA",
    nameMain: "Bassa",
    languageFamilyId: "FLG_KROU",
    languageFamilyName: "Krou",
    currentCountries: ["LBR"],
    appellations: { mainName: "Bassa", selfAppellation: "Bassa" },
    sources: [],
  };

  // @req REQ-198
  it("closes on the silences and the invitation instead of the amend band", () => {
    const { container } = render(
      <PeopleDetailViewV2 people={people} language="fr" nameHistory={BASSA} />
    );

    expect(container.querySelector("[data-name-sources]")).not.toBeNull();
    const band = container.querySelector("[data-name-closing]");
    expect(band?.textContent).toContain(
      "La plus ancienne trace datée que le projet connaît est de 1904."
    );
    // An oral account exists, so no line says one is missing.
    expect(band?.textContent).not.toContain("transmis oralement");
    expect(
      screen.queryByRole("link", { name: "Compléter cette page" })
    ).toBeNull();
  });

  // @req REQ-198
  it("sets the name from its closing silence in italics", () => {
    const { container } = render(
      <PeopleDetailViewV2 people={people} language="fr" nameHistory={BASSA} />
    );

    expect(container.querySelector("[data-name-closing] em")?.textContent).toBe(
      "Bassa"
    );
  });

  // @req REQ-198
  it("keeps the amend band on a fiche without a name history", () => {
    const { container } = render(
      <PeopleDetailViewV2 people={people} language="fr" />
    );

    expect(container.querySelector("[data-name-sources]")).toBeNull();
    expect(container.querySelector("[data-name-closing]")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Compléter cette page" })
    ).toBeInTheDocument();
  });
});

/** A people's name history as the loader reads it from the corpus. */
function corpusNameHistory(path: string, id: string): NameHistory {
  const raw = JSON.parse(
    readFileSync(
      join(process.cwd(), "dataset/source/afrik/peuples", path),
      "utf8"
    )
  ) as { nameHistory?: unknown };
  return ficheNameHistory(raw, id) as NameHistory;
}

// Brief 10 §1, approved 2026-10-17: docs/design/mockups/site/people-*.dc.html.
describe("PeopleDetailViewV2 — the link to the story of its name", () => {
  // @req REQ-198
  it("ends « D'où vient le nom ? » with the link to its leading name, before « Les autres noms »", () => {
    const { container } = render(
      <PeopleDetailViewV2
        people={peopleRecord("PPL_ZARMA")}
        language="fr"
        nameHistory={corpusNameHistory(
          "FLG_SONGHAY/PPL_ZARMA.json",
          "PPL_ZARMA"
        )}
      />
    );

    const answer = container.querySelector(
      `[data-fiche-section="D'où vient le nom ?"]`
    ) as HTMLElement;
    const link = within(answer).getByRole("link", {
      name: /^Suivre l'histoire du nom Zarma/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}/zarma`);
    expect(answer.lastElementChild).toBe(link.closest(".ea-story"));
    const others = container.querySelector(
      '[data-fiche-section="Les autres noms"]'
    );
    expect(others).not.toBeNull();
    expect(
      link.compareDocumentPosition(others as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // The board people-fula draws « Suivre l'histoire du nom Fulɓe ». The people
  // is filed « Peul », and the search answers it under every name its history
  // tells (ETNI-2093), so the page behind the link keeps its promise.
  // @req REQ-198
  it("draws « Suivre l'histoire du nom Fulɓe » on PPL_FULA, as the board people-fula does", () => {
    const { container } = render(
      <PeopleDetailViewV2
        people={peopleRecord("PPL_FULA")}
        language="fr"
        nameHistory={corpusNameHistory(
          "FLG_ATLANTIQUE/PPL_FULA.json",
          "PPL_FULA"
        )}
      />
    );

    const answer = container.querySelector(
      `[data-fiche-section="D'où vient le nom ?"]`
    ) as HTMLElement;
    const link = within(answer).getByRole("link", {
      name: /^Suivre l'histoire du nom Fulɓe/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}/ful%C9%93e`);
  });

  // @req REQ-198
  it("draws no link and no hint on a fiche without a name story", () => {
    render(
      <PeopleDetailViewV2 people={peopleRecord("PPL_ZARMA")} language="fr" />
    );

    expect(
      screen.queryByRole("link", { name: /Suivre l'histoire du nom/ })
    ).toBeNull();
    expect(screen.queryByText(/La page du nom présente/)).toBeNull();
  });
});
