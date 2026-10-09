import { formatNommerFigure } from "../figures";
import type { DossierChapter } from "../types";

/**
 * Chapter four — the language.
 *
 * Written first of the five, and it is the template the others follow: one
 * word, one date, one archive, and a conflict that does not resolve. It is
 * also the chapter where the atlas has the most to lose, because it goes on
 * using the word it is criticising, and says so rather than quietly dropping
 * it.
 *
 * The register alternates by section — prose, table, prose, pairs, prose —
 * which is the rule the whole dossier is written to: never two consecutive
 * sections a reader takes in the same way.
 */
// @req REQ-113
export const CHAPITRE_LA_LANGUE: DossierChapter = {
  key: "la-langue",
  ordinal: "04",
  title: "La langue",
  question: "D’où vient le mot « bantou » et que désigne-t-il ?",
  standfirst: {
    id: "standfirst",
    text: "Le nom « bantou » sert à regrouper des langues apparentées. Il a aussi été employé pour classer des populations et les traiter différemment. Nous continuons à l’utiliser pour les langues, en expliquant cette histoire.",
    sourceRefs: ["bleek-1862", "britannica-bleek"],
    figureRefs: ["corpus-language-families"],
  },
  measure: {
    value: "« bantou », 1857",
    unit: "première trace écrite connue, imprimée en 1858",
    sourceRefs: ["bleek-1862"],
    figureRefs: [],
  },
  sections: [
    {
      id: "un-mot-forge-dans-un-bureau",
      stepLabel: "04 · La langue",
      heading: "Un mot forgé dans un bureau",
      blocks: [
        {
          id: "un-nom-sans-locuteurs",
          text: `Nos fiches présentent ${formatNommerFigure({ figureKey: "corpus-peoples" })} peuples et ${formatNommerFigure({ figureKey: "corpus-language-families" })} familles de langues. Le nom « bantou », qui désigne l’une des plus grandes familles, a été proposé par un linguiste. Il ne vient pas d’un nom que tous les peuples concernés auraient choisi pour se désigner ensemble.`,
          sourceRefs: [],
          figureRefs: ["corpus-language-families", "corpus-peoples"],
        },
        {
          id: "bleek-et-abantu",
          text: "Les historiens de la linguistique relèvent le mot chez Wilhelm Bleek dans un manuscrit de 1857. Il est imprimé en 1858, puis diffusé par son ouvrage Comparative Grammar of South African Languages, publié en 1862. Bleek s’appuie sur le mot zoulou abantu, « les gens ». Dans ce mot, ba- indique plusieurs personnes et -ntu renvoie à la personne. Il reprend cette forme pour nommer un groupe de langues.",
          sourceRefs: ["bleek-1862", "britannica-bleek"],
          figureRefs: [],
        },
        {
          id: "bleek-dans-ladministration",
          text: "Bleek était interprète, puis bibliothécaire dans l’administration du Cap. Ses travaux ont donc été réalisés au sein du pouvoir colonial. La parenté entre les langues qu’il regroupait reste reconnue aujourd’hui. Pour comprendre le nom qu’il leur a donné, il faut aussi connaître ce cadre de travail.",
          sourceRefs: ["britannica-bleek", "saho-bantu"],
          figureRefs: [],
        },
      ],
    },
    {
      id: "trois-temps-du-glissement",
      stepLabel: "04 · La langue",
      heading: "Un mot employé dans trois sens différents",
      blocks: [
        {
          id: "le-trajet-du-mot",
          text: "Le mot a d’abord désigné une famille de langues. Il a ensuite été appliqué à des peuples, puis utilisé par l’administration pour classer des populations. Ces usages posent des questions différentes : parler des langues apparentées ne signifie pas former un seul peuple.",
          sourceRefs: ["saho-bantu"],
          figureRefs: [],
        },
      ],
      table: {
        caption:
          "Ce que « bantou » désigne, selon qui l'emploie et à quelle époque",
        columns: ["Ce que le mot désigne", "Qui l'emploie", "Statut"],
        rows: [
          {
            cells: [
              "Une famille de langues apparentées",
              "Les chercheurs qui comparent les langues, depuis Bleek",
              "Ces langues sont reconnues comme apparentées",
            ],
            sourceRefs: ["bleek-1862", "saho-bantu"],
            figureRefs: [],
          },
          {
            cells: [
              "Un peuple, ou un ensemble de peuples",
              "Les travaux coloniaux sur les peuples, puis l’usage courant",
              "Ces langues sont parlées par des peuples différents",
            ],
            sourceRefs: ["saho-bantu"],
            figureRefs: [],
          },
          {
            cells: [
              "Une catégorie de population administrée",
              "L'État sud-africain, Bantu Education Act, 1953",
              "Le mot devient un instrument de ségrégation scolaire",
            ],
            sourceRefs: ["bantu-education-act-1953", "saho-bantu"],
            figureRefs: [],
          },
        ],
      },
    },
    {
      id: "ce-que-le-prefixe-portait",
      stepLabel: "04 · La langue",
      heading: "Ce que le début du mot permet de distinguer",
      blocks: [
        {
          id: "le-prefixe-est-grammaire",
          text: "Dans les langues présentées ci-dessous, le début du mot peut indiquer si l’on parle d’une langue, d’une personne, d’un peuple ou d’un pays. Cette partie du mot s’appelle un préfixe. Elle aide à distinguer la langue des personnes qui la parlent.",
          sourceRefs: ["bantu-class-prefixes"],
          figureRefs: [],
        },
        {
          id: "le-tswana-en-quatre-mots",
          text: "On retrouve ainsi une même base dans quatre mots : Botswana désigne le pays, Batswana le peuple, Motswana une personne et Setswana la langue. En français et en anglais, l’emploi de « tswana » dans plusieurs de ces sens rend parfois cette distinction moins visible.",
          sourceRefs: ["bantu-class-prefixes"],
          figureRefs: [],
        },
        {
          id: "le-prefixe-coupe",
          text: "Dans les exemples ci-dessous, les formes européennes ont perdu ce début de mot. Un même mot peut alors servir à nommer la langue, le peuple ou ce qui s’y rapporte. Le contexte devient nécessaire pour savoir de quoi l’on parle.",
          sourceRefs: ["bantu-class-prefixes"],
          figureRefs: [],
        },
      ],
      pairs: [
        {
          endonym: "isiZulu",
          endonymGloss: "isi-, la langue ; le peuple est amaZulu",
          exonym: "zoulou",
          imposedBy: "usage européen, début du mot supprimé",
          pejorative: false,
          sourceRefs: ["bantu-class-prefixes"],
        },
        {
          endonym: "Setswana",
          endonymGloss: "se-, la manière et la langue ; le peuple est Batswana",
          exonym: "tswana",
          imposedBy: "usage européen, début du mot supprimé",
          pejorative: false,
          sourceRefs: ["bantu-class-prefixes"],
        },
        {
          endonym: "Otjiherero",
          endonymGloss: "otji-, la langue ; le peuple est Ovaherero",
          exonym: "herero",
          imposedBy: "contact colonial du XIXe siècle",
          pejorative: false,
          sourceRefs: ["ethnologue-her", "afrik-ppl-herero"],
        },
        {
          endonym: "Kiswahili",
          endonymGloss:
            "ki-, la langue ; le nom vient de l'arabe sawāḥil, « les côtes »",
          exonym: "swahili",
          imposedBy:
            "nom d’origine arabe employé pour la langue, puis repris sans ki-",
          pejorative: false,
          sourceRefs: ["bantu-class-prefixes"],
        },
      ],
    },
    {
      id: "un-cas-qui-ne-se-resout-pas",
      stepLabel: "04 · La langue",
      heading: "Pourquoi nous expliquons l’histoire de ce mot",
      blocks: [
        {
          id: "une-insulte-en-afrique-du-sud",
          text: "En Afrique du Sud, « bantou » a servi à nommer un ministère, des écoles séparées et une catégorie de citoyens privés de certains droits. Le mot peut donc être reçu comme une insulte. Son emploi pour décrire des langues ne fait pas disparaître cette histoire.",
          sourceRefs: ["saho-bantu", "bantu-education-act-1953"],
          figureRefs: [],
        },
        {
          id: "aucun-substitut",
          text: "Les linguistes continuent à employer « bantou » pour cette famille de langues. « Niger-congo » désigne un ensemble plus large, et un nom de région ne couvrirait pas toutes les langues concernées. Ces termes ne peuvent donc pas simplement le remplacer.",
          sourceRefs: ["saho-bantu"],
          figureRefs: [],
        },
        {
          id: "garder-et-expliquer",
          text: "Nous gardons « bantou » pour désigner la famille de langues et nous expliquons son histoire. Lorsque les sources l’emploient pour des populations, nous précisons le contexte et les problèmes que cet usage pose.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "la-regle-qui-en-sort",
      stepLabel: "04 · La langue",
      heading: "Ce que la source ne dit pas",
      blocks: [
        {
          id: "glossonyme-nest-pas-ethnonyme",
          text: "Le nom d’une langue et le nom d’un peuple ne désignent pas la même chose. Le fait que deux peuples parlent des langues apparentées ne suffit pas à établir l’origine de leurs habitants ou à reconstituer leurs déplacements.",
          sourceRefs: [],
          figureRefs: [],
        },
        {
          id: "le-classement-est-un-outil",
          text: "Nos fiches regroupent les peuples par famille de langues pour faciliter la lecture. Ce classement ne décrit pas l'origine des personnes. Lorsqu'un nom de groupe a été donné de l'extérieur, la fiche le précise.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
  ],
  entities: [
    { kind: "family", id: "FLG_BANTU", label: "Famille bantoue" },
    { kind: "people", id: "PPL_HERERO", label: "Herero" },
  ],
};
