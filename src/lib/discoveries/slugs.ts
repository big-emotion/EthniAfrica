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
  "proverb:la-grenouille-fait-tomber-la-pluie-sur-sa-tete": {
    fr: "proverbe-zande-grenouille",
    en: "zande-proverb-frog",
  },
  "proverb:un-pouce-seul-n-ecrase-pas-un-pou": {
    fr: "proverbe-shona-pouce",
    en: "shona-proverb-thumb",
  },
  // Productions played in the deck, keyed `video:<slug>` for the same reason.
  "video:origine-du-nom-mande": {
    fr: "origine-du-nom-mande",
    en: "origin-of-the-name-mande",
  },
  // Generated images (DEC-053), keyed `image:<slug>` for the same reason.
  "image:basotho": { fr: "autonyme-basotho", en: "basotho-autonym" },
  "image:amazigh": { fr: "autonyme-imazighen", en: "imazighen-autonym" },
  "image:ewe": { fr: "autonyme-ewe", en: "ewe-autonym" },
  "image:swahili": { fr: "autonyme-waswahili", en: "waswahili-autonym" },
  "image:kongo": { fr: "bakongo-deux-rives", en: "bakongo-both-banks" },
  "image:somali": { fr: "soomaali-deux-cotes", en: "soomaali-both-sides" },
  "image:hausa": { fr: "hausawa-deux-cotes", en: "hausawa-both-sides" },
  "image:swazi": { fr: "emaswati-deux-cotes", en: "emaswati-both-sides" },
  "image:njinga": { fr: "reine-njinga-mbande", en: "queen-njinga-mbande" },
  "image:mansa-musa": {
    fr: "mansa-musa-pelerinage-1324",
    en: "mansa-musa-pilgrimage-1324",
  },
  "image:grand-zimbabwe": {
    fr: "grand-zimbabwe-maisons-de-pierre",
    en: "great-zimbabwe-houses-of-stone",
  },
  "image:marrakech": {
    fr: "marrakech-almoravide",
    en: "almoravid-marrakesh",
  },
} satisfies Record<string, Record<Language, string>>;
