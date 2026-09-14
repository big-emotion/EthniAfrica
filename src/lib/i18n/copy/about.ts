import type { AccessMode } from "@/lib/hubs/moduleRegistry";
import type { Language } from "@/types/shared";

/**
 * The About page's three access-mode cards, in both locales (REQ-145).
 *
 * **A slice, not the whole surface.** `AboutPageContent` still holds its own
 * copy inline, which predates `check:copy-literals` and is grandfathered by
 * the gate's diff against the previous file. These three descriptions moved
 * out because they had to change — the Mercator game was renamed, and the
 * page's own contract (REQ-132, `AboutPageContent.test.tsx`) is that each card
 * names the modules sitting behind it, so a renamed module makes the sentence
 * wrong. Touching a French literal there is what the gate refuses, and it is
 * right: this is reader-facing copy.
 *
 * The rest of that file is the next slice's work, not this change's.
 */

export interface AccessModeCardCopy {
  id: AccessMode;
  label: string;
  description: string;
  accentClass: string;
}

/**
 * The accent each axis carries, per the atlas charter's one-accent-per-surface
 * rule. Declared alongside the copy because a card is the pair.
 */
const ACCENT_CLASS: Record<AccessMode, string> = {
  atlas: "afh-accent-ocre",
  dossiers: "afh-accent-teal",
  jeux: "afh-accent-perv",
};

// @req REQ-132
// @req REQ-145
export const accessModeCards: Record<Language, AccessModeCardCopy[]> = {
  en: [
    {
      id: "atlas",
      label: "The atlas",
      description:
        "Everything the atlas holds: families, languages, peoples, countries and names, plus free search.",
      accentClass: ACCENT_CLASS.atlas,
    },
    {
      id: "dossiers",
      label: "Dossiers",
      description:
        "Sourced anecdotes, initial migration landmarks and a dossier on colonisation.",
      accentClass: ACCENT_CLASS.dossiers,
    },
    {
      id: "jeux",
      label: "Play",
      description:
        "A quiz drawn from the atlas, and the Mercator projection cut down to size.",
      accentClass: ACCENT_CLASS.jeux,
    },
  ],
  fr: [
    {
      id: "atlas",
      label: "L'atlas",
      description:
        "Tout ce que l’atlas contient : familles de langues, langues, peuples, pays et noms, plus la recherche libre.",
      accentClass: ACCENT_CLASS.atlas,
    },
    {
      id: "dossiers",
      label: "Les dossiers",
      description:
        "Des anecdotes sourcées, les premiers repères de migrations et un dossier sur la colonisation.",
      accentClass: ACCENT_CLASS.dossiers,
    },
    {
      id: "jeux",
      label: "Jouer",
      description:
        "Un quiz tiré de l’atlas, et la projection de Mercator remise à sa juste taille.",
      accentClass: ACCENT_CLASS.jeux,
    },
  ],
};

export interface PurposeScaleCopy {
  title: string;
  body: string;
}

export interface PurposeChapterCopy {
  stepLabel: string;
  title: string;
  claim: string;
  claimStatus: string;
  /** The declaration the claim rests on, one titled part at a time. */
  declaration: DeclarationPartCopy[];
  /** The sentences the atlas does not write, each with the reason. */
  refusals: { title: string; items: DeclarationRefusalCopy[] };
  /**
   * A second, separate position (purpose-doctrine.md §5, 14 September 2026):
   * not a measurement the atlas produces, and not the constant ligne de
   * vision above — a distinct conviction, labelled the same way `claim` is.
   */
  unityClaim: string;
  unityClaimStatus: string;
  scales: PurposeScaleCopy[];
  closing: string;
}

interface DeclarationPartCopy {
  title: string;
  paragraphs: string[];
}

interface DeclarationRefusalCopy {
  sentence: string;
  reason: string;
}

