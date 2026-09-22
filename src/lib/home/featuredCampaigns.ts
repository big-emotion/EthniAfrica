/**
 * The home's featured-campaign slot (editorial-and-experience-plan.md,
 * H7-H10) — one reviewed subject given the weight of a dedicated tile.
 *
 * **Disabled by default, on purpose.** A campaign with no `activeFrom`
 * carries no window and is never picked by `getActiveFeaturedCampaign` — it
 * exists as a reviewed, ready entry, not a live one. The operator opens it by
 * adding a start date (and, optionally, an end) and merging; no admin console
 * or environment flag exists for this, the same as every other editorial
 * decision in this repository.
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
   * The activation window, ISO dates (YYYY-MM-DD). No `activeFrom` — the
   * default for every new campaign — means it is never picked; no `activeTo`
   * means it stays open once started.
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
    heading: "Fulbe, Peul\u00a0: pourquoi plusieurs noms\u00a0?",
    support:
      "Fulbe, Pullo, puis Peul, Fulani, Fula, Fellata… Découvrez ce que chaque forme raconte et ce que les sources en savent.",
    entity: { kind: "people", id: "PPL_FULA" },
    forms: [
      { label: "Fulɓe · Pullo", isSelfDesignation: true },
      { label: "Peul" },
      { label: "Fulani" },
      { label: "Fula" },
      { label: "Fellata" },
      { label: "Toucouleur" },
    ],
    // Verbatim from the fiche's origin-of-names paragraph, apostrophe included.
    quote: "Aucune de ces lectures n'est établie et nous n'en retenons aucune.",
    // Delafosse is named in the fiche's prose but only as reported by Tauxier
    // and Wane; he is not one of its sources, so Tauxier takes his place.
    sources: [
      { title: "Breedveld (1995)" },
      { title: "Hampâté Bâ (1966)" },
      { title: "Tauxier (1937)" },
      { title: "Barth (1857)" },
      {
        title: "SIL Ethnologue — Fulfulde (ful)",
        url: "https://www.ethnologue.com/language/ful/",
      },
    ],
    sourceCount: 26,
    linkLabel: "Explorer ces noms",
    // Opened by the operator on 2026-09-22, with no end: it stays until a
    // later campaign replaces it.
    activeFrom: "2026-09-23",
  },
];

/**
 * Picks the campaign whose window contains `now`, or null when none is open.
 * A window needs a start; a missing end leaves it open.
 */
// @req REQ-115
export function getActiveFeaturedCampaign(
  campaigns: FeaturedCampaign[],
  now: Date = new Date()
): FeaturedCampaign | null {
  return (
    campaigns.find((campaign) => {
      if (!campaign.activeFrom) return false;
      if (now < new Date(campaign.activeFrom)) return false;
      return !campaign.activeTo || now <= new Date(campaign.activeTo);
    }) ?? null
  );
}
