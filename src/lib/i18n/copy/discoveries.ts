import type { Language } from "@/types/shared";

const en = {
  title: "Discoveries",
  introduction: "A sourced fact, an image, then another view of Africa.",
  next: "Next discovery",
  previous: "Previous discovery",
  details: "Learn more",
  of: "of",
  image: "Photo:",
  imageUnavailable: "Photo unavailable. The discovery text remains accessible.",
  fact: "Did you know?",
  close: "Close",
  sources: "Sources",
  atlas: "In the atlas",
  original: "Original photo",
  licence: "Photo licence",
  keep: "Keep",
  kept: "Kept",
  saved: "My discoveries",
  empty: "No discoveries kept on this device.",
  temporary: "Kept only during this visit: device storage is unavailable.",
  share: "Share",
  copy: "Copy link",
  copied: "Link copied",
  copyFailed: "Copy failed. Select the link below.",
  shareFailed: "Sharing is unavailable here. You can copy the link.",
  videoUnavailable:
    "No cleared compatible video is available for this publication. Its link can still be shared.",
  mediaUnavailable:
    "No approved media export is available for this publication. Its link can still be shared.",
  linkAvailable: "Share the link",
  systemAvailable: "Share with a compatible app, if available",
  linkBadge: "Link",
  videoBadge: "Video unavailable",
  mediaBadge: "Media unavailable",
  systemBadge: "Device dependent",
  systemChoice: "Other apps",
  home: "Home",
  referenced: "Referenced source",
  official: "Official source",
  credits: {
    burkina: "Ouagadougou, 1930–1931 · W. Mittelholzer · Public domain",
    guere: "Wè mask · Mickey Mystique · CC BY-SA 4.0",
  },
};

type DiscoveriesCopy = typeof en;

const fr: DiscoveriesCopy = {
  title: "Découvertes",
  introduction:
    "Un fait sourcé, une image, puis un autre regard sur l’Afrique.",
  next: "Découverte suivante",
  previous: "Découverte précédente",
  details: "En savoir plus",
  of: "sur",
  image: "Photo :",
  imageUnavailable:
    "Photo indisponible. Le texte de la découverte reste accessible.",
  fact: "Saviez-vous que ?",
  close: "Fermer",
  sources: "Sources",
  atlas: "Dans l’atlas",
  original: "Photo originale",
  licence: "Licence de la photo",
  keep: "Conserver",
  kept: "Conservé",
  saved: "Mes découvertes",
  empty: "Aucune découverte conservée sur cet appareil.",
  temporary:
    "Conservation uniquement pendant cette visite : le stockage de cet appareil est indisponible.",
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
  referenced: "Source référencée",
  official: "Source officielle",
  credits: {
    burkina: "Ouagadougou, 1930–1931 · W. Mittelholzer · Domaine public",
    guere: "Masque wè · Mickey Mystique · CC BY-SA 4.0",
  },
};

// @req REQ-145
export const discoveriesCopy: Record<Language, DiscoveriesCopy> = { en, fr };
