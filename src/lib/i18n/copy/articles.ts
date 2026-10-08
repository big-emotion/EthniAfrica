import type { Language } from "@/types/shared";

/**
 * Every word the article listing and the article page say around the text.
 *
 * The article's own title, body and sources come from the article bank; this
 * dictionary holds only the frame. The empty and the failed catalogue are two
 * different sentences on purpose: a read that failed must never tell the
 * reader there is nothing to read.
 */
const fr = {
  listing: {
    pageTitle: "Articles",
    pageSubtitle:
      "Chaque article part d'une de nos publications et développe son sujet par écrit, avec les sources sur lesquelles il repose.",
    listLabel: "Tous les articles",
    collectionsLabel: "Aussi dans cette rubrique",
    collections: {
      anecdotes: "Anecdotes",
      proverbs: "Proverbes",
    },
    empty:
      "Aucun article n'est encore publié. Les anecdotes et les proverbes sont déjà ouverts.",
    failed:
      "Les articles n'ont pas pu être chargés. Cela ne veut pas dire qu'il n'y en a pas : réessayez dans un instant.",
    retry: "Réessayer",
    pagerLabel: "Pages des articles",
    previous: "Précédent",
    next: "Suivant",
    pageOf: (current: number, total: number) => `Page ${current} sur ${total}`,
    formats: {
      video: "Vidéo",
      carousel: "Carrousel",
    },
  },
  article: {
    byline: (author: string) => `Par ${author}`,
    publishedOn: (date: string) => `Publié le ${date}`,
    modifiedOn: (date: string) => `Mis à jour le ${date}`,
    skipToText: "Aller au texte",
    mediaLabel: "La publication d'origine",
    formatSwitchLabel: "Choisir le format",
    originalsTitle: "Voir la publication d'origine",
    originalPostedOn: (date: string) => `publiée le ${date}`,
    networks: {
      youtube: "YouTube",
      tiktok: "TikTok",
      instagram: "Instagram",
      facebook: "Facebook",
      linkedin: "LinkedIn",
      x: "X",
    },
    mediaUnavailable:
      "La publication n'a pas pu s'afficher ici. L'article complet se lit ci-dessous.",
    transcriptTitle: "Transcription",
    credits: (credits: string) => `Crédits : ${credits}`,
    correctionTitle: "Note de correction",
    citedBy: "Sources de cette partie",
    sourceMarker: (position: number) => `Source ${position}`,
    referencesTitle: "Sources consultées",
    relatedTitle: "À lire aussi",
    contribute: "Corriger ou compléter cet article",
    backToArticles: "Tous les articles",
  },
  carousel: {
    label: "Carrousel",
    slideLabel: (position: number, total: number) =>
      `Image ${position} sur ${total}`,
    position: (position: number, total: number) => `${position} / ${total}`,
    previous: "Image précédente",
    next: "Image suivante",
    enlarge: "Agrandir l'image",
    close: "Fermer l'image agrandie",
    slideTextTitle: "Le texte des images",
  },
};

type ArticlesCopy = typeof fr;

// @req REQ-114
export const articlesCopy: Record<Language, ArticlesCopy> = { fr };
