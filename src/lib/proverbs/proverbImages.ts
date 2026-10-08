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
    shortCredit: { fr: "diebmx, CC BY 2.0" },
    alt: {
      fr: "Un village de Kabylie sur son versant de colline, en Algérie : le lieu du peuple kabyle.",
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
    },
    alt: {
      fr: "Un panier d'œufs de poule en Éthiopie : ce dont parle le proverbe.",
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
    },
    alt: {
      fr: "Des pirogues serrées les unes contre les autres dans le port de Saint-Louis, au Sénégal : le pays du proverbe wolof.",
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
    },
    alt: {
      fr: "Un boutre à voile au large de Lamu, sur la côte swahilie du Kenya.",
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
    },
    alt: {
      fr: "Une rainette sur une feuille, de nuit, en République démocratique du Congo : la grenouille dont parle le proverbe.",
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
    },
    alt: {
      fr: "Un village karanga, groupe shona, dans la vallée du Grand Zimbabwe : un lieu bâti à plusieurs.",
    },
    focus: "50% 55%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
  },
  "on-ne-montre-pas-le-ciel-a-un-enfant": {
    src: "/images/proverbs/on-ne-montre-pas-le-ciel-a-un-enfant.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:The_Northern_Ghana_Blue_Skies_View.jpg",
    credit:
      "Ciel et plan d'eau dans le nord du Ghana — Sheihu Salawatia, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Sheihu Salawatia, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un ciel bleu chargé de nuages au-dessus d'un plan d'eau, dans le nord du Ghana : le ciel dont parle le proverbe.",
    },
    focus: "50% 30%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "on-n-apprend-pas-au-petit-leopard-a-bondir": {
    src: "/images/proverbs/on-n-apprend-pas-au-petit-leopard-a-bondir.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Leopard_cub_(6141231347).jpg",
    credit:
      "Petit léopard dans un arbre, Botswana — Malcolm Macgregor, Wikimedia Commons, CC BY 2.0",
    shortCredit: {
      fr: "Malcolm Macgregor, CC BY 2.0",
    },
    alt: {
      fr: "Un petit léopard installé dans un arbre, au Botswana : le petit dont parle le proverbe.",
    },
    focus: "40% 40%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "au-sot-il-faut-expliquer-le-proverbe": {
    src: "/images/proverbs/au-sot-il-faut-expliquer-le-proverbe.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Adinkra_cloth.JPG",
    credit:
      "Étoffe adinkra de deuil rapportée de Kumasi par Thomas Edward Bowdich en 1817 — reproduction ancienne, Wikimedia Commons, public domain",
    shortCredit: {
      fr: "Bowdich, 1817, domaine public",
    },
    alt: {
      fr: "Une étoffe adinkra de deuil rapportée de Kumasi en 1817, couverte de motifs imprimés : la culture matérielle du peuple asante.",
    },
    focus: "50% 50%",
    licence: "public-domain",
  },
  "en-marchant-doucement-on-dort-loin": {
    src: "/images/proverbs/en-marchant-doucement-on-dort-loin.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Isolated_Hill_and_Waterbody_near_Sabon_Kaura,_Bauchi.jpg",
    credit:
      "Colline et point d'eau près de Sabon Kaura, État de Bauchi, Nigeria — Martemmedia, Wikimedia Commons, CC BY 4.0",
    shortCredit: { fr: "Martemmedia, CC BY 4.0" },
    alt: {
      fr: "Une colline rocheuse au-dessus de la savane sèche et d'un point d'eau, dans l'État de Bauchi, au Nigeria : le pays du proverbe haoussa.",
    },
    focus: "40% 50%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "le-nombre-fait-tirer-la-pierre-au-coton": {
    src: "/images/proverbs/le-nombre-fait-tirer-la-pierre-au-coton.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Cotton_plant,_Ware_County,_GA,_US.jpg",
    credit:
      "Cotonnier, comté de Ware, Géorgie (États-Unis) — Bubba73 (Jud McCranie), Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: { fr: "Bubba73, CC BY-SA 4.0" },
    alt: {
      fr: "Un cotonnier aux capsules ouvertes, photographié aux États-Unis : ce dont parle le proverbe.",
    },
    focus: "40% 55%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "meme-le-niger-a-une-ile": {
    src: "/images/proverbs/meme-le-niger-a-une-ile.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:The_River_Niger_09.jpg",
    credit:
      "Le fleuve Niger et ses bancs de sable, région de Lokoja, Nigeria — Ebere Jude Ekemezie, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Ebere Jude Ekemezie, CC BY-SA 4.0",
    },
    alt: {
      fr: "Le fleuve Niger, ses bancs de sable et une île boisée près de Lokoja, au Nigeria : le fleuve dont parle le proverbe.",
    },
    focus: "60% 60%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "les-petites-averses-remplissent-le-ruisseau": {
    src: "/images/proverbs/les-petites-averses-remplissent-le-ruisseau.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:STREAM_IN_GODOGODO.jpg",
    credit:
      "Ruisseau en saison des pluies, Godogodo, État de Kaduna, Nigeria — Valtino44, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Valtino44, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un ruisseau gonflé en pleine saison des pluies, bordé d'herbe et de forêt, à Godogodo, au Nigeria : ce dont parle le proverbe.",
    },
    focus: "50% 45%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "aujourd-hui-frere-aine-de-demain": {
    src: "/images/proverbs/aujourd-hui-frere-aine-de-demain.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Grass_at_a_lawn_with_morning_dew_03.jpg",
    credit:
      "Rosée du matin sur l'herbe — Leonhard Lenz, Wikimedia Commons, CC0",
    shortCredit: { fr: "Leonhard Lenz, CC0" },
    alt: {
      fr: "Des gouttes de rosée au bout des brins d'herbe, au matin : la rosée dont parle le proverbe.",
    },
    focus: "50% 60%",
    licence: "cc0",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0",
  },
  "clin-d-oeil-du-crabe": {
    src: "/images/proverbs/clin-d-oeil-du-crabe.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Macrophthalmus_crab_at_the_shores_of_winnieba_2.jpg",
    credit:
      "Crabe sur le rivage, Winneba, Ghana — Treysam, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: { fr: "Treysam, CC BY-SA 4.0" },
    alt: {
      fr: "Un crabe aux yeux sur pédoncules, immobile sur le sable d'un rivage à Winneba, au Ghana : le crabe dont parle le proverbe.",
    },
    focus: "50% 45%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "la-maison-lieu-de-repos-du-voyageur": {
    src: "/images/proverbs/la-maison-lieu-de-repos-du-voyageur.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Mud_House._The_Ancient_house_live_by_our_forefathers,_it_common_among_the_Yoruba_Land_Wester_Nigeria_than_the_other_part.jpg",
    credit:
      "Maison en terre du pays yoruba, Nigeria — Tadekwiki, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Tadekwiki, CC BY-SA 4.0",
    },
    alt: {
      fr: "Une maison en terre au toit de tôle, dans une cour du pays yoruba, au Nigeria : le lieu du peuple yoruba.",
    },
    focus: "50% 55%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "proverbes-huile-de-palme-des-mots": {
    src: "/images/proverbs/proverbes-huile-de-palme-des-mots.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Palm_oil_in_a_white_bowl.jpg",
    credit:
      "Huile de palme rouge dans un bol blanc — Zmu'az4Z, Wikimedia Commons, CC BY 4.0",
    shortCredit: { fr: "Zmu'az4Z, CC BY 4.0" },
    alt: {
      fr: "De l'huile de palme rouge dans un bol blanc : l'huile dont parle le proverbe.",
    },
    focus: "50% 50%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "que-le-milan-se-pose-et-l-aigle-aussi": {
    src: "/images/proverbs/que-le-milan-se-pose-et-l-aigle-aussi.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Black_Kite_Ghana.jpg",
    credit:
      "Milan noir en vol, Ghana — Kradolferp, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Kradolferp, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un milan noir qui plane, ailes ouvertes, dans un ciel pâle au Ghana : l'oiseau dont parle le proverbe.",
    },
    focus: "45% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "peu-a-peu-on-remplit-la-mesure": {
    src: "/images/proverbs/peu-a-peu-on-remplit-la-mesure.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Grains_in_the_market.JPG",
    credit:
      "Grains en vrac sur un étal, Zanzibar, Tanzanie — Kennedy Bundi, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Kennedy Bundi, CC BY-SA 4.0",
    },
    alt: {
      fr: "Des grains de riz, de pois et de maïs dans des bols, sur un étal de marché à Zanzibar, en Tanzanie : ce qui se mesure et se remplit peu à peu.",
    },
    focus: "50% 85%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "une-personne-c-est-des-gens": {
    src: "/images/proverbs/une-personne-c-est-des-gens.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Shimoni_fishermen.JPG",
    credit:
      "Pêcheurs près de Shimoni, Kenya — FredD, Wikimedia Commons, CC BY-SA 3.0",
    shortCredit: { fr: "FredD, CC BY-SA 3.0" },
    alt: {
      fr: "Des pêcheurs ensemble sur une pirogue à balancier près de Shimoni, sur la côte swahilie du Kenya : le lieu du peuple swahili.",
    },
    focus: "45% 60%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "qui-n-est-pas-instruit-par-sa-mere": {
    src: "/images/proverbs/qui-n-est-pas-instruit-par-sa-mere.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Harbour_at_the_picturesque_Stone_Town.jpg",
    credit:
      "Le port de Stone Town, Zanzibar, Tanzanie — Ondřej Havelka, Wikimedia Commons, CC BY 4.0",
    shortCredit: {
      fr: "Ondřej Havelka, CC BY 4.0",
    },
    alt: {
      fr: "Le port de Stone Town, à Zanzibar, en Tanzanie : le lieu du peuple swahili, ouvert sur le monde.",
    },
    focus: "50% 60%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "l-enfant-est-a-tous-jita": {
    src: "/images/proverbs/l-enfant-est-a-tous-jita.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Rocks_in_lake_Victoria,_Musoma_Municipal_Council,_Mara_Region.jpg",
    credit:
      "Rochers dans le lac Victoria, Musoma, Tanzanie — Mnazini, Wikimedia Commons, CC BY 4.0",
    shortCredit: { fr: "Mnazini, CC BY 4.0" },
    alt: {
      fr: "Des rochers et des îlots sur le lac Victoria, à Musoma, en Tanzanie : le pays du proverbe jita.",
    },
    focus: "50% 50%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "aucun-putois-ne-sent-sa-propre-odeur": {
    src: "/images/proverbs/aucun-putois-ne-sent-sa-propre-odeur.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Ictonyx_striatus_10897825.jpg",
    credit:
      "Zorille commune (Ictonyx striatus) — Henry de Lange, Wikimedia Commons, CC BY 4.0",
    shortCredit: {
      fr: "Henry de Lange, CC BY 4.0",
    },
    alt: {
      fr: "Une zorille, ou putois d'Afrique, de nuit, la queue dressée : l'animal dont parle le proverbe.",
    },
    focus: "50% 70%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "on-n-atteint-pas-la-hauteur-dans-la-hate": {
    src: "/images/proverbs/on-n-atteint-pas-la-hauteur-dans-la-hate.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Amphitheatre_Drakensberg_View.jpg",
    credit:
      "L'amphithéâtre du Drakensberg, KwaZulu-Natal, Afrique du Sud — PhilippN, Wikimedia Commons, CC BY-SA 3.0",
    shortCredit: { fr: "PhilippN, CC BY-SA 3.0" },
    alt: {
      fr: "Les falaises de l'amphithéâtre du Drakensberg, dans le KwaZulu-Natal, en Afrique du Sud : des hauteurs, dans le pays du proverbe zoulou.",
    },
    focus: "50% 40%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "pas-de-riviere-sans-son-propre-bruit": {
    src: "/images/proverbs/pas-de-riviere-sans-son-propre-bruit.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Howick_Waterfall_01.JPG",
    credit:
      "Les chutes de Howick, sur l'uMngeni, KwaZulu-Natal, Afrique du Sud — Nicolette de Lange, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Nicolette de Lange, CC BY-SA 4.0",
    },
    alt: {
      fr: "Une rivière qui se jette dans le vide, aux chutes de Howick, dans le KwaZulu-Natal, en Afrique du Sud : le pays du proverbe zoulou.",
    },
    focus: "60% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "une-personne-est-une-personne-par-les-autres": {
    src: "/images/proverbs/une-personne-est-une-personne-par-les-autres.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Colenso,_South_Africa;_African_kraal_huts._Photograph_by_Hon_Wellcome_V0038003.jpg",
    credit:
      "Huttes d'un kraal à Colenso, Natal, Afrique du Sud, 1905 — Wellcome Collection (photographie de Geoffrey L. Parsons), Wikimedia Commons, CC BY 4.0",
    shortCredit: {
      fr: "Wellcome Collection, CC BY 4.0",
    },
    alt: {
      fr: "Des huttes en dôme d'un kraal à Colenso, dans le Natal, en Afrique du Sud, sur une photographie de 1905 : l'habitat du pays zoulou.",
    },
    focus: "50% 50%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "deterrer-les-rats-demande-de-s-y-mettre-ensemble": {
    src: "/images/proverbs/deterrer-les-rats-demande-de-s-y-mettre-ensemble.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Plate_16b._Folk-Lore,_vol._17.jpg",
    credit:
      "Grenier dans un village macharanga, près d'Umtali, Rhodésie — E. Sidney Hartland, Folk-Lore, vol. 17, 1906, Wikimedia Commons, public domain",
    shortCredit: {
      fr: "E. Sidney Hartland, 1906, domaine public",
    },
    alt: {
      fr: "Un grenier sur pilotis dans un village macharanga (karanga, groupe shona), près d'Umtali, en 1906 : là où l'on garde le grain que les rats convoitent.",
    },
    focus: "50% 50%",
    licence: "public-domain",
  },
  "crepitement-n-est-pas-feu": {
    src: "/images/proverbs/crepitement-n-est-pas-feu.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Campfire_flames_at_night.jpg",
    credit:
      "Feu de branchages, de nuit — Marc-Lautenbacher, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Marc-Lautenbacher, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un feu de petites branches sèches, de nuit : le feu dont parle le proverbe.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "un-jour-ne-suffit-pas-a-pourrir-un-elephant": {
    src: "/images/proverbs/un-jour-ne-suffit-pas-a-pourrir-un-elephant.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Herd_Bush_Elephants_Lupande_Zambia_Jul23_A7C_06143.jpg",
    credit:
      "Troupeau d'éléphants de savane, Luangwa, Zambie — Timothy A. Gonsalves, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Timothy A. Gonsalves, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un troupeau d'éléphants de savane traverse une clairière herbeuse, dans la vallée de la Luangwa, en Zambie : l'animal dont parle le proverbe.",
    },
    focus: "50% 70%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "la-force-du-crocodile-est-dans-l-eau": {
    src: "/images/proverbs/la-force-du-crocodile-est-dans-l-eau.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Nile_Crocodile_(Crocodylus_niloticus)_returning_to_water_(17087512898).jpg",
    credit:
      "Crocodile du Nil regagnant l'eau, parc Kruger, Afrique du Sud — Bernard Dupont, Wikimedia Commons, CC BY-SA 2.0",
    shortCredit: {
      fr: "Bernard Dupont, CC BY-SA 2.0",
    },
    alt: {
      fr: "Un crocodile du Nil qui regagne l'eau, dans le parc Kruger, en Afrique du Sud : l'animal dont parle le proverbe.",
    },
    focus: "50% 45%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
  },
  "c-est-la-patience-qui-sort-du-filet": {
    src: "/images/proverbs/c-est-la-patience-qui-sort-du-filet.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:COLLECTIE_TROPENMUSEUM_Een_visnet_hangt_te_drogen_aan_de_oever_van_het_Tanganyika_meer_TMnr_20039275.jpg",
    credit:
      "Filet de pêche séchant au bord du lac Tanganyika — H.W. (Henk) van Rinsum, Tropenmuseum, Wikimedia Commons, CC BY-SA 3.0",
    shortCredit: {
      fr: "H.W. van Rinsum, Tropenmuseum, CC BY-SA 3.0",
    },
    alt: {
      fr: "Un grand filet de pêche tendu sur son cadre pour sécher, au bord du lac Tanganyika : ce dont parle le proverbe.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "une-bouchee-ne-brise-pas-la-compagnie": {
    src: "/images/proverbs/une-bouchee-ne-brise-pas-la-compagnie.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Nsima_Relishes.JPG",
    credit:
      "Nshima et ses accompagnements — Jpatokal, Wikimedia Commons, CC BY-SA 2.5",
    shortCredit: { fr: "Jpatokal, CC BY-SA 2.5" },
    alt: {
      fr: "Un repas de nshima, la pâte de maïs blanche, avec trois plats d'accompagnement : la nourriture partagée dont parle le proverbe.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.5",
  },
  "ou-vont-les-vieux-habits": {
    src: "/images/proverbs/ou-vont-les-vieux-habits.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Kangas_drying_in_Zanzibar.jpg",
    credit:
      "Kangas séchant sur un fil, Zanzibar, Tanzanie — Lall (Flickr), Wikimedia Commons, CC BY 2.0",
    shortCredit: { fr: "Lall, CC BY 2.0" },
    alt: {
      fr: "Deux kangas, des étoffes de coton imprimées, qui sèchent sur un fil à Zanzibar : l'étoffe dont sont faits les habits du proverbe.",
    },
    focus: "50% 45%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "la-langue-ennemie-de-son-proprietaire": {
    src: "/images/proverbs/la-langue-ennemie-de-son-proprietaire.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Houses_at_the_Peul_Bande_village_of_Ibel_in_southeast_Senegal_(West_Africa)_(2206042333).jpg",
    credit:
      "Cases du village peul bande d'Ibel, sud-est du Sénégal, vers 1981 — John Atherton, Wikimedia Commons, CC BY-SA 2.0",
    shortCredit: {
      fr: "John Atherton, CC BY-SA 2.0",
    },
    alt: {
      fr: "Des cases au toit de chaume dans un village peul du sud-est du Sénégal : un lieu du peuple peul.",
    },
    focus: "50% 60%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
  },
  "l-or-perit-la-relation-humaine-demeure": {
    src: "/images/proverbs/l-or-perit-la-relation-humaine-demeure.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Sunset_in_Segou.jpg",
    credit:
      "Coucher de soleil sur le Niger à Ségou, Mali — Robin Taylor, Wikimedia Commons, CC BY 2.0",
    shortCredit: {
      fr: "Robin Taylor, CC BY 2.0",
    },
    alt: {
      fr: "Le fleuve Niger au coucher du soleil à Ségou, au Mali, avec deux pirogues : le pays du proverbe bambara.",
    },
    focus: "50% 55%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "le-propre-de-l-homme-est-de-comprendre": {
    src: "/images/proverbs/le-propre-de-l-homme-est-de-comprendre.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Mali10-501_Hirsefeld-Ernte.jpg",
    credit:
      "Champ de mil fauché, Mali — Lusi Lindwurm, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Lusi Lindwurm, CC BY-SA 4.0",
    },
    alt: {
      fr: "Du mil fauché, grains et tiges mêlés, dans un champ du Mali : la graine dont parle le proverbe bambara.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "il-n-y-a-pas-de-bon-village": {
    src: "/images/proverbs/il-n-y-a-pas-de-bon-village.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:ASC_Leiden_-_F._van_der_Kraaij_Collection_-_12_-_026_-_Un_village_traditionnel_avec_des_huttes_rondes_-_Mossi_Plateau,_Plateau-Central,_Burkina_Faso,_1982.tif",
    credit:
      "Village traditionnel du plateau mossi, Burkina Faso, 1982 — Fred van der Kraaij, ASC Leiden, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Fred van der Kraaij, ASC Leiden, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un village du plateau mossi, au Burkina Faso, avec ses cases rondes au toit de chaume derrière un champ : le lieu du peuple mossi.",
    },
    focus: "50% 45%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "dieu-puise-l-eau-des-termites": {
    src: "/images/proverbs/dieu-puise-l-eau-des-termites.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Termiti%C3%A8re_vu_%C3%A0_Bocabo_1.jpg",
    credit:
      "Termitière à Bocabo, Côte d'Ivoire — Kod B, Wikimedia Commons, CC0",
    shortCredit: { fr: "Kod B, CC0" },
    alt: {
      fr: "Une termitière dressée parmi la végétation, en Côte d'Ivoire : ce que bâtissent les termites du proverbe.",
    },
    focus: "50% 40%",
    licence: "cc0",
  },
  "une-main-seule-n-attrape-pas-le-buffle": {
    src: "/images/proverbs/une-main-seule-n-attrape-pas-le-buffle.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:B%C3%BAfalo_cafre_(Syncerus_caffer),_parque_nacional_del_lago_Nakuru,_Kenia,_2024-05-18,_DD_85.jpg",
    credit:
      "Buffle d'Afrique, parc national du lac Nakuru, Kenya — Diego Delso, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Diego Delso, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un buffle d'Afrique broutant dans l'herbe haute, au Kenya : l'animal dont parle le proverbe.",
    },
    focus: "40% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "c-est-avec-patience-qu-on-ote-les-sandales-du-chef": {
    src: "/images/proverbs/c-est-avec-patience-qu-on-ote-les-sandales-du-chef.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Amedzofe_village_Ghana.jpg",
    credit:
      "Amedzofe, région de la Volta, Ghana — Williams Penuku, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Williams Penuku, CC BY-SA 4.0",
    },
    alt: {
      fr: "Le village d'Amedzofe dans les collines brumeuses de la région de la Volta, au Ghana, où l'on parle ewe : le pays du proverbe ewe.",
    },
    focus: "50% 45%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "connais-le-prix-de-la-chikwangue": {
    src: "/images/proverbs/connais-le-prix-de-la-chikwangue.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Chikwangue_-_cooked_cassava,_showing_detail_of_popular_leaves_for_wrapping.jpg",
    credit:
      "Chikwangue cuite et ses feuilles d'emballage — T.K. Naliaka, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "T.K. Naliaka, CC BY-SA 4.0",
    },
    alt: {
      fr: "Une chikwangue, pain de manioc cuit, posée sur de larges feuilles d'emballage : ce dont parle le proverbe.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "le-silence-vaut-mieux-que-la-science": {
    src: "/images/proverbs/le-silence-vaut-mieux-que-la-science.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Massif_of_The_Djurdjura_kabyle.jpg",
    credit:
      "Massif du Djurdjura, Kabylie, Algérie — Ghiles Allali, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Ghiles Allali, CC BY-SA 4.0",
    },
    alt: {
      fr: "Le massif du Djurdjura au-dessus des collines d'oliviers de Kabylie, en Algérie : le lieu du peuple kabyle.",
    },
    focus: "50% 40%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "le-mensonge-souper-d-un-soir": {
    src: "/images/proverbs/le-mensonge-souper-d-un-soir.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Tigray_Landscape_(53009331742).jpg",
    credit:
      "Paysage du Tigré, Éthiopie — Rod Waddington, Wikimedia Commons, CC BY-SA 2.0",
    shortCredit: {
      fr: "Rod Waddington, CC BY-SA 2.0",
    },
    alt: {
      fr: "Des montagnes noyées de brume au crépuscule dans le Tigré, en Éthiopie : le lieu du peuple tigray.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
  },
  "avant-de-dire-un-on-ne-dit-pas-deux": {
    src: "/images/proverbs/avant-de-dire-un-on-ne-dit-pas-deux.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Tigray,_Ethiopia_(10587159784).jpg",
    credit:
      "Falaise et terrasses cultivées, Tigré, Éthiopie — Rod Waddington, Wikimedia Commons, CC BY-SA 2.0",
    shortCredit: {
      fr: "Rod Waddington, CC BY-SA 2.0",
    },
    alt: {
      fr: "Une falaise rouge dominant des champs en terrasses dans le Tigré, en Éthiopie : le lieu du peuple tigray.",
    },
    focus: "55% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
  },
  "tant-que-le-lion-n-a-pas-son-conteur": {
    src: "/images/proverbs/tant-que-le-lion-n-a-pas-son-conteur.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Male_lion_on_savanna.jpg",
    credit:
      "Lion mâle dans la savane — eismcsquare, Wikimedia Commons, CC BY 2.0",
    shortCredit: { fr: "eismcsquare, CC BY 2.0" },
    alt: {
      fr: "Un lion mâle dans l'herbe haute de la savane : le lion dont parle le proverbe.",
    },
    focus: "80% 60%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "deux-fourmis-et-la-sauterelle": {
    src: "/images/proverbs/deux-fourmis-et-la-sauterelle.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Green_ants_working.jpg",
    credit:
      "Deux fourmis vertes portant une sauterelle morte — BrunoPleno, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "BrunoPleno, CC BY-SA 4.0",
    },
    alt: {
      fr: "Deux fourmis vertes tirent une sauterelle morte sur un rocher : ce dont parle le proverbe.",
    },
    focus: "50% 45%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "le-zebre-emporte-ses-rayures": {
    src: "/images/proverbs/le-zebre-emporte-ses-rayures.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Zebra_family.jpg",
    credit:
      "Zèbres des plaines dans la savane — Colormebadd2025, Wikimedia Commons, CC BY 4.0",
    shortCredit: {
      fr: "Colormebadd2025, CC BY 4.0",
    },
    alt: {
      fr: "Des zèbres avancent en file dans l'herbe de la savane, sous un ciel d'orage : les zèbres dont parle le proverbe.",
    },
    focus: "50% 75%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "tous-tisses-comme-une-grande-natte": {
    src: "/images/proverbs/tous-tisses-comme-une-grande-natte.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Texture_paille.JPG",
    credit:
      "Texture de paille tressée — Jamou, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: { fr: "Jamou, CC BY-SA 4.0" },
    alt: {
      fr: "Le détail d'une natte de paille tressée : ce dont parle le proverbe.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "le-mensonge-a-les-jambes-courtes": {
    src: "/images/proverbs/le-mensonge-a-les-jambes-courtes.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Footsteps_Through_The_Sand_(Unsplash).jpg",
    credit: "Traces de pas dans le sable — chuttersnap, Wikimedia Commons, CC0",
    shortCredit: { fr: "chuttersnap, CC0" },
    alt: {
      fr: "Des traces de pas qui s'entremêlent dans le sable : ce qu'un chemin parcouru laisse derrière lui.",
    },
    focus: "50% 60%",
    licence: "cc0",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "vite-seul-loin-ensemble": {
    src: "/images/proverbs/vite-seul-loin-ensemble.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Dirt_Track_(121663313).jpeg",
    credit:
      "Piste sur une lande, Islande — Laimis B, Wikimedia Commons, CC BY 3.0",
    shortCredit: { fr: "Laimis B, CC BY 3.0" },
    alt: {
      fr: "Une piste boueuse qui file vers l'horizon sous un grand ciel : le chemin dont parle la phrase.",
    },
    focus: "50% 65%",
    licence: "cc-by",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
  },
  "tout-un-village-pour-elever-un-enfant": {
    src: "/images/proverbs/tout-un-village-pour-elever-un-enfant.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Uhl_Baragram_Village_Himachal_Oct20_D72_18731nxdt.jpg",
    credit:
      "Village de montagne, Himachal Pradesh, Inde — Timothy Gonsalves, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Timothy Gonsalves, CC BY-SA 4.0",
    },
    alt: {
      fr: "Un village de montagne serré sur son versant boisé : le village dont parle la phrase.",
    },
    focus: "50% 65%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "vieillard-bibliotheque-qui-brule": {
    src: "/images/proverbs/vieillard-bibliotheque-qui-brule.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Old_Geodesy_library_books.jpg",
    credit:
      "Anciens ouvrages sur des rayonnages en bois — Bibliothek Wissenschaftspark Albert Einstein, Wikimedia Commons, CC BY-SA 4.0",
    shortCredit: {
      fr: "Bibliothek Wissenschaftspark Albert Einstein, CC BY-SA 4.0",
    },
    alt: {
      fr: "Des rayonnages de bibliothèque garnis de vieux livres reliés : la bibliothèque dont parle la formule.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "enfant-que-le-village-n-embrasse-pas": {
    src: "/images/proverbs/enfant-que-le-village-n-embrasse-pas.jpg",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Lagerfeuer_mit_Glut_Mai_2012.JPG",
    credit:
      "Feu de camp et braises — 4028mdk09, Wikimedia Commons, CC BY-SA 3.0",
    shortCredit: {
      fr: "4028mdk09, CC BY-SA 3.0",
    },
    alt: {
      fr: "Un feu de bois et ses braises rouges au milieu de pierres : le feu dont parle la phrase.",
    },
    focus: "50% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "trop-petit-moustique": {
    src: "/images/proverbs/trop-petit-moustique.jpg",
    filePage: "https://commons.wikimedia.org/wiki/File:Mosquito-Macro.jpg",
    credit:
      "Moustique en gros plan — Balaram Mahalder, Wikimedia Commons, CC BY-SA 3.0",
    shortCredit: {
      fr: "Balaram Mahalder, CC BY-SA 3.0",
    },
    alt: {
      fr: "Un moustique en gros plan sur un fond bleu pâle : le moustique dont parle la phrase.",
    },
    focus: "40% 50%",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
};
