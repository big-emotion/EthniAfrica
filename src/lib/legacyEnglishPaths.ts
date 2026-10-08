/**
 * The English addresses the site published while it was bilingual (DEC-049),
 * and the French page each one now redirects to.
 *
 * English is retired for good, so this is a frozen redirect table rather than
 * a vocabulary: nothing renders from it, and it should never grow. It is kept
 * because those URLs were indexed and shared, and a 308 to the same page in
 * French keeps them working instead of 404ing.
 */

// Opening segments, matched longest first so `atlas/persons` wins over
// `atlas`. Slugs both vocabularies spelled alike (`about`, `doctrine`,
// `dossiers/anecdotes`, `contact`…) are absent: they carry over verbatim.
const ENGLISH_HEADS: Record<string, string> = {
  "atlas/countries": "atlas/pays",
  "atlas/families": "atlas/familles",
  "atlas/peoples": "atlas/peuples",
  "atlas/languages": "atlas/langues",
  "atlas/search": "atlas/recherche",
  // DEC-038: the ethnonym index was `ethnonyms`, the person-name entity `names`.
  "atlas/ethnonyms": "atlas/appellations",
  "atlas/names": "atlas/noms",
  "atlas/persons": "atlas/personnes",
  "dossiers/proverbs": "dossiers/proverbes",
  "dossiers/perspectives/colonisation-and-resistances":
    "dossiers/regards/colonisation-et-resistances",
  "dossiers/naming": "dossiers/nommer",
  "dossiers/resources": "dossiers/ressources",
  "dossiers/kongo-kingdom": "dossiers/royaume-kongo",
  "dossiers/luba-empire": "dossiers/empire-luba",
  "dossiers/lunda-empire": "dossiers/empire-lunda",
  "dossiers/kongo-spiritualities": "dossiers/spiritualites-kongo",
  discoveries: "decouvertes",
  compare: "comparer",
  glossary: "glossaire",
  wallpapers: "fonds-decran",
  games: "jeux",
  "legal-notice": "mentions-legales",
  "data-policy": "politique-de-donnees",
  accessibility: "accessibilite",
  sitemap: "plan-du-site",
  reports: "signalements",
};

// Single segments below a head: the links tail, the Nommer chapters, the
// comparer's entity, and the Découvertes entries.
const ENGLISH_TAIL_WORDS: Record<string, string> = {
  links: "liens",
  "the-people": "le-peuple",
  "the-country": "le-pays",
  "the-person": "la-personne",
  "the-language": "la-langue",
  "the-thing": "la-chose",
  peoples: "peuples",
  countries: "pays",
  families: "familles",
  "burkina-faso-three-languages": "burkina-faso-trois-langues",
  "guere-krahn-we-names": "guere-krahn-we",
  "kabyle-proverb-gentle-word": "proverbe-kabyle-parole-douce",
  "amharic-proverb-egg": "proverbe-amharique-oeuf",
  "wolof-proverb-remedy": "proverbe-wolof-remede",
  "swahili-proverb-hurry": "proverbe-swahili-hate",
  "zande-proverb-frog": "proverbe-zande-grenouille",
  "shona-proverb-thumb": "proverbe-shona-pouce",
  "origin-of-the-name-mande": "origine-du-nom-mande",
};

const HEADS_LONGEST_FIRST = Object.keys(ENGLISH_HEADS).sort(
  (a, b) => b.length - a.length
);

/**
 * The French path a retired `/en/...` address stands for:
 * `/en/atlas/peoples/PPL_X/links` → `/fr/atlas/peuples/PPL_X/liens`.
 *
 * Identifiers and words the table does not know are carried verbatim,
 * percent-encoding included, so a retired segment can still be resolved by
 * the proxy's relocation tables in the same hop. The query is the caller's.
 */
// @req REQ-140
export function frenchPathForLegacyEnglish(pathname: string): string {
  const rest = pathname.split("/").filter(Boolean).slice(1).join("/");

  let head: string | null = null;
  let tail = rest;
  for (const english of HEADS_LONGEST_FIRST) {
    if (rest === english || rest.startsWith(`${english}/`)) {
      head = ENGLISH_HEADS[english];
      tail = rest.slice(english.length);
      break;
    }
  }

  const segments = [
    "fr",
    ...(head === null ? [] : [head]),
    ...tail
      .split("/")
      .filter(Boolean)
      .map((segment) => ENGLISH_TAIL_WORDS[segment] ?? segment),
  ];
  return `/${segments.join("/")}`;
}
