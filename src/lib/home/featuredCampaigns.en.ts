/**
 * The English sidecar of `featuredCampaigns.ts`. Keyed by the French
 * campaign's id, the same way `didYouKnowFacts.en.ts` mirrors its French
 * bank — a parity test refuses a key on one side without its twin on the
 * other.
 *
 * `provenance: "human"`: this content is authored bilingually from the
 * fiche directly, not machine-translated from the French entry.
 */

import type { TranslationKind } from "@/lib/i18n/translationSidecarRules";

import type { FeaturedCampaign } from "./featuredCampaigns";

// @req REQ-145
export type FeaturedCampaignTranslation = Omit<
  FeaturedCampaign,
  "id" | "entity" | "activeFrom" | "activeTo" | "sourceCount"
> & {
  provenance: TranslationKind;
};

// @req REQ-145
export const FEATURED_CAMPAIGNS_EN: Record<
  string,
  FeaturedCampaignTranslation
> = {
  "peul-fulbe-noms": {
    kind: "naming",
    eyebrow: "One name, many histories",
    heading: "Fula, Fulbe: why so many names?",
    support:
      "Fula, Fulani, Peul, Fellata… Discover what each form tells, and what the sources actually know.",
    forms: [
      { label: "Fulɓe · Pullo", isSelfDesignation: true },
      { label: "Fula" },
      { label: "Fulani" },
      { label: "Peul" },
      { label: "Fellata" },
      { label: "Toucouleur" },
    ],
    quote:
      "None of the readings proposed for Fulɓe and Pullo is established, and we endorse none of them.",
    sources: [
      { title: "Breedveld (1995)" },
      { title: "Hampâté Bâ (1966)" },
      { title: "Delafosse" },
      { title: "Barth (1857)" },
      {
        title: "SIL Ethnologue — Fulfulde (ful)",
        url: "https://www.ethnologue.com/language/ful/",
      },
    ],
    linkLabel: "Explore these names",
    provenance: "human",
  },
};
