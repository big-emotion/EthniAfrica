import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LanguageFamilyDetailViewV2 } from "@/components/family/LanguageFamilyDetailViewV2";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { getLocalizedRoute } from "@/lib/routing";
import type { LanguageFamily } from "@/types/afrik";

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

/** Mandé as the corpus tells it, cut down: the family's name and Manden. */
const MANDE_HISTORY = {
  summary: "Le nom mandé désigne une famille de langues d'Afrique de l'Ouest.",
  names: [
    {
      nameText: "Mandé",
      nameStatus: "current",
      selfGiven: false,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: 1867, to: 1867, label: "1867" },
          birth: true,
          statement: "Le nom mandé apparaît chez H. Steinthal.",
          sources: [
            {
              title: "Die Mande-Neger-Sprachen",
              author: "H. Steinthal",
              year: 1867,
              url: null,
              tier: "referenced",
              source_kind: "archive",
            },
          ],
        },
      ],
    },
    {
      nameText: "Manden",
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: "man",
      namedBy: null,
      accounts: [
        {
          period: {
            from: null,
            to: 1235,
            label: "Avant Soundiata, selon la tradition",
          },
          statement:
            "Le nom Manden est l'autre nom du royaume de Kiri, selon les traditions orales.",
          sources: [
            {
              title: "Histoire générale de l'Afrique, IV, ch. 6",
              author: "Djibril Tamsir Niane",
              year: 1985,
              url: null,
              tier: "official",
              source_kind: "intergovernmental",
            },
            {
              title: "Traditions des écoles de griots du Manden",
              author: "Écoles de griots du Manden",
              year: null,
              url: null,
              tier: "unverified",
              source_kind: "oral_tradition",
            },
          ],
        },
        {
          period: { from: 1854, to: 1854, label: "1854" },
          statement: "Le nom Manden est noté Mánde par Sigismund Koelle.",
          sources: [
            {
              title: "Polyglotta Africana",
              author: "Sigismund Wilhelm Koelle",
              year: 1854,
              url: null,
              tier: "referenced",
              source_kind: "linguistic_reference",
            },
          ],
        },
      ],
    },
  ],
} as NameHistory;

const MANDE: LanguageFamily = {
  id: "FLG_MANDE",
  nameFr: "Mandé",
  nameHistory: MANDE_HISTORY,
  content: {
    generalInfo: {
      branches: ["Eastern Mande", "Western Mande"],
      numberOfLanguages: 75,
      totalSpeakers: 60000000,
      figureNotes: {
        numberOfLanguages: { note: "Selon Glottolog, édition 5.3" },
        totalSpeakers: { unsourced: true },
      },
    },
    distribution: {
      totalSpeakers: 60000000,
      distributionByCountry: { SEN: 465052, CIV: 6433783 },
    },
  },
};

const BANTOU: LanguageFamily = {
  id: "FLG_BANTU",
  nameFr: "Bantou",
  classificationStatus: "colonial-legacy",
  content: {
    generalInfo: { branches: [], numberOfLanguages: 500 },
  },
};

// Brief 4, approved 2026-10-15: docs/design/mockups/site/family-*.dc.html.
describe("LanguageFamilyDetailViewV2 — the names and the end of the fiche", () => {
  // @req REQ-198
  // @req REQ-161
  it("tells who reports an oral tradition that has no carrier", () => {
    const { container } = render(
      <LanguageFamilyDetailViewV2 family={MANDE} language="fr" />
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Les sources des noms de cette famille de langues",
      })
    ).toBeInTheDocument();
    const oral = container.querySelector('details[data-family="oral"]');
    expect(oral?.textContent).toContain(
      "Traditions des écoles de griots du Manden · Tradition orale · rapportées par Djibril Tamsir Niane, 1985, « Histoire générale de l'Afrique, IV, ch. 6 »"
    );
    expect(oral?.textContent).not.toContain("récit porté par");
    // The work that wrote the tradition down is named in its line, not
    // counted again as a public report.
    expect(container.querySelector('details[data-family="report"]')).toBeNull();
  });

  // @req REQ-198
  it("closes on the silences, the declared countries last", () => {
    const { container } = render(
      <LanguageFamilyDetailViewV2 family={MANDE} language="fr" />
    );

    const band = container.querySelector("[data-name-closing]");
    const lines = Array.from(band?.querySelectorAll("li") ?? []).map(
      (line) => line.textContent
    );
    expect(lines).toEqual([
      "Les traditions orales sur le nom Manden ne nous parviennent que par Djibril Tamsir Niane. Le projet n’a pas encore de récit recueilli auprès de celles et ceux qui les transmettent.",
      "Aucune trace du nom Mandé plus ancienne que 1867 n’est connue du projet.",
      "Pays par pays, le nombre de personnes qui parlent ces langues n’est donné que pour deux pays : Sénégal et Côte d'Ivoire.",
    ]);
  });

  // @req REQ-119
  it("says what each figure is worth, an unsourced one in the caveat tone", () => {
    render(<LanguageFamilyDetailViewV2 family={MANDE} language="fr" />);

    expect(
      within(screen.getByTestId("stat-card-langues")).getByText(
        "Selon Glottolog, édition 5.3"
      )
    ).toBeInTheDocument();
    const speakers = within(
      screen.getByTestId("stat-card-locuteurs")
    ).getByText(
      "Une estimation que la fiche ne rattache pas encore à une source"
    );
    expect(speakers).toHaveAttribute("data-caveat");
    expect(screen.queryByTestId("stat-card-distribution")).toBeNull();
  });

  // @req REQ-023
  it("states a colonial classification in a sentence above the figures", () => {
    const { container } = render(
      <LanguageFamilyDetailViewV2 family={BANTOU} language="fr" />
    );

    expect(
      container.querySelector('[data-classification="colonial-legacy"]')
        ?.textContent
    ).toBe(
      "Ce regroupement de langues est une catégorie héritée de la période coloniale. Nous la conservons et nous expliquons pourquoi plus bas, dans « Appellations et décolonisation »."
    );
    // No name history: the page keeps the end it had.
    expect(container.querySelector("[data-name-closing]")).toBeNull();
    expect(container.querySelector("[data-name-sources]")).toBeNull();
  });
});
