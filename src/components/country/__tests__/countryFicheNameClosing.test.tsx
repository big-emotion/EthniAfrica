import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CountryRecordView } from "@/components/country/CountryRecordView";
import { countryRecord } from "@/components/fiche/__tests__/corpusRecords";
import {
  countryPeopleCount,
  shortSourceName,
} from "@/lib/countryDataTransformer";
import { getLocalizedRoute } from "@/lib/routing";

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

// Brief 5, approved 2026-10-15: docs/design/mockups/site/country-*.dc.html.
describe("CountryRecordView — the names of a country and the end of its fiche", () => {
  // @req REQ-198
  it("lists the names of the sourced history and folds the readings of Côte de Quaqua", () => {
    const { container } = render(
      <CountryRecordView country={countryRecord("CIV")} language="fr" />
    );

    const rows = Array.from(
      container.querySelectorAll('[data-testid="name-story-form"]')
    ).map((row) => row.getAttribute("data-form"));
    expect(rows).toEqual([
      "Côte d'Ivoire",
      "Côte des Dents",
      "Costa de Malagens",
      "Côte de Quaqua",
      "Établissements français de la Côte d'Or",
    ]);

    const folded = container.querySelectorAll("details[data-form-readings]");
    expect(folded).toHaveLength(1);
    const quaqua = folded[0] as HTMLDetailsElement;
    expect(quaqua.open).toBe(false);
    expect(quaqua.querySelector("summary")?.textContent).toBe(
      "Côte de Quaqua3 explications"
    );
    expect(
      quaqua.querySelectorAll(".afh-name-timeline-hypothesis")
    ).toHaveLength(3);
  });

  // @req REQ-198
  // @req REQ-161
  it("tells who speaks for the names, then closes on the silences", () => {
    const { container } = render(
      <CountryRecordView country={countryRecord("CIV")} language="fr" />
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Les sources des noms de ce pays",
      })
    ).toBeInTheDocument();
    const lines = Array.from(
      container.querySelectorAll("[data-name-closing] li")
    ).map((line) => line.textContent);
    expect(lines).toEqual([
      "Aucun récit transmis oralement n’est enregistré pour les noms de ce pays.",
      "Aucune trace du nom Côte d'Ivoire plus ancienne que 1670 n’est connue du projet.",
      "Les trois explications du nom Côte de Quaqua ne sont pas datées.",
    ]);
    expect(screen.queryByTestId("fiche-amend-band")).toBeNull();
  });

  // CIV lists six shares, the last « Autres peuples » with no fiche: « En
  // bref » said 6 where « Peuples du pays » said 5 peuples.
  // @req REQ-151
  it("counts in « En bref » the peoples « Peuples du pays » counts", () => {
    const country = countryRecord("CIV");
    const { container } = render(
      <CountryRecordView country={country} language="fr" />
    );

    const figure = container.querySelector(
      '[data-testid="stat-card-peoples"] .afh-stat-card-n'
    );
    expect(figure?.textContent).toBe("5");
    expect(screen.getAllByText("5 peuples").length).toBeGreaterThan(0);
    expect(countryPeopleCount(country)).toBe(5);
  });

  // @req REQ-115
  it("gives the population its source and its year", () => {
    render(<CountryRecordView country={countryRecord("CIV")} language="fr" />);

    expect(screen.getAllByText("UNFPA, 2025").length).toBeGreaterThan(0);
    expect(shortSourceName("UNFPA – World Population Dashboard")).toBe("UNFPA");
  });

  // @req REQ-198
  it("says that two countries bear the name, under the names", () => {
    const { container } = render(
      <CountryRecordView
        country={countryRecord("COG")}
        language="fr"
        sharedName={{
          name: "Congo",
          self: "la République du Congo",
          other: "la République démocratique du Congo",
        }}
      />
    );

    const note = container.querySelector("[data-shared-name]");
    expect(note?.textContent).toBe(
      "Deux pays portent le nom Congo : la République du Congo, dont parle cette page, et la République démocratique du Congo. Ce sont deux pays différents."
    );
    // Under the names, before the figures of « En bref ».
    const story = container.querySelector('[data-testid="fiche-name-story"]');
    expect(
      story!.compareDocumentPosition(note!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

// Brief 10 §1, approved 2026-10-17: docs/design/mockups/site/country-*.dc.html.
describe("CountryRecordView — the link to the story of its name", () => {
  // @req REQ-198
  it("holds in « En bref » the link to Côte d'Ivoire, after the lead and « Lire la suite », before the names", () => {
    const { container } = render(
      <CountryRecordView country={countryRecord("CIV")} language="fr" />
    );

    const brief = container.querySelector(
      '[data-fiche-section="En bref"]'
    ) as HTMLElement;
    const link = within(brief).getByRole("link", {
      name: /^Suivre l'histoire du nom Côte d'Ivoire/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}/c%C3%B4te%20d'ivoire`);
    expect(screen.getByTestId("name-story-lead").textContent).toBe(
      "Le nom Côte d'Ivoire renvoie au commerce de l'ivoire pratiqué le long du littoral."
    );
    const readMore = brief.querySelector("[data-name-story-more]") as Node;
    const firstRow = brief.querySelector(
      '[data-testid="name-story-form"]'
    ) as Node;
    expect(
      readMore.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      link.compareDocumentPosition(firstRow) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // @req REQ-198
  it("names Gabon and Congo on their own fiches", () => {
    render(<CountryRecordView country={countryRecord("GAB")} language="fr" />);
    expect(
      screen.getByRole("link", { name: /^Suivre l'histoire du nom Gabon/ })
    ).toHaveAttribute("href", `${SEARCH}/gabon`);
    cleanup();

    render(<CountryRecordView country={countryRecord("COG")} language="fr" />);
    expect(
      screen.getByRole("link", { name: /^Suivre l'histoire du nom Congo/ })
    ).toHaveAttribute("href", `${SEARCH}/congo`);
  });

  // Brief 10 §2 (REQ-153 as amended), board country-civ.
  // @req REQ-153
  it("folds « Histoire », « Culture et société » and the long names list, and never « En bref » or who tells the names", () => {
    const { container } = render(
      <CountryRecordView country={countryRecord("CIV")} language="fr" />
    );

    const closedLabel = (selector: string) =>
      container.querySelector(
        `${selector} details.ea-fold > summary [data-when="closed"]`
      )?.textContent;
    expect(closedLabel('[data-fiche-section="Histoire"]')).toBe(
      "+ Voir aussi : 5 entités politiques, Royaume de Kong, Colonie de Côte d'Ivoire, République de Côte d'Ivoire"
    );
    expect(closedLabel('[data-fiche-section="Culture et société"]')).toBe(
      "+ Voir aussi : Modes de vie, Organisation, Relations, Traditions"
    );
    for (const block of [
      '[data-fiche-section="En bref"]',
      '[data-fiche-section="Peuples du pays"]',
      '[data-fiche-section="Langues"]',
      "[data-name-sources]",
      "[data-name-closing]",
      '[data-fiche-section="Sources"]',
    ]) {
      expect(container.querySelector(block)).not.toBeNull();
      expect(container.querySelector(`${block} .ea-fold`)).toBeNull();
    }
  });

  // TZA is filed « République-Unie de Tanzanie » and its story leads with
  // « Tanzanie », which the search answers it under since it reads every name
  // a history tells (ETNI-2093).
  // @req REQ-198
  it("draws « Suivre l'histoire du nom Tanzanie » on TZA, its story's leading name", () => {
    const { container } = render(
      <CountryRecordView country={countryRecord("TZA")} language="fr" />
    );

    const brief = container.querySelector(
      '[data-fiche-section="En bref"]'
    ) as HTMLElement;
    const link = within(brief).getByRole("link", {
      name: /^Suivre l'histoire du nom Tanzanie/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}/tanzanie`);
  });

  // @req REQ-198
  it("draws no link on a country without a name story", () => {
    const { nameHistory: _none, ...withoutHistory } = countryRecord("CIV");
    render(<CountryRecordView country={withoutHistory} language="fr" />);

    expect(
      screen.queryByRole("link", { name: /Suivre l'histoire du nom/ })
    ).toBeNull();
  });
});
