import type { SourceKindFamily } from "@/lib/sources/sourceKindFamily";
import type { Language } from "@/types/shared";

/**
 * The source diamond and its legend (ETNI-2015). The button's name carries the
 * source's own type, so a screen reader hears what the colour shows; the
 * legend names the colour families, which group several types each.
 */
interface SourceDiamondCopy {
  open: (kind: string, others: number) => string;
  legendHeading: string;
  families: Record<SourceKindFamily, string>;
}

// @req REQ-198
export const sourceDiamondCopy: Record<Language, SourceDiamondCopy> = {
  fr: {
    open: (kind, others) =>
      others === 0
        ? `Source : ${kind} — voir les sources`
        : `Sources : ${kind} et ${others} ${others === 1 ? "autre" : "autres"} — voir les sources`,
    legendHeading: "La couleur du losange indique le type de source",
    families: {
      oral: "Tradition orale ou communauté",
      book: "Livre ou étude",
      press: "Article de presse",
      report: "Rapport public",
      archive: "Archive",
      other: "Autre source",
    },
  },
};
