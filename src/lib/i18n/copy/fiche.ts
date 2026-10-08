import type { Language } from "@/types/shared";

const fr = {
  contribute: "Contribuer",
  showMap: "Voir la carte",
  hideMap: "Masquer la carte",
  sourcesList: "La liste",
  languages: {
    main: "Langue principale",
    family: "Famille",
    dialects: "Parlers",
    vehicular: "Rôle véhiculaire",
    official: "Langue officielle",
    others: "Autres langues du pays",
    all: "Langues du pays",
    dialectCount: (count: number) =>
      `${count} ${count === 1 ? "parler" : "parlers"}`,
    languageCount: (count: number) =>
      `${count} ${count === 1 ? "langue" : "langues"}`,
  },
  culture: {
    rites: "Rites",
    symbols: "Symboles",
    arts: "Arts et musique",
    spiritualities: "Spiritualités",
    organisation: "Organisation",
    relations: "Relations",
    groups: "Groupes associés",
    religions: "Religions",
    lifestyles: "Modes de vie",
    traditions: "Traditions",
  },
  chronology: {
    label: "Chronologie",
    regime: {
      polity: "Précolonial",
      colonial: "Colonial",
      modern: "Contemporain",
    },
    groupedEntities: (count: number) => `${count} entités politiques`,
    since: (year: number) => `Depuis ${year}`,
    nameAtTheTime: "nom",
    territoryName: "Nom du territoire",
    etymology: "D'où vient le nom",
    otherNames: "Autres noms portés par le territoire",
    centres: "Centres",
  },
  tile: {
    more: "+ en savoir plus",
    less: "− replier",
  },
  amendable: {
    lead: "Vous connaissez un nom, une date ou une source que cette page n'a pas ? Elle est faite pour être complétée.",
    action: "Compléter cette page",
  },
  archivedCapture: (version: number) =>
    `Ce contenu est une capture archivée (v${version}) et ne sera jamais modifié.`,
  unreadableField:
    "Ce champ n'est pas lisible : la page l'a enregistré sous une forme que l'affichage ne sait pas rendre.",
  auditDisclaimer: {
    never: "page non auditée — lire avec précaution",
    stale: (date: string) => `dernière vérification : ${date} · à re-vérifier`,
    region: "avertissement vérification",
    close: "fermer l'avertissement",
  },
  onward: {
    title: "Poursuivre",
    kind: {
      people: "Peuple",
      country: "Pays",
      "language-family": "Famille linguistique",
      language: "Langue",
      name: "Patronyme",
    },
  },
  chapterBar: {
    aria: "Chapitres de la page",
    summary: "Sommaire",
    toggle: (title: string) => `Sommaire de la page — ${title}`,
    report: "Signaler",
  },
};

type FicheCopy = typeof fr;

// @req REQ-145
export const ficheCopy: Record<Language, FicheCopy> = { fr };
