/**
 * The proverb bank.
 *
 * Compilations of « proverbes africains » are plentiful and almost never say
 * whose proverb they print. Republishing them that way would repeat the one
 * move the atlas exists to undo — folding eight hundred peoples into a
 * continent — so every entry here states how far its origin is known:
 *
 *   attested       an official or referenced source names the people or the
 *                  language the proverb comes from
 *   estimated      only unverified sources (aggregators, quotation sites)
 *                  name it; the attribution is published and labelled
 *   unestablished  no source names a people, or the African attribution
 *                  itself is doubtful; the proverb carries no chip at all
 *
 * Nothing is dropped for being weakly sourced — the Source Tier policy
 * applies here as on the fiches — but a chip is never added that a source
 * does not support. The bank's tests hold both halves of that line.
 *
 * Like the anecdotes, the bank is a module rather than rows in a table: the
 * collection is small, it is read whole, and a page that renders from a
 * constant cannot show an empty dossier because a database was slow.
 */

import type {
  DidYouKnowEntity,
  DidYouKnowEntityKind,
  DidYouKnowSource,
} from "@/lib/home/didYouKnowFacts";

export type ProverbOriginStatus = "attested" | "estimated" | "unestablished";

export interface ProverbOriginal {
  /** The proverb in its own language, as the cited source prints it. */
  text: string;
  /** ISO 639-3 — the corpus's language id, and a valid `lang` attribute. */
  lang: string;
  /** The language's name in the bank's locale. */
  language: string;
}

export interface Proverb {
  id: string;
  /** The proverb as the reader of this locale reads it. */
  text: string;
  /** Absent when no source prints it — never reconstructed. */
  original?: ProverbOriginal;
  /** One sober sentence on what the proverb is used to say. */
  meaning: string;
  origin: {
    status: ProverbOriginStatus;
    /** Why the atlas hesitates; may be empty only for an attested origin. */
    note: string;
  };
  entities: DidYouKnowEntity[];
  sources: DidYouKnowSource[];
}

