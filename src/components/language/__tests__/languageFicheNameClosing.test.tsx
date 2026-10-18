import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FicheNameReadings } from "@/components/fiche/FicheNameReadings";
import { LanguageDetailViewV2 } from "@/components/language/LanguageDetailViewV2";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import type { LanguagePageData } from "@/lib/languageDataTransformer";
import { getLocalizedRoute } from "@/lib/routing";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const SEARCH = getLocalizedRoute("fr", "search");

type Account = NameHistory["names"][number]["accounts"][number];

const source = (title: string): Account["sources"][number] => ({
  title,
  author: "Auteur",
  year: 2024,
  url: null,
  tier: "referenced",
  source_kind: "academic",
});

const reading = (
  label: string,
  statement: string,
  from: number | null
): Account => ({
  period: { from, to: from, label },
  statement,
  hypothesisGroup: "origine du nom lingala",
  sources: [source(label)],
});

/** Lingala as the corpus tells it, shortened: one name, four readings. */
const LINGALA: NameHistory = {
  summary: "Le nom lingala désigne une langue du bassin du Congo.",
  names: [
    {
      nameText: "Lingala",
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: 1902, to: 1902, label: "1902" },
          statement: "Le nom lingala apparaît par écrit en 1902.",
          birth: true,
          sources: [source("Lingala")],
        },
        reading(
          "1901-1902",
          "Le nom lingala aurait été choisi par les missionnaires.",
          1901
        ),
        reading(
          "Avant 1901, selon cette lecture",
          "Le nom lingala viendrait du bobangi.",
          null
        ),
        reading(
          "Origine non datée",
          "Le nom lingala aurait été formé par des locuteurs du libinza.",
          null
        ),
        reading(
          "Origine non datée",
          "Le nom lingala viendrait de mongálá.",
          null
        ),
      ],
    },
  ],
} as NameHistory;

const lingala: LanguagePageData = {
  id: "lin",
  name: "Lingala",
  nameProvenance: "sourced",
  isoCode639_3: "lin",
  glottocode: "ling1263",
  nameEn: "Lingala",
  alternateNames: ["Bangala", "Mangala"],
  spellingAliases: [],
  dialects: [],
  family: { id: "FLG_BANTU", name: "Bantou" },
  speakingPeoples: [{ id: "PPL_LINGALA", name: "Lingala (locuteurs)" }],
  vehicularRole: "regional_lingua_franca",
  vitalityStatus: null,
  sources: [],
  nameHistory: LINGALA,
  gaps: ["Nous n'avons pas trouvé la date de la première grammaire."],
};

