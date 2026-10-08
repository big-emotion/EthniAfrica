import type { TranslationKind } from "@/lib/i18n/translationKind";
import type { Language } from "@/types/shared";

import type { DidYouKnowFact } from "./didYouKnowFacts";
import type { DidYouKnowIllustration } from "./didYouKnowIllustrations";

export type LocalizedDidYouKnowFact = DidYouKnowFact & {
  translationKind?: TranslationKind;
};

// The anecdotes are written in French, the one locale published, so a fact
// is its own localization. Kept as a seam until the callers stop passing a
// language.
// @req REQ-145
export function localizeDidYouKnowFact(
  fact: DidYouKnowFact,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language: Language
): LocalizedDidYouKnowFact {
  return fact;
}

// @req REQ-145
export function localizeDidYouKnowIllustration(
  id: string,
  illustration: DidYouKnowIllustration | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language: Language
): DidYouKnowIllustration | undefined {
  return illustration;
}
