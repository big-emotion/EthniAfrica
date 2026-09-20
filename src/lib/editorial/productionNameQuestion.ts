import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import type { Language } from "@/types/shared";

// @req REQ-180
export function formatProductionNameQuestion(
  name: string,
  language: Language
): string {
  return discoveriesCopy[language].production.nameQuestion(name.trim());
}

// @req REQ-180
export function formatProductionPosterAlt(
  name: string,
  language: Language
): string {
  return discoveriesCopy[language].production.posterAlt(name.trim());
}
