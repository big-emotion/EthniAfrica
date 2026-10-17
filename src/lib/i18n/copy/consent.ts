import type { Language } from "@/types/shared";

const fr = {
  title: "Gestion des cookies",
  // The strip's first layer: the three facts of the data policy a reader
  // needs before answering (brief 12 part C).
  strip:
    "Avec votre accord, nous mesurons les visites, les pages lues et les mots cherchés. Ces mots sont affichés sur un tableau de bord public. Cette mesure ne dépose aucun cookie.",
  description:
    "Vos choix sont conservés dans le stockage local de votre navigateur, et non dans un cookie. Les fonctions essentielles sont toujours actives ; la mesure d’audience ne démarre que si vous l’acceptez.",
  dataPolicy: "Politique de données",
  essential: "Cookies essentiels",
  essentialDescription: "Requis — nécessaires au fonctionnement du site",
  analytics: "Cookies analytiques",
  analyticsDescription:
    "Plausible — statistiques anonymes de visite, sans cookie",
  embeds: "Lecture de vidéos tierces",
  embedsDescription:
    "YouTube — le lecteur n’est chargé, et YouTube ne reçoit votre adresse IP, que si vous lancez une vidéo",
  save: "Enregistrer mes préférences",
  acceptAll: "Accepter",
  reject: "Refuser",
  customise: "Personnaliser",
};

type ConsentCopy = typeof fr;

// @req REQ-145
export const consentCopy: Record<Language, ConsentCopy> = { fr };
