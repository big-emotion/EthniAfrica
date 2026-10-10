import type { Language } from "@/types/shared";

const fr = {
  title: "Découvertes",
  browse: "Parcourir",
  actions: "Actions de la découverte",
  context: "Sources et contexte",
  next: "Découverte suivante",
  previous: "Découverte précédente",
  details: "En savoir plus",
  of: "sur",
  image: "Photo :",
  imageUnavailable:
    "Photo indisponible. Le texte de la découverte reste accessible.",
  fact: "Saviez-vous que ?",
  proverb: "Proverbe",
  production: {
    nameQuestion: (name: string) => `D’où vient le nom « ${name} » ?`,
    posterAlt: (name: string) => `Couverture : D’où vient le nom « ${name} » ?`,
  },
  carousel: "Série",
  video: "Vidéo",
  videoLicences: {
    "public-domain": "Domaine public",
    cc0: "CC0",
    "cc-by": "CC BY 4.0",
    "cc-by-sa": "CC BY-SA 4.0",
  },
  carouselLabel: "Images de cette découverte",
  frame: "Image",
  playSound: "Écouter le son d’origine",
  muteSound: "Couper le son",
  soundUnavailable: "Aucun son disponible pour cette découverte.",
  close: "Fermer",
  sources: "Sources",
  atlas: "Nos fiches",
  readArticle: "Lire l'article",
  original: "Photo originale",
  licence: "Licence de la photo",
  keep: "Garder",
  kept: "Gardé",
  saved: "Mes découvertes",
  empty: "Aucune découverte gardée sur cet appareil.",
  temporary:
    "Gardée uniquement pendant cette visite : le stockage de cet appareil est indisponible.",
  share: "Partager",
  copy: "Copier le lien",
  copied: "Lien copié",
  copyFailed: "Copie impossible. Sélectionnez le lien ci-dessous.",
  shareFailed: "Partage indisponible ici. Vous pouvez copier le lien.",
  videoUnavailable:
    "Aucune vidéo compatible et autorisée n’est disponible pour cette publication. Son lien reste partageable.",
  mediaUnavailable:
    "Aucun export média validé n’est disponible pour cette publication. Son lien reste partageable.",
  linkAvailable: "Partager le lien",
  systemAvailable: "Partager avec une application compatible, si disponible",
  linkBadge: "Lien",
  videoBadge: "Vidéo indisponible",
  mediaBadge: "Média indisponible",
  systemBadge: "Selon l’appareil",
  systemChoice: "Autres applications",
  home: "Accueil",
  credits: {
    burkina: "Ouagadougou, 1930–1931 · W. Mittelholzer · Domaine public",
    guere: "Masque wè · Mickey Mystique · CC BY-SA 4.0",
  },
};

type DiscoveriesCopy = typeof fr;

// @req REQ-145
export const discoveriesCopy: Record<Language, DiscoveriesCopy> = { fr };
