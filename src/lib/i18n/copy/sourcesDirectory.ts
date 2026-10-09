import type { Language } from "@/types/shared";

const fr = {
  description:
    "Retrouvez les sources utilisées sur le site. Chaque référence indique son type et les pages qui la citent.",
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
    `Chaque référence mène à une page qui présente la source et ses usages sur le site.`,
  provenanceNote: (withKind: string, total: string) =>
    `Le type n'est renseigné que pour ${withKind} sources sur ${total} : ` +
    `ce filtre affiche uniquement les références dont le type est déjà connu.`,
  empty: "Aucune source ne répond à cette sélection.",
  reset: "Revenir à toutes les sources",
  referenceBibliography: "La bibliographie de référence du projet",
};

type SourcesDirectoryCopy = typeof fr;

// @req REQ-141
export const sourcesDirectoryCopy: Record<Language, SourcesDirectoryCopy> = {
  fr,
};
