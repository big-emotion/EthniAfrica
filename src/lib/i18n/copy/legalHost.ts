import type { Language } from "@/types/shared";

const fr = {
  namedBy: "par",
  roleOnly: "sur un serveur dédié exploité pour le compte de l’éditeur",
};

type LegalHostCopy = typeof fr;

// @req REQ-088
export const legalHostCopy: Record<Language, LegalHostCopy> = { fr };
