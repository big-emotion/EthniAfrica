import type { Language } from "@/types/shared";

const fr = {
  verifyBadge: {
    label: "source à vérifier",
    reason:
      "Le lien vers cette source ne fonctionne plus depuis au moins 7 jours.",
  },
  sourceChain: {
    title: "Sources de cette information",
    description:
      "Consultez les sources et les vérifications associées à cette information.",
    position: "Position",
    openReports: (count: number) =>
      `${count} signalement${count > 1 ? "s" : ""} ouvert${
        count > 1 ? "s" : ""
      } sur cette information.`,
    sources: "Sources",
    reviewedNarratives: "Récits oraux relus",
    viewInBibliography: "Consulter la référence complète",
    brokenLink: (date: string) => `lien inaccessible, signalé le ${date}`,
    reportSource: "Signaler cette source",
    revisionHistory: "Voir les modifications précédentes",
    reportProblem: "Signaler un problème",
    citeAssertion: "Citer cette information",
  },
  doctrineLink: {
    action: "Comprendre notre méthode",
    descriptions: {
      "endonymes-vs-exonymes":
        "Cette fiche distingue les noms que les personnes emploient pour se nommer et ceux que d’autres leur donnent. Notre méthode explique comment nous les présentons.",
      "classifications-contestees":
        "Les chercheurs ne regroupent pas tous ces peuples ou ces langues de la même façon. Nous expliquons les choix retenus et les désaccords.",
      "heritage-colonial":
        "Ce nom est lié à la période coloniale. Nous le conservons pour raconter son histoire et expliquer les questions qu’il pose.",
      "topics-sensibles":
        "Ce sujet peut toucher à l’identité ou à l’histoire des personnes concernées. Notre méthode explique comment nous utilisons les sources et présentons les désaccords.",
    },
  },
  pinnedVersion: {
    regionLabel: "informations sur cette version enregistrée",
    live: "voir la version à jour",
    liveAfterCorrections: "voir la version à jour",
    title: "Version enregistrée",
    dated: (date: string) => ` du ${date}`,
    corrections: (count: number) =>
      `Depuis cette version enregistrée, ${count} ${count === 1 ? "information a" : "informations ont"} été corrigée${count === 1 ? "" : "s"}`,
    expand: "afficher les détails de cette version",
    collapse: "masquer les détails de cette version",
  },
};

type SourceTransparencyCopy = typeof fr;

// @req REQ-145
export const sourceTransparencyCopy: Record<Language, SourceTransparencyCopy> =
  {
    fr,
  };
