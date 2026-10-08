import type { Language } from "@/types/shared";

const fr = {
  navLabel: "Migrations",
  pageTitle: "Frise des migrations",
  pageSubtitle:
    "Le récit chronologique de chaque migration, peuplement et route commerciale documenté ici.",
  tabs: {
    map: "Carte",
    narrative: "Récit",
  },
  mapPlaceholder:
    "La carte interactive des migrations arrive avec la Story 12.9.",
  debateLabel: "Débat historiographique",
  peoplesLabel: "Peuples concernés",
  sourcesCountSingular: "source",
  sourcesCountPlural: "sources",
  filterChip: {
    label: "Filtré sur",
    clear: "Retirer le filtre",
  },
  emptyState: "Aucune migration ne correspond à ce filtre.",
  states: {
    failure:
      "Les migrations n'ont pas pu être chargées. Le problème vient de notre côté, pas d'un filtre.",
    failureRetry: "Réessayer",
    emptyUnpublished: "Aucune migration n'est encore publiée.",
    filteredEmpty: "Aucune migration ne correspond à ce filtre",
  },
};

type MigrationsCopy = typeof fr;

// @req REQ-145
export const migrationsCopy: Record<Language, MigrationsCopy> = { fr };
