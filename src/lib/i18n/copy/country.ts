import type { Language } from "@/types/shared";

const fr = {
  editorialCommonNames: {
    COD: "République démocratique du Congo",
  },
  title: { ficheCountry: "page du pays", reference: "réf." },
  summary: {
    title: "En bref",
    portrait: "Portrait",
    referenceYear: (year: number) => `Année de référence : ${year}`,
    figures: {
      population: {
        label: "habitants",
        absent: "population non renseignée",
      },
      peoples: {
        label: "peuples",
        scope: "documentés ici",
        absent: "aucun peuple documenté ici",
      },
      languages: {
        label: "langues",
        scope: "documentées ici",
        absent: "aucune langue documentée ici",
      },
      families: {
        label: "familles linguistiques",
        scope: "documentées ici",
        absent: "aucune famille documentée ici",
      },
      names: {
        label: "noms",
        scope: "référencés ici",
        absent: "aucun nom référencé ici",
      },
    },
  },
  sections: {
    nameAndHistory: "Le nom et son histoire",
    history: "Histoire",
    etymology: "Étymologie du nom",
    peoples: "Peuples du pays",
    kingdoms: "Royaumes et formations politiques",
    namesHistory: "Noms à travers l'histoire",
    historicalFacts: "Faits historiques majeurs",
    languages: "Langues",
    culture: "Culture et société",
    sources: "Sources",
  },
  historyDateMissing: "Date non renseignée",
  languagesDerivedNote: "Déduit des pages peuple documentées ici.",
  languagesUnavailable:
    "Les liens entre langues et peuples sont temporairement indisponibles.",
  peoples: {
    inhabitants: "habitants",
    documentedInhabitants: "habitants documentés",
    count: (count: number) => `${count} peuple${count > 1 ? "s" : ""}`,
    groupedCount: (count: number) => `${count} peuples`,
    coverage: (share: number) =>
      `Les peuples documentés ici représentent ${share}\u00a0% de la population du pays. Le reste n'est pas encore réparti ici.`,
    estimatedBreakdown: "Répartition estimée ou incomplète",
    diversity: "Diversité ethnolinguistique",
    notDetailed: "non détaillée individuellement",
    otherLanguages: (count: number) => `+ ${count} autres langues`,
  },
  reportSection: "Signaler cette section",
  targetFacts: {
    written: "Page rédigée",
    derived: "Présence dérivée des pages peuple",
    population: "Population",
    reference: "réf.",
    languages: "Langues principales",
    boundary: (id: string) =>
      `${id} · frontière publiée, tracée à l'apparition`,
    declaredPeoples: "Peuples déclarés par la page",
    firstEntries: "Premières entrées",
    none: "Aucun peuple rattaché à ce pays pour l’instant.",
    readFull: "Lire la page complète",
    documentedOne: "1 peuple documenté",
    documentedMany: (count: string) => `${count} peuples documentés`,
  },
  atlas: {
    areaNoun: "le continent",
    returnTo: (name: string) => `Revenir à ${name}`,
    missingOutline: (name: string) => `Contour non disponible pour ${name}`,
    disputedStatus: {
      label: "Statut contesté",
      body: "L'étendue de ce territoire est datée et citable : la convention franco-espagnole de 1912 en fixe la limite nord au parallèle 27°40′N. Sa souveraineté ne l'est pas. L'ONU l'inscrit depuis 1963 parmi les territoires non autonomes et n'y enregistre aucune puissance administrante depuis le retrait espagnol de 1976 ; l'Union africaine y siège un État membre, la République arabe sahraouie démocratique.",
      encoding:
        "Nous traçons donc ce que nous pouvons citer et laissons vide ce que nous ne pouvons pas : le trait se referme, l'intérieur reste vide.",
    },
  },
  generated: {
    eras: {
      middleAges: "Moyen Âge",
      precolonial: "Époque précoloniale",
      colonization: "Colonisation",
      contemporary: "Période contemporaine",
    },
    kingdomTitles: {
      generic: "Entités politiques historiques",
      kingdoms: "Royaumes & Civilisations",
      sultanates: "Sultanats & Chefferies",
      chiefdoms: "Chefferies & Entités",
    },
    historicalPeriods: {
      ancientPeriods: "Périodes anciennes",
      middleAges: "Moyen Âge",
      precolonial: "Époque précoloniale",
      colonization: "Colonisation",
      independenceStruggle: "Lutte pour l'indépendance",
      postIndependence: "Période post-indépendance",
    },
    each: "chacun",
    centers: "Centres",
  },
};

type CountryCopy = typeof fr;

// @req REQ-145
export const countryCopy: Record<Language, CountryCopy> = { fr };
