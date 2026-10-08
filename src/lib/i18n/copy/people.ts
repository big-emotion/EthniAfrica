import type { Language } from "@/types/shared";

const fr = {
  summary: {
    title: "En bref",
    persons: "Personnes recensées",
    referenceYear: (year: number) => `Année de référence : ${year}`,
    countriesOfPresence: "Pays de présence",
    mainLanguage: "Langue principale",
    linguisticFamily: "Famille linguistique",
    namesReferencedHere: "Noms rattachés",
    missingData: "Non renseigné",
    populationDisagreement: (declared: string, summed: string) =>
      `Le total déclaré est de ${declared} personnes, tandis que les populations indiquées par pays totalisent ${summed}. Ces chiffres ne concordent pas.`,
  },
  sections: {
    naming: "Le nom et ses appellations",
    mapGrammar: "Pourquoi la carte ne trace pas de frontière",
    mapDerivation: "Dérivé de la répartition par pays",
    origins: "Origines & formation",
    language: "Langue",
    historicalAffiliation: "Filiation historique",
    historicalRole: "Histoire",
    culture: "Culture et société",
    neighbours: "Peuples voisins & organisation",
    relatedPeoples: "Peuples liés",
    answer: "D'où vient le nom ?",
    otherNames: "Les autres noms",
    distribution: "Où vit ce peuple",
    referenceYear: "Année de référence : 2025",
    fragmentation: "Fragmentation coloniale",
    fragmentationNote: "Dérivé de la présence du peuple dans plusieurs pays",
    fragmentationCount: (count: number) => `${count} pays de présence`,
    sources: "Sources",
  },
  chapterDetails: {
    historyChronology: "Chronologie historique",
    historyUndated: "Non daté",
    historyRole: "Rôle historique",
    historyOriginStation: "Formation et origines",
    cultureRitesAndSymbols: "Rites & symboles",
    associatedGroups: (count: number) =>
      `${count} ${count === 1 ? "groupe associé" : "groupes associés"}`,
    documentedRelations: (count: number) =>
      `${count} ${count === 1 ? "relation documentée" : "relations documentées"}`,
  },
  reportSection: "Signaler cette section",
  naming: {
    selfDesignation: "Auto-appellation",
    exonyms: "Exonymes",
    origin: "D'où viennent ces noms.",
    problematic: "Pourquoi ces noms posent problème.",
    contemporary: "L'usage aujourd'hui.",
    sectionTitle: "Noms & appellations",
    pronunciation: (ipa: string) => `Prononciation phonétique : ${ipa}`,
    collapse: "Réduire",
    more: (count: number) => `+${count} autres`,
    exonymCount: (count: number) => `${count} noms relevés`,
    currentUsageAndCritique: "Usage et contexte",
  },
  field: {
    explanation: (count: number) =>
      `Sur la page d'un pays, le trait se referme parce qu'une frontière administrative est publiée et datée. Ici, rien de tel n'existe : aucune source que nous citons ne dit où la présence de ce peuple s'arrête. Ce que nous déclarons, ce sont ${count} populations par pays. La carte s'en tient exactement à cela — un halo par pays, dont l'aire suit la population et dont le bord vaut zéro. Un tracé fermé aurait affirmé un dedans et un dehors que personne ne peut sourcer.`,
    legend: "Densité décroissante, bord nul",
    offMapOne:
      "Une présence déclarée est hors carte, notre projet ne couvrant que l'Afrique :",
    offMapMany: (count: number) =>
      `${count} présences déclarées sont hors carte, notre projet ne couvrant que l'Afrique :`,
  },
  originFields: {
    ancientOrigins: "Origines anciennes",
    formationPeriod: "Période de formation",
    migrationRoutes: "Routes migratoires",
    settlementZones: "Zones de peuplement",
    unifications: "Unifications & divisions",
    externalInfluences: "Influences extérieures",
    majorEvents: "Événements majeurs",
  },
  languageFields: {
    family: "Famille linguistique",
    main: "Langue principale",
    iso: "Codes ISO",
    dialects: "Dialectes",
    vehicularRole: "Rôle véhiculaire",
  },
  historyFields: {
    kingdoms: "Royaumes & chefferies",
    neighbours: "Relations avec les voisins",
    conflicts: "Conflits & alliances",
    diaspora: "Diaspora",
  },
  cultureFields: {
    majorRites: "Rites majeurs",
    symbols: "Symboles",
    artsAndMusic: "Arts & musique",
    spiritualities: "Spiritualités",
  },
  relatedFields: {
    links: "Liens",
    seeAll: "Voir tous les liens",
    associatedGroups: "Groupes associés",
    politicalSystem: "Système politique traditionnel",
    clanOrganisation: "Organisation clanique",
    ageGrades: "Grades d'âge",
    lineages: "Rôle des lignages",
    religiousAuthority: "Autorité religieuse",
  },
  external: {
    title: "Identifiants externes",
    description:
      "Les entrées correspondantes dans les registres extérieurs auxquels cette page renvoie.",
  },
  countries: {
    offMap: "hors carte",
    derivedShare: "populations par pays indiquées ici",
    source: "Source",
    sourceMissing: "Source non renseignée",
    reference: "réf.",
  },
  oral: {
    title: "Voix & récits",
    description:
      "Des récits attribués, présentés sans les confondre avec des faits historiques établis.",
    attributed: (name: string) => `Récit attribué à ${name}.`,
    anonymous: "Récit attribué à une personne ayant choisi de rester anonyme.",
    linkedVariant: "Variante liée",
    notYetReviewed: "Pas encore relu",
  },
  media: {
    title: "Crédits médias",
    description:
      "Auteur, licence et page d'origine de chaque image ou vidéo attachée à cette page.",
    unknownAuthor: "Auteur inconnu",
    licence: "Licence",
    sourcePage: "Page source",
  },
  ficheHead: {
    kind: "Peuple",
    people: "personnes",
    reference: "réf.",
    presenceCountries: (count: number) => `${count} pays de présence`,
    sourceAria: (name: string) => `pour la page ${name}`,
  },
  presenceFacts: {
    description: (id: string) =>
      `${id} · présence déclarée, sans tracé de limite`,
    declaredPopulation: "Population déclarée",
    share: "Part de l'ensemble du peuple",
    haloTitle: "Ce que le halo dit",
    haloBody:
      "Le rayon suit la racine de la population, donc l'aire suit la population. Le bord vaut zéro : il n'y a pas de limite à lire.",
    reference: "Réf.",
    readFull: "Lire la page complète",
  },
  atlas: {
    missingDistribution: (name: string) =>
      `Répartition par pays non renseignée pour ${name}`,
    wholeArea: "Toute l'aire",
    areaNoun: "présence",
    noBoundary: "Aucune frontière ici.",
    presenceAndDensity: "Une présence, et sa densité.",
  },
  nameAnswer: {
    pronounced: "Se dit",
    listen: (name: string) => `Écouter la prononciation de ${name}`,
    meaningLeads: "Les pistes sur le sens",
    writtenTraces: "Où il a été écrit",
    whatTheyRaise: "Ce que ces noms soulèvent",
    givenBy: (namer: string) => `Donné par ${namer}.`,
    badges: {
      own: "Leur nom",
      outside: "Donné de l'extérieur",
      imposed: "Imposé",
      debated: "Origine débattue",
      usage: (language: string) => `En ${language}`,
    },
  },
};

type PeopleCopy = typeof fr;

// @req REQ-145
export const peopleCopy: Record<Language, PeopleCopy> = { fr };
