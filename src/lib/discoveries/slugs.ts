import type { Language } from "@/types/shared";

// @req REQ-158
export const DISCOVERY_SLUGS = {
  "burkina-faso": {
    fr: "burkina-faso-trois-langues",
    en: "burkina-faso-three-languages",
  },
  "guere-wobe": {
    fr: "guere-krahn-we",
    en: "guere-krahn-we-names",
  },
  // Proverbs are keyed `proverb:<bank id>` so a proverb id can never shadow an
  // anecdote id. The slugs live here rather than in the bank because routing
  // reads this table to translate an address, and the middleware that loads
  // routing must not carry the proverb bank.
  "proverb:une-parole-douce-lie-les-coeurs": {
    fr: "proverbe-kabyle-parole-douce",
    en: "kabyle-proverb-gentle-word",
  },
  "proverb:peu-a-peu-l-oeuf-marchera": {
    fr: "proverbe-amharique-oeuf",
    en: "amharic-proverb-egg",
  },
  "proverb:l-homme-est-le-remede-de-l-homme": {
    fr: "proverbe-wolof-remede",
    en: "wolof-proverb-remedy",
  },
  "proverb:hate-hate-n-a-pas-de-benediction": {
    fr: "proverbe-swahili-hate",
    en: "swahili-proverb-hurry",
  },
  "proverb:connais-le-prix-de-la-chikwangue": {
    fr: "proverbe-kongo-chikwangue",
    en: "kongo-proverb-kwanga",
  },
  "proverb:un-pouce-seul-n-ecrase-pas-un-pou": {
    fr: "proverbe-shona-pouce",
    en: "shona-proverb-thumb",
  },
} satisfies Record<string, Record<Language, string>>;
