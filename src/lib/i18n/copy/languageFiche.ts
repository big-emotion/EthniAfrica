import type { Language } from "@/types/shared";

const fr = {
  identifiers: "Identifiants",
  otherAttestedNames: "Autres noms attestés",
  languageFamily: "Famille linguistique",
  speakers: "Personnes qui parlent cette langue",
  dialects: "Dialectes",
  vehicularRole: "Rôle véhiculaire",
  vitality: "Vitalité",
  sources: "Sources",
  eyebrow: "Langue",
  majorityVote: "vote majoritaire des sources",
};

type LanguageFicheCopy = typeof fr;

// @req REQ-145
export const languageFicheCopy: Record<Language, LanguageFicheCopy> = {
  fr,
};
