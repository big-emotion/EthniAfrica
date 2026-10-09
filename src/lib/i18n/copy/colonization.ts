import { COLONIAL_EVENT_TYPE_LABELS } from "@/lib/glossaire/vocabularies";
import type { Language } from "@/types/shared";

const fr = {
  navLabel: "Colonisation & résistances",
  pageTitle: "Colonisation & résistances",
  pageSubtitle:
    "Fragmentations, frontières héritées, noms imposés, déplacements et résistances documentés peuple par peuple.",
  fragmentation: {
    title: "Peuples fragmentés par les frontières coloniales",
    countryCount: (count: number) => `${count} pays`,
    caption: (name: string) =>
      `Répartition de ${name} par pays, avec les sources`,
    country: "Pays",
    populationShare: "Part de la population",
    sources: "Sources",
    colonialBorder: "frontière issue du partage colonial",
    shareAria: (country: string) => `pour la part de population en ${country}`,
    shareStatement: (country: string, share: string) =>
      `Part de la population en ${country} : ${share}`,
  },
  sources: {
    title: "Sources",
    linkLabel: "voir les sources",
  },
  timeline: {
    title: "Chronologie",
    eventTypeLabels: COLONIAL_EVENT_TYPE_LABELS.fr,
    filterLegend: "Filtrer par type d'événement",
    openEventSuffix: "Entrée pour ouvrir",
    closeEventCard: "Fermer",
    peoplesJoiner: "et",
    table: {
      caption: "Chronologie des événements coloniaux",
      date: "Date",
      type: "Type",
      people: "Peuple",
      place: "Lieu",
      source: "Source",
      placeUndocumented: "Non documenté",
      sourceUndocumented: "Aucune source citée",
    },
    emptyState:
      "Aucun événement de colonisation ou de résistance n'est documenté pour le moment.",
  },
};

type ColonizationCopy = typeof fr;

// @req REQ-145
export const colonizationCopy: Record<Language, ColonizationCopy> = { fr };
