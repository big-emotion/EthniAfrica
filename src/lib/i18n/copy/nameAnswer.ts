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
  problematicMark: string;
  /** Said when the atlas holds no such name at all. */
  unknownName: string;
  unknownNameBody: string;
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
  en: {
    eyebrow: "Where this name comes from",
    disambiguation: "Which one are you looking for?",
    appellations: "The names",
    appellationsLead: "The most common first. None of them is “the right one”.",
    origins: "Where they come from",
    selfGiven: "What the peoples call themselves",
    problem: "What these names raise",
    usageToday: "Who says what today",
    throughTime: "Through time",
    atlasHolds: "What we know",
    silences: "What we do not know yet",
    silencesLead: "A declared silence, not an oversight.",
    noDatedAttestation: "No dated attestation",
    noDatedAttestationBody:
      "The sources shown here do not yet date these forms.",
    invitation: "Have we got it wrong?",
    invitationBody:
      "If you know a source on any of these names, it will be read.",
    invitationAction: "Suggest a source",
    further: "Going further",
    yourSearch: "your search",
    selfGivenMark: "the name they give themselves",
    problematicMark: "contested form",
    unknownName: "We do not know this name.",
    unknownNameBody:
      "That is not an answer: it is a confession. If this name is yours, or one of a people, a language or a place you know, tell us. That is how our project grows.",
    noExactMatch: "No exact result for",
    searchUnavailable:
      "Search is temporarily unavailable. Try again in a moment.",
    browsePeoples: "Browse the peoples",
    browseFamilies: "The language families",
    conviction: "Several names can coexist.",
    convictionBody:
      "We state their usages, their contexts and any disputes: the one a people gives itself, the ones its neighbours give it, the one an administration wrote down one day.",
  },
  fr: {
    eyebrow: "D'où vient ce nom",
    disambiguation: "Lequel cherchez-vous ?",
    appellations: "Les appellations",
    appellationsLead: "Les plus communes d'abord. Aucune n'est « la bonne ».",
    origins: "D’où elles viennent",
    selfGiven: "Ce que les peuples se donnent",
    problem: "Ce que ces noms posent",
    usageToday: "Qui dit quoi, aujourd’hui",
    throughTime: "À travers le temps",
    atlasHolds: "Ce que nous savons",
    silences: "Ce que nous ne savons pas encore",
    silencesLead: "Un silence déclaré, pas un oubli.",
    noDatedAttestation: "Aucune attestation datée",
    noDatedAttestationBody:
      "Les sources présentées ici ne permettent pas encore de dater ces formes.",
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