// Brief 3, approved 2026-10-15: docs/design/mockups/site/language-*.dc.html.
describe("FicheNameReadings — the competing readings of a name", () => {
  // @req REQ-198
  it("shows every account of the group, numbered in the corpus's order", () => {
    const { container } = render(
      <FicheNameReadings history={LINGALA} language="fr" />
    );

    const tags = Array.from(
      container.querySelectorAll(".afh-name-timeline-tag"),
      (tag) => tag.textContent
    );
    expect(tags).toEqual([
      "Hypothèse 1 · 1901-1902",
      "Hypothèse 2 · Avant 1901, selon cette lecture",
      "Hypothèse 3 · Origine non datée",
      "Hypothèse 4 · Origine non datée",
    ]);
    expect(container.textContent).not.toMatch(/fiable|probable|tier/i);
  });

  // @req REQ-198
  it("draws nothing for a name with a single account per group", () => {
    const { container } = render(
      <FicheNameReadings
        history={{
          ...LINGALA,
          names: [
            {
              ...LINGALA.names[0],
              accounts: LINGALA.names[0].accounts.slice(0, 2),
            },
          ],
        }}
        language="fr"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("LanguageDetailViewV2 — the language fiche of brief 3", () => {
  // @req REQ-198
  it("tells who speaks for the names and closes on what the fiche does not know", () => {
    const { container } = render(
      <LanguageDetailViewV2 data={lingala} language="fr" />
    );

    expect(
      screen.getByRole("heading", { name: "Qui raconte le nom Lingala ?" })
    ).toBeInTheDocument();
    expect(container.querySelector("[data-readings]")).not.toBeNull();
    const band = container.querySelector("[data-name-closing]") as HTMLElement;
    for (const line of [
      "Aucune trace du nom Lingala plus ancienne que 1902 n’est connue du projet.",
      "Nous n'avons pas trouvé la date de la première grammaire.",
      "La vitalité du lingala n’est pas encore renseignée dans le projet.",
      "Les dialectes du lingala ne sont pas encore renseignés dans le projet.",
    ]) {
      expect(within(band).getByText(line)).toBeInTheDocument();
    }
  });

  // @req REQ-198
  it("drops the empty vitality and dialects chapters instead of saying they are empty", () => {
    render(<LanguageDetailViewV2 data={lingala} language="fr" />);

    expect(screen.queryByRole("heading", { name: "Vitalité" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Dialectes" })).toBeNull();
  });

  // @req REQ-198
  it("says the vehicular role in French and that a language is not a people", () => {
    const { container } = render(
      <LanguageDetailViewV2 data={lingala} language="fr" />
    );

    expect(
      screen.getByText("Langue commune à plusieurs régions")
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-shared-name]")?.textContent
    ).toContain(
      "« Lingala (locuteurs) » désigne ici l’ensemble des gens qui parlent le lingala"
    );
  });
});

// Brief 10 §1, approved 2026-10-17: docs/design/mockups/site/language-*.dc.html.
describe("LanguageDetailViewV2 — the link to the story of its name", () => {
  // @req REQ-198
  it("ends « L’histoire des noms » with the link, after the explanations, before « Les sources parlent »", () => {
    const { container } = render(
      <LanguageDetailViewV2 data={lingala} language="fr" />
    );

    const chapter = container.querySelector(
      '[data-fiche-section="L’histoire des noms"]'
    ) as HTMLElement;
    const link = within(chapter).getByRole("link", {
      name: /^Suivre l'histoire du nom Lingala/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}/lingala`);
    expect(chapter.lastElementChild).toBe(link.closest(".ea-story"));
    const readings = chapter.querySelector("[data-readings]") as Node;
    expect(
      readings.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    const sources = container.querySelector("[data-name-sources]") as Node;
    expect(
      link.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // @req REQ-198
  it("spells the name as its story does, Kihavu and not the h1's Havu", () => {
    const havu: LanguagePageData = {
      ...lingala,
      id: "hav",
      name: "Havu",
      isoCode639_3: "hav",
      nameEn: "Havu",
      alternateNames: ["Kihavu", "Haavu"],
      nameHistory: {
        summary: "Le nom kihavu désigne la langue des Havu.",
        names: [
          { ...LINGALA.names[0], nameText: "Kihavu", accounts: [] },
          { ...LINGALA.names[0], nameText: "Haavu", accounts: [] },
        ],
      } as NameHistory,
    };
    render(<LanguageDetailViewV2 data={havu} language="fr" />);

    // Kihavu is not the name hav is filed under, so it has no address of its
    // own: the link stays the search page's reading of it.
    expect(
      screen.getByRole("link", { name: /^Suivre l'histoire du nom Kihavu/ })
    ).toHaveAttribute("href", `${SEARCH}?q=Kihavu`);
  });

  // dyu is filed « Dioula »; its story leads with « Julakan », which neither
  // the filed name nor its alternate names carry. The search answers it under
  // every name its history tells (ETNI-2093), so the page for « Julakan »
  // reads dyu. The spelling alias is no part of it: the search row leaves
  // that column out.
  // @req REQ-198
  it("draws « Suivre l'histoire du nom Julakan » on dyu, from its history alone", () => {
    const dioula: LanguagePageData = {
      ...lingala,
      id: "dyu",
      name: "Dioula",
      isoCode639_3: "dyu",
      nameEn: "Dyula",
      alternateNames: ["Diula", "Djula", "Dyoula", "Jula"],
      spellingAliases: ["Julakan"],
      nameHistory: {
        summary: "Le nom julakan désigne la langue des marchands dioula.",
        names: [
          { ...LINGALA.names[0], nameText: "Julakan", accounts: [] },
          { ...LINGALA.names[0], nameText: "Dioula", accounts: [] },
        ],
      } as NameHistory,
    };
    const { container } = render(
      <LanguageDetailViewV2 data={dioula} language="fr" />
    );

    const chapter = container.querySelector(
      '[data-fiche-section="L’histoire des noms"]'
    ) as HTMLElement;
    const link = within(chapter).getByRole("link", {
      name: /^Suivre l'histoire du nom Julakan/,
    });
    expect(link).toHaveAttribute("href", `${SEARCH}?q=Julakan`);
  });

  // @req REQ-198
  it("draws no link on a fiche without a name story", () => {
    render(
      <LanguageDetailViewV2
        data={{ ...lingala, nameHistory: null }}
        language="fr"
      />
    );

    expect(
      screen.queryByRole("link", { name: /Suivre l'histoire du nom/ })
    ).toBeNull();
  });
});
