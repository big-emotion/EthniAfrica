import type { Language } from "@/types/shared";

const fr = {
  page: {
    section: "Peuples",
    title: (name: string) => `Liens de ${name}`,
    missingTitle: "Liens introuvables — EthniAfrica",
    fallbackTitle: "Liens — EthniAfrica",
    metadataTitle: (name: string) => `Liens de ${name} — EthniAfrica`,
    description: (name: string) =>
      `Liens migratoires, commerciaux et religieux documentés entre ${name} et les peuples voisins, avec leurs sources.`,
  },
  list: {
    filterGroup: "filtrer par type de lien",
    removeFilter: (label: string) => `retirer le filtre ${label}`,
    clearFilters: "tout effacer",
    empty: "Aucune relation documentée pour le moment.",
    derivedOnly:
      "Seuls des liens de proximité linguistique, dérivés de la hiérarchie AFRIK, sont disponibles pour l'instant.",
    derived: "dérivé de la hiérarchie AFRIK",
    proseFallback: "",
    linkWith: (name: string) => `Lien avec ${name}`,
  },
  graph: {
    role: "graphe de relations",
    label: (name: string) => `Graphe de relations centré sur ${name}`,
    intro: (name: string, count: number) =>
      `Graphe de relations centré sur ${name} : ${count} liens. Flèches pour parcourir les liens, Échap pour quitter.`,
    centre: (name: string) => `Centre : ${name}.`,
    edge: (type: string, name: string) => `Lien ${type} avec ${name}`,
    derived: "lien dérivé de la hiérarchie AFRIK, non sourcé individuellement",
    sources: (count: number) => `${count} sources`,
    derivedAction: "Entrée pour en savoir plus sur ce lien dérivé.",
    edgeAction: "Entrée pour ouvrir le détail.",
    node: (name: string) =>
      `Nœud ${name}. Entrée pour naviguer vers cette page.`,
    overflow: (count: number) =>
      `+${count} autres liens, voir la liste complète.`,
  },
  derivedBadge: "dérivé",
};

type RelationsCopy = typeof fr;

// @req REQ-145
export const relationsCopy: Record<Language, RelationsCopy> = { fr };
