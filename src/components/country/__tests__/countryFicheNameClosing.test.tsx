import { cleanup, render, screen } from "@testing-library/react";
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
