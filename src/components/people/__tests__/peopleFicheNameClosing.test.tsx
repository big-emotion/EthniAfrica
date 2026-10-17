import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PeopleDetailViewV2 } from "@/components/people/PeopleDetailViewV2";
import { NameFicheSourcesBlock } from "@/components/search/timeline/NameClosing";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
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
  it("groups the accounts by name first, the first name open and marked as theirs", () => {
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
    expect((groups[0] as HTMLDetailsElement).open).toBe(true);
    for (const group of Array.from(groups).slice(1)) {
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
