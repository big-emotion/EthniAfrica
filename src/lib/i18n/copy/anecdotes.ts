import type {
  DidYouKnowEntityKind,
  DidYouKnowTier,
} from "@/lib/home/didYouKnowFacts";
import type { Language } from "@/types/shared";

const fr = {
  homeEyebrow: "Saviez-vous que",
  homeMore: "Lire d'autres anecdotes",
  pageTitle: "Anecdotes",
  pageSubtitle:
    "Des noms d'Afrique pris un par un : qui les a donnés, quand, et ce qu'ils recouvraient.",
  pageKicker: "Chaque nom a été donné par quelqu'un",
  empty: "Aucune anecdote n'est publiée pour le moment.",
  savedCount: (count: number) =>
    `${count} anecdote${count > 1 ? "s" : ""} retenue${count > 1 ? "s" : ""} sur cet appareil`,
  entityLabels: {
    people: "Peuple",
    country: "Pays",
    family: "Famille linguistique",
  } satisfies Record<DidYouKnowEntityKind, string>,
  tierLabels: {
    official: "Source officielle",
    referenced: "Source référencée",
    unverified: "Source non vérifiée",
  } satisfies Record<DidYouKnowTier, string>,
  file: "fichier",
  licence: "licence",
  factReliability: "Fiabilité du fait",
  missingProvenance:
    "Provenance à documenter — ce fait est antérieur au champ de sources.",
  nextAnnouncement: (headline: string) => `Anecdote suivante : ${headline}`,
  previousAnnouncement: (headline: string) =>
    `Anecdote précédente : ${headline}`,
  next: "Anecdote suivante",
  previous: "Anecdote précédente",
  sourceLead: "Source\u00a0:",
  marked: "Anecdote retenue",
  mark: "Cette anecdote est intéressante",
  share: "Partager",
  dispute: "Je conteste cette anecdote",
  linkCopied: "Lien copié",
  copyLink: "Copier le lien",
};

type AnecdotesCopy = typeof fr;

// @req REQ-145
export const anecdotesCopy: Record<Language, AnecdotesCopy> = { fr };
