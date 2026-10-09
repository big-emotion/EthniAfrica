import type { Language } from "@/types/shared";

const fr = {
  home: {
    title: "L'accueil",
    blurb:
      "EthniAfrica s'ouvre par l'intention, pas par le sommaire : chercher, comprendre ou jouer déplie ses modules sur l'accueil même, et le clic suivant est le module.",
    label: "Accueil",
    note: "Le globe et les trois axes.",
  },
  corpus: {
    title: "Parcourir, dans l'ordre AFRIK",
    hub: ["Parcourir", "L'axe et ses six entrées."],
    blurb:
      "Famille linguistique → langue → peuple → pays. C'est la hiérarchie même de notre projet, et chaque page se lit depuis celle du dessus. Les appellations et les noms la traversent : ils nomment, ils ne situent pas.",
    families: [
      "Familles linguistiques",
      "Le premier niveau : 25 familles, chacune avec ses langues.",
    ],
    languages: [
      "Langues",
      "748 langues, chacune rattachée à sa famille linguistique.",
    ],
    peoples: [
      "Peuples",
      "789 pages, rattachées à leur famille et à leurs pays.",
    ],
    countries: [
      "Pays",
      "54 pages, chacune listant les peuples qui l'habitent.",
    ],
    names: [
      "Noms",
      "30 systèmes de nommage des personnes, distincts des appellations d'un peuple.",
    ],
    search: [
      "Recherche libre",
      "Quand on sait ce qu'on cherche et pas où le trouver.",
    ],
    compare: ["Comparer", "Mettre deux entités du même type côte à côte."],
  },
  dossiers: {
    title: "Articles",
    blurb:
      "Les sujets de nos vidéos et de nos carrousels, développés par écrit, avec leurs références.",
    all: "Tous les articles",
    nommerTitle: "Qui a donné ce nom ?",
    nommerNote: "Le dossier fondateur, et ses cinq chapitres.",
    names: [
      "Appellations",
      "Les noms employés par les peuples et ceux que d’autres leur donnent.",
    ],
    migrations: [
      "Premiers repères de migrations",
      "Six événements sourcés, pas une frise de trois millénaires.",
    ],
    colonization: "Regards : colonisation et résistances",
    doctrine: [
      "Comment nous travaillons",
      "Les trois questions posées à un nom, et comment nous traitons les sources, les désaccords et les corrections.",
    ],
  },
  play: {
    title: "Jouer",
    hub: ["Jouer", "L'axe et ses parties."],
    blurb:
      "Chaque partie est tirée de nos fiches : gagner suppose d'avoir lu quelque chose, jamais d'avoir deviné.",
    quiz: "Le quiz",
  },
  contribute: {
    title: "Participer",
    blurb:
      "Notre projet est ouvert et incomplet, et il le dit. Les deux portes par lesquelles on le corrige.",
    contribution: [
      "Contribuer",
      "Proposer une page, une source, une correction.",
    ],
    reports: [
      "Signalements",
      "Les erreurs signalées et leur traitement, en public.",
    ],
  },
  site: {
    title: "Le site",
    blurb: "Qui publie, sous quelles règles, et comment lire les données.",
    about: "À propos",
    glossary: [
      "Glossaire",
      "Les mots avec lesquels nous nommons, définis une fois.",
    ],
    sources: ["Sources", "La bibliographie qui documente notre projet."],
    api: ["API publique v2", "Nos contenus en JSON, sous licence ouverte."],
    contact: ["Contact", "Écrire à l'équipe qui publie EthniAfrica."],
    accessibility: "Accessibilité",
    legal: "Mentions légales",
    data: "Politique de données",
    sitemap: "Plan du site",
  },
};

type SiteTreeCopy = typeof fr;

// @req REQ-145
export const siteTreeCopy: Record<Language, SiteTreeCopy> = { fr };
