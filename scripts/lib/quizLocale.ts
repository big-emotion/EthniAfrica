import {
  isTranslationLocale,
  type TranslationLocale,
} from "@/lib/i18n/translationLocale";

/**
 * Parses `--lang fr` and `--lang=fr`. The bank is French only; any other
 * value, `en` included, is refused rather than silently built in French.
 */
// @req REQ-145
export function parseLocaleArgument(args: string[]): TranslationLocale {
  const inline = args.find((arg) => arg.startsWith("--lang="));
  const flagIndex = args.indexOf("--lang");
  const value =
    inline?.slice("--lang=".length) ??
    (flagIndex >= 0 ? args[flagIndex + 1] : undefined) ??
    "fr";

  if (!isTranslationLocale(value)) {
    throw new Error(
      `generateQuizQuestions --lang must be fr; received ${JSON.stringify(value)}`
    );
  }
  return value;
}
