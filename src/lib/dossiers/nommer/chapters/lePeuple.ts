import { formatNommerFigure } from "../figures";
import type { DossierChapter } from "../types";

/**
 * Chapter one — the people.
 *
 * The chapter the whole dossier rests on, and the one most easily written
 * badly. Two guards are built into the writing itself:
 *
 *   - the lexical probe is published with its method, because a count of word
 *     stems in free prose is not a coding of the corpus and saying so is the
 *     difference between a measure and a rhetorical figure;
 *   - the Herero case is not optional. A chapter that presented every exonym
 *     as an injury would have no standing left when it reaches « Hottentot ».
 */
// @req REQ-113
export const CHAPITRE_LE_PEUPLE: DossierChapter = {
  key: "le-peuple",
  ordinal: "01",
  title: "Le peuple",
  question: "Un peuple peut porter plusieurs noms. Qui les lui a donnés ?",
  standfirst: {
    id: "standfirst",
    text: "Nos fiches recensent davantage de noms donnés de l'extérieur que de noms revendiqués par les peuples eux-mêmes. Cet écart dépend des personnes qui ont écrit les textes disponibles ; il ne permet pas à lui seul de mesurer l'effet de la colonisation.",
    sourceRefs: [],
    figureRefs: ["corpus-exonyms", "corpus-autonyms"],
  },
  measure: {
    value: formatNommerFigure({ figureKey: "corpus-exonyms" }),
    unit: "noms donnés de l’extérieur",
    sourceRefs: [],
    figureRefs: ["corpus-exonyms"],
  },
  sections: [
    {
      id: "la-mesure-et-ce-quelle-ne-mesure-pas",
      stepLabel: "01 · Le peuple",
      heading: "Ce que ces nombres nous apprennent",
      blocks: [
        {
          id: "quatre-pour-un",
          text: `Nos ${formatNommerFigure({ figureKey: "corpus-peoples" })} fiches de peuple recensent ${formatNommerFigure({ figureKey: "corpus-exonyms" })} noms donnés par d’autres personnes, contre ${formatNommerFigure({ figureKey: "corpus-autonyms" })} noms que les peuples emploient pour se nommer. Cela représente environ quatre noms donnés de l’extérieur pour un nom employé par les peuples eux-mêmes.`,
          sourceRefs: [],
          figureRefs: ["corpus-peoples", "corpus-exonyms", "corpus-autonyms"],
        },
        {
          id: "une-asymetrie-darchive",
          text: "Cet écart ne dit pas combien de peuples ont été renommés de force. Il dépend des textes qui nous sont parvenus et des personnes qui les ont écrits. Les noms donnés par d’autres personnes y occupent davantage de place. Nos fiches reprennent ce déséquilibre.",
          sourceRefs: [],
          figureRefs: [],
        },
        {
          id: "trois-declarations",
          text: `Parmi nos fiches, ${formatNommerFigure({ figureKey: "status-contested-or-colonial" })} décrivent le nom comme contesté ou hérité de la colonisation. ${formatNommerFigure({ figureKey: "status-other" })} le classent autrement et ${formatNommerFigure({ figureKey: "status-undeclared" })} ne donnent aucune indication sur ce point.`,
          sourceRefs: [],
          figureRefs: [
            "status-contested-or-colonial",
            "status-other",
            "status-undeclared",
          ],
        },
        {
          id: "le-troisieme-nombre",
          text: "Une fiche qui ne donne aucune indication sur ce point ne permet pas de dire que le nom est accepté sans réserve. De même, une fiche qui décrit un nom comme contesté ne prouve pas que toutes les personnes concernées le contestent. Il faut lire les explications et les sources de chaque fiche.",
          sourceRefs: [],
          figureRefs: ["status-undeclared"],
        },
      ],
    },
    {
      id: "le-sondage-lexical",
      stepLabel: "01 · Le peuple",
      heading: "Les mots employés dans les fiches",
      blocks: [
        {
          id: "de-la-prose-pas-une-donnee",
          text: "Les fiches racontent d’où viennent les noms donnés par d’autres peuples ou par des administrations. Le tableau ci-dessous compte certains mots dans ces récits. Il ne compte pas les personnes ou les institutions qui ont choisi les noms. Par exemple, une fiche qui écrit « ce nom n'est pas d'origine européenne » est comptée parce qu’elle contient « europ- ». Une même fiche peut apparaître dans plusieurs lignes.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
      table: {
        caption:
          "Nombre de fiches contenant les mots ou débuts de mots indiqués, dans les explications sur l’origine des noms et les raisons de les contester. Une fiche peut être comptée plusieurs fois.",
        columns: ["Mot recherché", "Fiches", "Exemples de sujets abordés"],
        rows: [
          {
            cells: [
              "colonial",
              formatNommerFigure({ figureKey: "probe-colonial" }),
              "Les noms apparus ou rendus officiels pendant la colonisation",
            ],
            sourceRefs: [],
            figureRefs: ["probe-colonial"],
          },
          {
            cells: [
              "administr-",
              formatNommerFigure({ figureKey: "probe-administration" }),
              "L’usage du nom dans les recensements",
            ],
            sourceRefs: [],
            figureRefs: ["probe-administration"],
          },
          {
            cells: [
              "europ-",
              formatNommerFigure({ figureKey: "probe-european" }),
              "Navigateurs, explorateurs, cartographes",
            ],
            sourceRefs: [],
            figureRefs: ["probe-european"],
          },
          {
            cells: [
              "voisin",
              formatNommerFigure({ figureKey: "probe-neighbours" }),
              "Les noms donnés par un peuple voisin",
            ],
            sourceRefs: [],
            figureRefs: ["probe-neighbours"],
          },
          {
            cells: [
              "mots liés au mépris",
              formatNommerFigure({ figureKey: "probe-pejorative" }),
              "Recherche des mots « péjoratif », « dépréciatif », « moqueur » ou « dérisoire », ainsi que de leurs variantes",
            ],
            sourceRefs: [],
            figureRefs: ["probe-pejorative"],
          },
          {
            cells: [
              "portugais",
              formatNommerFigure({ figureKey: "probe-portuguese" }),
              "Les noms employés par les Portugais sur la côte atlantique dès le XVe siècle",
            ],
            sourceRefs: [],
            figureRefs: ["probe-portuguese"],
          },
          {
            cells: [
              "arab-",
              formatNommerFigure({ figureKey: "probe-arabic" }),
              "L’usage de l’arabe au Sahel et sur la côte orientale, avant l’arrivée des Européens",
            ],
            sourceRefs: [],
            figureRefs: ["probe-arabic"],
          },
          {
            cells: [
              "swahili",
              formatNommerFigure({ figureKey: "probe-swahili" }),
              "Les noms employés en swahili, langue d’échange entre plusieurs peuples",
            ],
            sourceRefs: [],
            figureRefs: ["probe-swahili"],
          },
          {
            cells: [
              "esclav-",
              formatNommerFigure({ figureKey: "probe-slavery" }),
              "Les noms liés à la capture et à l’esclavage",
            ],
            sourceRefs: [],
            figureRefs: ["probe-slavery"],
          },
          {
            cells: [
              "missionn-",
              formatNommerFigure({ figureKey: "probe-missionary" }),
              "Les noms employés par les missions religieuses et dans l’enseignement de la lecture",
            ],
            sourceRefs: [],
            figureRefs: ["probe-missionary"],
          },
        ],
      },
    },
    {
      id: "lexonyme-nest-pas-europeen",
      stepLabel: "01 · Le peuple",
      heading: "Des noms donnés aussi par des peuples voisins",
      blocks: [
        {
          id: "voisins-arabe-swahili",
          text: "Les fiches mentionnent aussi des noms donnés par des peuples voisins ou empruntés à l’arabe et au swahili. Les Européens n’ont donc pas été les seuls à donner des noms à d’autres peuples. Pour comprendre chaque nom, il faut regarder qui l’a employé et dans quelles circonstances.",
          sourceRefs: [],
          figureRefs: ["probe-neighbours", "probe-arabic", "probe-swahili"],
        },
        {
          id: "le-registre",
          text: "L’administration coloniale a repris certains de ces noms dans ses registres, notamment pour les recensements et les impôts. Une appellation utilisée dans les échanges pouvait ainsi devenir un nom officiel, plus difficile à changer.",
          sourceRefs: [],
          figureRefs: ["probe-administration"],
        },
        {
          id: "les-jieng",
          text: "La fiche des Jieng, au Soudan du Sud, rapporte que « Dinka » vient de marchands arabes du nord et que l’administration anglo-égyptienne l’a repris. Ce nom est aujourd’hui largement accepté, y compris par les personnes concernées dans les échanges officiels. Depuis l’indépendance de 2011, « Jieng » est aussi davantage revendiqué pour affirmer leur identité. Un peuple peut donc adopter un nom qui lui a d’abord été donné par d’autres.",
          sourceRefs: ["afrik-ppl-dinka"],
          figureRefs: [],
        },
      ],
    },
    {
      id: "quand-le-nom-est-une-moquerie",
      stepLabel: "01 · Le peuple",
      heading: "Quand le nom est une moquerie",
      blocks: [
        {
          id: "quatre-vingt-sept-fiches",
          text: `${formatNommerFigure({ figureKey: "probe-pejorative" })} fiches contiennent au moins un des mots recherchés pour repérer les noms présentés comme méprisants. Ce nombre dépend des mots choisis pour la recherche. Les exemples suivants expliquent pourquoi certains noms sont contestés.`,
          sourceRefs: [],
          figureRefs: ["probe-pejorative"],
        },
      ],
      pairs: [
        {
          endonym: "Khoekhoe",
          endonymGloss: "« les hommes des hommes »",
          exonym: "Hottentot",
          imposedBy:
            "colons néerlandais, par imitation moqueuse des consonnes claquantes",
          pejorative: true,
          sourceRefs: ["britannica-khoekhoe"],
        },
        {
          endonym: "ǂKhomani, Ju|'hoansi, !Xun",
          endonymGloss: "les noms de chaque peuple",
          exonym: "Bushmen, puis San",
          imposedBy:
            "« Bushmen » vient des colons anglophones ; « San » vient d’un mot khoekhoe jugé méprisant",
          pejorative: true,
          sourceRefs: ["saho-khoisan", "san-council-2003"],
        },
        {
          endonym: "Jieng",
          endonymGloss: "au singulier Muonyjang",
          exonym: "Dinka",
          imposedBy: "marchands arabes, puis administration anglo-égyptienne",
          pejorative: false,
          sourceRefs: ["afrik-ppl-dinka"],
        },
        {
          endonym: "Ovaherero",
          endonymGloss: "« les possesseurs de bétail »",
          exonym: "Herero",
          imposedBy: "contact colonial du XIXe siècle",
          pejorative: false,
          sourceRefs: ["ethnologue-her", "afrik-ppl-herero"],
        },
      ],
    },
    {
      id: "remplacer-nest-pas-reparer",
      stepLabel: "01 · Le peuple",
      heading: "Changer de nom ne suffit pas toujours",
      blocks: [
        {
          id: "hottentot-bushmen-san",
          text: "Selon les sources citées, « Hottentot » a été abandonné dans les travaux de recherche puis dans la loi. À partir des années 1970, les anthropologues de langue anglaise ont remplacé « Bushmen » par « San ». Mais ce dernier nom pose aussi question : il vient d’un mot khoekhoe jugé méprisant, qui désignait les chasseurs-cueilleurs sans bétail.",
          sourceRefs: ["saho-khoisan"],
          figureRefs: [],
        },
        {
          id: "le-nom-de-la-nation",
          text: "En 2003, leurs représentants ont demandé à être appelés par le nom de leur propre peuple, comme ǂKhomani, Ju|'hoansi ou !Xun. Ils souhaitaient éviter qu’un seul nom regroupe des peuples distincts sans tenir compte de la manière dont chacun se nomme.",
          sourceRefs: ["san-council-2003", "saho-khoisan"],
          figureRefs: [],
        },
      ],
    },
    {
      id: "le-contre-exemple",
      stepLabel: "01 · Le peuple",
      heading: "Le cas différent des Ovaherero",
      blocks: [
        {
          id: "herero-sans-connotation",
          text: "Notre fiche sur les Ovaherero distingue l'histoire du peuple du sens de son nom. « Herero » est un nom utilisé à l'international et lié au contact colonial. Les sources consultées ne décrivent pas de sens méprisant attaché au mot lui-même.",
          sourceRefs: ["afrik-ppl-herero", "ethnologue-her"],
          figureRefs: [],
        },
        {
          id: "le-genocide-et-le-mot",
          text: "La fiche rappelle aussi le génocide des Herero et des Nama. Cette histoire de violence coloniale doit être étudiée pour elle-même. Elle ne permet pas, à elle seule, de conclure que le mot « Herero » a un sens méprisant.",
          sourceRefs: ["afrik-ppl-herero"],
          figureRefs: [],
        },
        {
          id: "la-regle-du-chapitre",
          text: "Pour comprendre un nom donné de l’extérieur, nous regardons son sens, les personnes qui l’ont employé ou imposé et ce qu’en disent aujourd’hui les personnes concernées. Ces éléments varient d’un nom à l’autre.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "ce-que-latlas-en-fait",
      stepLabel: "01 · Le peuple",
      heading: "Ce que la source ne dit pas",
      blocks: [
        {
          id: "compter-le-mot-administration",
          text: "Nos fiches décrivent l'origine de noms donnés de l'extérieur, sans toujours expliquer pourquoi ils ont continué à être utilisés. La présence du mot « administration » dans une fiche ne signifie pas qu'une administration a imposé le nom. Elle ne permet donc pas de compter les noms réellement imposés.",
          sourceRefs: [],
          figureRefs: ["exonyms-imposed-by-administration"],
        },
        {
          id: "les-fiches-muettes",
          text: `${formatNommerFigure({ figureKey: "status-undeclared" })} fiches ne précisent pas si le nom est contesté ou hérité de la colonisation. Ce manque d’information ne signifie pas que ces noms ne posent aucune question. Il reste à les étudier.`,
          sourceRefs: [],
          figureRefs: ["status-undeclared"],
        },
      ],
    },
  ],
  entities: [
    { kind: "people", id: "PPL_DINKA", label: "Dinka" },
    { kind: "people", id: "PPL_HERERO", label: "Herero" },
    { kind: "country", id: "SSD", label: "Soudan du Sud" },
    { kind: "country", id: "NAM", label: "Namibie" },
  ],
};