// @req REQ-113
export const PROVERBS: Proverb[] = [
  {
    id: "on-ne-montre-pas-le-ciel-a-un-enfant",
    text: "Personne ne montre le ciel à un enfant.",
    meaning:
      "Certaines évidences n'ont pas besoin d'être enseignées. Selon une autre lecture que Rattray rapporte avec prudence, nul n'a besoin d'apprendre à un enfant que l'Être suprême existe.",
    origin: {
      status: "attested",
      note: "Proverbe publié en 1916 par R. S. Rattray avec son texte twi (n° 3), à partir du recueil de proverbes twi de J. G. Christaller.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ASANTE",
        label: "Asante",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger-Congo",
      },
    ],
    sources: [
      {
        title: "Ashanti Proverbs (The Primitive Ethics of a Savage People)",
        url: "https://archive.org/details/ashantiproverbst00rattuoft",
        tier: "referenced",
        notes:
          "Recueil publié par Clarendon Press et numérisé par Internet Archive. Il attribue le proverbe aux Asante, donne le texte twi et un commentaire recueilli auprès d'anciens. Le sous-titre emploie le vocabulaire dépréciatif de l'administration coloniale de l'époque.",
      },
    ],
  },
  {
    id: "on-n-apprend-pas-au-petit-leopard-a-bondir",
    text: "Personne n'apprend au petit du léopard à bondir.",
    meaning:
      "Ce qui se transmet par la naissance ou par l'exemple n'a pas besoin d'être enseigné. Rattray le rapporte au fait que les fils de roi n'ont pas besoin qu'on leur apprenne la force.",
    origin: {
      status: "attested",
      note: "Proverbe publié en 1916 par R. S. Rattray avec son texte twi (n° 123). Ruth Finnegan le cite à nouveau comme proverbe akan.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ASANTE",
        label: "Asante",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger-Congo",
      },
    ],
    sources: [
      {
        title: "Ashanti Proverbs (The Primitive Ethics of a Savage People)",
        url: "https://archive.org/details/ashantiproverbst00rattuoft",
        tier: "referenced",
        notes:
          "Recueil publié qui attribue le proverbe aux Asante, avec le texte twi et une note sur l'interprétation donnée par les anciens. Le sous-titre emploie le vocabulaire dépréciatif de l'époque coloniale.",
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès (Open Book Publishers). Il cite le proverbe comme akan et le rattache à l'autorité royale.",
      },
    ],
  },
  {
    id: "au-sot-il-faut-expliquer-le-proverbe",
    text: "Quand on dit un proverbe à un sot, il faut lui en expliquer le sens.",
    meaning:
      "Le proverbe s'adresse à qui sait entendre à demi-mot : l'expliquer, c'est déjà constater qu'on n'a pas été compris.",
    origin: {
      status: "attested",
      note: "Proverbe publié en 1916 par R. S. Rattray avec son texte twi (n° 589). Ruth Finnegan le reprend comme proverbe akan sur la subtilité des proverbes.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ASANTE",
        label: "Asante",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger-Congo",
      },
    ],
    sources: [
      {
        title: "Ashanti Proverbs (The Primitive Ethics of a Savage People)",
        url: "https://archive.org/details/ashantiproverbst00rattuoft",
        tier: "referenced",
        notes:
          "Recueil publié qui attribue le proverbe aux Asante et donne le texte twi. L'auteur le cite aussi dans son introduction. Le sous-titre emploie le vocabulaire dépréciatif de l'époque coloniale.",
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il cite le proverbe comme akan, d'après Rattray (1916).",
      },
    ],
  },
  {
    id: "en-marchant-doucement-on-dort-loin",
    text: "En voyageant doucement, on dort loin.",
    original: {
      text: "Taffia sanu sanu kwana nesa.",
      lang: "hau",
      language: "haoussa",
    },
    meaning:
      "La prudence et la régularité mènent plus loin que la précipitation.",
    origin: {
      status: "attested",
      note: "Proverbe haoussa publié en 1905 avec son texte original (n° 166), dans une orthographe ancienne. Le haoussa courant l'écrit aujourd'hui autrement.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroun",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Tchad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Soudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Tchadique",
      },
    ],
    sources: [
      {
        title: "Hausa Proverbs",
        url: "https://archive.org/details/hausaproverbs00merrrich",
        tier: "referenced",
        notes:
          "Recueil publié à Londres par Kegan Paul, numérisé par Internet Archive. Il donne le texte haoussa, une traduction anglaise et une explication. L'auteur est un officier britannique de l'époque coloniale.",
      },
    ],
  },
  {
    id: "le-nombre-fait-tirer-la-pierre-au-coton",
    text: "Le nombre fait que le coton tire une pierre.",
    original: {
      text: "Yawa shi kan sa zarre ya ja duchi.",
      lang: "hau",
      language: "haoussa",
    },
    meaning:
      "Des fils fragiles, une fois réunis, déplacent ce qu'aucun ne bougerait seul : l'union fait la force.",
    origin: {
      status: "attested",
      note: "Proverbe haoussa publié en 1905 avec son texte original (n° 7), dans une orthographe ancienne.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroun",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Tchad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Soudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Tchadique",
      },
    ],
    sources: [
      {
        title: "Hausa Proverbs",
        url: "https://archive.org/details/hausaproverbs00merrrich",
        tier: "referenced",
        notes:
          "Recueil publié qui donne le texte haoussa, la traduction « Quantity makes the cotton draw a stone » et l'équivalent « Unity is strength ».",
      },
    ],
  },
  {
    id: "meme-le-niger-a-une-ile",
    text: "Même le Niger a une île.",
    meaning:
      "Même la puissance la plus grande doit parfois s'incliner devant un obstacle.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme haoussa par Ruth Finnegan, d'après le recueil de C. E. J. Whitting (1940). La source ne donne pas le texte haoussa.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroun",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Tchad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Soudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Tchadique",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Haoussa, cite Whitting (1940) et explique que même le pouvoir doit parfois s'incliner.",
      },
    ],
  },
  {
    id: "les-petites-averses-remplissent-le-ruisseau",
    text: "Les petites averses remplissent le ruisseau.",
    original: {
      text: "Da yeyefi kwogi kan chikka.",
      lang: "hau",
      language: "haoussa",
    },
    meaning:
      "La persévérance, par petites contributions, finit par accomplir l'ouvrage.",
    origin: {
      status: "attested",
      note: "Proverbe haoussa publié en 1905 avec son texte original (n° 233), dans une orthographe ancienne. La version numérisée du recueil comporte une légère erreur de lecture sur le dernier mot.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroun",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Tchad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Soudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Tchadique",
      },
    ],
    sources: [
      {
        title: "Hausa Proverbs",
        url: "https://archive.org/details/hausaproverbs00merrrich",
        tier: "referenced",
        notes:
          "Recueil publié qui donne le texte haoussa, la traduction « Small showers fill the stream » et le commentaire « Perseverance finishes work ».",
      },
    ],
  },
  {
    id: "aujourd-hui-frere-aine-de-demain",
    text: "Aujourd'hui est le frère aîné de demain, et une forte rosée est la sœur aînée de la pluie.",
    meaning: "Ce qui arrive aujourd'hui annonce et prépare ce qui viendra.",
    origin: {
      status: "attested",
      note: "Couplet cité comme yoruba par Ruth Finnegan, en exemple de construction en antithèse. La source ne donne pas le texte yoruba.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_YORUBA",
        label: "Yoruba",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le couplet aux Yoruba et l'analyse comme un parallélisme en antithèse.",
      },
    ],
  },
  {
    id: "clin-d-oeil-du-crabe",
    text: "Celui qui attend de voir un crabe cligner de l'œil s'attardera longtemps sur le rivage.",
    meaning: "Attendre l'impossible, c'est perdre son temps.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme yoruba par Ruth Finnegan, d'après A. B. Ellis (1894). La source ne donne pas le texte yoruba.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_YORUBA",
        label: "Yoruba",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Yoruba, d'après Ellis (1894), en exemple d'image désignant l'impossible.",
      },
    ],
  },
  {
    id: "la-maison-lieu-de-repos-du-voyageur",
    text: "La terre natale est le lieu de repos ultime du voyageur.",
    original: {
      text: "Ilé làbọ̀ sinmi oko",
      lang: "yor",
      language: "yoruba",
    },
    meaning:
      "Quel que soit le chemin parcouru, c'est chez soi qu'on revient se reposer.",
    origin: {
      status: "attested",
      note: "Proverbe yoruba publié en 2025 avec son texte original par des linguistes de l'université d'Ibadan. Ils notent que l'émigration a changé la façon dont beaucoup le reçoivent.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_YORUBA",
        label: "Yoruba",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title: "Yorùbá Proverbs and their Relevance to our Contemporary Times",
        url: "https://www.academicresearchjournals.org/IJELC/PDF/2025/February/Oluwadoro%20et%20al.pdf",
        tier: "referenced",
        notes:
          "Article de revue (International Journal of English Literature and Culture, vol. 13, n° 1). Il donne le proverbe en yoruba (n° 15) avec sa traduction anglaise et un commentaire sur la récession économique et l'émigration.",
      },
    ],
  },
  {
    id: "proverbes-huile-de-palme-des-mots",
    text: "Les proverbes sont l'huile de palme avec laquelle on mange les mots.",
    meaning:
      "Chez les Igbo, un propos sans proverbe est comme un plat sans assaisonnement : le proverbe rend la parole acceptable et savoureuse.",
    origin: {
      status: "attested",
      note: "La phrase vient du roman de Chinua Achebe Things Fall Apart (1958). Le narrateur la présente comme la conception igbo de l'art de la conversation. On la cite depuis comme proverbe igbo, mais l'atlas ne s'appuie sur aucun recueil de tradition orale, et le texte igbo n'est pas donné.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_IGBO",
        label: "Igbo",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title:
          "'The palm-oil with which Igbo words are eaten': a descriptive analysis of the translation of Igbo idioms into Zulu in Things Fall Apart",
        url: "https://www.researchgate.net/publication/233035724_'The_palm-oil_with_which_Igbo_words_are_eaten'_a_descriptive_analysis_of_the_translation_of_Igbo_idioms_into_Zulu_in_Things_Fall_Apart",
        tier: "referenced",
        notes:
          "Article universitaire sur la traduction en zoulou des expressions igbo du roman d'Achebe. Son titre reprend la formule et la rattache à la langue igbo.",
      },
      {
        title: "Use of Language in Things Fall Apart",
        url: "https://www.cliffsnotes.com/literature/t/things-fall-apart/critical-essays/use-of-language-in-things-fall-apart",
        tier: "unverified",
        notes:
          "Guide de lecture scolaire qui cite la phrase du premier chapitre du roman, où elle est dite des Igbo.",
      },
    ],
  },
  {
    id: "que-le-milan-se-pose-et-l-aigle-aussi",
    text: "Que le milan se pose et que l'aigle se pose aussi ; celui qui refuse à l'autre de se poser, que son aile se brise.",
    original: {
      text: "Egbe bere ugo bere, nke si ibe ya ebena nku kwaa ya.",
      lang: "ibo",
      language: "igbo",
    },
    meaning:
      "Chacun a droit à sa place : c'est la règle du « vivre et laisser vivre ».",
    origin: {
      status: "attested",
      note: "Proverbe igbo qu'un personnage prononce, sous une forme abrégée, dans Things Fall Apart (1958) de Chinua Achebe. Une chronique de presse nigériane l'analyse comme proverbe igbo. Le texte igbo cité ici vient d'une source non vérifiée.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_IGBO",
        label: "Igbo",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title:
          'A Dissection of the Proverb "Let the kite perch and let the eagle perch"',
        url: "https://www.opinionnigeria.com/a-dissection-of-the-proverb-let-the-kite-perch-and-let-the-eagle-perch-by-azuka-onwuka/",
        tier: "referenced",
        notes:
          "Chronique signée dans la presse nigériane. Elle commente le proverbe comme proverbe igbo.",
      },
      {
        title: "Things Fall Apart Chapter 3 Questions and Answers",
        url: "https://www.enotes.com/topics/things-fall-apart/quiz/chapter-3-questions-answers",
        tier: "unverified",
        notes:
          "Guide de lecture qui situe la phrase au chapitre 3 du roman, dans la bouche du personnage Nwakibie.",
      },
      {
        title: "IGBO PROVERBS (compte X) — « Egbe bere ugo bere… »",
        url: "https://x.com/IgboProverbs_/status/1198126440983801856",
        tier: "unverified",
        notes:
          "Publication sur un réseau social qui donne le texte igbo complet et une traduction anglaise, sans citer de recueil.",
      },
    ],
  },
  {
    id: "peu-a-peu-on-remplit-la-mesure",
    text: "Peu à peu, on remplit la mesure.",
    original: {
      text: "Haba na haba hujaza kibaba",
      lang: "swh",
      language: "swahili",
    },
    meaning: "Les petites quantités accumulées finissent par faire une somme.",
    origin: {
      status: "attested",
      note: "Proverbe publié avec son texte swahili et sa traduction par le Centre d'études africaines de l'université de l'Illinois.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "République-Unie de Tanzanie",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comores",
      },
      {
        kind: "country",
        id: "COD",
        label: "République démocratique du Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Ouganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Swahili Proverbs — Methali za Kiswahili",
        url: "https://swahiliproverbs.afrst.illinois.edu/proverbs.htm",
        tier: "referenced",
        notes:
          "Collection universitaire en ligne. Elle donne le proverbe en swahili et sa traduction anglaise « Little by little fills up the measure ».",
      },
    ],
  },
  {
    id: "hate-hate-n-a-pas-de-benediction",
    text: "Hâte, hâte n'a pas de bénédiction.",
    original: {
      text: "Haraka haraka haina baraka",
      lang: "swh",
      language: "swahili",
    },
    meaning: "Ce qui est fait dans la précipitation tourne rarement bien.",
    origin: {
      status: "attested",
      note: "Proverbe swahili publié par l'université de l'Illinois. Ruth Finnegan le cite aussi, d'après Doke (1947), pour son redoublement.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "République-Unie de Tanzanie",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comores",
      },
      {
        kind: "country",
        id: "COD",
        label: "République démocratique du Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Ouganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Swahili Proverbs — Methali za Kiswahili",
        url: "https://swahiliproverbs.afrst.illinois.edu/proverbs.htm",
        tier: "referenced",
        notes:
          "Collection universitaire en ligne. Elle donne le proverbe en swahili et la traduction « Hurry, hurry, has no blessings ».",
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il cite le proverbe comme swahili, avec son texte original, en exemple de redoublement.",
      },
    ],
  },
  {
    id: "une-personne-c-est-des-gens",
    text: "Une personne, c'est des gens.",
    original: {
      text: "Mtu ni watu",
      lang: "swh",
      language: "swahili",
    },
    meaning: "On n'existe pleinement qu'à travers ses liens avec les autres.",
    origin: {
      status: "attested",
      note: "Proverbe publié avec son texte swahili et sa traduction par le Centre d'études africaines de l'université de l'Illinois.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "République-Unie de Tanzanie",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comores",
      },
      {
        kind: "country",
        id: "COD",
        label: "République démocratique du Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Ouganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Swahili Proverbs — Methali za Kiswahili",
        url: "https://swahiliproverbs.afrst.illinois.edu/proverbs.htm",
        tier: "referenced",
        notes:
          "Collection universitaire en ligne. Elle donne le proverbe en swahili et la traduction « A person is people ».",
      },
    ],
  },
  {
    id: "qui-n-est-pas-instruit-par-sa-mere",
    text: "Celui que sa mère n'a pas instruit sera instruit par le monde.",
    original: {
      text: "Asiyefunzwa na mamae hufunzwa na ulimwengu",
      lang: "swh",
      language: "swahili",
    },
    meaning:
      "Ce que l'éducation familiale n'a pas transmis, la vie l'enseignera, souvent plus durement.",
    origin: {
      status: "attested",
      note: "Proverbe swahili cité par la radio publique américaine NPR comme équivalent africain approché de « Il faut tout un village pour élever un enfant ». La traduction française est celle de l'atlas, faite à partir du texte swahili cité.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "République-Unie de Tanzanie",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comores",
      },
      {
        kind: "country",
        id: "COD",
        label: "République démocratique du Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Ouganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title:
          "It Takes A Village To Determine The Origins Of An African Proverb",
        url: "https://www.npr.org/sections/goatsandsoda/2016/07/30/487925796/it-takes-a-village-to-determine-the-origins-of-an-african-proverb",
        tier: "referenced",
        notes:
          "Article de presse. Il cite ce proverbe en swahili, recueilli lors d'une discussion entre universitaires africanistes, comme proche du sens de « It takes a village ».",
      },
    ],
  },
  {
    id: "l-enfant-est-a-tous-jita",
    text: "L'enfant appartient à tous.",
    original: {
      text: "Omwana ni wa bhone",
      lang: "jit",
      language: "jita",
    },
    meaning:
      "L'éducation de l'enfant revient à la communauté, quelle que soit sa filiation biologique.",
    origin: {
      status: "attested",
      note: "Proverbe jita cité par NPR, qui l'a trouvé dans une discussion entre universitaires africanistes. La traduction reprend l'explication donnée par la source.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_JITA",
        label: "Jita",
      },
      {
        kind: "country",
        id: "TZA",
        label: "République-Unie de Tanzanie",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title:
          "It Takes A Village To Determine The Origins Of An African Proverb",
        url: "https://www.npr.org/sections/goatsandsoda/2016/07/30/487925796/it-takes-a-village-to-determine-the-origins-of-an-african-proverb",
        tier: "referenced",
        notes:
          "Article de presse. Il donne le proverbe en jita et explique que l'éducation de l'enfant appartient à la communauté.",
      },
    ],
  },
  {
    id: "aucun-putois-ne-sent-sa-propre-odeur",
    text: "Aucun putois n'a jamais senti sa propre puanteur.",
    original: {
      text: "Aku 'qaqa lazizwa ukunuka.",
      lang: "zul",
      language: "zoulou",
    },
    meaning: "Personne ne reconnaît ses propres défauts.",
    origin: {
      status: "attested",
      note: "Proverbe zoulou publié en 1912 avec son texte original (n° 10), dans l'orthographe de l'époque. Ruth Finnegan le cite à nouveau.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "Afrique du Sud",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambie",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Zulu Proverbs",
        url: "https://emandulo.apc.uct.ac.za/collection/Mayr/Publications/Mayr_Zulu_Proverbs.pdf",
        tier: "referenced",
        notes:
          "Article de la revue Anthropos (vol. 7), mis en ligne par l'université du Cap. Il donne le texte zoulou, la traduction anglaise et le sens « Nobody recognises his own faults ».",
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il cite le proverbe comme zoulou, d'après Mayr (1912), sur l'aveuglement envers soi-même.",
      },
    ],
  },
  {
    id: "on-n-atteint-pas-la-hauteur-dans-la-hate",
    text: "La hauteur ne s'atteint pas dans la hâte.",
    original: {
      text: "Ubude abupangwa.",
      lang: "zul",
      language: "zoulou",
    },
    meaning:
      "Ce qui grandit demande du temps : inutile de précipiter les choses.",
    origin: {
      status: "attested",
      note: "Proverbe zoulou publié en 1912 avec son texte original (n° 2), dans l'orthographe de l'époque.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "Afrique du Sud",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambie",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Zulu Proverbs",
        url: "https://emandulo.apc.uct.ac.za/collection/Mayr/Publications/Mayr_Zulu_Proverbs.pdf",
        tier: "referenced",
        notes:
          "Article de la revue Anthropos (vol. 7). Il donne le texte zoulou et la traduction « Height is not reached in a hurry », suivie d'un conseil contre la précipitation.",
      },
    ],
  },
  {
    id: "pas-de-riviere-sans-son-propre-bruit",
    text: "Il n'est pas de rivière qui n'ait son propre bruit.",
    original: {
      text: "Aku 'mfula ungahlokomi.",
      lang: "zul",
      language: "zoulou",
    },
    meaning: "Chacun a ses qualités propres.",
    origin: {
      status: "attested",
      note: "Proverbe zoulou publié en 1912 avec son texte original (n° 27), dans l'orthographe de l'époque.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "Afrique du Sud",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambie",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Zulu Proverbs",
        url: "https://emandulo.apc.uct.ac.za/collection/Mayr/Publications/Mayr_Zulu_Proverbs.pdf",
        tier: "referenced",
        notes:
          "Article de la revue Anthropos (vol. 7). Il donne le texte zoulou, la traduction et le sens « Everyone has his own qualities ».",
      },
    ],
  },
  {
    id: "une-personne-est-une-personne-par-les-autres",
    text: "Une personne est une personne à travers les autres personnes.",
    original: {
      text: "Umuntu ngumuntu ngabantu",
      lang: "zul",
      language: "zoulou et ndébélé",
    },
    meaning:
      "L'humanité de chacun se réalise dans ses relations avec les autres. C'est la maxime souvent associée à la notion d'ubuntu.",
    origin: {
      status: "attested",
      note: "Une encyclopédie de philosophie à comité de lecture donne cette maxime en zoulou et en ndébélé. Elle cite son équivalent shona « munhu munhu muvanhu » et une forme xhosa employée par Desmond Tutu. Le texte ne dit pas depuis quand la maxime sert à définir l'ubuntu.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "people",
        id: "PPL_NDEBELE",
        label: "Ndebele",
      },
      {
        kind: "people",
        id: "PPL_SHONA",
        label: "Shona",
      },
      {
        kind: "people",
        id: "PPL_XHOSA",
        label: "Xhosa",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "Afrique du Sud",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambie",
      },
      {
        kind: "country",
        id: "LSO",
        label: "Lesotho",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Hunhu/Ubuntu in Traditional Southern African Thought",
        url: "https://iep.utm.edu/hunhu-ubuntu-southern-african-thought/",
        tier: "referenced",
        notes:
          "Article de l'Internet Encyclopedia of Philosophy, à comité de lecture. Il donne la maxime en zoulou et en ndébélé, son équivalent shona et une forme xhosa, toutes traduites « a person is a person through other persons ».",
      },
    ],
  },
  {
    id: "un-pouce-seul-n-ecrase-pas-un-pou",
    text: "Un seul pouce n'écrase pas un pou.",
    original: {
      text: "Chara chimwe hachitswanyi inda",
      lang: "sna",
      language: "shona",
    },
    meaning: "Seul, on accomplit moins qu'à plusieurs.",
    origin: {
      status: "attested",
      note: "Proverbe shona publié en 2015 dans une revue africaniste. Les auteurs l'opposent à d'autres proverbes shona qui prônent l'autonomie. Leur traduction anglaise porte « crash a mouse », qui paraît être une coquille : « inda » désigne le pou.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SHONA",
        label: "Shona",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title:
          "Communicating co-operation or individualism? The paradox of the Shona proverb",
        url: "https://academicjournals.org/journal/JASD/article-full-text/01F90D253039",
        tier: "referenced",
        notes:
          "Article du Journal of African Studies and Development, vol. 7, n° 5. Il donne le proverbe en shona, une traduction anglaise, et le discute avec des proverbes shona de sens opposé.",
      },
    ],
  },
  {
    id: "deterrer-les-rats-demande-de-s-y-mettre-ensemble",
    text: "Déterrer les rats demande de s'y mettre ensemble.",
    original: {
      text: "Kuchera mbeva kukomberana",
      lang: "sna",
      language: "shona",
    },
    meaning:
      "Certaines tâches ne réussissent que si chacun encercle et prend sa part.",
    origin: {
      status: "attested",
      note: "Proverbe shona publié en 2015 avec son texte original dans une revue africaniste consacrée aux proverbes shona sur la coopération.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SHONA",
        label: "Shona",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title:
          "Communicating co-operation or individualism? The paradox of the Shona proverb",
        url: "https://academicjournals.org/journal/JASD/article-full-text/01F90D253039",
        tier: "referenced",
        notes:
          "Article de revue. Il donne le proverbe en shona avec la traduction « To dig for mice needs concerted effort ».",
      },
    ],
  },
  {
    id: "crepitement-n-est-pas-feu",
    text: "Crépiter, crépiter, ce n'est pas du feu.",
    original: {
      text: "bugu-bugu simuliro",
      lang: "lug",
      language: "luganda",
    },
    meaning:
      "L'agitation et le bruit ne prouvent pas qu'il se passe quelque chose de réel.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme ganda, avec son texte original, par Ruth Finnegan d'après Doke (1947), en exemple de redoublement.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAGANDA",
        label: "Baganda / Ganda",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Ouganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Ganda et donne le texte « bugu-bugu simuliro » avec sa traduction.",
      },
    ],
  },
  {
    id: "un-jour-ne-suffit-pas-a-pourrir-un-elephant",
    text: "Un seul jour ne suffit pas à faire pourrir un éléphant.",
    meaning: "Les grandes choses, et leur fin, prennent du temps.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme ila par Ruth Finnegan, d'après le recueil de Smith et Dale (1920). La source ne donne pas le texte ila.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ILA",
        label: "Ila",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambie",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Ila, d'après Smith et Dale (1920), et le rapproche de « Rome ne s'est pas faite en un jour ».",
      },
    ],
  },
  {
    id: "la-force-du-crocodile-est-dans-l-eau",
    text: "La force du crocodile est dans l'eau.",
    meaning:
      "Chacun tire sa force de son milieu et des siens ; hors de sa place, on devient vulnérable.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme « thonga » par Ruth Finnegan, d'après Henri-Alexandre Junod (1938). « Thonga » est le nom que Junod donnait aux Tsonga. La source ne donne pas le texte original.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_TSONGA",
        label: "Tsonga",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "Afrique du Sud",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "SWZ",
        label: "Eswatini",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger-Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Thonga, d'après Junod (1938), et en donne deux sens : les parents font la force, ou chacun doit rester à sa place.",
      },
    ],
  },
  {
    id: "c-est-la-patience-qui-sort-du-filet",
    text: "C'est la patience qui te sort du filet.",
    meaning:
      "S'agiter ou mentir emmêle davantage ; la patience permet de se dégager.",
    origin: {
      status: "attested",
      note: "Proverbe employé devant les tribunaux coutumiers, cité comme nyanja par Ruth Finnegan d'après Gray (1944). La source ne donne pas le texte nyanja.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_NYANJA",
        label: "Nyanja",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambie",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger-Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Nyanja, d'après Gray (1944), dans le contexte des procès : le mensonge emmêle davantage.",
      },
    ],
  },
  {
    id: "la-grenouille-fait-tomber-la-pluie-sur-sa-tete",
    text: "La grenouille fait tomber la pluie sur sa propre tête.",
    meaning:
      "Celui qui provoque un malheur est le premier à en subir les conséquences.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme azande par Ruth Finnegan, d'après E. E. Evans-Pritchard (1963), qui le décrit comme un argument sans réplique dans les disputes. La source ne donne pas le texte zande.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZANDE",
        label: "Azande",
      },
      {
        kind: "country",
        id: "COD",
        label: "République démocratique du Congo",
      },
      {
        kind: "country",
        id: "CAF",
        label: "République centrafricaine",
      },
      {
        kind: "country",
        id: "SSD",
        label: "Soudan du Sud",
      },
      {
        kind: "family",
        id: "FLG_SOUDANIQUECENTRAL",
        label: "Soudanique central",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Azande, d'après Evans-Pritchard (1963), et le présente comme un constat qu'on oppose dans les disputes.",
      },
    ],
  },
  {
    id: "une-bouchee-ne-brise-pas-la-compagnie",
    text: "Une bouchée de nourriture ne brise pas une compagnie ; ce qui brise une compagnie, c'est la bouche.",
    meaning:
      "Ce ne sont pas les biens partagés qui divisent un groupe, mais les paroles.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme lamba par Ruth Finnegan, en exemple de construction en chiasme. La source donne aussi le texte lamba.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_LALA_LAMBA",
        label: "Lala-Lamba",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambie",
      },
      {
        kind: "country",
        id: "COD",
        label: "République démocratique du Congo",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue le proverbe aux Lamba et l'analyse comme parallélisme croisé.",
      },
    ],
  },
  {
    id: "ou-vont-les-vieux-habits",
    text: "Quand on coud des habits neufs, où vont les vieux ?",
    meaning:
      "Une question sans réponse, posée pour clore une discussion : le nouveau ne fait pas disparaître ce qui l'a précédé.",
    origin: {
      status: "attested",
      note: "Proverbe cité comme kikuyu par Ruth Finnegan : une question qu'on pose pour mettre fin à une discussion. La source ne donne pas le texte gikuyu.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KIKUYU",
        label: "Kikuyu",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "Ouvrage universitaire en libre accès. Il attribue cette question proverbiale aux Kikuyu et indique qu'elle sert à clore une discussion.",
      },
    ],
  },
  {
    id: "l-homme-est-le-remede-de-l-homme",
    text: "L'homme est le remède de l'homme.",
    original: {
      text: "Nit nitay garabam",
      lang: "wol",
      language: "wolof",
    },
    meaning:
      "L'humanité ne va pas de soi : chacun la réalise avec l'aide des autres.",
    origin: {
      status: "attested",
      note: "Maxime wolof commentée par le philosophe Souleymane Bachir Diagne. Il rappelle que Léopold Sédar Senghor l'avait analysée longuement dans un discours sur les droits humains en 1978.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_WOLOF",
        label: "Wolof",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Sénégal",
      },
      {
        kind: "country",
        id: "GMB",
        label: "Gambie",
      },
      {
        kind: "country",
        id: "MRT",
        label: "Mauritanie",
      },
      {
        kind: "family",
        id: "FLG_ATLANTIQUE",
        label: "Atlantique",
      },
    ],
    sources: [
      {
        title: "Ubuntu, nite et humanisme",
        url: "https://palaisdetokyo.com/en/ressource/ubuntu-nite-et-humanisme/",
        tier: "referenced",
        notes:
          "Texte signé d'un philosophe, publié par le Palais de Tokyo. Il donne la maxime en wolof et la traduit « l'homme est le remède de l'homme ». Il en présente une variante à une voyelle près et renvoie à l'analyse de Senghor (1978).",
      },
    ],
  },
  {
    id: "la-langue-ennemie-de-son-proprietaire",
    text: "La langue est l'ennemie de son propriétaire.",
    original: {
      text: "ɗemngal ko ganyo jooma mum",
      lang: "fuc",
      language: "pulaar",
    },
    meaning:
      "Une parole mal maîtrisée se retourne contre celui qui la prononce.",
    origin: {
      status: "attested",
      note: "Proverbe peul du Fouladou (Sénégal), publié en 1987 avec son texte original. Les Peuls lui opposent un proverbe inverse : « la langue est utilité ». Dans la version en ligne de l'article, la première lettre est rendue par un caractère voisin.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_FULA",
        label: "Fula (Fulbe / Peul)",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Sénégal",
      },
      {
        kind: "country",
        id: "GIN",
        label: "Guinée",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroun",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Tchad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Soudan",
      },
      {
        kind: "country",
        id: "CAF",
        label: "République centrafricaine",
      },
      {
        kind: "country",
        id: "MRT",
        label: "Mauritanie",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_ATLANTIQUE",
        label: "Atlantique",
      },
    ],
    sources: [
      {
        title:
          "La parole à travers quelques proverbes peuls du Fouladou (Sénégal)",
        url: "https://www.persee.fr/doc/jafr_0399-0346_1987_num_57_1_2162",
        tier: "referenced",
        notes:
          "Article du Journal des Africanistes (vol. 57), en ligne sur Persée. Il donne le proverbe en pulaar avec la traduction « la langue est l'ennemi de son propriétaire » et le proverbe antithétique « la langue est utilité ».",
      },
    ],
  },
  {
    id: "l-or-perit-la-relation-humaine-demeure",
    text: "L'or et l'argent sont périssables, mais les relations humaines restent.",
    original: {
      text: "Sanu ni wari bè ban, nga mogoya te ban",
      lang: "bam",
      language: "bambara",
    },
    meaning: "La richesse peut disparaître, la fraternité est plus durable.",
    origin: {
      status: "attested",
      note: "Proverbe bambara publié en 2008 avec son texte original par un juriste malien, dans une série de l'université de Fribourg. L'auteur y rassemble des proverbes utiles au dialogue sur les droits humains.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAMBARA",
        label: "Bambara",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "country",
        id: "GIN",
        label: "Guinée",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Sénégal",
      },
      {
        kind: "family",
        id: "FLG_MANDE",
        label: "Mandé",
      },
    ],
    sources: [
      {
        title:
          "Grenier à mots — Bamanan (Dagné Jiginé), Document de travail de l'IIEDH n° 15.3",
        url: "https://www.unifr.ch/ethique/fr/assets/public/Files/bambaradt.pdf",
        tier: "referenced",
        notes:
          "Document de travail publié par l'Institut interdisciplinaire d'éthique et des droits de l'homme (université de Fribourg). Il donne le proverbe en bambara, la traduction française et l'explication « la richesse peut disparaître, mais la fraternité est plus stable ».",
      },
    ],
  },
  {
    id: "le-propre-de-l-homme-est-de-comprendre",
    text: "Le propre de la graine est de lever, celui du fruit est de mûrir, celui de l'homme est de comprendre.",
    original: {
      text: "Dànnifen ye wilita ye, jiriden ye mofen ye, mogoya ye hakili ye",
      lang: "bam",
      language: "bambara",
    },
    meaning: "La réflexion et la sagesse sont ce qui distingue l'être humain.",
    origin: {
      status: "attested",
      note: "Proverbe bambara publié en 2008 avec son texte original dans une série de l'université de Fribourg. L'auteur le marque comme l'une des « perles » de la sagesse bamanan.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAMBARA",
        label: "Bambara",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "country",
        id: "GIN",
        label: "Guinée",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Sénégal",
      },
      {
        kind: "family",
        id: "FLG_MANDE",
        label: "Mandé",
      },
    ],
    sources: [
      {
        title:
          "Grenier à mots — Bamanan (Dagné Jiginé), Document de travail de l'IIEDH n° 15.3",
        url: "https://www.unifr.ch/ethique/fr/assets/public/Files/bambaradt.pdf",
        tier: "referenced",
        notes:
          "Document de travail universitaire. Il donne le proverbe en bambara, la traduction française et l'explication « la réflexion, l'intelligence, la sagesse sont le propre de l'homme ».",
      },
    ],
  },
  {
    id: "il-n-y-a-pas-de-bon-village",
    text: "Il faut savoir s'asseoir et exister, il n'y a pas de bon village.",
    original: {
      text: "Bãng n zĩnd n be, tẽng sẽn nooma ka ye",
      lang: "mos",
      language: "mooré",
    },
    meaning:
      "L'ailleurs n'est pas forcément meilleur : il faut apprendre à bien vivre là où l'on est.",
    origin: {
      status: "attested",
      note: "Proverbe moaga publié en 2014 avec son texte original. On le chantait pour dissuader les jeunes de partir. Des migrants de retour l'ont relu autrement : il faut savoir s'intégrer partout où l'on s'installe.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_MOSSI",
        label: "Mossi",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "family",
        id: "FLG_GUR",
        label: "Gur",
      },
    ],
    sources: [
      {
        title:
          "Mobilités et migrations dans les discours et la littérature orale moose (Burkina Faso)",
        url: "https://journals.openedition.org/etudesafricaines/17667",
        tier: "referenced",
        notes:
          "Article des Cahiers d'études africaines (n° 213-214), en libre accès. Il donne le proverbe en mooré avec sa traduction française et analyse ses emplois dans les chants funéraires, le théâtre et les récits de migrants.",
      },
    ],
  },
  {
    id: "dieu-puise-l-eau-des-termites",
    text: "C'est Dieu qui puise l'eau des termites.",
    meaning:
      "Les êtres faibles et démunis ne sont pas abandonnés : une puissance bienveillante pourvoit à leurs besoins.",
    origin: {
      status: "attested",
      note: "Proverbe baoulé analysé en 2016 par deux linguistes de l'université Félix-Houphouët-Boigny. Ils le glosent mot à mot et expliquent l'image : les termites bâtissent avec une eau que Dieu leur fournit.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAOULE",
        label: "Baoulé",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title: "Approche cognitive du figement dans les proverbes baoulé",
        url: "https://cvc.cervantes.es/lengua/paremia/pdf/025/012_yao-kouakou.pdf",
        tier: "referenced",
        notes:
          "Article de la revue Paremia (n° 25, p. 149-160), en ligne sur le Centro Virtual Cervantes. Il donne le proverbe glosé mot à mot en baoulé, sa traduction française et l'explication de l'image.",
      },
    ],
  },
  {
    id: "une-main-seule-n-attrape-pas-le-buffle",
    text: "Une seule main ne peut pas attraper un buffle.",
    original: {
      text: "Asideka melea todzo o.",
      lang: "ewe",
      language: "ewe",
    },
    meaning: "Il n'y a pas de force dans l'isolement.",
    origin: {
      status: "attested",
      note: "Proverbe ewe publié en 2010 avec son texte original dans un recueil signé, imprimé à compte d'auteur. Le texte est reproduit tel qu'il apparaît dans la version en ligne ; certaines lettres propres à l'ewe ont pu y être simplifiées.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_EWE",
        label: "Ewe",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title: "A Collection of Ewe Proverbs",
        url: "https://afriprov.tangaza.ac.ke/wp-content/uploads/2008/11/images_afriprov_books_ewe100proverbs.pdf",
        tier: "referenced",
        notes:
          "Recueil signé de cent proverbes ewe, imprimé à compte d'auteur à Nairobi et mis en ligne par la collection Afriprov. Il donne le texte ewe (n° 24), la traduction anglaise et le sens « There's no strength in isolation ».",
      },
    ],
  },
  {
    id: "c-est-avec-patience-qu-on-ote-les-sandales-du-chef",
    text: "C'est avec patience qu'on retire les sandales d'un chef.",
    original: {
      text: "Dzigbodi wotsona dea afokpa le Fia fe afo.",
      lang: "ewe",
      language: "ewe",
    },
    meaning: "La patience permet d'obtenir ce qui semble inaccessible.",
    origin: {
      status: "attested",
      note: "Proverbe ewe publié en 2010 avec son texte original dans un recueil signé, imprimé à compte d'auteur. Le texte est reproduit tel qu'il apparaît dans la version en ligne ; certaines lettres propres à l'ewe ont pu y être simplifiées.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_EWE",
        label: "Ewe",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
    ],
    sources: [
      {
        title: "A Collection of Ewe Proverbs",
        url: "https://afriprov.tangaza.ac.ke/wp-content/uploads/2008/11/images_afriprov_books_ewe100proverbs.pdf",
        tier: "referenced",
        notes:
          "Recueil signé de proverbes ewe. Il donne le texte ewe (n° 46), la traduction anglaise et le sens « Patience pays ».",
      },
    ],
  },
  {
    id: "connais-le-prix-de-la-chikwangue",
    text: "Sache le prix d'une chikwangue pendant que papa et maman sont encore vivants.",
    original: {
      text: "Tata ye mama bakinu zinga, zaya ntalu ya kwanga",
      lang: "kng",
      language: "kikongo",
    },
    meaning:
      "Il faut apprendre de ses parents, tant qu'ils vivent, les savoirs qui permettent de subvenir à ses besoins.",
    origin: {
      status: "attested",
      note: "Proverbe kongo publié avec son texte original dans un recueil signé, imprimé à compte d'auteur en 2012. La chikwangue (kwanga) est un pain de manioc dont la préparation demande des mois de culture et un savoir-faire.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KONGO",
        label: "Kongo",
      },
      {
        kind: "country",
        id: "COD",
        label: "République démocratique du Congo",
      },
      {
        kind: "country",
        id: "AGO",
        label: "Angola",
      },
      {
        kind: "country",
        id: "COG",
        label: "Congo",
      },
      {
        kind: "country",
        id: "GAB",
        label: "Gabon",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title:
          'May 2012: "Know the price of a Kwanga while dad and mom are still alive." – Kongo Proverb',
        url: "https://afriprov.tangaza.ac.ke/apoftmmay2012/",
        tier: "referenced",
        notes:
          "Collection en ligne African Proverbs, Sayings and Stories. Elle attribue le proverbe aux Kongo d'Angola et des deux Congo, donne le texte kikongo, et cite le recueil « Kongo Proverbs » (imprimé à compte d'auteur, Nairobi, mai 2012, n° 44).",
      },
    ],
  },
  {
    id: "une-parole-douce-lie-les-coeurs",
    text: "Une parole douce lie les cœurs.",
    original: {
      text: "Awal ziḍan ittarez ulawen",
      lang: "kab",
      language: "kabyle",
    },
    meaning:
      "La politesse et la douceur du langage renforcent les liens sociaux.",
    origin: {
      status: "attested",
      note: "Proverbe kabyle étudié en 2025 dans une revue universitaire algérienne, à partir du recueil de proverbes berbères de Kabylie de T. Hamadache (2015).",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KABYLE",
        label: "Kabyle",
      },
      {
        kind: "country",
        id: "DZA",
        label: "Algérie",
      },
      {
        kind: "family",
        id: "FLG_BERBERE",
        label: "Berbère / Amazighe",
      },
    ],
    sources: [
      {
        title:
          "La politesse dans le proverbe kabyle : entre éthique et esthétique",
        url: "https://aleph.edinum.org/14804",
        tier: "referenced",
        notes:
          "Article de la revue Aleph (vol. 12, n° 2). Il donne le proverbe en kabyle avec la traduction « une parole douce lie les cœurs » et l'analyse, d'après le recueil de Hamadache (2015).",
      },
    ],
  },
  {
    id: "le-silence-vaut-mieux-que-la-science",
    text: "Le silence vaut mieux que la science.",
    original: {
      text: "Ttif tasusmi, tamusni",
      lang: "kab",
      language: "kabyle",
    },
    meaning:
      "La retenue dans la parole est une forme de sagesse supérieure au savoir affiché.",
    origin: {
      status: "attested",
      note: "Proverbe kabyle étudié en 2025 dans une revue universitaire algérienne, à partir du recueil de T. Hamadache (2015).",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KABYLE",
        label: "Kabyle",
      },
      {
        kind: "country",
        id: "DZA",
        label: "Algérie",
      },
      {
        kind: "family",
        id: "FLG_BERBERE",
        label: "Berbère / Amazighe",
      },
    ],
    sources: [
      {
        title:
          "La politesse dans le proverbe kabyle : entre éthique et esthétique",
        url: "https://aleph.edinum.org/14804",
        tier: "referenced",
        notes:
          "Article de la revue Aleph (vol. 12, n° 2). Il donne le proverbe en kabyle avec la traduction « silence vaut mieux que science » et le lit comme un éloge de la retenue.",
      },
    ],
  },
  {
    id: "peu-a-peu-l-oeuf-marchera",
    text: "Peu à peu, l'œuf marchera sur ses pattes.",
    original: {
      text: "ቀስ በቀስ እንቁላል በእግሩ ይሄዳል",
      lang: "amh",
      language: "amharique",
    },
    meaning:
      "Avec le temps, ce qui semble immobile se transforme : l'œuf devient poussin.",
    origin: {
      status: "attested",
      note: "Proverbe amharique publié en 2018 avec son texte original dans une revue de l'université d'Addis-Abeba. L'auteur le rapproche de « Rome ne s'est pas faite en un jour ». La traduction littérale est celle de l'atlas.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_AMHARA",
        label: "Amhara",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Éthiopie",
      },
      {
        kind: "family",
        id: "FLG_SEMITIQUE",
        label: "Sémitique",
      },
    ],
    sources: [
      {
        title: "Cross-cultural Wisdom in English and Amharic Proverbs",
        url: "https://ejol.aau.edu.et/index.php/EJOLL/article/download/2842/2308/4747",
        tier: "referenced",
        notes:
          "Article de l'Ethiopian Journal of Languages and Literature (vol. 14). Il donne le proverbe en écriture guèze et le classe sous l'évolution des phénomènes, avec l'image de l'œuf qui devient poussin, en face de l'anglais « Rome was not built in a day ».",
      },
    ],
  },
  {
    id: "le-mensonge-souper-d-un-soir",
    text: "Le mensonge est un souper d'un seul soir.",
    original: {
      text: "ሓሶት ድራር ሓደ ምሸት",
      lang: "tir",
      language: "tigrinya",
    },
    meaning: "Un mensonge ne dure pas longtemps.",
    origin: {
      status: "attested",
      note: "Proverbe tigrinya publié en 2021 avec son texte original dans la revue Aethiopica. Il est courant en Érythrée comme au Tigray.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_TIGRAY",
        label: "Tigray",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Éthiopie",
      },
      {
        kind: "country",
        id: "ERI",
        label: "Érythrée",
      },
      {
        kind: "family",
        id: "FLG_SEMITIQUE",
        label: "Sémitique",
      },
    ],
    sources: [
      {
        title:
          "Proverbs in Language Teaching: Using the Example of Let's Speak Tigrinya (2018)",
        url: "https://journals.sub.uni-hamburg.de/aethiopica/article/view/1347",
        tier: "referenced",
        notes:
          "Article de la revue Aethiopica (vol. 23), en libre accès, université de Hambourg. Il donne le proverbe en écriture guèze et en translittération, le traduit « Lie is a one-evening supper » et explique qu'un mensonge ne dure pas.",
      },
    ],
  },
  {
    id: "avant-de-dire-un-on-ne-dit-pas-deux",
    text: "Avant d'avoir dit « un », on ne dit pas « deux ».",
    original: {
      text: "ሓደ ከይበልካ፡ ክልተ ኣይበሃልን",
      lang: "tir",
      language: "tigrinya",
    },
    meaning:
      "Chaque chose en son temps : une action commencée doit être achevée avant de passer à la suivante.",
    origin: {
      status: "attested",
      note: "Proverbe tigrinya publié en 2021 avec son texte original dans la revue Aethiopica.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_TIGRAY",
        label: "Tigray",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Éthiopie",
      },
      {
        kind: "country",
        id: "ERI",
        label: "Érythrée",
      },
      {
        kind: "family",
        id: "FLG_SEMITIQUE",
        label: "Sémitique",
      },
    ],
    sources: [
      {
        title:
          "Proverbs in Language Teaching: Using the Example of Let's Speak Tigrinya (2018)",
        url: "https://journals.sub.uni-hamburg.de/aethiopica/article/view/1347",
        tier: "referenced",
        notes:
          "Article de la revue Aethiopica (vol. 23). Il donne le proverbe en écriture guèze, sa traduction anglaise et son sens : chaque action en son temps et dans l'ordre.",
      },
    ],
  },
  {
    id: "tant-que-le-lion-n-a-pas-son-conteur",
    text: "Tant que le lion n'aura pas son propre conteur, le chasseur aura toujours le beau rôle dans l'histoire.",
    original: {
      text: "Gnatola ma no kpon sia, eyenabe adelan to kpo mi sena.",
      lang: "gej",
      language: "gen",
    },
    meaning:
      "Le récit dépend de celui qui le raconte : celui qui n'a pas la parole a toujours le mauvais rôle.",
    origin: {
      status: "estimated",
      note: "Chinua Achebe cite en 1994 « ce grand proverbe » dans une autre formulation, avec les historiens à la place du conteur, sans nommer de peuple. La seule source qui donne un peuple et un texte original est une contribution à la collection Afriprov : elle attribue le proverbe aux Ewe-Mina et ne renvoie à aucun recueil publié. La même page mentionne une variante igbo, sans source.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_EWE",
        label: "Ewe",
      },
      {
        kind: "people",
        id: "PPL_MINA",
        label: "Mina",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Bénin",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Bénoué-Congo",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger-Congo",
      },
    ],
    sources: [
      {
        title:
          'Apr. 2006: "Until the lion has his or her own storyteller, the hunter will always have the best part of the story." – Ewe-mina (Benin, Ghana, and Togo) Proverb',
        url: "https://afriprov.tangaza.ac.ke/april-2006-proverb-quntil-the-lion-has-his-or-her-own-storyteller-the-hunter-will-always-have-the-best-part-of-the-storyq-ewe-mina-benin-ghana-and-togo/",
        tier: "unverified",
        notes:
          "Collection en ligne African Proverbs, Sayings and Stories (université Tangaza). Elle attribue le proverbe aux Ewe-Mina du Bénin, du Ghana et du Togo et donne le texte original. Elle ne cite aucun recueil publié et mentionne une variante igbo sur les historiens.",
      },
      {
        title: "Chinua Achebe, The Art of Fiction No. 139",
        url: "https://www.theparisreview.org/interviews/1720/the-art-of-fiction-no-139-chinua-achebe",
        tier: "referenced",
        notes:
          "Entretien publié dans The Paris Review. Achebe y cite « ce grand proverbe » : tant que les lions n'auront pas leurs propres historiens, l'histoire de la chasse glorifiera toujours le chasseur. Il ne l'attribue à aucun peuple précis.",
      },
    ],
  },
  {
    id: "deux-fourmis-et-la-sauterelle",
    text: "Deux fourmis ne manquent pas de tirer une sauterelle.",
    original: {
      text: "Obusisi bubili tibulemwa nsenene emoi",
      lang: "hay",
      language: "haya",
    },
    meaning:
      "Unis, même les plus petits viennent à bout d'une charge qui les dépasse.",
    origin: {
      status: "estimated",
      note: "La seule source qui attribue ce proverbe aux Haya est une contribution à une collection en ligne. Elle donne le texte original mais ne renvoie à aucun recueil publié. La même page le signale aussi chez les Ganda et les Sukuma.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAYA",
        label: "Haya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "République-Unie de Tanzanie",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantou",
      },
    ],
    sources: [
      {
        title:
          'Jan. 2007: "Two ants do not fail to pull one grasshopper." – Haya (Tanzania) Proverb',
        url: "https://afriprov.tangaza.ac.ke/january2007/",
        tier: "unverified",
        notes:
          "Collection en ligne African Proverbs, Sayings and Stories (université Tangaza). Elle attribue le proverbe aux Haya de Tanzanie et donne le texte haya, sans citer de recueil publié.",
      },
    ],
  },
  {
    id: "le-zebre-emporte-ses-rayures",
    text: "Le zèbre emporte ses rayures partout où il va.",
    original: {
      text: "Enap oloitiko isirat enelo.",
      lang: "mas",
      language: "maa",
    },
    meaning:
      "On emporte avec soi ce qu'on est : ses habitudes et sa culture ne se quittent pas.",
    origin: {
      status: "estimated",
      note: "La seule source qui attribue ce proverbe aux Maasai est un recueil en ligne de cent proverbes maasai. Il donne le texte en maa mais ne nomme ni compilateur ni source.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_MAASAI",
        label: "Maasai",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "République-Unie de Tanzanie",
      },
      {
        kind: "family",
        id: "FLG_NILOTIQUE",
        label: "Nilotique",
      },
    ],
    sources: [
      {
        title: "A Collection of 100 Maasai Proverbs",
        url: "https://afriprov.tangaza.ac.ke/wp-content/uploads/2008/11/A-collection-of-100-Maasai-Proverbs.pdf",
        tier: "unverified",
        notes:
          "Recueil en ligne de la collection Afriprov. Il donne le proverbe en maa (n° 49) avec des traductions anglaise, française et swahilie, et le rapproche d'un verset biblique. Il ne nomme ni compilateur ni source.",
      },
    ],
  },
  {
    id: "tous-tisses-comme-une-grande-natte",
    text: "Tous ceux qui vivent sous le ciel sont tissés ensemble comme une grande natte.",
    original: {
      text: "Tsihy be lambanana ny ambanilantra",
      lang: "plt",
      language: "malgache",
    },
    meaning:
      "Les êtres humains sont liés les uns aux autres comme les brins d'une même natte.",
    origin: {
      status: "estimated",
      note: "Proverbe malgache publié avec son texte original sur le site d'une association de bibliothécaires. L'article ne cite aucun recueil. L'atlas ne s'appuie sur aucun des grands recueils publiés, comme celui de J. A. Houlder (1915-1916).",
    },
    entities: [
      {
        kind: "country",
        id: "MDG",
        label: "Madagascar",
      },
      {
        kind: "family",
        id: "FLG_AUSTRONESIENNE",
        label: "Austronésienne (présente en Afrique uniquement via Madagascar)",
      },
    ],
    sources: [
      {
        title: "Ohabolana: Malagasy Proverbs",
        url: "https://glli-us.org/2021/12/11/ohabolana-malagasy-proverbs/",
        tier: "unverified",
        notes:
          "Billet publié par la Global Literature in Libraries Initiative. Il donne une douzaine de proverbes malgaches avec leur texte et une traduction anglaise, sans citer de recueil publié ni nommer de groupe.",
      },
    ],
  },
  {
    id: "le-mensonge-a-les-jambes-courtes",
    text: "Le mensonge a les jambes courtes.",
    original: {
      text: "Beeni raad ma leh.",
      lang: "som",
      language: "somali",
    },
    meaning: "Un mensonge ne mène pas loin : il finit par être découvert.",
    origin: {
      status: "estimated",
      note: "L'atlas ne connaît ce proverbe en somali que par un blog personnel. Ce blog le rend par l'équivalent anglais « Lies have short legs », pas mot à mot, et ne cite aucun recueil. L'atlas ne s'appuie pas sur le grand dictionnaire des proverbes somalis de Georgi Kapchits (1998).",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SOMALI",
        label: "Somali",
      },
      {
        kind: "country",
        id: "SOM",
        label: "Somalie",
      },
      {
        kind: "country",
        id: "DJI",
        label: "Djibouti",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Éthiopie",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "family",
        id: "FLG_COUCHITIQUE",
        label: "Couchitique",
      },
    ],
    sources: [
      {
        title: "Somali Proverbs with Equivalent English Proverbs",
        url: "https://ismail4all.wordpress.com/2013/11/22/somali-proverbs-with-equivalent-english-proverbs-2/",
        tier: "unverified",
        notes:
          "Blog personnel qui associe des proverbes somalis à des équivalents anglais, sans traduction littérale ni recueil cité.",
      },
    ],
  },
  {
    id: "vite-seul-loin-ensemble",
    text: "Si tu veux aller vite, marche seul ; si tu veux aller loin, marchons ensemble.",
    meaning:
      "L'effort solitaire est rapide, mais l'effort partagé dure plus longtemps.",
    origin: {
      status: "unestablished",
      note: "Aucun texte en langue africaine n'est connu. Les folkloristes Charles Doyle et Wolfgang Mieder relèvent des formes anglo-américaines dès 1917, en réponse au vers de Kipling « celui qui voyage seul voyage le plus vite ». L'étiquette « africaine » n'apparaît qu'à partir de 2004, et ils la jugent fausse. Il existe un proverbe luo voisin, qui n'est pas cette phrase.",
    },
    entities: [],
    sources: [
      {
        title:
          '"If you want to travel fast, travel alone; if you want to travel far, travel with others." (message à la liste ADS-L)',
        url: "https://listserv.linguistlist.org/pipermail/ads-l/2016-March/141091.html",
        tier: "referenced",
        notes:
          "Message signé du co-auteur du Dictionary of Modern Proverbs (Yale). Il présente la phrase comme une réponse au proverbe anglo-américain « He who travels fastest travels alone ». Il qualifie l'attribution africaine de probablement fausse et donne des attestations anglaises à partir de 1917.",
      },
      {
        title:
          "Who first said: if you want to go fast, go alone; if you want to go far, go together?",
        url: "https://andrewwhitby.com/2020/12/25/if-you-want-to-go-fast/",
        tier: "unverified",
        notes:
          "Enquête documentée sur un blog personnel. Elle date la première attribution africaine de 2004, dans un livre de Bill Hull. Elle rapporte que Mieder et Doyle ont remplacé « peut-être à tort » par « à tort » dans leur publication. Elle cite aussi une variante luo et une origine burkinabè avancée par un missionnaire, sans texte original pour aucune des deux.",
      },
    ],
  },
  {
    id: "tout-un-village-pour-elever-un-enfant",
    text: "Il faut tout un village pour élever un enfant.",
    meaning:
      "L'éducation d'un enfant est l'affaire de toute la communauté, pas seulement de ses parents.",
    origin: {
      status: "unestablished",
      note: "Personne n'a trouvé cette phrase dans une langue africaine. Plusieurs peuples ont des proverbes au sens proche, par exemple en jita ou en swahili, mais aucun ne dit ces mots. Elle s'est popularisée en anglais, notamment comme titre d'un livre en 1996.",
    },
    entities: [],
    sources: [
      {
        title:
          "It Takes A Village To Determine The Origins Of An African Proverb",
        url: "https://www.npr.org/sections/goatsandsoda/2016/07/30/487925796/it-takes-a-village-to-determine-the-origins-of-an-african-proverb",
        tier: "referenced",
        notes:
          "Article de presse (NPR). Il conclut qu'on ne peut pas remonter à une origine précise. Il cite des universitaires et deux proverbes voisins, l'un en jita et l'autre en swahili, qui ne sont pas cette phrase.",
      },
    ],
  },
  {
    id: "vieillard-bibliotheque-qui-brule",
    text: "En Afrique, quand un vieillard meurt, c'est une bibliothèque qui brûle.",
    meaning:
      "La mort d'un détenteur de tradition orale fait disparaître un savoir qui n'existe nulle part ailleurs.",
    origin: {
      status: "unestablished",
      note: "Ce n'est pas un proverbe mais la reformulation d'une intervention d'Amadou Hampâté Bâ, écrivain peul du Mali, à l'UNESCO le 1er décembre 1960. Il y parlait de traditions conservées « dans la mémoire d'hommes qui meurent chaque jour ». La formule avec « bibliothèque » est rapportée à une intervention ultérieure, vers 1962. La présenter comme un « proverbe africain » efface son auteur.",
    },
    entities: [],
    sources: [
      {
        title:
          "Discours de Hamadou Hampâté Bâ à la commission Afrique de l'UNESCO",
        url: "https://www.ina.fr/ina-eclaire-actu/audio/phd86073514/discours-de-hamadou-hampate-ba-a-la-commission-afrique-de-l-unesco",
        tier: "official",
        notes:
          "Archive sonore de l'Institut national de l'audiovisuel, datée du 1er décembre 1960. Hampâté Bâ, qui dirige alors l'institut scientifique du Mali, y plaide pour sauver des traditions conservées « dans la mémoire d'hommes qui meurent chaque jour ». La notice ne contient pas le mot « bibliothèque ».",
      },
      {
        title:
          "Quelle est l'origine du proverbe ? Un vieillard qui meurt, c'est une bibliothèque qui brûle",
        url: "https://www.dicocitations.com/questions-reponses/question/quelle-est-lorigine-du-proverbe-un-vieillard-qui-meurt-cest-une-bibliotheque-qui-brule/",
        tier: "unverified",
        notes:
          "Site de citations. Il situe la phrase à la conférence générale de l'UNESCO de 1960 et rapporte la formule « chaque fois qu'un vieillard meurt, c'est une bibliothèque qui a brûlé » à 1962, sans renvoyer à un document d'archive.",
      },
    ],
  },
  {
    id: "enfant-que-le-village-n-embrasse-pas",
    text: "L'enfant que le village n'embrasse pas le brûlera pour en sentir la chaleur.",
    meaning:
      "Un jeune tenu à l'écart de sa communauté risque de chercher sa place par la destruction.",
    origin: {
      status: "unestablished",
      note: "La phrase circule en anglais comme « proverbe africain », sans peuple, sans langue et sans texte original. L'atlas ne connaît aucune source publiée qui en atteste l'usage dans une langue africaine.",
    },
    entities: [],
    sources: [
      {
        title:
          'Quote by African Proverb: "A child that is not embraced by the village will..."',
        url: "https://www.goodreads.com/quotes/9946467-a-child-that-is-not-embraced-by-the-village-will",
        tier: "unverified",
        notes:
          "Site de citations. Il attribue la phrase à « African Proverb » sans nommer de peuple, de langue ni de source.",
      },
      {
        title:
          "The Child Who Is Not Embraced By The Village: A Powerful Proverb About Connection and Community",
        url: "https://captainaxom.medium.com/the-child-who-is-not-embraced-by-the-village-a-powerful-proverb-about-connection-and-community-d0cf0a4931e5",
        tier: "unverified",
        notes:
          "Billet de blog qui commente la phrase comme proverbe africain, sans texte original ni source vérifiable.",
      },
    ],
  },
  {
    id: "trop-petit-moustique",
    text: "Si tu te crois trop petit pour changer quoi que ce soit, essaie de dormir avec un moustique.",
    meaning: "Même un être minuscule peut avoir un effet considérable.",
    origin: {
      status: "unestablished",
      note: "La phrase est attribuée tantôt au dalaï-lama, tantôt à un « proverbe d'Afrique de l'Ouest ». Aucune de ces sources ne donne un peuple, une langue ou un texte original, et les deux attributions se contredisent.",
    },
    entities: [],
    sources: [
      {
        title:
          "#12 - West African Proverb: If You Think You're Too Small to Make A Difference…",
        url: "https://www.proverbsonblast.com/p/12-if-you-think-youre-too-small-to",
        tier: "unverified",
        notes:
          "Lettre d'information personnelle qui présente la phrase comme proverbe d'Afrique de l'Ouest entendu pendant l'enfance de l'auteur, sans pays, langue ni source. L'auteur note lui-même qu'elle a été popularisée par le dalaï-lama.",
      },
      {
        title:
          'Quote by Dalai Lama XIV: "If you think you are too small to make a difference..."',
        url: "https://www.goodreads.com/quotes/7777-if-you-think-you-are-too-small-to-make-a",
        tier: "unverified",
        notes:
          "Site de citations qui attribue la même phrase au dalaï-lama, sans référence.",
      },
    ],
  },
];

