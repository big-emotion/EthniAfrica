import type { Decorator, Meta, StoryObj } from "@storybook/react";

import { CountryRecordView } from "@/components/country/CountryRecordView";
import { NameNextStep } from "@/components/search/timeline/NameClosing";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { mapCountryDetail } from "@/lib/afrikDetailMapper";
import { firstSentence } from "@/lib/search/nameClosing";

import civ from "../../../dataset/source/afrik/pays/CIV.json";
import cod from "../../../dataset/source/afrik/pays/COD.json";
import cog from "../../../dataset/source/afrik/pays/COG.json";
import gab from "../../../dataset/source/afrik/pays/GAB.json";
import daloa from "../../../dataset/source/afrik/lieux/LOC_DALOA.json";
import akan from "../../../dataset/source/afrik/peuples/FLG_KWA/PPL_AKAN.json";
import fang from "../../../dataset/source/afrik/peuples/FLG_BANTU/PPL_FANG.json";
import kongo from "../../../dataset/source/afrik/peuples/FLG_BANTU/PPL_KONGO.json";
import punu from "../../../dataset/source/afrik/peuples/FLG_NIGERCONGO/PPL_PUNU.json";

/**
 * The country fiche of brief 5 (approved 2026-10-15; boards country-civ and
 * country-state-*.dc.html), fed with the corpus fiches themselves. The next
 * names are the ones the route picks.
 */

const frame: Decorator = (Story) => (
  <div className="afh-shell afh-accent-teal min-w-0 bg-afh-bg py-afh-2xl">
    <div className="mx-auto max-w-[1240px] px-[var(--afh-page-padding)]">
      <Story />
    </div>
  </div>
);

const country = (fiche: unknown) =>
  mapCountryDetail(fiche as Parameters<typeof mapCountryDetail>[0]);

const reason = (fiche: { nameHistory?: { summary: string } | NameHistory }) =>
  firstSentence(fiche.nameHistory?.summary ?? "");

const meta = {
  title: "Fiches/Pays (brief 5)",
  component: CountryRecordView,
  decorators: [frame],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CountryRecordView>;

export default meta;

type Story = StoryObj<typeof meta>;

// @req REQ-198
export const CoteDIvoire: Story = {
  name: "Côte d'Ivoire",
  args: {
    country: country(civ),
    language: "fr",
    onward: (
      <NameNextStep
        cards={[
          {
            relation: "people",
            kind: "Peuple",
            name: "Akan",
            reason: reason(akan),
          },
          {
            relation: "place",
            kind: "Lieu",
            name: "Daloa",
            reason: reason(daloa),
          },
        ]}
        language="fr"
      />
    ),
  },
};

// @req REQ-198
export const Gabon: Story = {
  args: {
    country: country(gab),
    language: "fr",
    onward: (
      <NameNextStep
        cards={[
          {
            relation: "people",
            kind: "Peuple",
            name: "Fang",
            reason: reason(fang),
          },
          {
            relation: "people",
            kind: "Peuple",
            name: "Punu",
            reason: reason(punu),
          },
        ]}
        language="fr"
      />
    ),
  },
};

// @req REQ-198
export const Congo: Story = {
  args: {
    country: country(cog),
    language: "fr",
    sharedName: {
      name: "Congo",
      self: "la République du Congo",
      other: "la République démocratique du Congo",
    },
    onward: (
      <NameNextStep
        cards={[
          {
            relation: "country",
            kind: "Pays",
            name: "République démocratique du Congo",
            reason: reason(cod),
          },
          {
            relation: "people",
            kind: "Peuple",
            name: "Kongo",
            reason: reason(kongo),
          },
        ]}
        language="fr"
      />
    ),
  },
};
