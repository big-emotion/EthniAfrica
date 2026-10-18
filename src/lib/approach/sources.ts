import type { SourceKind, SourceTier } from "@/types/sources";

export interface ApproachSource {
  id: string;
  hrefs: string[];
  tier: SourceTier;
  sourceKind: SourceKind;
  claims: string[];
}

/** Citation metadata is internal; the page renders `type`, never `tier`. */
// @req REQ-132
export const approachSources: ApproachSource[] = [
  {
    id: "britannica-africa",
    hrefs: ["https://www.britannica.com/place/Africa"],
    tier: "unverified",
    sourceKind: "encyclopedia",
    claims: ["area", "dimensions", "africa-origin"],
  },
  {
    id: "un-demographic-yearbook-2023",
    hrefs: [
      "https://unstats.un.org/unsd/demographic-social/products/dyb/documents/dyb2023/table01.pdf",
      "https://unstats.un.org/unsd/demographic-social/products/dyb/documents/dyb2023/table03.pdf",
    ],
    tier: "official",
    sourceKind: "official_statistics",
    claims: ["area", "countries-comparison"],
  },
  {
    id: "un-regional-groups",
    hrefs: ["https://www.un.org/dgacm/en/content/regional-groups"],
    tier: "official",
    sourceKind: "intergovernmental",
    claims: ["un-member-states"],
  },
  {
    id: "african-union-member-states",
    hrefs: ["https://au.int/en/member_states/countryprofiles2"],
    tier: "official",
    sourceKind: "intergovernmental",
    claims: ["au-members"],
  },
  {
    id: "un-world-population-prospects-2024",
    hrefs: ["https://population.un.org/wpp/"],
    tier: "official",
    sourceKind: "official_statistics",
    claims: ["population"],
  },
  {
    id: "ethnologue-africa",
    hrefs: [
      "https://www.ethnologue.com/region/Africa/",
      "https://www.ethnologue.com/insights/how-many-languages/",
    ],
    tier: "official",
    sourceKind: "linguistic_reference",
    claims: ["languages"],
  },
  {
    id: "kotula-afri",
    hrefs: ["https://journals.openedition.org/encyclopedieberbere/886"],
    tier: "referenced",
    sourceKind: "encyclopedia",
    claims: ["africa-origin"],
  },
  {
    id: "ivorian-name-laws",
    hrefs: [
      "https://loidici.biz/2018/08/20/la-loi-relative-au-nom-patronymique/lois-article-par-article/droit-des-personnes-et-de-la-famille/646/naty/",
      "https://loidici.biz/?p=671",
    ],
    tier: "unverified",
    sourceKind: "repository",
    claims: ["family-name-law", "law-repeal"],
  },
  {
    id: "barre-mettre-son-nom",
    hrefs: ["https://shs.cairn.info/revue-geneses-2018-3-page-12"],
    tier: "referenced",
    sourceKind: "academic",
    claims: ["day-names-context", "family-name-law"],
  },
  {
    id: "thiero-meman-patronymic-name",
    hrefs: ["https://theses.fr/1999PA100172"],
    tier: "referenced",
    sourceKind: "academic",
    claims: ["family-name-law"],
  },
];

/** Additional citations reached through the linked Kouassi and Yao fiches. */
// @req REQ-132
export const approachSupportingSources: ApproachSource[] = [
  {
    id: "pagnet-2005-noms-baoule",
    hrefs: ["https://hdl.handle.net/20.500.12177/1675"],
    tier: "referenced",
    sourceKind: "academic",
    claims: ["kouassi-baoule-day", "yao-baoule-day"],
  },
  {
    id: "delafosse-1900-agni",
    hrefs: ["https://archive.org/details/essaidemanuelde00delagoog"],
    tier: "referenced",
    sourceKind: "linguistic_reference",
    claims: ["kouassi-agni-day", "yao-agni-day"],
  },
  {
    id: "christaller-1881-twi",
    hrefs: ["https://archive.org/details/dictionaryofasan00chriuoft"],
    tier: "referenced",
    sourceKind: "linguistic_reference",
    claims: ["kwasi-twi-day", "yaw-twi-day"],
  },
  {
    id: "agyekum-2006-akan-names",
    hrefs: ["https://www.njas.fi/njas/article/download/24/16/38"],
    tier: "referenced",
    sourceKind: "academic",
    claims: ["kwasi-twi-day", "yaw-twi-day"],
  },
];

// @req REQ-132
export const allApproachSources = [
  ...approachSources,
  ...approachSupportingSources,
];

/** Explicit editorial mapping for every factual claim printed on the page. */
// @req REQ-132
export const approachClaimSources: Record<string, string[]> = {
  area: ["britannica-africa", "un-demographic-yearbook-2023"],
  dimensions: ["britannica-africa"],
  "countries-comparison": ["un-demographic-yearbook-2023"],
  "un-member-states": ["un-regional-groups"],
  "au-members": ["african-union-member-states"],
  population: ["un-world-population-prospects-2024"],
  languages: ["ethnologue-africa"],
  "africa-origin": ["britannica-africa", "kotula-afri"],
  "day-names-context": ["barre-mettre-son-nom"],
  "kouassi-baoule-day": ["pagnet-2005-noms-baoule"],
  "yao-baoule-day": ["pagnet-2005-noms-baoule"],
  "kouassi-agni-day": ["delafosse-1900-agni"],
  "yao-agni-day": ["delafosse-1900-agni"],
  "kwasi-twi-day": ["christaller-1881-twi", "agyekum-2006-akan-names"],
  "yaw-twi-day": ["christaller-1881-twi", "agyekum-2006-akan-names"],
  "family-name-law": [
    "ivorian-name-laws",
    "barre-mettre-son-nom",
    "thiero-meman-patronymic-name",
  ],
  "law-repeal": ["ivorian-name-laws"],
};

/** The local name fiches that carry the day-name and spelling attestations. */
// @req REQ-132
export const approachClaimFiches: Record<string, string[]> = {
  "kouassi-baoule-day": ["PAT_KOUASSI"],
  "yao-baoule-day": ["PAT_YAO"],
  "kouassi-agni-day": ["PAT_KOUASSI"],
  "yao-agni-day": ["PAT_YAO"],
  "kwasi-twi-day": ["PAT_KOUASSI"],
  "yaw-twi-day": ["PAT_YAO"],
};