/** `${kind}:${id}`, the form a filter link carries. */
export type ProverbEntityKey = `${DidYouKnowEntityKind}:${string}`;

// @req REQ-113
export function proverbEntityKey(entity: DidYouKnowEntity): ProverbEntityKey {
  return `${entity.kind}:${entity.id}`;
}

// @req REQ-113
export function findProverb(
  id: string | null | undefined,
  bank: readonly Proverb[] = PROVERBS
): Proverb | null {
  if (!id) return null;
  return bank.find((entry) => entry.id === id) ?? null;
}

// Generic so a localized bank keeps its translation marker through the filter.
// @req REQ-113
export function proverbsConcerning<T extends Proverb>(
  key: string | null | undefined,
  bank: readonly T[] = PROVERBS as unknown as readonly T[]
): T[] {
  if (!key) return [...bank];
  return bank.filter((entry) =>
    entry.entities.some((entity) => proverbEntityKey(entity) === key)
  );
}

// Countries first because a reader most often arrives knowing where, not who;
// families last because they are the widest net.
const KIND_ORDER: Record<DidYouKnowEntityKind, number> = {
  country: 0,
  people: 1,
  family: 2,
};

// @req REQ-113
export function proverbEntities(
  bank: readonly Proverb[] = PROVERBS
): DidYouKnowEntity[] {
  const byKey = new Map<string, DidYouKnowEntity>();
  for (const entry of bank) {
    for (const entity of entry.entities) {
      byKey.set(proverbEntityKey(entity), entity);
    }
  }
  return [...byKey.values()].sort(
    (left, right) =>
      KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
      left.label.localeCompare(right.label, "fr")
  );
}
