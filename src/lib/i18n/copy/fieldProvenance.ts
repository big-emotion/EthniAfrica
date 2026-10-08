import type { Language } from "@/types/shared";

const fr = {
  missingLabel: "Donnée manquante",
  missingReason: "Nous ne renseignons pas ce champ pour cette page.",
  derivedLabel: "Valeur dérivée",
  derivedFromPrefix: "Dérivée de : ",
};

type FieldProvenanceCopy = typeof fr;

// @req REQ-145
export const fieldProvenanceCopy: Record<Language, FieldProvenanceCopy> = {
  fr,
};
