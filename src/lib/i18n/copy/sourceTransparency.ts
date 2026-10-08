import type { Language } from "@/types/shared";

const fr = {
  verifyBadge: {
    label: "source à vérifier",
    reason: "URL de la source injoignable depuis au moins 7 jours consécutifs.",
  },
  sourceChain: {
    title: "Chaîne des sources",
    description:
      "Détails de l'assertion, niveau de confiance et sources vérifiables.",
    position: "Position",
    confidence: "Niveau de confiance",
    confidenceSummary: (count: number, auditedAt: string | null) =>
      `Calculé à partir de ${count} source${count > 1 ? "s" : ""}${
        auditedAt
          ? ` · dernier audit humain le ${auditedAt}`
          : " · jamais audité par un humain"
      }.`,
    openReports: (count: number) =>
      `${count} signalement${count > 1 ? "s" : ""} ouvert${
        count > 1 ? "s" : ""
      } sur cette assertion.`,
    sources: "Sources",
    reviewedNarratives: "Récits oraux relus",
    unconfirmedIntro:
      "Ces sources ne sont pas encore confirmées. Notre travail est de faire remonter celles qui se rapprochent le plus de ce que les peuples ont vécu.",
    viewInBibliography: "Voir dans la bibliographie",
    brokenLink: (date: string) => `lien non résolu — signalé le ${date}`,
    reportSource: "Signaler cette source",
    revisionHistory: "Voir l'historique des révisions",
    reportProblem: "Signaler un problème",
    citeAssertion: "Citer cette assertion",
  },
  pinnedVersion: {
    regionLabel: "indicateur de version figée",
    live: "voir la version vivante",
    liveAfterCorrections: "voir version vivante",
    title: "Version figée",
    dated: (date: string) => ` du ${date}`,
    corrections: (count: number) =>
      `Depuis cette version figée, ${count} ${count === 1 ? "assertion a" : "assertions ont"} été corrigée${count === 1 ? "" : "s"}`,
    expand: "développer l’indicateur de version figée",
    collapse: "réduire l’indicateur de version figée",
  },
};

type SourceTransparencyCopy = typeof fr;

// @req REQ-145
export const sourceTransparencyCopy: Record<Language, SourceTransparencyCopy> =
  {
    fr,
  };
