import type { Language } from "@/types/shared";

const en = {
  title: "Cookie settings",
  description:
    "Your choices are kept in your browser’s local storage, not in a cookie. Essential functions are always on; audience measurement starts only if you agree.",
  dataPolicy: "Data policy",
  essential: "Essential cookies",
  essentialDescription: "Required — necessary for the site to work",
  analytics: "Analytics cookies",
  analyticsDescription: "Plausible — anonymous visit statistics, no cookie",
  save: "Save preferences",
  acceptAll: "Accept all",
  reject: "Reject",
  customise: "Customise",
};

type ConsentCopy = typeof en;

const fr: ConsentCopy = {
  title: "Gestion des cookies",
  description:
    "Vos choix sont conservés dans le stockage local de votre navigateur, et non dans un cookie. Les fonctions essentielles sont toujours actives ; la mesure d’audience ne démarre que si vous l’acceptez.",
  dataPolicy: "Politique de données",
  essential: "Cookies essentiels",
  essentialDescription: "Requis — nécessaires au fonctionnement du site",
  analytics: "Cookies analytiques",
  analyticsDescription:
    "Plausible — statistiques anonymes de visite, sans cookie",
  save: "Enregistrer mes préférences",
  acceptAll: "Accepter tout",
  reject: "Refuser",
  customise: "Personnaliser",
};

// @req REQ-145
export const consentCopy: Record<Language, ConsentCopy> = { en, fr };
