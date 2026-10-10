import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";

type Source =
  NameHistory["names"][number]["accounts"][number]["sources"][number];

const MEEUWIS: Source = {
  title: "Lingala",
  author: "Michael Meeuwis",
  year: null,
  url: "https://apics-online.info/surveys/60",
  tier: "referenced",
  source_kind: "academic",
  page: "section 2",
};

const DE_BOECK: Source = {
  title: "Grammaire et vocabulaire du lingala ou langue du Haut-Congo",
  author: "Le père De Boeck, de la congrégation de Scheut",
  year: 1904,
  url: "https://archive.org/details/grammaireetvoca00boecgoog",
  tier: "referenced",
  source_kind: "archive",
  page: "p. 3 et p. 5",
};

const MIMPONGO: Source = {
  title: "L'origine et la signification du glossonyme lingala",
  author: "Mpoke Mimpongo",
  year: 2024,
  url: "https://ling.auf.net/lingbuzz/008154",
  tier: "referenced",
  source_kind: "academic",
  page: "p. 44",
};

/**
 * Condensed from the lingala fiche (dataset/source/afrik/langues/lin.json),
 * in the fiche's own order — which is not the timeline's: the before tiles
 * are listed out of date order on purpose, as they are in the fiche.
 */
// @req REQ-198
export const LINGALA_HISTORY: NameHistory = {
  summary:
    "Le nom lingala désigne une langue du bassin du Congo, que beaucoup de ses locuteurs appellent aussi mangala. Elle a porté d'autres noms : Bangala, et avant lui bobangi.",
  names: [
    {
      nameText: "Lingala",
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: null,
      namedBy: null,
      shortLine:
        "Le nom d'une langue du fleuve Congo, écrit pour la première fois vers 1902.",
      accounts: [
        {
          period: { from: 2006, to: null, label: "Depuis 2006" },
          statement:
            "Le lingala est l'une des quatre langues nationales de la République démocratique du Congo.",
          sources: [
            {
              title: "Constitution de la République démocratique du Congo",
              author: "République démocratique du Congo",
              year: 2006,
              url: null,
              tier: "official",
              source_kind: "government",
            },
          ],
        },
        {
          period: { from: 1904, to: 1904, label: "1904" },
          statement:
            "Le nom lingala figure dans le titre de la grammaire que publie le père De Boeck.",
          formAsWritten: "Lingala",
          actors: [
            {
              name: "Le père De Boeck",
              role: "auteur de la grammaire",
            },
          ],
          sources: [DE_BOECK],
        },
        {
          period: { from: 1902, to: 1902, label: "1902" },
          statement:
            "Le nom lingala apparaît par écrit en 1902. C'est la plus ancienne trace de ce nom que le projet connaît.",
          birth: true,
          sources: [MEEUWIS],
        },
        {
          period: { from: 1901, to: 1902, label: "1901-1902" },
          statement:
            "Le nom lingala aurait été choisi par les missionnaires pour remplacer « Bangala », selon Michael Meeuwis.",
          hypothesisGroup: "origine du nom lingala",
          sources: [MEEUWIS],
        },
        {
          period: { from: null, to: 1901, label: "Avant 1901" },
          statement:
            "Le nom lingala viendrait du bobangi, selon Mpoke Mimpongo.",
          hypothesisGroup: "origine du nom lingala",
          sources: [MIMPONGO],
        },
        {
          period: { from: null, to: null, label: "Origine non datée" },
          statement:
            "Le nom lingala aurait été formé par des locuteurs du libinza, selon Tshimpaka.",
          hypothesisGroup: "origine du nom lingala",
          sources: [MIMPONGO],
        },
        {
          period: { from: null, to: 1882, label: "Jusqu'aux années 1880" },
          statement:
            "Le bobangi est alors la langue de commerce des riverains du fleuve Congo, selon Michael Meeuwis.",
          before: true,
          sources: [MEEUWIS],
        },
        {
          period: { from: 1884, to: 1901, label: "De 1884-1885 à 1901" },
          statement:
            "Le nom Bangala est donné à ce parler après 1884-1885, selon Michael Meeuwis.",
          before: true,
          sources: [MEEUWIS, DE_BOECK],
        },
      ],
    },
    {
      nameText: "Bangala",
      nameStatus: "current",
      selfGiven: false,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: 1884, to: 1885, label: "1884-1885" },
          statement:
            "Le nom Bangala est d'abord celui d'un poste de l'État, Bangala Station.",
          birth: true,
          sources: [MEEUWIS],
        },
      ],
    },
    {
      nameText: "Mangala",
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: null, to: null, label: "Aujourd'hui" },
          statement:
            "Le nom mangala reste celui que beaucoup de locuteurs préfèrent.",
          sources: [MEEUWIS],
        },
      ],
    },
  ],
};

const BA: Source = {
  title: "Des Peuls",
  author: "Amadou Hampâté Bâ",
  year: 1966,
  url: null,
  tier: "referenced",
  source_kind: "academic",
};

/** Condensed from the Peul fiche: a people searched by a name it does not give itself. */
// @req REQ-198
export const PEUL_HISTORY: NameHistory = {
  summary:
    "Le nom Peul désigne un peuple qui se nomme lui-même Fulɓe, et Pullo pour une seule personne.",
  names: [
    {
      nameText: "Fulɓe",
      nameStatus: "current",
      selfGiven: true,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: null, to: null, label: "Usage contemporain" },
          statement:
            "Fulɓe est le nom que les personnes concernées emploient pour se nommer au pluriel.",
          sources: [
            {
              title: "Récit recueilli à Labé",
              author: "Conteurs du Fouta-Djalon",
              year: null,
              url: null,
              tier: "unverified",
              source_kind: "oral_tradition",
            },
          ],
        },
      ],
    },
    {
      nameText: "Peul",
      nameStatus: "current",
      selfGiven: false,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: 1966, to: 1966, label: "1966" },
          statement:
            "Le nom Peul est écrit « Peuls ou Peulhs » par Amadou Hampâté Bâ.",
          formAsWritten: "Peuls ou Peulhs",
          sources: [{ ...BA, page: "p. 2" }],
        },
        {
          period: { from: 1842, to: 1842, label: "1842" },
          statement: "Le nom Peul apparaît chez D'Eichtal, en 1842.",
          birth: true,
          sources: [BA],
        },
      ],
    },
  ],
};
