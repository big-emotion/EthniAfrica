import type { Language } from "@/types/shared";

const fr = {
  title: "Qui a donné ce nom ?",
  subtitle:
    "Nous nommons huit cents peuples, cinquante-quatre pays et vingt-quatre familles de langues. Presque aucun de ces noms n'a été choisi par ceux qu'il désigne.",
  thesisStep: "La thèse",
  thesisHeading: "Trois nombres, avant tout le reste",
  dossierStep: "Le dossier",
  dossierHeading: "Cinq chapitres, cinq choses qu'on nomme",
  dossierIntro:
    "Un peuple, un pays, une personne, une langue, une chose. Chaque chapitre est un régime de dénomination différent, et le dernier existe parce que les quatre premiers laisseraient croire que la question ne concerne que les peuples.",
  limitsStep: "Les limites",
  limitsHeading: "Ce que ce dossier ne peut pas dire",
  undeclared: (undeclared: number, peoples: number) =>
    `${undeclared} pages de peuple sur ${peoples} ne déclarent aucun statut de classification. Elles ne sont pas jugées non problématiques : elles n’ont pas été examinées. C’est un chantier ouvert, et le taire derrière un pourcentage reviendrait à le compter comme un résultat.`,
  missingImposition:
    "Nous enregistrons l'origine d'un exonyme en prose libre, jamais comme une valeur. On peut compter les pages qui emploient le mot « administration » ; on ne peut pas compter les noms qu'une administration a imposés.",
  countryEtymologies:
    "Les étymologies des cinquante-quatre pays sont renseignées ici et adossées à aucune source : le chapitre « Le pays » les présente comme une lecture, jamais comme une mesure.",
  doctrineAction: "Lire la doctrine éditoriale",
  vocabularyStep: "Le vocabulaire",
  vocabularyHeading: (count: number) => `${count} mots, définis une fois`,
  vocabularyIntro:
    "Endonyme, exonyme, glossonyme, réification ethnique : ce dossier emploie des mots que le site affichait sans les définir nulle part. Le glossaire les tient, chacun avec un exemple pris dans nos fiches — ou avec la raison pour laquelle nous n’en avons pas.",
  glossaryAction: (count: number) => `Ouvrir le glossaire — ${count} termes`,
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
