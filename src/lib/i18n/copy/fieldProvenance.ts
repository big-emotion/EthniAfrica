import type { Language } from "@/types/shared";

const fr = {
  missingLabel: "Information manquante",
  missingReason: "Cette information n’est pas renseignée sur cette page.",
  derivedLabel: "Information obtenue à partir d’autres données",
  derivedFromPrefix: "À partir de : ",
};

type FieldProvenanceCopy = typeof fr;

// @req REQ-145
export const fieldProvenanceCopy: Record<Language, FieldProvenanceCopy> = {
  fr,
};
