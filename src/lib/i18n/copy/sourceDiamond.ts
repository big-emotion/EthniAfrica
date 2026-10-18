import type { SourceKindFamily } from "@/lib/sources/sourceKindFamily";
import type { Language } from "@/types/shared";

/**
 * The source diamond and its legend (ETNI-2015). The button's name carries the
 * source's own type, so a screen reader hears what the colour shows; the
 * legend names the colour families, which group several types each.
 *
 * The visible label agrees in number and never counts (brief 11 §3): a number
 * beside each passage would read as a score of its strength. The button's
 * name starts with that label, so a reader who says what they see reaches it
 * (WCAG 2.5.3).
 */
interface SourceDiamondCopy {
  label: (count: number) => string;
  open: (kind: string, others: number) => string;
  legendHeading: string;
  families: Record<SourceKindFamily, string>;
}

// @req REQ-198
export const sourceDiamondCopy: Record<Language, SourceDiamondCopy> = {
  fr: {
    label: (count) => (count === 1 ? "Source" : "Sources"),
    open: (kind, others) =>
      others === 0
        ? `Source : ${kind}, voir les sources`
        : `Sources : ${kind} et ${others} ${others === 1 ? "autre" : "autres"}, voir les sources`,
    legendHeading: "La couleur du losange indique le type de source",
    families: {
      oral: "Tradition orale ou communauté",
      book: "Livre ou étude",
      encyclopedia: "Encyclopédie",
      press: "Article de presse",
      report: "Rapport public",
      archive: "Archive",
      other: "Autre source",
    },
  },
};
