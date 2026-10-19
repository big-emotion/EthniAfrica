/**
 * Letters Unicode decomposition does not split, folded to the Latin letter a
 * reader types in their place (REQ-135). Lower case only: the fold lowers
 * first, and every capital of these letters lowers to its small letter.
 *
 * It is the table `afrik_name_key` applies in the database (migration 109):
 * `extensions.unaccent` folds ɓ ɗ ɛ ŋ ʋ ƴ ɖ ɨ, and the key adds ɔ and drops
 * ʿ ʾ. A letter the database folds and this table does not would let « Fulbe »
 * answer in one layer and not in the other. ɣ, the click letters and ː stay as
 * they are in both: they name a sound no Latin letter stands for.
 */
const UNSPLIT_LETTERS: Readonly<Record<string, string>> = {
  ɓ: "b",
  ɗ: "d",
  ɛ: "e",
  ɔ: "o",
  ŋ: "n",
  ʋ: "v",
  ƴ: "y",
  ɖ: "d",
  ɨ: "i",
  ʿ: "",
  ʾ: "",
};

const UNSPLIT_LETTER = new RegExp(
  `[${Object.keys(UNSPLIT_LETTERS).join("")}]`,
  "gu"
);

/**
 * The comparison fold: what the reader typed and every stored form are
 * compared under it, never shown in it. It drops case, every combining mark
 * (Latin accents, and the Arabic vowel signs some forms carry) and folds the
 * letters above. Apostrophes are kept, unlike `afrik_unaccent`.
 */
// @req REQ-002
// @req REQ-135
export const normalizeString = (str: string | undefined | null): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(UNSPLIT_LETTER, (letter) => UNSPLIT_LETTERS[letter]);
};

/**
 * Convertit un nom en clé camelCase normalisée pour les URLs
 * Exemples:
 * - "Adja & apparentés" → "adjaApparentes"
 * - "Afrique du Sud" → "afriqueDuSud"
 * - "Chokwe & Lunda" → "chokweLunda"
 * - "Ambundu (Mbundu)" → "ambunduMbundu"
 */
// @req REQ-002
export const normalizeToKey = (name: string): string => {
  if (!name) return "";

  // Normaliser: enlever accents, convertir en minuscules
  let normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // Remplacer les caractères spéciaux par des espaces
  normalized = normalized
    .replace(/[&/()]/g, " ") // &, /, parenthèses → espace
    .replace(/[^\w\s-]/g, " ") // Autres caractères spéciaux → espace
    .replace(/\s+/g, " ") // Multiples espaces → un seul
    .trim();

  // Convertir en camelCase
  const words = normalized.split(" ").filter((word) => word.length > 0);
  if (words.length === 0) return "";

  // Premier mot en minuscule, autres avec première lettre majuscule
  const camelCase = words
    .map((word, index) => {
      if (index === 0) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");

  return camelCase;
};
