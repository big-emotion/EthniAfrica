import type { Language } from "@/types/shared";

const fr = {
  loading: {
    about: "Chargement de la présentation",
    accessibility: "Chargement de la déclaration d'accessibilité",
    legalNotice: "Chargement des mentions légales",
    dataPolicy: "Chargement de la politique de données",
  },
  forbidden: {
    title: "Accès non autorisé",
    body: "Cette ressource nécessite un rôle que votre compte n'a pas encore.",
    home: "Retour à l'accueil",
    signOut: "Se déconnecter",
  },
  notFound: {
    title: "Page introuvable",
    body: "Cette adresse ne mène à rien. La page a peut-être changé de nom, ou n'est pas encore publiée.",
    search: "Rechercher une page",
    report: "Signaler une URL cassée",
    reportSubject: "URL cassée",
  },
  error: {
    title: "Une erreur est survenue",
    body: "Une erreur inattendue s'est produite. Vous pouvez réessayer ou contacter le support avec la référence ci-dessous.",
    copy: "Copier la référence",
    copied: "Copié",
    retry: "Réessayer",
    anecdote: "Le saviez-vous ?",
  },
  empty: {
    searchHint: "Vérifiez l'orthographe ou parcourez par famille linguistique.",
    browseFamilies: "Parcourir les familles linguistiques",
    retry: "Réessayer",
  },
};

type SystemStatesCopy = typeof fr;

// @req REQ-145
export const systemStatesCopy: Record<Language, SystemStatesCopy> = { fr };
