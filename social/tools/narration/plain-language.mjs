/**
 * The plain-language rule, made checkable.
 *
 * The operator stated it on 2026-09-09 (one idea per sentence, twenty words at
 * most, active voice) and restated it on 2026-09-21 after a narration that
 * followed none of it: every scene opens on subject, verb, complement — unless
 * it is a question — in short sentences a general audience can follow, many of
 * whom do not have French as a first language. Simple wording is also what
 * keeps a sourced claim from being read as another one.
 *
 * The doctrine lived in a guide outside the repository, so nothing enforced it
 * and the narration of « ethnie » broke it in every scene. This module checks
 * the three parts a program can see:
 *
 *   - a statement does not open on a complement, an adverb, a conjunction or an
 *     imperative verb (« En 1994, … », « Selon lui, … », « Aidez-nous … »);
 *   - a speech verb does not follow its quotation (« … , écrit-elle », « … , dit
 *     le Trésor »);
 *   - a sentence has at most twenty words of its own.
 *
 * It cannot see whether a sentence is *simple*; that stays with the author and
 * the operator's validation. A quotation cannot be rewritten, so the words
 * inside « … » are neither counted nor inspected.
 *
 * Pure functions of text, like `etat-pipeline/etat.mjs`, so the rule is tested
 * without the library.
 */

export const PLAFOND_MOTS = 20;

/** Folded lower-case first words that put a complement, an adverb or a
 * conjunction ahead of the subject. */
const OUVERTURES_REFUSEES = new Set([
  "a",
  "apres",
  "au",
  "aujourd'hui",
  "aux",
  "avant",
  "avec",
  "ainsi",
  "alors",
  "car",
  "cependant",
  "chez",
  "comme",
  "contre",
  "dans",
  "de",
  "depuis",
  "donc",
  "du",
  "en",
  "enfin",
  "ensuite",
  "entre",
  "et",
  "lorsque",
  "mais",
  "maintenant",
  "malgre",
  "ou",
  "page",
  "par",
  "parce",
  "parmi",
  "pendant",
  "pour",
  "pourtant",
  "puis",
  "quand",
  "sans",
  "selon",
  "si",
  "sous",
  "sur",
  "vers",
  "voici",
  "voila",
]);

/** Imperatives of the calls to action; an imperative has no subject. */
const IMPERATIFS = new Set([
  "aidez",
  "corrigez",
  "decouvrez",
  "ecrivez",
  "envoyez",
  "imaginez",
  "notez",
  "partagez",
  "participez",
  "proposez",
  "regardez",
  "signalez",
  "retrouvez",
  "sachez",
  "suivez",
]);

const VERBES_DE_PAROLE =
  "dit|ecrit|explique|affirme|note|declare|precise|ajoute|souligne";
const VERBE_INVERSE = new RegExp(
  `\\b(?:${VERBES_DE_PAROLE})-(?:t-)?(?:il|elle|on)\\b|,\\s*(?:${VERBES_DE_PAROLE})\\s+(?:le|la|l'|les|un|une)\\b`
);

function plier(texte) {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replaceAll("’", "'")
    .toLowerCase();
}

/**
 * Cuts one paragraph into sentences. A full stop inside « … » ends nothing; a
 * quotation that closes on a full stop ends the sentence it sits in.
 */
function decouperEnPhrases(paragraphe) {
  const phrases = [];
  let debut = 0;
  let profondeur = 0;
  for (let i = 0; i < paragraphe.length; i++) {
    const c = paragraphe[i];
    if (c === "«") profondeur++;
    else if (c === "»") profondeur = Math.max(0, profondeur - 1);
    const fin = i + 1 === paragraphe.length || /\s/.test(paragraphe[i + 1]);
    const terminaison = /[.?!…]/.test(c) && profondeur === 0 && fin;
    const citationTerminee =
      c === "»" &&
      profondeur === 0 &&
      fin &&
      /[.?!…]\s*»$/.test(paragraphe.slice(debut, i + 1));
    if (terminaison || citationTerminee) {
      phrases.push(paragraphe.slice(debut, i + 1).trim());
      debut = i + 1;
    }
  }
  const reste = paragraphe.slice(debut).trim();
  if (reste) phrases.push(reste);
  return phrases;
}

const sansCitations = (phrase) => phrase.replace(/«[^»]*»/g, "«…»");

function premierMot(phrase) {
  const mot = plier(sansCitations(phrase)).trim().split(/[\s]/)[0] ?? "";
  return mot
    .replace(/^[«"(]+/, "")
    .replace(/-.*$/, "")
    .replace(/[,;:]+$/, "");
}

function verifierPhrase(phrase) {
  const nues = sansCitations(phrase);
  const trouvailles = [];
  const question = /\?\s*$/.test(nues.replace(/«…»/g, ""));

  if (!question && !phrase.trimStart().startsWith("«")) {
    const mot = premierMot(phrase);
    if (OUVERTURES_REFUSEES.has(mot) || IMPERATIFS.has(mot)) {
      trouvailles.push({
        regle: "sujet-en-premier",
        detail: `« ${mot} » ouvre la phrase : mettre le sujet d'abord (sujet, verbe, complément)`,
      });
    }
  }

  if (VERBE_INVERSE.test(plier(nues))) {
    trouvailles.push({
      regle: "verbe-inverse",
      detail:
        "le verbe de parole suit sa citation : écrire « Elle écrit que… »",
    });
  }

  const mots = nues
    .replace(/«…»/g, " ")
    .split(/\s+/)
    .filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
  if (mots > PLAFOND_MOTS) {
    trouvailles.push({
      regle: "phrase-trop-longue",
      detail: `${mots} mots, ${PLAFOND_MOTS} au plus : couper en deux phrases`,
    });
  }
  return trouvailles;
}

/**
 * @param {string} narration the text of a `narration.fr.txt`, one scene per
 *   paragraph, paragraphs separated by a blank line
 * @returns {{paragraphe: number, phrase: string, regle: string, detail: string}[]}
 */
export function verifierNarration(narration) {
  const trouvailles = [];
  narration
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .forEach((paragraphe, index) => {
      for (const phrase of decouperEnPhrases(
        paragraphe.replace(/\s+/g, " ").trim()
      )) {
        for (const t of verifierPhrase(phrase)) {
          trouvailles.push({ paragraphe: index + 1, phrase, ...t });
        }
      }
    });
  return trouvailles;
}
