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
  noDatedAttestation: string;
  noDatedAttestationBody: string;
  invitation: string;
  invitationBody: string;
  invitationAction: string;
  further: string;
  /** The searched form, marked in the list without being promoted. */
  yourSearch: string;
  selfGivenMark: string;
  /** Said when the atlas holds no such name at all. */
  unknownName: string;
  unknownNameBody: string;
  /** The closing conviction, and the line that keeps it honest. */
  conviction: string;
  convictionBody: string;
}

// @req REQ-178
export const nameAnswerCopy: Record<Language, NameAnswerCopy> = {
  en: {
    eyebrow: "Where this name comes from",
    disambiguation: "Which one are you looking for?",
    appellations: "The appellations",
    appellationsLead: "The most common first. None of them is “the right one”.",
    origins: "Where they come from",
    selfGiven: "What the peoples call themselves",
    problem: "What these names raise",
    usageToday: "Who says what today",
    throughTime: "Through time",
    atlasHolds: "What the atlas does hold",
    silences: "What the atlas does not say",
    silencesLead: "A declared silence, not an oversight.",
    noDatedAttestation: "No dated attestation",
    noDatedAttestationBody:
      "The atlas does not date any of these forms: we do not know since when each one has been written.",
    invitation: "Have we got it wrong?",
    invitationBody:
      "If you know a source on any of these names, it will be read.",
    invitationAction: "Suggest a source",
    further: "Going further",
    yourSearch: "your search",
    selfGivenMark: "the name they give themselves",
    unknownName: "We do not know this name.",
    unknownNameBody:
      "That is not an answer: it is a confession. If this name is yours, or one of a people, a language or a place you know, tell us. That is how the atlas grows.",
    conviction: "None of these names is false.",
    convictionBody:
      "They simply do not come from the same place: the one a people gives itself, the ones its neighbours give it, the one an administration wrote down one day.",
  },
  fr: {
    eyebrow: "D’où vient ce nom",
    disambiguation: "Lequel cherchez-vous ?",
    appellations: "Les appellations",
    appellationsLead: "Les plus communes d’abord. Aucune n’est « la bonne ».",
    origins: "D’où elles viennent",
    selfGiven: "Ce que les peuples se donnent",
    problem: "Ce que ces noms posent",
    usageToday: "Qui dit quoi, aujourd’hui",
    throughTime: "À travers le temps",
    atlasHolds: "Ce que l’atlas tient",
    silences: "Ce que l’atlas ne dit pas",
    silencesLead: "Un silence déclaré, pas un oubli.",
    noDatedAttestation: "Aucune attestation datée",
    noDatedAttestationBody:
      "L’atlas ne date aucune de ces formes : on ne sait pas depuis quand chacune est écrite.",
    invitation: "Nous nous sommes trompés ?",
    invitationBody:
      "Si vous connaissez une source sur l’un de ces noms, elle sera lue.",
    invitationAction: "Proposer une source",
    further: "Aller plus loin",
    yourSearch: "votre recherche",
    selfGivenMark: "le nom qu’ils se donnent",
    unknownName: "Nous ne connaissons pas ce nom.",
    unknownNameBody:
      "Ce n’est pas une réponse : c’est un aveu. Si ce nom est le vôtre, ou celui d’un peuple, d’une langue ou d’un lieu que vous connaissez, dites-le-nous. C’est comme ça que l’atlas grandit.",
    conviction: "Aucun de ces noms n’est faux.",
    convictionBody:
      "Ils ne viennent simplement pas du même endroit : celui qu’un peuple se donne, ceux que ses voisins lui donnent, celui qu’une administration a écrit un jour.",
  },
};
