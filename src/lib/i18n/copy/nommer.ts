import type { Language } from "@/types/shared";

const fr = {
  title: "Qui a donné ce nom ?",
  subtitle:
    "Les noms des peuples, des pays et des langues ont des histoires différentes. Certains ont été choisis par les personnes concernées, d’autres leur ont été donnés. Ce dossier suit ces histoires.",
  thesisStep: "Pour commencer",
  thesisHeading: "Trois nombres pour comprendre les fiches",
  dossierStep: "Le dossier",
  dossierHeading: "Cinq chapitres, cinq choses qu'on nomme",
  dossierIntro:
    "Les cinq chapitres explorent les noms des peuples, des pays, des personnes, des langues et des choses. Chaque cas aide à comprendre qui a choisi un nom et comment il a été repris.",
  limitsStep: "Les limites",
  limitsHeading: "Ce que ce dossier ne peut pas dire",
  undeclared: (undeclared: number, peoples: number) =>
    `${undeclared} fiches de peuple sur ${peoples} ne précisent pas si le nom est contesté ou hérité de la colonisation. Ce manque d’information ne signifie pas que le nom est accepté sans réserve.`,
  missingImposition:
    "Les fiches racontent l’origine des noms donnés de l’extérieur. Compter celles qui emploient le mot « administration » ne permet pas de savoir combien de noms une administration a imposés.",
  countryEtymologies:
    "Le classement des noms de pays repose sur un relevé dont les explications n’étaient pas accompagnées de sources. Le chapitre « Le pays » présente cette limite et les références ajoutées depuis.",
  doctrineAction: "Comprendre notre méthode",
  vocabularyStep: "Le vocabulaire",
  vocabularyHeading: (count: number) => `${count} mots expliqués`,
  vocabularyIntro:
    "Le glossaire explique les mots spécialisés que vous pouvez rencontrer dans les sources. Chaque définition est accompagnée d’un exemple, lorsque nos fiches en proposent un.",
  glossaryAction: (count: number) => `Ouvrir le glossaire — ${count} termes`,
  pejorativeName: "nom jugé méprisant dans les sources",
  otherChapters: "Les autres chapitres",
  backToDossier: "Revenir au dossier",
};

type NommerCopy = typeof fr;

// @req REQ-145
export const nommerCopy: Record<Language, NommerCopy> = { fr };

// @req REQ-113
export const nommerMeasuresCopy = {
  ratio: (ratio: number) => `${ratio} pour 1`,
  ratioClaim: (ratio: number) =>
    `Nos fiches recensent environ ${ratio} noms donnés de l'extérieur pour un nom utilisé par les peuples eux-mêmes.`,
  ratioProvenance: (external: string, selfGiven: string) =>
    `${external} noms donnés de l'extérieur et ${selfGiven} noms utilisés par les peuples eux-mêmes.`,
  share: (count: number, total: number) => `${count} sur ${total}`,
  contestedClaim:
    "Ces fiches décrivent un nom contesté ou hérité de la colonisation.",
  undeclared: (count: number) =>
    `${count} autres fiches ne donnent pas d'information sur ce point.`,
  countryClaim:
    "Ces pays portent un nom choisi ou rétabli par des Africains, selon notre lecture des fiches.",
  countryProvenance:
    "Ce classement vient d'une lecture de 54 fiches pays. Au moment du relevé, les explications de l'origine des noms n'étaient pas accompagnées de sources.",
} as const;
