import type { Language } from "@/types/shared";

const fr = {
  description:
    "Notre bibliographie : chaque source sur laquelle reposent les pages, son type et ce qui la cite.",
  sorts: {
    titre: "Titre",
    annee: "Année, la plus récente d'abord",
    ajout: "Date d’ajout, le plus récent d'abord",
  },
  labels: {
    search: "Rechercher une source",
    searchPlaceholder: "Titre ou auteur",
    provenance: "Type de source",
    anyProvenance: "Tous les types",
    decade: "Décennie",
    anyDecade: "Toutes les décennies",
    sort: "Trier par",
    activeSort: "Tri",
  },
  selection: (total: string, singular: boolean) =>
    `${total} ${singular ? "source" : "sources"} dans cette sélection. ` +
    `Chacune mène à sa page, qui dit ce qui la cite.`,
  provenanceNote: (withKind: string, total: string) =>
    `Le type n'est renseigné que pour ${withKind} sources sur ${total} : ` +
    `filtrer dessus ne montre pas l'état de notre projet, seulement ce qui a déjà été qualifié.`,
  empty: "Aucune source ne répond à cette sélection.",
  reset: "Revenir à toutes les sources",
  referenceBibliography: "La bibliographie de référence du projet",
};

type SourcesDirectoryCopy = typeof fr;

// @req REQ-141
export const sourcesDirectoryCopy: Record<Language, SourcesDirectoryCopy> = {
  fr,
};