/**
 * The chapter that answers "what is this for", and the reason it exists.
 *
 * A reader wrote to the project on 9 September 2026 that its goal was not
 * perceptible: the page listed what the corpus holds and never said what it
 * sets out to change. A statement of contents is not a statement of intent,
 * so this chapter opens the page and the other two shift down.
 *
 * `claimStatus` is not decoration. The claim is editorial emphasis, not a
 * finding the corpus establishes, and an atlas whose product is provenance
 * cannot print it unlabelled — the same doctrine as the Source Tier policy,
 * one layer up: nothing is forbidden, everything is labelled.
 *
 * The figures were re-measured from `content.demography.distributionByCountry`
 * on 11 September 2026, macro-groups excluded, and `closing` states that date
 * because the corpus moves and a number printed as a constant would drift.
 *
 * `declaration` and `refusals` are the full statement the claim comes from:
 * the operator's message of 10 September 2026 and the agent's corrections of
 * it, in the agent's own words, with the second person and the workshop's
 * vocabulary taken out (docs/editorial/purpose-doctrine.md keeps the
 * verbatim exchange). The refusals are published with their reasons because
 * the corrections are the doctrine: a refused sentence printed without why
 * reads as a taboo. They sit under `claimStatus`, which labels the whole
 * chapter as a position — « mille » included, an assumed approximation.
 */
