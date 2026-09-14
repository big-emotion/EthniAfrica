import type { Meta, StoryObj } from "@storybook/react";

import { PeoplesSection } from "@/components/country/PeoplesSection";
import {
  FICHE_A11Y_PARAMETERS,
  atFicheBreakpoint,
} from "@/components/fiche/ficheStoryViewports";
import type { PeoplesData } from "@/lib/countryDataTransformer";

/**
 * Shares summing to 92 %: the case REQ-170 labels "estimated or incomplete".
 * Long compound names are deliberate — the label and the coverage sentence
 * sit in the uppercase, tracked eyebrow style, which is where a narrow screen
 * would overflow first (illustrative, not data).
 */
const INCOMPLETE_BREAKDOWN: PeoplesData = {
  totalPopulation: 21_000_000,
  totalPopulationFormatted: "21 M",
  totalPopulationIsNational: true,
  everyPeopleDeclaresPopulation: false,
  populationReferenceYear: 2025,
  peopleCount: 4,
  rows: [
    {
      name: "Peuple illustratif A",
      percentage: 38,
      region: "Région septentrionale",
      languageFamily: "Famille linguistique illustrative",
      colorIndex: 1,
    },
    {
      name: "Peuple illustratif B",
      percentage: 27,
      region: "Plateau central",
      languageFamily: "Famille linguistique illustrative",
      colorIndex: 2,
    },
    {
      name: "Peuple illustratif C",
      percentage: 19,
      region: "Littoral",
      colorIndex: 3,
    },
    {
      name: "Autres groupes",
      percentage: 8,
      colorIndex: 0,
      isOther: true,
    },
  ],
};

const meta = {
  title: "Country/PeoplesSection",
  component: PeoplesSection,
  tags: ["autodocs"],
  parameters: { layout: "padded", a11y: FICHE_A11Y_PARAMETERS },
} satisfies Meta<typeof PeoplesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const incompleteBreakdown: Story = {
  args: { data: INCOMPLETE_BREAKDOWN, language: "fr" },
};

// @req REQ-170
export const IncompleteBreakdownMobile430 = atFicheBreakpoint(
  incompleteBreakdown,
  "ficheMobile430"
);
// @req REQ-170
export const IncompleteBreakdownTablet720 = atFicheBreakpoint(
  incompleteBreakdown,
  "ficheTablet720"
);
// @req REQ-170
export const IncompleteBreakdownDesktop800 = atFicheBreakpoint(
  incompleteBreakdown,
  "ficheDesktop800"
);
