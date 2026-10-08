import type { Language } from "@/types/shared";

// @req REQ-158
export const DISCOVERY_SLUGS = {
  "burkina-faso": {
    fr: "burkina-faso-trois-langues",
  },
  "guere-wobe": {
    fr: "guere-krahn-we",
  },
  // Proverbs are keyed `proverb:<bank id>` so a proverb id can never shadow an
  // anecdote id. The slugs live here rather than in the bank so an address
  // can be composed without loading the proverb bank.
  "proverb:une-parole-douce-lie-les-coeurs": {
    fr: "proverbe-kabyle-parole-douce",
  },
  "proverb:peu-a-peu-l-oeuf-marchera": {
    fr: "proverbe-amharique-oeuf",
  },
  "proverb:l-homme-est-le-remede-de-l-homme": {
    fr: "proverbe-wolof-remede",
  },
  "proverb:hate-hate-n-a-pas-de-benediction": {
    fr: "proverbe-swahili-hate",
  },
  "proverb:la-grenouille-fait-tomber-la-pluie-sur-sa-tete": {
    fr: "proverbe-zande-grenouille",
  },
  "proverb:un-pouce-seul-n-ecrase-pas-un-pou": {
    fr: "proverbe-shona-pouce",
  },
  // Productions played in the deck, keyed `video:<slug>` for the same reason.
  "video:origine-du-nom-mande": {
    fr: "origine-du-nom-mande",
  },
} satisfies Record<string, Record<Language, string>>;