// @req REQ-132
// @req REQ-145
export const purposeChapter: Record<Language, PurposeChapterCopy> = {
  en: {
    stepLabel: "01 · Purpose",
    title: "What this atlas sets out to change",
    claim: "This people was not divided. The map was drawn over it.",
    claimStatus:
      "That is what we think, not a fact the atlas proves. Here is what it rests on.",
    declaration: [
      {
        title: "The names are older than the borders",
        paragraphs: [
          "Most of Africa’s borders are less than a hundred and forty years old. The names are more than a thousand years old.",
          "A border does not contain a people; it crosses it. And the same line encloses peoples who never asked to be together.",
        ],
      },
      {
        title: "The apparent order is reversed",
        paragraphs: [
          "What is presented as natural, the nations, is the most recent layer. What is presented as archaic, the peoples, is the continuous one.",
          "This atlas does not tell the past. It shows that what looks old is still here, and that what looks natural is very recent. Every people has a history, and its name traces it: that is what we tell.",
        ],
      },
      {
        title: "What remained, not what was taken",
        paragraphs: [
          "The language of reparation keeps the coloniser at the centre of the sentence. Even to accuse him, he stays the subject of the verb.",
          "We speak of what remained, not of what was taken.",
        ],
      },
    ],
    refusals: {
      title: "Three sentences we do not write",
      items: [
        {
          sentence: "“Before, people lived in harmony with the continent.”",
          reason:
            "That is a golden age, and a golden age does not need to be true to be attacked. Africa before Berlin had empires, conquests and internal slave trades. The argument’s strength does not come from how gentle the past was; it comes from its duration and its scale. It is enough that it is older, larger, and alive.",
        },
        {
          sentence: "“The borders are arbitrary.”",
          reason:
            "Half false: some follow rivers. They were drawn without reference to who lived there, and the atlas can show it people by people.",
        },
        {
          sentence: "“Reconnecting with the past.”",
          reason:
            "Reconnecting puts the subject in the past and assumes the break is complete. Yet these peoples are counted in 2025 and live in France. Not reconnecting with: recognising what never stopped. It is truer, and it is less sad.",
        },
        {
          sentence: "“Before the borders, peoples were united.”",
          reason:
            "Kinship of language and culture sometimes crossed ruptures older than the colonial map itself — a split, a migration, a disputed succession, long before any colonial line passed between two territories. The border did not always create the separation: it often locked one in.",
        },
      ],
    },
    scales: [
      {
        title: "For a people",
        body: "It leads with the name it gives itself. The name others give it comes after. And if we get it wrong, anyone can tell us.",
      },
      {
        title: "For a country",
        body: "A country is not a flag. It is the list of those who live there. Tanzania counts 95, Ethiopia 82, Ghana 80.",
      },
      {
        title: "For a diaspora",
        body: "For the Soninke, the Kabyles and the Comorians, France is already on the list of their countries. We are not talking about somewhere else.",
      },
    ],
    closing:
      "Berlin, 1884. Independence, 1960. What the borders cut across is far older: 191 peoples live today in three countries or more. The Fula in twelve. The Soninke in eleven. Counted on 11 September 2026.",
    unityClaim:
      "What connects Africa’s peoples has survived their own ruptures as much as the borders imposed on them. That is where a stronger unity begins.",
    unityClaimStatus:
      "That is our conviction, distinct from what the atlas shows — not a measurement it produces.",
  },
  fr: {
    stepLabel: "01 · Le propos",
    title: "Ce que cet atlas veut changer",
    claim:
      "Ce peuple n’a pas été divisé. C’est la carte qui a été dessinée par-dessus.",
    claimStatus:
      "C’est ce que nous pensons, pas un fait que l’atlas démontre. Voici sur quoi ça repose.",
    declaration: [
      {
        title: "Les noms sont plus vieux que les frontières",
        paragraphs: [
          "La plupart des frontières de l’Afrique ont moins de cent quarante ans. Les noms en ont plus de mille.",
          "Une frontière ne contient pas un peuple, elle le traverse. Et le même tracé enferme ensemble des peuples qui n’ont rien demandé.",
        ],
      },
      {
        title: "L’ordre apparent est inversé",
        paragraphs: [
          "Ce qu’on présente comme naturel, les nations, est la couche la plus récente. Ce qu’on présente comme archaïque, les peuples, est la couche continue.",
          "Cet atlas ne raconte pas le passé. Il montre que ce qui a l’air ancien est encore là, et que ce qui a l’air naturel est très récent. Chaque peuple a une histoire, et son nom la retrace : c’est ce que nous racontons.",
        ],
      },
      {
        title: "Ce qui est resté, pas ce qui a été pris",
        paragraphs: [
          "Le registre de la réparation garde le colonisateur au centre de la phrase. Même pour l’accuser, il reste le sujet du verbe.",
          "Nous parlons de ce qui est resté, pas de ce qui a été pris.",
        ],
      },
    ],
    refusals: {
      title: "Trois phrases que nous n’écrivons pas",
      items: [
        {
          sentence: "« Avant, on vivait en accord avec le continent. »",
          reason:
            "C’est un âge d’or, et un âge d’or n’a pas besoin d’être vrai pour être attaquable. L’Afrique d’avant Berlin avait des empires, des conquêtes, des traites internes. La force de l’argument ne vient pas de la douceur du passé, elle vient de sa durée et de son échelle : il suffit que ce soit plus vieux, plus large, et vivant.",
        },
        {
          sentence: "« Les frontières sont arbitraires. »",
          reason:
            "À demi faux : certaines suivent des fleuves. Elles ont été tracées sans référence à qui habitait là, et l’atlas peut le montrer peuple par peuple.",
        },
        {
          sentence: "« Renouer avec le passé. »",
          reason:
            "Renouer met le sujet au passé et suppose la rupture consommée. Or ces peuples sont comptés en 2025 et présents en France. Pas renouer avec : reconnaître ce qui n’a jamais cessé. C’est plus vrai, et c’est moins triste.",
        },
        {
          sentence: "« Avant les frontières, les peuples étaient unis. »",
          reason:
            "Des parentés de langue et de culture ont parfois traversé des ruptures plus anciennes que la carte coloniale elle-même — une scission, une migration, une querelle de succession, bien avant qu’un tracé colonial ne passe entre deux territoires. La frontière n’a pas toujours créé la séparation : elle l’a souvent verrouillée.",
        },
      ],
    },
    scales: [
      {
        title: "Pour un peuple",
        body: "Il porte d’abord le nom qu’il se donne. Celui que les autres lui donnent vient après. Et si on se trompe, n’importe qui peut nous le dire.",
      },
      {
        title: "Pour un pays",
        body: "Un pays, ce n’est pas un drapeau. C’est la liste de ceux qui y vivent. La Tanzanie en compte 95, l’Éthiopie 82, le Ghana 80.",
      },
      {
        title: "Pour une diaspora",
        body: "Pour les Soninké, les Kabyles et les Comoriens, la France est déjà dans la liste de leurs pays. On ne parle pas d’un ailleurs.",
      },
    ],
    closing:
      "Berlin, 1884. Les indépendances, 1960. Ce que les frontières coupent est bien plus vieux : 191 peuples vivent aujourd’hui dans trois pays ou plus. Les Peul dans douze. Les Soninké dans onze. Compté le 11 septembre 2026.",
    unityClaim:
      "Ce qui relie les peuples d’Afrique a survécu à leurs propres ruptures autant qu’aux frontières qu’on leur a imposées. C’est là que commence une unité plus forte.",
    unityClaimStatus:
      "C’est notre conviction, distincte de ce que montre l’atlas — pas une mesure qu’il produit.",
  },
};

