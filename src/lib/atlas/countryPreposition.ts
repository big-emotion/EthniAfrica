/**
 * The preposition a country name takes when it is where something is:
 * "en Éthiopie", "au Togo", "aux Comores", "à Madagascar".
 *
 * The people fiche's globe panel hard-coded "au", which reads as broken French
 * on every country that does not take it. PPL_AARI's one presence country is
 * Ethiopia, so its panel said "Aari au Éthiopie". The corpus reaches all 54
 * African countries, so no single form works.
 *
 * French settles this on gender, number and whether the name takes an article
 * at all — none of which a name's spelling reveals: "le Mozambique" and
 * "la Namibie" both end in a vowel. One part *is* mechanical, though: a
 * vowel-initial name takes "en" whatever its gender, because "au Angola"
 * cannot be said. So the rule below handles that, and the two sets carry only
 * what it cannot reach. Everything else is masculine and takes "au", which is
 * the African majority.
 *
 * Keyed by ISO code, never by the name, so a change to the admin-0 asset's
 * French wording cannot silently change a preposition.
 *
 * REQ-143, class 4: a grammatical particle is authored in code, never stored
 * as translated data.
 */

import type { TranslationLocale } from "@/lib/i18n/translationLocale";

/** No French country name in Africa begins with a mute h, so the rule is plain vowels. */
const VOWEL_INITIAL = /^[aeiouyàâéèêëîïôöûü]/i;

/** Names that take no article: "à Madagascar", "à Djibouti". */
const ARTICLELESS: ReadonlySet<string> = new Set([
  "MDG", // Madagascar
  "MUS", // Maurice
  "DJI", // Djibouti
  "STP", // Sao Tomé-et-Principe
]);

/** Plural names: "aux Comores", "aux Seychelles". */
const PLURAL: ReadonlySet<string> = new Set([
  "COM", // Comores
  "SYC", // Seychelles
]);

/**
 * Feminine names beginning with a consonant — the only case the vowel rule
 * cannot reach. Feminine names beginning with a vowel (Éthiopie, Érythrée,
 * Algérie, Égypte) already take "en" through it.
 */
const FEMININE_CONSONANT_INITIAL: ReadonlySet<string> = new Set([
  "CIV", // Côte d'Ivoire
  "GMB", // Gambie
  "GIN", // Guinée
  "GNB", // Guinée-Bissau
  "GNQ", // Guinée équatoriale
  "LBY", // Libye
  "MRT", // Mauritanie
  "NAM", // Namibie
  "SLE", // Sierra Leone
  "SOM", // Somalie
  "TZA", // Tanzanie
  "TUN", // Tunisie
  "ZMB", // Zambie
  "CAF", // République centrafricaine
  "COD", // République démocratique du Congo
]);

export type LocativePreposition = "en" | "au" | "aux" | "à";

/**
 * The particle alone, so a caller needing a different construction is not
 * forced through the joined form. `locale` is accepted for callers that still
 * pass one; French is the only locale published.
 */
// @req REQ-117
export function locativePreposition(
  countryId: string,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale: TranslationLocale = "fr"
): LocativePreposition {
  if (ARTICLELESS.has(countryId)) return "à";
  if (PLURAL.has(countryId)) return "aux";
  if (VOWEL_INITIAL.test(name)) return "en";
  if (FEMININE_CONSONANT_INITIAL.has(countryId)) return "en";
  return "au";
}

/** The country with the preposition it takes, e.g. "en Éthiopie". */
// @req REQ-117
export function inCountry(
  countryId: string,
  name: string,
  locale: TranslationLocale = "fr"
): string {
  return `${locativePreposition(countryId, name, locale)} ${name}`;
}
