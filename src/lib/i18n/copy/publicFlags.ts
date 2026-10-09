import { PRODUCT_NAME } from "@/lib/brand";
import type { Language } from "@/types/shared";

const fr = {
  title: "Tous les signalements",
  metadataTitle: `Tous les signalements — ${PRODUCT_NAME}`,
  metadataDescription:
    "Transparence éditoriale — explorez les signalements de la communauté",
  introduction:
    "Cette file publique rend visible le suivi éditorial des signalements transmis par la communauté.",
  queueLabel: "File publique des signalements",
  filters: {
    statuses: "Statuts",
    kinds: "Types de signalement",
    targets: "Cibles",
  },
  statuses: {
    open: "Ouvert",
    under_review: "En cours d’examen",
    accepted: "Accepté",
    rejected: "Rejeté",
    withdrawn: "Retiré",
    duplicate: "Doublon",
  },
  statusDescriptions: {
    open: "en cours — examen par l'équipe éditoriale",
    under_review: "en cours — examen par l'équipe éditoriale",
    accepted: "acceptée",
    rejected: "rejetée",
    duplicate: "doublon",
    withdrawn: "retirée",
  },
  remediation: {
    label: "Avancement de la correction",
    notStarted: {
      state: "Correction non encore publiée",
      body: (decidedOn: string) =>
        `Nous avons donné raison à cette remarque le ${decidedOn}. La page concernée n'a pas changé à ce jour.`,
    },
    inProgress: {
      state: "Correction en cours",
    },
    published: {
      state: (publishedOn: string) => `Corrigée le ${publishedOn}`,
      link: "Voir ce qui a changé",
    },
  },
  moderation: {
    responseLabel: "Réponse de la modération",
    signature: (decidedOn: string) =>
      `Modération ${PRODUCT_NAME} · ${decidedOn}`,
  },
  kinds: {
    inaccurate: "Information inexacte",
    "missing-source": "Source manquante",
    "broken-url": "URL brisée",
    offensive: "Contenu offensant",
    "correction-proposal": "Proposition de correction",
    other: "Autre",
  },
  targets: {
    assertion: "Information concernée",
    source: "Source",
    fiche_section: "Section de page",
    classification: "Classification",
    general: "Signalement général",
  },
  entities: {
    people: "Peuple",
    country: "Pays",
    language: "Langue",
    language_family: "Famille linguistique",
    source: "Source",
    fiche_section: "Section de page",
    classification: "Classification",
  },
  anonymous: "anonyme",
  loading: "Chargement des signalements…",
  loadError: "Impossible de charger les signalements.",
  empty: "aucun signalement ne correspond à ces filtres",
  reset: "réinitialiser",
  loadingMore: "Chargement…",
  retry: "Réessayer",
  loadMore: "Afficher plus de signalements",
};

type PublicFlagsCopy = typeof fr;

// @req REQ-145
export const publicFlagsCopy: Record<Language, PublicFlagsCopy> = { fr };
