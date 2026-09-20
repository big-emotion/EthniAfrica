import type { Language } from "@/types/shared";

const en = {
  namedBy: "by",
  roleOnly: "on a dedicated server operated on the publisher’s behalf",
};

type LegalHostCopy = typeof en;

const fr: LegalHostCopy = {
  namedBy: "par",
  roleOnly: "sur un serveur dédié exploité pour le compte de l’éditeur",
};

// @req REQ-088
export const legalHostCopy: Record<Language, LegalHostCopy> = { en, fr };
