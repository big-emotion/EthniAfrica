import type { Language } from "@/types/shared";

/**
 * The quiz surface's own dictionary.
 *
 * Its own file rather than a branch of the façade because the play island is
 * budgeted: it ships under 15 KB gzipped (scripts/quiz-bundle-size.ts), and
 * importing the whole site dictionary for thirty labels once broke that
 * budget on +0.58 KB of unrelated copy. The island reads this module only.
 */
const fr = {
  autonymQuestion: (name: string) =>
    `Quel nom emploie pour se désigner le peuple appelé ${name} ?`,
  navLabel: "Quiz",
  pageTitle: "Sur quoi veux-tu jouer ?",
  pageSubtitle:
    "Un pays, une famille de langues, un sujet — ou tout le continent. Huit questions à chaque fois.",
  scopeThemeHeading: "Un sujet",
  scopeCountryHeading: "Un pays",
  scopeFamilyHeading: "Une famille de langues",
  scopeCountryHint:
    "Touchez un pays : les sujets qu'il peut remplir se déplient.",
  scopeThemePanelHint: "Choisissez un sujet, ou jouez le pays entier.",
  scopeThemePanelNoTheme: "Jouer sans thème",
  scopeMixedHint:
    "Huit questions sur les peuples présentés dans nos fiches, des plus connus à ceux sur lesquels nous avons moins d'informations.",
  scopeRandomHint: "Huit questions au hasard, sans ordre de difficulté.",
  leaveSession: "Quitter le quiz",
  seeScoreCard: "Voir la carte de score",
  comingSoon:
    "les questions de cette sélection arrivent — les fiches correspondantes sont en cours de vérification",
  validate: "Valider",
  questionProgressPrefix: "question",
  questionProgressSeparator: "sur",
  correctVerdict: "Bonne réponse !",
  incorrectVerdict: "Ce n'est pas ça",
  correctAnswerLabel: "Réponse : ",
  openSourceChain: "Ouvrir la chaîne de sources",
  nextQuestion: "Question suivante",
  seeScore: "Voir le score",
  loadingSession: "Chargement de la session…",
  emptySession: "Aucune question disponible sur ce sujet — réessaie plus tard.",
  backToPicker: "Choisir autre chose",
  sessionError:
    "Impossible de charger cette session — réessaie dans un instant.",
  scoreHeading: "Score",
  scoreFractionSeparator: "bonnes réponses sur",
  playAgain: "Rejouer",
  scoreCardExactAnswersSeparator: "réponses exactes sur",
  fichesEncounteredLabel: "Fiches rencontrées",
  shareScoreLabel: "Partager le score",
  copiedFeedback: "copié",
  ogSourcedLine: "chaque réponse est sourcée",
};

type QuizCopy = typeof fr;

// @req REQ-145
export const quizCopy: Record<Language, QuizCopy> = { fr };
