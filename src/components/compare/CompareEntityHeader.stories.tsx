import type { Meta, StoryObj } from "@storybook/react";
import { CompareEntityHeader } from "./CompareEntityHeader";
import {
  FICHE_A11Y_PARAMETERS,
  atFicheBreakpoint,
} from "@/components/fiche/ficheStoryViewports";
import type { ComparisonColumn } from "@/types/compare";

const plainColumn: ComparisonColumn = {
  id: "PPL_SERER",
  label: "Sérère",
  type: "peuple",
};

const contestedColumn: ComparisonColumn = {
  id: "PPL_ILLUSTRATIVE_CONTESTED",
  label: "Peuple Illustratif Contesté",
  type: "peuple",
  classificationStatus: "contested",
};

const meta = {
  title: "Compare/CompareEntityHeader",
  component: CompareEntityHeader,
  tags: ["autodocs"],
  parameters: { layout: "padded", a11y: FICHE_A11Y_PARAMETERS },
} satisfies Meta<typeof CompareEntityHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const plain: Story = {
  name: "Consensual classification (no badge)",
  args: { language: "fr", column: plainColumn },
};

const contested: Story = {
  name: "Contested classification",
  args: { language: "fr", column: contestedColumn },
};

// @req REQ-097
export const Mobile430 = atFicheBreakpoint(contested, "ficheMobile430");
// @req REQ-097
export const Tablet720 = atFicheBreakpoint(plain, "ficheTablet720");
// @req REQ-097
export const Desktop800 = atFicheBreakpoint(contested, "ficheDesktop800");
