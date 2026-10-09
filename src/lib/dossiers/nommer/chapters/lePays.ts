import type { DossierChapter } from "../types";

/**
 * Chapter two — the country.
 *
 * The most fragile of the five, and it opens by saying so. The 54 country
 * fiches all fill `etymology` and `nameOriginActor`, and not one of those
 * etymologies is attached to a source: `content.sources[]` documents the
 * demography and nothing else. A dossier that criticises folk etymologies
 * cannot lean on 54 unsourced ones without declaring the fact first.
 *
 * The four families are therefore published as a `read` figure, with the
 * caveat travelling beside them, and the whole classification is offered as
 * contestable — which is why the lists are printed in full rather than
 * summarised.
 */
// @req REQ-113
export const CHAPITRE_LE_PAYS: DossierChapter = {
  key: "le-pays",
  ordinal: "02",
  title: "Le pays",
  question: "Qui a choisi les noms des pays et que racontent-ils ?",
  standfirst: {
    id: "standfirst",
    text: "Dans le classement proposé ici, moins d’un tiers des pays portent un nom choisi ou rétabli par des Africains. Ces choix s’étalent sur plusieurs décennies. Ils racontent des histoires différentes, que les fiches ne documentent pas toutes avec la même précision.",
    sourceRefs: [],
    figureRefs: ["countries-african-choice", "corpus-countries"],
  },
  measure: {
    value: "17 sur 54",
    unit: "noms choisis par des Africains",
    sourceRefs: [],
    figureRefs: ["countries-african-choice", "corpus-countries"],
  },
  sections: [
    {
      id: "un-avertissement-de-methode",
      stepLabel: "02 · Le pays",
      heading: "Sur quels textes ce classement repose",
      blocks: [
        {
          id: "une-seule-etymologie-sourcee",
          text: "Lors du premier relevé des cinquante-quatre fiches de pays, les explications sur l’origine des noms n’étaient pas accompagnées de sources. Des références ont depuis été ajoutées à ce chapitre pour le Nigeria, le Bénin et le Ghana. Le classement ci-dessous reste fondé sur ce premier relevé et doit être lu avec cette limite.",
          sourceRefs: [
            "shaw-times-nigeria",
            "afrik-pays-ben",
            "afrik-pays-gha",
          ],
          figureRefs: ["corpus-countries"],
        },
        {
          id: "une-lecture-a-une-date",
          text: "Le classement qui suit repose sur une lecture des fiches à une date donnée. Les fiches ne précisent pas toutes de la même manière qui a choisi le nom du pays. Ce classement demande donc une interprétation et ne peut pas être obtenu par un simple décompte.",
          sourceRefs: [],
          figureRefs: ["countries-african-choice"],
        },
        {
          id: "des-listes-en-entier",
          text: "Nous donnons la liste complète des pays dans chaque catégorie. Vous pouvez ainsi voir les choix que nous avons faits et les discuter.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "quatre-familles",
      stepLabel: "02 · Le pays",
      heading: "Quatre origines proposées",
      blocks: [
        {
          id: "quatre-cas-inegaux",
          text: "Les fiches évoquent notamment des noms donnés par des navigateurs ou des géographes, des noms de royaumes déjà présents et des choix faits à l’indépendance ou après. Nous proposons quatre catégories pour comparer ces histoires.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
      table: {
        caption:
          "Classement proposé à partir des explications sur l’origine des noms des 54 pays.",
        columns: ["Origine du nom", "Pays", "Lesquels"],
        rows: [
          {
            cells: [
              "Nom donné par des Européens et conservé",
              "20",
              "Guinée, Guinée équatoriale, Gambie, Sierra Leone, Côte d'Ivoire, Cameroun, Gabon, Sénégal, Nigeria, Libéria, Seychelles, Maurice, Mozambique, São Tomé-et-Príncipe, Érythrée, Djibouti, Mauritanie, Algérie, Tunisie, Madagascar",
            ],
            sourceRefs: [],
            figureRefs: ["countries-european-exonym"],
          },
          {
            cells: [
              "Nom ancien donné de l’extérieur",
              "6",
              "Égypte et Libye (grec), Éthiopie (grec, puis adopté), Soudan (arabe, bilād as-sūdān), Maroc (arabe), Comores (arabo-persan)",
            ],
            sourceRefs: [],
            figureRefs: ["countries-ancient-exonym"],
          },
          {
            cells: [
              "Nom local repris par le colonisateur",
              "11",
              "Rwanda, Burundi, Angola (du titre ngola), Ouganda (du Buganda), Togo (de Togodo), Tchad, Niger, Kenya (de Kirinyaga), Zambie, Somalie, Congo",
            ],
            sourceRefs: [],
            figureRefs: ["countries-local-kept"],
          },
          {
            cells: [
              "Choisi ou restauré par des Africains",
              "17",
              "Ghana 1957, Mali 1960, République centrafricaine 1960, Malawi 1964, Tanzanie 1964, Botswana 1966, Lesotho 1966, Guinée-Bissau 1973, Bénin 1975, Zimbabwe 1980, Burkina Faso 1984, Namibie 1990, Soudan du Sud 2011, Cabo Verde 2013, Eswatini 2018, Afrique du Sud, République démocratique du Congo",
            ],
            sourceRefs: [],
            figureRefs: ["countries-african-choice"],
          },
        ],
      },
    },
    {
      id: "ce-que-dit-le-dix-sept",
      stepLabel: "02 · Le pays",
      heading: "Des changements de nom sur plusieurs décennies",
      blocks: [
        {
          id: "une-pratique-sur-soixante-ans",
          text: "Les changements de nom ne se limitent pas à l’année 1960. Le Ghana prend son nom en 1957. D’autres choix suivent : Zimbabwe en 1980, Burkina Faso en 1984, Namibie en 1990, Soudan du Sud en 2011, Cabo Verde en 2013 et Eswatini en 2018.",
          sourceRefs: ["afrik-pays-gha"],
          figureRefs: ["countries-african-choice"],
        },
        {
          id: "soixante-et-un-ans",
          text: "Soixante et un ans séparent le premier et le dernier de ces exemples. La question du nom d’un pays peut donc être reprise longtemps après son indépendance.",
          sourceRefs: [],
          figureRefs: [],
        },
        {
          id: "un-nom-herite-nest-pas-subi",
          text: "Un nom venu de l’extérieur peut être conservé par les habitants du pays. Pour le Sénégal, une explication rapproche le nom d’une expression wolof que des navigateurs portugais auraient mal comprise. Cette proposition ne suffit pas à dire comment les habitants perçoivent le nom aujourd’hui.",
          sourceRefs: [],
          figureRefs: ["countries-european-exonym"],
        },
      ],
    },
    {
      id: "trois-cas-qui-defont-la-lecture",
      stepLabel: "02 · Le pays",
      heading: "Trois histoires de noms à examiner de près",
      blocks: [
        {
          id: "nigeria-nomme-par-une-journaliste",
          text: "Le 8 janvier 1897, la journaliste Flora Shaw propose dans le Times le nom « Nigeria » pour la « Niger Area » administrée par la Royal Niger Company. Lugard l’officialise en 1914, lors de l’unification des protectorats du Nord et du Sud. La proposition du nom et son adoption officielle sont donc deux étapes distinctes.",
          sourceRefs: ["shaw-times-nigeria"],
          figureRefs: [],
        },
        {
          id: "une-attribution-nuancee",
          text: "L’histoire reste à préciser. Des emplois plus anciens de « Nigerian » sont signalés chez William Cole en 1862 et Richard Burton en 1863. La source consultée ne permet pas de savoir si le mot figurait dans les textes d’origine ou s’il a été ajouté dans une édition ultérieure.",
          sourceRefs: ["shaw-times-nigeria"],
          figureRefs: [],
        },
        {
          id: "benin-se-desindexe",
          text: "Le 30 novembre 1975, le Bénin remplace le nom colonial « Dahomey », tiré d’un royaume fon. Selon la fiche citée, le régime cherchait un nom qui ne soit celui d’aucun peuple du territoire, afin de limiter les divisions entre régions et populations. Le golfe du Bénin, qui borde la côte, offrait une référence géographique commune.",
          sourceRefs: ["afrik-pays-ben"],
          figureRefs: [],
        },
        {
          id: "ghana-restaure-un-empire",
          text: "Le 6 mars 1957, la Gold Coast prend le nom de Ghana, en référence à un empire médiéval situé dans le sud de l’actuelle Mauritanie et l’ouest du Mali. Cet empire ne se trouvait pas sur le territoire du Ghana actuel. La fiche citée présente ce choix comme le résultat de plusieurs décennies de réflexion d’enseignants et de lettrés sur le nom colonial du pays.",
          sourceRefs: ["afrik-pays-gha"],
          figureRefs: [],
        },
      ],
    },
    {
      id: "le-nom-du-pays-nest-pas-le-nom-du-peuple",
      stepLabel: "02 · Le pays",
      heading: "Le nom du pays n'est pas le nom du peuple",
      blocks: [
        {
          id: "quatre-objets-nommes",
          text: "Les fiches proposent des origines très différentes pour les noms des pays. Elles rattachent Niger et Nigeria au fleuve Niger, Kenya à la montagne appelée Kirinyaga en kikuyu, Soudan à l’expression arabe bilād as-sūdān, « le pays des Noirs », et Congo à un royaume.",
          sourceRefs: [],
          figureRefs: ["countries-local-kept", "countries-ancient-exonym"],
        },
        {
          id: "hydronyme-oronyme-choronyme",
          text: "Un pays peut donc porter le nom d’un fleuve, d’une montagne, d’une région ou d’un ancien royaume. Son nom ne suffit pas à identifier les peuples qui y vivent. Le glossaire explique les termes employés pour distinguer ces sortes de noms.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "ce-que-la-source-ne-dit-pas-pays",
      stepLabel: "02 · Le pays",
      heading: "Ce que la source ne dit pas",
      blocks: [
        {
          id: "trois-etymologies-sourcees",
          text: "Des sources sont citées ici pour les noms Nigeria, Bénin et Ghana. Flora Shaw a proposé Nigeria en 1897 ; Lugard l'a officialisé en 1914. Lors du relevé utilisé pour ce chapitre, les cinquante et une autres explications de noms de pays n'étaient pas accompagnées de sources.",
          sourceRefs: [
            "shaw-times-nigeria",
            "afrik-pays-ben",
            "afrik-pays-gha",
          ],
          figureRefs: ["corpus-countries"],
        },
        {
          id: "un-champ-type-manque",
          text: "Les fiches racontent l’origine des noms sans les répartir systématiquement dans les mêmes catégories. Le classement présenté ici repose donc sur notre lecture. Il pourra changer avec de nouvelles sources ou une autre interprétation des textes.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
  ],
  entities: [
    { kind: "country", id: "NGA", label: "Nigeria" },
    { kind: "country", id: "BEN", label: "Bénin" },
    { kind: "country", id: "GHA", label: "Ghana" },
    { kind: "country", id: "KEN", label: "Kenya" },
  ],
};
