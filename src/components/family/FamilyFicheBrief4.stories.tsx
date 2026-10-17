import type { Decorator, Meta, StoryObj } from "@storybook/react";

import { LanguageFamilyDetailViewV2 } from "@/components/family/LanguageFamilyDetailViewV2";
import { NameNextStep } from "@/components/search/timeline/NameClosing";
import { firstSentence } from "@/lib/search/nameClosing";
import type { LanguageFamily } from "@/types/afrik";

import bantu from "../../../dataset/source/afrik/famille_linguistique/FLG_BANTU.json";
import mande from "../../../dataset/source/afrik/famille_linguistique/FLG_MANDE.json";
import bam from "../../../dataset/source/afrik/langues/bam.json";
import lin from "../../../dataset/source/afrik/langues/lin.json";
import malinke from "../../../dataset/source/afrik/peuples/FLG_MANDE/PPL_MALINKE.json";
import swahili from "../../../dataset/source/afrik/peuples/FLG_BANTU/PPL_SWAHILI.json";

/**
 * The language-family fiche of brief 4 (approved 2026-10-15; boards
 * family-bantu-*.dc.html and family-mande-*.dc.html), fed with the corpus
 * fiches themselves. The next names are the ones the route picks: the most
 * spoken language with a summary, then the widest people with one.
 */

const frame: Decorator = (Story) => (
  <div className="afh-shell afh-accent-perv min-w-0 bg-afh-bg py-afh-2xl">
    <div className="mx-auto max-w-[1240px] px-[var(--afh-page-padding)]">
      <Story />
    </div>
  </div>
);

const reason = (fiche: { nameHistory?: { summary: string } }) =>
  firstSentence(fiche.nameHistory?.summary ?? "");

const meta = {
  title: "Fiches/Famille de langues (brief 4)",
  component: LanguageFamilyDetailViewV2,
  decorators: [frame],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LanguageFamilyDetailViewV2>;

export default meta;

type Story = StoryObj<typeof meta>;

// @req REQ-198
export const Bantou: Story = {
  args: {
    family: bantu as unknown as LanguageFamily,
    language: "fr",
    onward: (
      <NameNextStep
        cards={[
          {
            relation: "language",
            kind: "Langue",
            name: "Lingala",
            reason: reason(lin),
          },
          {
            relation: "people",
            kind: "Peuple",
            name: "Swahili",
            reason: reason(swahili),
          },
        ]}
        language="fr"
      />
    ),
  },
};

// @req REQ-198
export const Mande: Story = {
  name: "Mandé",
  args: {
    family: mande as unknown as LanguageFamily,
    language: "fr",
    onward: (
      <NameNextStep
        cards={[
          {
            relation: "language",
            kind: "Langue",
            name: "Bambara",
            reason: reason(bam),
          },
          {
            relation: "people",
            kind: "Peuple",
            name: "Malinké",
            reason: reason(malinke),
          },
        ]}
        language="fr"
      />
    ),
  },
};