/**
 * The step label each of the two later chapters wears.
 *
 * They live here because inserting a chapter renumbers every one below it,
 * and a number spelled in two locales inside a component is exactly the
 * literal the copy gate refuses to see change.
 */
// @req REQ-132
// @req REQ-145
export const chapterSteps: Record<
  Language,
  { corpus: string; accessModes: string }
> = {
  en: { corpus: "02 · Contents", accessModes: "03 · Ways in" },
  fr: { corpus: "02 · Le contenu", accessModes: "03 · Les accès" },
};

export interface SubjectCopy {
  description: string;
  linkLabel: string;
}

export interface AboutPageCopy {
  title: string;
  overview: {
    eyebrow: string;
    lead: string;
    asideLead: string;
    asideNote: string;
    doctrineLinkLabel: string;
  };
  contents: {
    title: string;
    intro: string;
    subjects: Record<string, SubjectCopy>;
  };
  accessModes: { title: string; intro: string };
}

/**
 * The About page's own words.
 *
 * Rewritten on 11 September 2026 against the plain-language doctrine the
 * project already applies to its social cards. Two rules did most of the work.
 *
 * **The reader does not know what a "page" is.** It is a workshop word, and
 * so is "atlas". Both are gone from this surface: a people has a page, and
 * the thing that holds them all is the atlas. Nothing about the vocabulary was
 * load-bearing — it was the workshop talking to itself in front of a visitor.
 *
 * **Scholarly words subtract readers from a sourced fact, they do not add
 * rigour to it.** So "autonyme" becomes the name a people gives itself, and
 * "exonyme" the name others give it. The figures, the dates and the proper
 * names all stay: it is the abstraction that goes, never the precision.
 *
 * The link to the editorial doctrine says what the page is for rather than
 * repeating its title, which is a scholarly phrase a visitor will not open.
 */
// @req REQ-132
// @req REQ-145
export const aboutPage: Record<Language, AboutPageCopy> = {
  en: {
    title: "About",
    overview: {
      eyebrow: "The project",
      lead: "EthniAfrica tells the story of Africa’s peoples: where they live, the languages they speak, and where their names come from.",
      asideLead:
        "Everything written here comes from a source, and the source is shown.",
      asideNote:
        "When we do not know, that is written too. Our rules are here:",
      doctrineLinkLabel: "how we write",
    },
    contents: {
      title: "What you will find",
      intro: "Six subjects. Each one points to the others.",
      subjects: {
        peoples: {
          description:
            "Who they are, where they live, and the names they are given.",
          linkLabel: "See the peoples",
        },
        languages: {
          description:
            "Every language has its page, linked to the peoples who speak it.",
          linkLabel: "See the languages",
        },
        families: {
          description:
            "Related languages, grouped. A family of languages is not a people.",
          linkLabel: "See the families",
        },
        countries: {
          description:
            "The peoples who live there, and the story of the country’s name.",
          linkLabel: "See the countries",
        },
        names: {
          description:
            "The name a people gives itself, and the name others give it.",
          linkLabel: "See the names of peoples",
        },
        patronymes: {
          description:
            "Family names, and where they come from. They do not all work the way European ones do.",
          linkLabel: "See the family names",
        },
      },
    },
    accessModes: {
      title: "Three ways in",
      intro: "Look something up, read a story, or play.",
    },
  },
  fr: {
    title: "À propos",
    overview: {
      eyebrow: "Le projet",
      lead: "EthniAfrica raconte les peuples d’Afrique : où ils vivent, quelles langues ils parlent, et d’où viennent leurs noms.",
      asideLead:
        "Tout ce qui est écrit ici vient d’une source, et la source est affichée.",
      asideNote:
        "Quand on ne sait pas, c’est écrit aussi. Nos règles sont ici :",
      doctrineLinkLabel: "comment on écrit",
    },
    contents: {
      title: "Ce qu’on y trouve",
      intro: "Six sujets. Chacun renvoie vers les autres.",
      subjects: {
        peoples: {
          description:
            "Qui ils sont, où ils vivent, et les noms qu’on leur donne.",
          linkLabel: "Voir les peuples",
        },
        languages: {
          description:
            "Chaque langue a sa page, reliée aux peuples qui la parlent.",
          linkLabel: "Voir les langues",
        },
        families: {
          description:
            "Des langues parentes, regroupées. Une famille de langues n’est pas un peuple.",
          linkLabel: "Voir les familles",
        },
        countries: {
          description:
            "Les peuples qui y vivent, et l’histoire du nom du pays.",
          linkLabel: "Voir les pays",
        },
        names: {
          description:
            "Le nom qu’un peuple se donne, et celui que les autres lui donnent.",
          linkLabel: "Voir les noms de peuples",
        },
        patronymes: {
          description:
            "Les noms de famille, et d’où ils viennent. Ils ne marchent pas tous comme en Europe.",
          linkLabel: "Voir les noms de famille",
        },
      },
    },
    accessModes: {
      title: "Trois manières d’entrer",
      intro: "Chercher quelque chose de précis, lire une histoire, ou jouer.",
    },
  },
};

