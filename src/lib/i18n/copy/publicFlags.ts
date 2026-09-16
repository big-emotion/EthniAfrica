import { PRODUCT_NAME } from "@/lib/brand";
import type { Language } from "@/types/shared";

const en = {
  title: "All reports",
  metadataTitle: `All reports — ${PRODUCT_NAME}`,
  metadataDescription:
    "Editorial transparency — browse the reports sent in by the community",
  introduction:
    "This public queue makes visible the editorial follow-up of the reports sent in by the community.",
  queueLabel: "Public queue of reports",
  filters: {
    statuses: "Statuses",
    kinds: "Report types",
    targets: "Targets",
  },
  statuses: {
    open: "Open",
    under_review: "Under review",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    duplicate: "Duplicate",
  },
  /**
   * The disposition axis: what the atlas thinks of the remark, and nothing
   * about the corpus. `accepted` used to read "accepted · page updated", which
   * asserted a correction the moderator's click never produced.
   */
  statusDescriptions: {
    open: "in progress — editorial review",
    under_review: "in progress — editorial review",
    accepted: "accepted",
    rejected: "rejected",
    duplicate: "duplicate",
    withdrawn: "withdrawn",
  },
  /** The remediation axis: what changed in the corpus, and when. */
  remediation: {
    label: "Corpus state",
    notStarted: {
      state: "Correction not yet published",
      body: (decidedOn: string) =>
        `The atlas agreed with this report on ${decidedOn}. The page it concerns has not changed to date.`,
    },
    inProgress: {
      state: "Correction under way",
    },
    published: {
      state: (publishedOn: string) => `Corrected on ${publishedOn}`,
      link: "See what changed",
    },
  },
  /**
   * The report page already quotes the reporter. Without a label the
   * moderator's answer is a second quoted block, and nothing tells the reader
   * which one is the atlas speaking.
   */
  moderation: {
    responseLabel: "Moderation response",
    signature: (decidedOn: string) =>
      `${PRODUCT_NAME} moderation · ${decidedOn}`,
  },
  kinds: {
    inaccurate: "Inaccurate information",
    "missing-source": "Missing source",
    "broken-url": "Broken URL",
    offensive: "Offensive content",
    "correction-proposal": "Proposed correction",
    other: "Other",
  },
  targets: {
    assertion: "Assertion",
    source: "Source",
    fiche_section: "Page section",
    classification: "Classification",
    general: "General report",
  },
  entities: {
    people: "People",
    country: "Country",
    language: "Language",
    language_family: "Language family",
    source: "Source",
    fiche_section: "Page section",
    classification: "Classification",
  },
  anonymous: "anonymous",
  loading: "Loading the reports…",
  loadError: "The reports could not be loaded.",
  empty: "no report matches these filters",
  reset: "reset",
  loadingMore: "Loading…",
  retry: "Try again",
  loadMore: "Show more reports",
};

type PublicFlagsCopy = typeof en;

const fr: PublicFlagsCopy = {
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
    label: "État du corpus",
    notStarted: {
      state: "Correction non encore publiée",
      body: (decidedOn: string) =>
        `L'atlas a donné raison à cette remarque le ${decidedOn}. La page concernée n'a pas changé à ce jour.`,
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
    assertion: "Assertion",
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

// @req REQ-145
export const publicFlagsCopy: Record<Language, PublicFlagsCopy> = { en, fr };
