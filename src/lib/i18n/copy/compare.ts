import type { CompareEntityType as PickerEntityType } from "@/hooks/use-compare-selection";
import type { CompareEntityType } from "@/types/compare";
import type { Language } from "@/types/shared";

const fr = {
  title: "Comparer",
  pickerIntroduction:
    "Choisissez deux ou trois pages du même type, puis lancez la comparaison.",
  entityTypeLegend: "Type de page à comparer",
  entityTypes: {
    peoples: "peuples",
    countries: "pays",
    "language-families": "familles linguistiques",
  } satisfies Record<PickerEntityType, string>,
  search: (kind: string) => `Rechercher ${kind}`,
  searchPlaceholder: (kind: string) => `Rechercher ${kind}…`,
  suggestions: (kind: string) => `Suggestions ${kind}`,
  maximum: (count: number) => `${count} maximum`,
  selectedEntities: "Pages sélectionnées",
  remove: (name: string) => `retirer ${name}`,
  selectionRegion: "Sélection de comparaison",
  selectedCount: (count: number, maximum: number) =>
    `${count}/${maximum} sélectionnés`,
  compare: "comparer",
  addedAnnouncement: (name: string, count: number, maximum: number) =>
    `${name} ajouté à la comparaison, ${count} sur ${maximum}`,
  removedAnnouncement: (name: string, count: number, maximum: number) =>
    `${name} retiré de la comparaison, ${count} sur ${maximum}`,
  rowTitles: {
    peuple: {
      appellations: "Noms & appellations",
      origins: "Origines & formation",
      organization: "Peuples voisins & organisation",
      languages: "Langue",
      culture: "Culture & spiritualité",
      historicalRole: "Rôle historique",
      demography: "Répartition géographique",
    },
    pays: {
      historicalNames: "Noms à travers l'histoire",
      kingdoms: "Royaumes & Civilisations",
      majorPeoples: "Peuples et population",
      culture: "Culture & Société",
      historicalFacts: "Faits historiques majeurs",
      demographics: "Peuples et population",
    },
    famille: {
      decolonialHeader: "Appellations et décolonisation",
      generalInfo: "Informations générales",
      associatedPeoples: "Peuples associés",
      linguisticCharacteristics: "Caractéristiques linguistiques",
      historyAndOrigins: "Histoire et origines",
      distribution: "Répartition géographique",
    },
  } satisfies Record<CompareEntityType, Record<string, string>>,
  caption: (labels: string) => `Comparaison de ${labels}`,
  listJoiner: "et",
  tableLabel: "Tableau de comparaison",
  comparedAttribute: "Information comparée",
  missing: "non renseigné",
  missingFor: (name: string) => ` pour ${name}`,
  referenceYear: "réf. 2025",
  viewSources: "voir les sources",
  editorialConfidence: (name: string) => `Confiance éditoriale — ${name}`,
  scoreExplainer: "comment ce score est calculé",
  metadataTitle: (labels: string) => `Comparaison : ${labels}`,
  metadataDescription: (labels: string) =>
    `Comparez les pages ${labels} pour explorer les noms, les langues, les populations et les sources.`,
  metadataImageAlt: "Comparaison AFRIK",
  notFoundTitle: "Comparaison introuvable",
  notFoundBeforePattern:
    "Cette comparaison n'existe pas. Les URLs de comparaison suivent le format",
  notFoundAfterPattern:
    "(2 à 3 identifiants du même type : peuples, pays ou familles linguistiques, sans doublon).",
  startComparison: "Commencer une comparaison",
  reportBrokenUrl: "Signaler un lien qui ne fonctionne pas",
  og: {
    comparison: "Comparaison",
    entityTypes: {
      peuple: "Peuples",
      pays: "Pays",
      famille: "Familles linguistiques",
    },
    unaudited: "page pas encore relue",
    confidence: (score: number) => `${score} % de confiance`,
  },
};

type CompareCopy = typeof fr;

// @req REQ-145
export const compareCopy: Record<Language, CompareCopy> = { fr };