export interface PlateCopy {
  alt: string;
  /** One short sentence saying what the picture argues. Never decoration. */
  caption: string;
  /** Author, work and date, as the reader should see them. */
  credit: string;
  sourceLabel: string;
  /** Only where the licence requires a visible notice. */
  licenceLabel?: string;
}

/**
 * The three plates that open the chapters.
 *
 * Each one is a document the chapter is *about*, not an illustration of it —
 * a generic photograph of the continent would substitute for none of them.
 * Together they carry three registers, which is what the brand charter asks
 * of any surface holding more than one image: the colonial document, a
 * people's own record, and a map drawn from inside Africa.
 *
 * The captions argue in one sentence and then get out of the way. The credit
 * line is not editorial discretion: where a licence requires attribution, the
 * rendered page carries the author and the licence's own address, because a
 * notice a reader cannot reach is not a notice.
 */
// @req REQ-132
// @req REQ-145
export const aboutPlates: Record<Language, Record<string, PlateCopy>> = {
  en: {
    ogilby: {
      alt: "A 1670 engraved map of the West African coast, its shoreline labelled by the goods taken from it.",
      caption:
        "The West African coast in 1670, named after what was taken from it.",
      credit: "John Ogilby, Guinea, 1670. Public domain.",
      sourceLabel: "Wikimedia Commons",
    },
    tifinagh: {
      alt: "Tifinagh letters carved into rock in Algeria, photographed in 2006.",
      caption: "Their own writing, cut into the rock.",
      credit: "Tifinagh inscriptions, Algeria, 2006. Patrick Gruban.",
      sourceLabel: "Wikimedia Commons",
      licenceLabel: "CC BY-SA 2.0",
    },
    idrisi: {
      alt: "Al-Idrisi's world map of 1154, drawn with south at the top, Africa filling the upper half.",
      caption: "Africa seen from the inside, in 1154. South is at the top.",
      credit: "Al-Idrisi, Tabula Rogeriana, 1154. Public domain.",
      sourceLabel: "Wikimedia Commons",
    },
  },
  fr: {
    ogilby: {
      alt: "Une carte gravée de 1670 de la côte ouest-africaine, dont le littoral est nommé d’après les marchandises qu’on y prenait.",
      caption:
        "La côte ouest-africaine en 1670, nommée d’après ce qu’on y prenait.",
      credit: "John Ogilby, Guinea, 1670. Domaine public.",
      sourceLabel: "Wikimedia Commons",
    },
    tifinagh: {
      alt: "Des lettres tifinagh gravées dans la roche en Algérie, photographiées en 2006.",
      caption: "Leur propre écriture, gravée dans la roche.",
      credit: "Inscriptions tifinagh, Algérie, 2006. Patrick Gruban.",
      sourceLabel: "Wikimedia Commons",
      licenceLabel: "CC BY-SA 2.0",
    },
    idrisi: {
      alt: "La carte du monde d’al-Idrisi de 1154, dessinée le sud en haut, l’Afrique occupant la moitié supérieure.",
      caption: "L’Afrique vue de l’intérieur, en 1154. Le sud est en haut.",
      credit: "Al-Idrisi, Tabula Rogeriana, 1154. Domaine public.",
      sourceLabel: "Wikimedia Commons",
    },
  },
};
