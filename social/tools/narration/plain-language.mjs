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
 *   - a sentence has at most twenty words of its own;
 *   - a sentence does not lead with a scholar, an author or a book (see
 *     `AUTORITES`): the peoples speak, the source goes on a card, after.
 *
 * It cannot see whether a sentence is *simple*, nor every way of hiding behind
 * a name (a surname alone passes); that stays with the author and
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
  "d'apres",
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

/**
 * An authority or a document put in front of what peoples say.
 *
 * Operator ruling of 2026-09-28: the narration says what the peoples call each
 * other, and the linguist, the author or the book that documents it goes on a
 * source card, after. Leading with them makes the sentence's authority the
 * reference instead of the subject. The source is still owed; only its place
 * moves. Citing a book proves neither that people were asked nor that they
 * were not, so nothing here infers either. A lexical check, on purpose: it
 * catches the shapes that were shipped (« Un livre de 1912 le montre »,
 * « Le linguiste X publie… »), not every way of hiding behind a name.
 *
 * A scholar or a document is refused as the *source* of a statement, never as
 * an *actor* in the history of a name or as the *subject* of the sentence:
 * « Un linguiste européen inscrit la langue dans un catalogue en 1934 » says
 * who named, and « Ce livre raconte la vie de son auteur » is about the book.
 * So either is flagged only when the sentence also carries a verb of speech or
 * knowledge (« écrit », « pense », « note »…) or opens with « selon » /
 * « d'après » in front of it. That cannot tell a book that *describes* from a
 * book that is the subject of a reading tip; such a sentence is refused until
 * a reviewer records why in a review (`appliquerRevues`), never bypassed.
 */
const NOMS_DOCUMENT =
  "livres?|ouvrages?|articles?|dictionnaires?|etudes?|manuels?|theses?";
const NOMS_SAVANT =
  "linguistes?|philologues?|ethnologues?|anthropologues?|historiens?|historiennes?|chercheu(?:rs?|ses?)|universitaires?|savants?|lexicographes?|auteurs?|autrices?";
const DOCUMENTS = new RegExp(`\\b(?:${NOMS_DOCUMENT})\\b`);
const SAVANTS = new RegExp(`\\b(?:${NOMS_SAVANT})\\b`);
const OUVERTURE_ATTRIBUEE = new RegExp(
  `^(?:selon|d'apres)\\s+(?:l'|(?:le|la|les|ce|cet|cette|un|une|des)\\s+)?(?:${NOMS_DOCUMENT}|${NOMS_SAVANT})\\b`
);
const PAROLE_DU_SAVANT =
  /\b(?:ecri(?:t|vent)|not(?:e|ent)|pens(?:e|ent)|montr(?:e|ent)|affirm(?:e|ent)|expliqu(?:e|ent)|relev(?:e|ent)|rapport(?:e|ent)|decri(?:t|vent)|publi(?:e|ent)|estim(?:e|ent)|propos(?:e|ent)|soutien(?:t|nent)|dit|disent|remarqu(?:e|ent)|observ(?:e|ent)|constat(?:e|ent)|considere(?:nt)?|jug(?:e|ent)|attribu(?:e|ent))\b/;

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
export function decouperEnPhrases(paragraphe) {
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

  const plie = plier(nues);
  const autorite =
    plie.trimStart().match(OUVERTURE_ATTRIBUEE) ??
    (PAROLE_DU_SAVANT.test(plie)
      ? (plie.match(DOCUMENTS) ?? plie.match(SAVANTS))
      : null);
  if (autorite) {
    trouvailles.push({
      regle: "attribution-en-tete",
      detail: `« ${autorite[0]} » met une autorité devant ce que disent les peuples : dire directement ce que les peuples disent, la source va sur la carte de source, après`,
    });
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

/**
 * Sets aside the findings a reviewer has explicitly accepted, and nothing else.
 *
 * A lexical rule cannot decide whether a book is the subject of a sentence or
 * an authority put in front of it, so an ambiguous case is accepted only by an
 * entry naming the exact sentence, the rule and a written reason. An entry with
 * no reason blocks nothing, and an entry that no longer matches a sentence is
 * reported as stale: a review must not outlive the text it was written for.
 *
 * @param {ReturnType<typeof verifierNarration>} trouvailles
 * @param {{phrase: string, regle: string, raison: string}[]} revues
 */
export function appliquerRevues(trouvailles, revues = []) {
  const valides = [];
  const invalides = [];
  for (const revue of revues) {
    const complete =
      revue.phrase &&
      revue.regle &&
      typeof revue.raison === "string" &&
      revue.raison.trim();
    (complete ? valides : invalides).push(revue);
  }

  const utilisees = new Set();
  const bloquantes = [];
  const acceptees = [];
  for (const trouvaille of trouvailles) {
    const index = valides.findIndex(
      (revue) =>
        revue.phrase === trouvaille.phrase && revue.regle === trouvaille.regle
    );
    if (index === -1) {
      bloquantes.push(trouvaille);
    } else {
      utilisees.add(index);
      acceptees.push({ ...trouvaille, raison: valides[index].raison });
    }
  }
  const perimees = valides.filter((_, index) => !utilisees.has(index));
  return { bloquantes, revues: acceptees, invalides, perimees };
}
