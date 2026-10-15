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
  // Brief 3 (approved 2026-10-15): the corpus codes, said in French.
  vehicularRoleLabel: {
    vehicular: "Langue commune entre groupes",
    non_vehicular: "Pas employée comme langue commune entre groupes",
    national_official: "Langue nationale ou officielle",
    regional_lingua_franca: "Langue commune à plusieurs régions",
  } as Record<string, string>,
  vitalityLabel: {
    International: "Internationale",
    National: "Nationale",
    Provincial: "Provinciale",
    "Wider Communication": "De communication élargie",
    Educational: "Enseignée",
    Developing: "En développement",
    Vigorous: "Vigoureuse",
    Threatened: "Menacée",
    Shifting: "En recul",
    Moribund: "Moribonde",
    "Nearly Extinct": "Presque éteinte",
    Dormant: "Dormante",
    Extinct: "Éteinte",
    Institutional: "Institutionnelle",
  } as Record<string, string>,
  vitalityLine: (status: string, scale: string, asOf: number) =>
    `${status} · échelle ${scale}, ${asOf}`,
  vitalitySilence: (name: string) =>
    `La vitalité du ${name} n’est pas encore renseignée dans le projet.`,
  dialectsSilence: (name: string) =>
    `Les dialectes du ${name} ne sont pas encore renseignés dans le projet.`,
  sharedName: (people: string, name: string) =>
    `Une langue et un peuple sont deux choses différentes. « ${people} » désigne ici l’ensemble des gens qui parlent le ${name}, et non un peuple au sens strict. Cette confusion entre langue et peuple fait partie de l’histoire du nom.`,
};

type LanguageFicheCopy = typeof fr;

// @req REQ-145
export const languageFicheCopy: Record<Language, LanguageFicheCopy> = {
  fr,
};
