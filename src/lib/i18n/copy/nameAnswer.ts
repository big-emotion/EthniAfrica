import type { Language } from "@/types/shared";

/**
 * The result page's own words, block by block.
 *
 * Every heading the grammar of REQ-178 names, plus the three things the atlas
 * owes its reader whatever the corpus holds. The conviction is the only entry
 * that is not a label: it is one sentence chosen by the case, drawn from the
 * published doctrine on the About page, and it closes every result page rather
 * than only the rich ones.
 *
 * **No scholarly word reaches this surface** — not _exonyme_, not _endonyme_,
 * not _étymologie_, not _corpus_. A reader who wants the vocabulary meets it on
 * a fiche or in the glossary. The first draft of the boards broke that rule in
 * a sentence lifted straight out of a curator field, which is where the charter
 * rule "a corpus field is never copied onto this page, it is translated" comes
 * from.
 */

export interface NameAnswerCopy {
  eyebrow: string;
  /** The link after a subject's answer; the kind tells two same-named subjects apart. */
  answerFiche: (kind: string) => string;
  /** Expand and collapse a long list of names in place. */
  showMoreNames: (count: number) => string;
  showFewerNames: string;
  /** Movement II, in the grammar's order. */
  disambiguation: string;
  appellations: string;
  appellationsLead: string;
  origins: string;
  selfGiven: string;
  problem: string;
  usageToday: string;
  throughTime: string;
  atlasHolds: string;
  /** Movement III. */
  silences: string;
  silencesLead: string;
  invitation: string;
  invitationBody: string;
  invitationAction: string;
  further: string;
  /** The searched form, marked in the list without being promoted. */
  yourSearch: string;
  selfGivenMark: string;
  problematicMark: string;
  /** Said when the atlas holds no such name at all. */
  unknownName: string;
  unknownNameBody: string;
  /**
   * Said instead of the confession when no entity answers to the word but we
   * made a piece on it: the confession would be a claim about what we hold that
   * the piece next to it contradicts.
   */
  wordName: string;
  wordNameBody: string;
  /**
   * The near-miss case, which the boards keep separate from the confession: a
   * search whose spelling missed is not a name the atlas lacks, and saying so
   * spares the reader a confession that is not owed to them.
   */
  noExactMatch: string;
  browsePeoples: string;
  browseFamilies: string;
  /**
   * Said when the request never reached the corpus. It is deliberately not an
   * confession: the atlas may well hold this name, and only the search failed.
   */
  searchUnavailable: string;
  /** The closing conviction, and the line that keeps it honest. */
  conviction: string;
  convictionBody: string;
}

// @req REQ-178
export const nameAnswerCopy: Record<Language, NameAnswerCopy> = {
  fr: {
    eyebrow: "D'où vient ce nom",
    answerFiche: (kind) => `Voir la fiche · ${kind}`,
    showMoreNames: (count) =>
      `Afficher ${count === 1 ? "l’autre appellation" : `les ${count} autres appellations`}`,
    showFewerNames: "Réduire",
    disambiguation: "Lequel cherchez-vous ?",
    appellations: "Les appellations",
    appellationsLead:
      "Le nom que chaque peuple se donne d'abord, puis les autres. Aucune n'est « la bonne ».",
    origins: "D’où elles viennent",
    selfGiven: "Ce que les peuples se donnent",
    problem: "Ce que ces noms posent",
    usageToday: "Qui dit quoi, aujourd’hui",
    throughTime: "À travers le temps",
    atlasHolds: "Ce que nous savons",
    silences: "Ce que nous ne savons pas encore",
    silencesLead: "Un silence déclaré, pas un oubli.",
    invitation: "Nous nous sommes trompés ?",
    invitationBody:
      "Si vous connaissez une source sur l’un de ces noms, elle sera lue.",
    invitationAction: "Proposer une source",
    further: "Aller plus loin",
    yourSearch: "votre recherche",
    selfGivenMark: "le nom qu’ils se donnent",
    problematicMark: "forme contestée",
    unknownName: "Nous ne connaissons pas ce nom.",
    unknownNameBody:
      "Ce n’est pas une réponse : c’est un aveu. Si ce nom est le vôtre, ou celui d’un peuple, d’une langue ou d’un lieu que vous connaissez, dites-le-nous. C’est comme ça que notre projet grandit.",
    wordName:
      "Nous n’avons pas de fiche pour ce nom, mais nous avons une vidéo sur son origine.",
    wordNameBody:
      "Elle est ci-dessous. Si vous connaissez une source sur ce mot, dites-le-nous. C’est comme ça que notre projet grandit.",
    noExactMatch: "Aucun résultat exact pour",
    searchUnavailable:
      "La recherche est momentanément indisponible. Réessayez dans un instant.",
    browsePeoples: "Parcourir les peuples",
    browseFamilies: "Les familles de langues",
    conviction: "Plusieurs noms peuvent coexister.",
    convictionBody:
      "Nous précisons leurs usages, leurs contextes et les éventuelles contestations : celui qu’un peuple se donne, ceux que ses voisins lui donnent, celui qu’une administration a écrit un jour.",
  },
};
