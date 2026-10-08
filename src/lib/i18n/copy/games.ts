import type { Language } from "@/types/shared";

const fr = {
  estimateCommit: "Valider mon estimation",
  estimateHint: "Faites glisser, puis validez.",
  correctVerdict: "Bonne réponse",
  incorrectVerdict: "Ce n'est pas ça",
  provenanceLabel: "D'après",
  openFiche: "Lire la page",
  openAtlas: "Parcourir",
  confidenceAriaSuffix: "pour le sujet de cette manche",
  yourEstimate: "Votre estimation :",
  nextRound: "Tour suivant",
  seeScore: "Voir le score",
  scoreHeading: "Partie terminée",
  scoreSeparator: "sur",
  scoreCaption: "réponses exactes",
  playAgain: "Rejouer",
  factsHeading: "Tout ce que la carte cachait",
  factEyebrow: "Ce que la carte cachait",
  corpusLimited:
    "Cette partie a été plus courte que prévu : les tracés ne fournissent pas encore assez de comparaisons trompeuses pour huit manches.",
  emptyCorpus:
    "Nous n’avons pas encore assez de pages pour composer un tour de ce jeu.",
  emptyCorpusHint:
    "Ce jeu s'ouvrira quand les pages correspondantes auront été publiées.",
  trueSizeHeading: "La taille réelle de l'Afrique",
  unResolution:
    "Le 4 septembre 2026, l'Assemblée générale des Nations unies a adopté par 164 voix contre une, portée par le Togo au nom du groupe africain et soutenue par l'Union africaine, une résolution appelant à corriger cette « minimisation symbolique » du continent et à préférer les projections qui respectent les surfaces, comme Equal Earth.",
  unSourceLabel: "ONU Info, 4 septembre 2026",
  continentGlobe: {
    missing: "Nous ne renseignons encore aucun peuple par pays.",
    fallback:
      "Carte de l'Afrique, à plat : ce navigateur ne peut pas afficher le globe.",
    wholeArea: "Tout le continent",
    areaNoun: "le continent",
  },
};

type GamesCopy = typeof fr;

// @req REQ-145
export const gamesCopy: Record<Language, GamesCopy> = { fr };
