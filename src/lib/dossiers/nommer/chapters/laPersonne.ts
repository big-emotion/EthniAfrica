import { formatNommerFigure } from "../figures";
import type { DossierChapter } from "../types";

/**
 * Chapter three — the person.
 *
 * The hinge of the dossier: chapter one shows a name being fixed, this one
 * shows a person being fixed by the same instrument. It is also where the
 * atlas states, to the reader rather than in a code comment, the one thing it
 * refuses to do — take a family name and return an ethnic origin.
 *
 * Two cautions the writing holds. The claim that the hereditary surname is a
 * European state invention is the broadest in the dossier and rests on the
 * thinnest source, so it is written as the mechanism it can document (the
 * registry) rather than as the genealogy it cannot. And the taxonomy of
 * `namingSystem` in the design note governs the naming-system fiches, not the
 * `nameSystem` field of the PAT_* fiches: the two vocabularies are kept apart.
 */
// @req REQ-113
export const CHAPITRE_LA_PERSONNE: DossierChapter = {
  key: "la-personne",
  ordinal: "03",
  title: "La personne",
  question:
    "Le nom de famille se transmet, croit-on, depuis toujours. Depuis quand, exactement ?",
  standfirst: {
    id: "standfirst",
    text: "Le nom de famille transmis entre générations dépend aussi de règles administratives. Nos fiches présentent d'autres manières de nommer les personnes, où le nom ne se transmet pas.",
    sourceRefs: ["afrik-naming-taxonomy"],
    figureRefs: ["patronyme-non-hereditary", "patronyme-fiches"],
  },
  measure: {
    value: formatNommerFigure({ figureKey: "patronyme-non-hereditary" }),
    unit: "fiches sur des noms qui ne se transmettent pas à l’identique",
    sourceRefs: [],
    figureRefs: ["patronyme-non-hereditary"],
  },
  sections: [
    {
      id: "ce-que-le-corpus-tient",
      stepLabel: "03 · La personne",
      heading: "Les noms présentés ici",
      blocks: [
        {
          id: "trente-six-systemes",
          text: `Nos ${formatNommerFigure({ figureKey: "patronyme-fiches" })} fiches accompagnées de sources présentent plusieurs façons de nommer une personne. Le nom peut rappeler un clan, célébrer une famille, indiquer un lieu d’origine ou renvoyer à un animal ou une plante associés au clan. Ces usages ne correspondent pas tous au nom de famille tel qu’on le connaît en français.`,
          sourceRefs: ["afrik-naming-taxonomy"],
          figureRefs: ["patronyme-fiches"],
        },
        {
          id: "quatre-systemes-non-hereditaires",
          text: `${formatNommerFigure({ figureKey: "patronyme-non-hereditary" })} de ces fiches décrivent des noms qui ne se transmettent pas à l’identique d’une génération à l’autre. Transmettre un nom de famille est donc une façon de faire parmi d’autres.`,
          sourceRefs: [],
          figureRefs: ["patronyme-non-hereditary"],
        },
      ],
      table: {
        caption:
          "Exemples tirés d’un premier relevé de trente fiches, selon ce que le nom désigne et la manière dont il se transmet",
        columns: ["Système", "Fiches", "Ce que le nom désigne"],
        rows: [
          {
            cells: [
              "Nom de clan",
              "18",
              "L’appartenance à un clan, par naissance ou par accueil de nouveaux membres",
            ],
            sourceRefs: ["afrik-naming-taxonomy"],
            figureRefs: [],
          },
          {
            cells: [
              "Nom de clan associé à un animal ou une plante",
              "4",
              "Un clan, avec son interdit alimentaire et sa liste fermée de prénoms",
            ],
            sourceRefs: ["afrik-naming-taxonomy"],
            figureRefs: [],
          },
          {
            cells: [
              "Suite de prénoms des parents",
              "4",
              "Une personne dont le second nom est le prénom de son père",
            ],
            sourceRefs: ["afrik-naming-taxonomy"],
            figureRefs: [],
          },
          {
            cells: [
              "Nom de louange",
              "2",
              "Une famille célébrée, comme dans l’oríkì yoruba ou le jamu mandingue",
            ],
            sourceRefs: ["afrik-naming-taxonomy"],
            figureRefs: [],
          },
          {
            cells: [
              "Nisba",
              "2",
              "Un lieu, un groupe ou un métier, dans le monde arabo-berbère",
            ],
            sourceRefs: ["afrik-naming-taxonomy"],
            figureRefs: [],
          },
        ],
      },
    },
    {
      id: "letat-civil-colonial",
      stepLabel: "03 · La personne",
      heading: "Comment l’état civil a changé la transmission des noms",
      blocks: [
        {
          id: "le-nom-comme-outil-detat",
          text: "James Scott explique que le nom de famille permanent aide un État à identifier ses habitants et à retrouver une même famille d’une génération à l’autre. Il le rapproche d’autres moyens utilisés par les administrations, comme les recensements, une langue commune et des unités de mesure partagées.",
          sourceRefs: ["civil-registration-surnames"],
          figureRefs: [],
        },
        {
          id: "le-mecanisme-colonial",
          text: "Dans les situations coloniales décrites par la source, les registres de naissance, de baptême, de propriété ou de travail exigeaient un nom selon le modèle européen. Lorsqu’une personne n’en avait pas, un agent en inscrivait un. Ce nom pouvait ensuite être transmis à la génération suivante, même si cet usage n’existait pas auparavant.",
          sourceRefs: ["civil-registration-surnames"],
          figureRefs: [],
        },
        {
          id: "le-meme-geste",
          text: "Comme pour certains noms de peuples, l’inscription dans un registre pouvait rendre un nom officiel et durable. Les façons de nommer les personnes devaient alors s’adapter aux règles administratives.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "le-postnom",
      stepLabel: "03 · La personne",
      heading: "Le choix du postnom au Zaïre",
      blocks: [
        {
          id: "le-recours-a-lauthenticite",
          text: "Le 27 octobre 1971, le régime de Mobutu proclame le recours à l'authenticité. Le 12 janvier 1972, la mesure atteint les noms : les prénoms chrétiens sont abandonnés au profit d'un postnom, et le chef de l'État change le sien le premier.",
          sourceRefs: ["zaire-authenticite-1972"],
          figureRefs: [],
        },
        {
          id: "une-ordonnance-loi",
          text: "Une ordonnance-loi du 30 août 1972 prévoit une sanction contre les responsables religieux qui donnent un prénom étranger lors d’un baptême. Le changement est donc imposé par la loi, avec des conséquences pour les personnes qui ne le respectent pas.",
          sourceRefs: ["zaire-authenticite-1972"],
          figureRefs: [],
        },
        {
          id: "ce-quil-en-reste",
          text: "Le postnom est resté en usage après la chute du régime de Mobutu. Un nom imposé par une politique peut ainsi continuer à être porté lorsque cette politique a disparu.",
          sourceRefs: ["zaire-authenticite-1972"],
          figureRefs: [],
        },
        {
          id: "les-instruments-empruntes",
          text: "Le régime entendait abandonner des noms liés à la colonisation. Il a pourtant lui aussi utilisé la loi et l’état civil pour décider des noms que les habitants pouvaient porter. Le choix des personnes concernées reste donc une question centrale.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "ce-quun-nom-ne-dit-pas",
      stepLabel: "03 · La personne",
      heading: "Ce qu'un nom ne dit pas d'une personne vivante",
      blocks: [
        {
          id: "un-nom-ne-dit-pas-lorigine",
          text: "Un nom de famille ne suffit pas à connaître l’origine d’une personne. Des familles sans lien de sang ont pu rejoindre un même clan par une alliance politique, une relation de protection ou la captivité de guerre. Une fiche peut indiquer qu’un nom est employé chez un peuple. Elle ne permet pas d’en déduire que toute personne portant ce nom appartient à ce peuple.",
          sourceRefs: ["dec-040"],
          figureRefs: [],
        },
        {
          id: "aucune-fonctionnalite",
          text: "Le site permet de chercher l’histoire d’un nom de famille. Il ne détermine pas l’origine ethnique de la personne qui le porte.",
          sourceRefs: ["dec-040"],
          figureRefs: [],
        },
      ],
      pairs: [
        {
          endonym: "Jamu",
          endonymGloss: "nom de clan mandingue, transmis mais aussi accordé",
          exonym: "« nom de famille »",
          imposedBy: "traduction administrative française",
          pejorative: false,
          sourceRefs: ["afrik-naming-taxonomy"],
        },
        {
          endonym: "Oríkì",
          endonymGloss: "nom de louange yoruba, récité plutôt qu'inscrit",
          exonym: "« patronyme »",
          imposedBy: "réduction à la case d'état civil",
          pejorative: false,
          sourceRefs: ["afrik-naming-taxonomy"],
        },
        {
          endonym: "Postnom",
          endonymGloss: "nom adopté après 1972, en République du Zaïre",
          exonym: "« deuxième prénom »",
          imposedBy: "formulaires étrangers sans case correspondante",
          pejorative: false,
          sourceRefs: ["zaire-authenticite-1972"],
        },
      ],
    },
    {
      id: "ce-que-la-source-ne-dit-pas-personne",
      stepLabel: "03 · La personne",
      heading: "Ce que la source ne dit pas",
      blocks: [
        {
          id: "lhypothese-la-moins-etayee",
          text: "La source citée aide à comprendre comment l’état civil a rendu certains noms transmissibles. Elle ne suffit pas à établir que tous les noms de famille héréditaires auraient été inventés par des États européens, puis diffusés par la colonisation. Cette explication plus générale demanderait d’autres recherches.",
          sourceRefs: ["civil-registration-surnames"],
          figureRefs: [],
        },
        {
          id: "les-systemes-sans-fiche",
          text: "Le premier relevé de trente-six fiches utilisé pour ce chapitre ne comprenait pas de fiche consacrée à l’abtirsi, la suite de noms somalie, ni au postnom. Le glossaire explique ces deux termes. Ce relevé ne couvrait qu’une partie des façons de nommer les personnes.",
          sourceRefs: [],
          figureRefs: ["patronyme-fiches"],
        },
      ],
    },
  ],
  entities: [],
};
