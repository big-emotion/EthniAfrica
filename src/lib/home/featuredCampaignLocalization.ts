import type { TranslationKind } from "@/lib/i18n/translationSidecarRules";
import type { Language } from "@/types/shared";

import type { FeaturedCampaign } from "./featuredCampaigns";
import { FEATURED_CAMPAIGNS_EN } from "./featuredCampaigns.en";

export type LocalizedFeaturedCampaign = FeaturedCampaign & {
  translationKind?: TranslationKind;
};

// @req REQ-145
export function localizeFeaturedCampaign(
  campaign: FeaturedCampaign,
  language: Language
): LocalizedFeaturedCampaign {
  if (language === "fr") return campaign;

  const translation = FEATURED_CAMPAIGNS_EN[campaign.id];
  if (!translation) return campaign;
  const { provenance, ...copy } = translation;
  return { ...campaign, ...copy, translationKind: provenance };
}
