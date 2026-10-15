import type { Decorator, Meta, StoryObj } from "@storybook/react";

import { LanguageDetailViewV2 } from "@/components/language/LanguageDetailViewV2";
import { NameNextStep } from "@/components/search/timeline/NameClosing";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import type { LanguagePageData } from "@/lib/languageDataTransformer";

import hav from "../../../dataset/source/afrik/langues/hav.json";
import lin from "../../../dataset/source/afrik/langues/lin.json";

/**
 * The language fiche of brief 3 (approved 2026-10-15; boards
 * language-lingala-*.dc.html and language-thin-havu-*.dc.html), fed with the
 * corpus fiches themselves.
 */

const frame: Decorator = (Story) => (
  <div className="afh-shell afh-accent-language min-w-0 bg-afh-bg py-afh-2xl">
    <div className="mx-auto max-w-[1240px] px-[var(--afh-page-padding)]">
      <Story />
    </div>
  </div>
);

const lingala: LanguagePageData = {
  id: "lin",
  name: lin.nameFr,
  nameProvenance: "sourced",
  isoCode639_3: "lin",
  glottocode: lin.glottocode,
  nameEn: lin.nameEn,
  alternateNames: lin.alternateNames,
  spellingAliases: lin.spellingAliases,
  dialects: lin.content.dialects,
  family: { id: "FLG_BANTU", name: "Bantou" },
  speakingPeoples: [
    { id: "PPL_NGALA", name: "Ngala (Bangala)" },
    { id: "PPL_LINGALA", name: "Lingala (locuteurs)" },
  ],
  vehicularRole: lin.content.vehicularRole,
  vitalityStatus: null,
  sources: [],
  nameHistory: lin.nameHistory as NameHistory,
};

const havu: LanguagePageData = {
  id: "hav",
  name: hav.nameFr,
  nameProvenance: "sourced",
  isoCode639_3: "hav",
  glottocode: hav.glottocode,
  nameEn: hav.nameEn,
  alternateNames: hav.alternateNames,
  spellingAliases: hav.spellingAliases,
  dialects: hav.content.dialects,
  family: { id: "FLG_BANTU", name: "Bantou" },
  speakingPeoples: [{ id: "PPL_HAVU", name: "Havu" }],
  vehicularRole: hav.content.vehicularRole,
  vitalityStatus: hav.content.vitalityStatus,
  sources: [],
  nameHistory: hav.nameHistory as NameHistory,
  gaps: hav.content.gaps.map((gap) => gap.reason),
};

const meta = {
  title: "Fiches/Langue (brief 3)",
  component: LanguageDetailViewV2,
  decorators: [frame],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LanguageDetailViewV2>;

export default meta;

type Story = StoryObj<typeof meta>;

// @req REQ-198
export const Lingala: Story = {
  args: {
    data: lingala,
    language: "fr",
    onward: (
      <NameNextStep
        cards={[
          {
            kind: "Famille de langues",
            name: "Bantou",
            reason:
              "Le nom bantou désigne une famille de langues d'Afrique centrale, orientale et australe, et non un peuple.",
          },
          {
            kind: "Peuple",
            name: "Lingala (locuteurs)",
            reason:
              "Le nom Lingala désigne ici l'ensemble des gens qui parlent le lingala, une langue du fleuve Congo devenue langue commune de millions de personnes.",
          },
        ]}
        language="fr"
      />
    ),
  },
};

// @req REQ-198
export const Havu: Story = { args: { data: havu, language: "fr" } };
