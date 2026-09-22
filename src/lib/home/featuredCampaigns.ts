/**
 * The home's featured-campaign slot (editorial-and-experience-plan.md,
 * H7-H10) — one reviewed subject given the weight of a dedicated tile.
 *
 * **Disabled by default, on purpose.** A campaign with no `activeFrom` /
 * `activeTo` carries no window and is never picked by
 * `getActiveFeaturedCampaign` — it exists as a reviewed, ready entry, not a
 * live one. The operator opens it by adding the two dates and merging; no
 * admin console or environment flag exists for this, the same as every
 * other editorial decision in this repository.
 *
 * **The shape stays constant, the subject does not.** The site is not
 * about one people: a naming story today, a dated historical event
 * tomorrow, on the same tile. A single subject left permanently featured
 * would read as the atlas endorsing it rather than featuring it for a
 * reason — the operator's own instruction, 2026-09-22.
 */

export type FeaturedCampaignKind = "naming" | "event";

/** One documented form of the subject's name. Never ranked — the
 * self-designation is marked, not promoted, the same rule DEC-057 holds
 * the search result page to. */
export interface FeaturedCampaignForm {
  label: string;
  isSelfDesignation?: boolean;
}

export interface FeaturedCampaignSource {
  title: string;
  /** Absent for a work with no address; never invented. */
  url?: string;
}

export interface FeaturedCampaign {
  id: string;
  kind: FeaturedCampaignKind;
  eyebrow: string;
  heading: string;
  support: string;
  /** The fiche this campaign points to. */
  entity: { kind: "people" | "country" | "language" | "patronyme"; id: string };
  /** Shown for a "naming" campaign. */
  forms?: FeaturedCampaignForm[];
  /** A sentence the excerpt rests on, traceable to the fiche — never invented. */
  quote?: string;
  /** A few sources worth naming on a teaser, not the fiche's whole bibliography. */
  sources: FeaturedCampaignSource[];
  /** The fiche's real total, read from its own sources array — never inflated. */
  sourceCount: number;
  linkLabel: string;
  /**
   * The activation window, both ISO dates (YYYY-MM-DD). Omitted entirely —
   * the default for every new campaign — means it is never picked.
   */
  activeFrom?: string;
  activeTo?: string;
}

// @req REQ-115
export const FEATURED_CAMPAIGNS: FeaturedCampaign[] = [
  {
    id: "peul-fulbe-noms",
    kind: "naming",
    eyebrow: "Un nom, plusieurs histoires",
    heading: "Peul, Fulbe : pourquoi plusieurs noms ?",
    support:
      "Peul, Fulani, Fula, Fellata… Découvrez ce que chaque forme raconte et ce que les sources en savent.",
    entity: { kind: "people", id: "PPL_FULA" },
    forms: [
      { label: "Fulɓe · Pullo", isSelfDesignation: true },
      { label: "Peul" },
      { label: "Fulani" },
      { label: "Fula" },
      { label: "Fellata" },
      { label: "Toucouleur" },
    ],
    quote:
      "Aucune des lectures proposées pour Fulɓe et Pullo n’est établie, et nous n’en retenons aucune.",
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
    sourceCount: 26,
    linkLabel: "Explorer ces noms",
    // activeFrom / activeTo intentionally absent: ready, not active.
  },
];

/** Picks the campaign whose window contains `now`, or null when none is open. */
// @req REQ-115
export function getActiveFeaturedCampaign(
  campaigns: FeaturedCampaign[],
  now: Date = new Date()
): FeaturedCampaign | null {
  return (
    campaigns.find((campaign) => {
      if (!campaign.activeFrom || !campaign.activeTo) return false;
      const from = new Date(campaign.activeFrom);
      const to = new Date(campaign.activeTo);
      return now >= from && now <= to;
    }) ?? null
  );
}
