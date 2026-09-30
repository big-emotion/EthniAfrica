import type { Language } from "@/types/shared";

/**
 * What the confidence chip says. It states a reference count and the date a
 * person last reviewed those references, and nothing about how likely the claim
 * is to be true: a percentage beside a claim reads as its odds, and « vérifié »
 * reads as a guarantee (audit findings T04, T02).
 */
interface ConfidenceChipCopy {
  references: (count: number) => string;
  pill: (references: string, isoDate: string) => string;
  openSources: (references: string, longDate: string) => string;
  viewSources: string;
}

// @req REQ-019
export const confidenceChipCopy: Record<Language, ConfidenceChipCopy> = {
  en: {
    references: (count) =>
      `${count} ${count === 1 ? "reference" : "references"}`,
    pill: (references, isoDate) => `${references} · reviewed ${isoDate}`,
    openSources: (references, longDate) =>
      `open the source chain for this assertion (${references}, last reviewed on ${longDate})`,
    viewSources: "view sources",
  },
  fr: {
    references: (count) =>
      `${count} ${count === 1 ? "référence" : "références"}`,
    pill: (references, isoDate) => `${references} · revu ${isoDate}`,
    openSources: (references, longDate) =>
      `ouvrir la chaîne de sources pour cette assertion (${references}, dernière relecture le ${longDate})`,
    viewSources: "voir les sources",
  },
};
