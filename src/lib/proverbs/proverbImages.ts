import type { Language } from "@/types/shared";

/**
 * A photograph behind each proverb, and the credit that makes it citable.
 *
 * Deliberately not a field on `Proverb`, for the reason
 * `didYouKnowIllustrations.ts` gives: a picture is something a reading surface
 * adds, and the bank stays a bank. Both surfaces read this map — the
 * Découvertes reader draws it full-frame, the dossier card as a side-anchored
 * fade — so a proverb is dressed once.
 *
 * Every file is a real photograph under a free licence, never a generated
 * one (operator ruling 2026-09-25; brand charter §9). It follows the charter's
 * cascade — the thing the proverb speaks of, then the people's own place or
 * material culture, then the country — and `alt` and `credit` say which rung
 * it is. A proverb with no entry stays a typographic card until one is
 * sourced. Provenance in full lives in `public/images/proverbs/CREDITS.md`.
 */
export interface ProverbPicture {
  /** Path under `public/`, so `next/image` can size and re-encode it. */
  src: string;
  /** The Commons (or museum) page of the original file. */
  filePage: string;
  /** The visible attribution line: work, author, source, licence. */
  credit: string;
  shortCredit: Record<Language, string>;
  alt: Record<Language, string>;
  /** `object-position` that keeps the subject clear of the text. */
  focus?: string;
  /** Absent for a public-domain file, which asks for no licence notice. */
  licenceUrl?: string;
  licence: "public-domain" | "cc0" | "cc-by" | "cc-by-sa";
}

// @req REQ-157
export const PROVERB_IMAGES: Record<string, ProverbPicture> = {
  "une-parole-douce-lie-les-coeurs": {
    src: "/images/proverbs/une-parole-douce-lie-les-coeurs.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Kabylievillage.jpg",
    credit:
      "Paysage de Kabylie, Algérie — diebmx, Wikimedia Commons, CC BY 2.0",
    shortCredit: { fr: "diebmx, CC BY 2.0", en: "diebmx, CC BY 2.0" },
    alt: {
      fr: "Un village de Kabylie sur son versant de colline, en Algérie : le lieu du peuple kabyle.",
      en: "A Kabylie village on its hillside in Algeria: the Kabyle people's own place.",
    },
    focus: "50% 60%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "peu-a-peu-l-oeuf-marchera": {
    src: "/images/proverbs/peu-a-peu-l-oeuf-marchera.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Egg_Basket,_Ethiopia_(15221836391).jpg",
    credit:
      "Panier d'œufs, Jimma, Éthiopie — Rod Waddington, Wikimedia Commons, CC BY-SA 2.0",
    shortCredit: {
      fr: "Rod Waddington, CC BY-SA 2.0",
      en: "Rod Waddington, CC BY-SA 2.0",
    },
    alt: {
      fr: "Un panier d'œufs de poule en Éthiopie : ce dont parle le proverbe.",
      en: "A basket of hen eggs in Ethiopia: what the proverb speaks of.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
  },
  "l-homme-est-le-remede-de-l-homme": {
    src: "/images/proverbs/l-homme-est-le-remede-de-l-homme.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Saint-Louis-du-S%C3%A9n%C3%A9gal.JPG",
    credit:
      "Pirogues à Saint-Louis, Sénégal — Ji-Elle, Wikimedia Commons, public domain",
    shortCredit: {
      fr: "Ji-Elle, domaine public",
      en: "Ji-Elle, public domain",
    },
    alt: {
      fr: "Des pirogues serrées les unes contre les autres dans le port de Saint-Louis, au Sénégal : le pays du proverbe wolof.",
      en: "Pirogues moored side by side in the harbour of Saint-Louis, Senegal: the country of the Wolof proverb.",
    },
    focus: "50% 40%",
    licence: "public-domain",
  },
  "hate-hate-n-a-pas-de-benediction": {
    src: "/images/proverbs/hate-hate-n-a-pas-de-benediction.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Lamu_dhow_3.JPG",
    credit:
      "Boutre à Lamu, Kenya — Karl Ragnar Gjertsen, Wikimedia Commons, CC BY-SA 3.0",
    shortCredit: {
      fr: "Karl Ragnar Gjertsen, CC BY-SA 3.0",
      en: "Karl Ragnar Gjertsen, CC BY-SA 3.0",
    },
    alt: {
      fr: "Un boutre à voile au large de Lamu, sur la côte swahilie du Kenya.",
      en: "A sailing dhow off Lamu, on Kenya's Swahili coast.",
    },
    focus: "45% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "la-grenouille-fait-tomber-la-pluie-sur-sa-tete": {
    src: "/images/proverbs/la-grenouille-fait-tomber-la-pluie-sur-sa-tete.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Christy%27s_Tree_Frog,_Walikale,_Democratic_Republic_of_the_Congo_imported_from_iNaturalist_photo_184075766.jpg",
    credit:
      "Rainette de Christy, Walikale, République démocratique du Congo — Mahomed Desai, Wikimedia Commons, CC BY 4.0",
    shortCredit: {
      fr: "Mahomed Desai, CC BY 4.0",
      en: "Mahomed Desai, CC BY 4.0",
    },
    alt: {
      fr: "Une rainette sur une feuille, de nuit, en République démocratique du Congo : la grenouille dont parle le proverbe.",
      en: "A tree frog on a leaf at night in the Democratic Republic of the Congo: the frog the proverb speaks of.",
    },
    focus: "45% 50%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "un-pouce-seul-n-ecrase-pas-un-pou": {
    src: "/images/proverbs/un-pouce-seul-n-ecrase-pas-un-pou.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Gr_Zimb_Shona_Dorf.jpg",
    credit:
      "Village karanga dans la vallée du Grand Zimbabwe — Thomas Wozniak, Wikimedia Commons, CC BY 3.0",
    shortCredit: {
      fr: "Thomas Wozniak, CC BY 3.0",
      en: "Thomas Wozniak, CC BY 3.0",
    },
    alt: {
      fr: "Un village karanga, groupe shona, dans la vallée du Grand Zimbabwe : un lieu bâti à plusieurs.",
      en: "A Karanga (Shona) village in the valley of Great Zimbabwe: a place built by many hands.",
    },
    focus: "50% 55%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
  },
};
