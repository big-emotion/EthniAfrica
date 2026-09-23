/**
 * The narration template of a reel « D'où vient le nom X ? », made checkable.
 *
 * One skeleton for the five kinds of subject (peuple, pays, patronyme, lieu,
 * langue), and nothing outside it: a text that adds a scene, drops one, lists
 * a fifth name or rewords a fixed sentence is refused. The operator wanted every
 * reel to carry the same structure at the same level of information, so the fixed
 * sentences are matched, not merely suggested.
 *
 * The scenes, one paragraph each, in this order:
 *
 *   ouverture · inventaire · [variantes] · blocs (inner names first, then outer
 *   names) · classement · synthèse · clôture
 *
 * The block of an inner name (endonym) is the one that carries the group's own
 * language and its own explanation; every outer name (exonym) is measured
 * against it with one of three fixed gap sentences. The words in the fixed
 * sentences are the operator's decision of 2026-09-21; the human-readable
 * template, with a worked example per type, is
 * `.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md`.
 *
 * What a program cannot see stays with the author and the operator: whether a
 * meaning is right, whether a source holds, whether a sentence is simple.
 */
import { decouperEnPhrases, verifierNarration } from "./plain-language.mjs";

export const TYPES = ["peuple", "pays", "patronyme", "lieu", "langue"];

/** Same text for voice and card, every reel (GABARITS-SOCIAL.md §7 ter). */
export const CLOTURE_UNIQUE =
  "Notre objectif : raconter l'origine des noms, avec des sources. Vous avez une histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica.";

export const PLAFOND_SCENES = 10;
export const PLAFOND_PHRASES_BLOC = 8;
export const PLAFOND_EXPLICATIONS = 2;
export const PLAFOND_PHRASES_SYNTHESE = 3;

/**
 * A patronyme has a second, distinct story: not which form is original, but
 * what a jamu-like institution transmits — affiliation, founding narratives,
 * the manner of transmission, as opposed to a documented individual descent.
 * Decided by the operator 2026-09-23, on the Traoré (PAT_TRAORE) research: the
 * comparison skeleton above cannot carry that argument without inventing an
 * etymology or a form the sources do not give. A second, sibling skeleton,
 * not a rewrite of the first — `TYPES` and the comparison path are unchanged.
 *
 * The dispatch is structural, not a flag: a `patronyme` narration whose
 * synthesis scene starts with this fixed sentence is read against this
 * skeleton instead (`gabarit-reel-nom.md`, « Le patronyme a deux cas »).
 *
 * Revised the same day, on the same subject: the first wording (« Nous
 * devons donc distinguer quatre questions… ») tested clean on the checkers
 * but read as a lecture to an audience the operator described as reading for
 * pleasure, not as specialists — a plain-language problem the tooling here
 * cannot see (`ordonner()` only checks sentence shape, never register). This
 * wording keeps the one guardrail that actually matters structurally — a
 * name does not prove a single ancestor — and drops the four-way taxonomy's
 * own vocabulary (étymologie, généalogie, filiations) rather than explain it.
 */
export const SYNTHESE_METHODE_QUATRE_QUESTIONS =
  "Un nom de famille peut donc venir de plusieurs choses. Il peut venir du sens d'un mot, d'une histoire racontée, ou d'un lien créé entre deux familles. Un seul nom ne prouve pas un seul ancêtre, ni une seule origine.";
export const PLAFOND_SCENES_TRANSMISSION = 12;
export const PLANCHER_CAS_TRANSMISSION = 2;
const RESERVE_EPISTEMIQUE =
  /\bnous ne\b|\bn'établi\w*|\bne (?:fournit|permet(?:tent)?|suffit|rend|pouvons|peut)\b|\baucune source\b|\bne confirme\b|\bne d[ée]montr\w*/i;
/**
 * Dispatch reads the anchor sentence, not the whole fixed paragraph: a typo
 * in the synthesis must still land on this skeleton, with its own named
 * finding, rather than silently fall through to the comparison one and
 * report unrelated errors about forms and endonyms.
 */
const ANCRE_SYNTHESE_METHODE =
  "Un nom de famille peut donc venir de plusieurs choses.";
const NOMBRES = { deux: 2, trois: 3, quatre: 4 };
const MOTS_DU_NOMBRE = { 2: "deux", 3: "trois", 4: "quatre" };

/**
 * A patronyme has no inner and outer names: its axis is the form of origin
 * against the forms the civil registry made of it, hence a vocabulary of its own.
 */
const VOCABULAIRE = {
  peuple: { referents: ["peuple"], verbe: "porte", formes: "noms" },
  pays: { referents: ["pays"], verbe: "porte", formes: "noms" },
  lieu: {
    referents: ["lieu", "ville", "région"],
    verbe: "porte",
    formes: "noms",
  },
  langue: { referents: ["langue"], verbe: "porte", formes: "noms" },
  patronyme: {
    referents: ["nom de famille"],
    verbe: "prend",
    formes: "formes",
  },
};

const ETIQUETTES_INTERIEUR = new Set([
  "l'endonyme",
  "un endonyme",
  "aussi un endonyme",
  "la forme d'origine",
]);
const ETIQUETTES_EXTERIEUR = new Set(["un exonyme", "une forme transformée"]);
const ETIQUETTES_PAR_TYPE = (type) =>
  type === "patronyme"
    ? new Set(["la forme d'origine", "une forme transformée"])
    : new Set(["l'endonyme", "un endonyme", "aussi un endonyme", "un exonyme"]);

const OUVREUR_DE_BLOC =
  /^(.+) est (l'endonyme|un endonyme|aussi un endonyme|un exonyme|la forme d'origine|une forme transformée)\.$/;
const VARIANTES = /s'écrit|pose(?:nt)? un problème/;
const LANGUE_DU_GROUPE = /^Ce nom vient de (?:la|leur|sa) langue/;
const EXPLICATION_LOCALE = /\bexpliquent?\b[^.]*\bainsi\b/;
const SILENCE_LOCAL = "Nous n'avons pas encore leur explication.";
const ECART = /\bdit (?:la même|autre) chose qu(?:e |')/;
const EXPLICATION_OU_PISTE =
  /\b(?:piste|y voit|y voient)\b|\bexpliquent?\b[^.]*\bainsi\b/;

const normaliser = (texte) => texte.replaceAll("’", "'");
const phrasesDe = (paragraphe) =>
  decouperEnPhrases(paragraphe.replace(/\s+/g, " ").trim());
const trouvaille = (paragraphe, regle, detail) => ({
  paragraphe,
  regle,
  detail,
});
const noms = (liste) => liste.split(/, | et /).map((n) => n.trim());
const memesNoms = (a, b) =>
  a.length === b.length && a.every((nom, i) => nom === b[i]);

function verifierOuverture(paragraphe, numero, type, nbInterieur) {
  const vocab = VOCABULAIRE[type];
  const trouvailles = [];
  const phrases = phrasesDe(paragraphe);
  if (phrases.length !== 4) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-ouverture",
        `l'ouverture compte quatre phrases (question, une même…, endonyme, exonymes) : ${phrases.length} trouvée(s)`
      )
    );
  }
  const [question, definition, interieur, exterieur] = phrases;

  if (!question || !question.endsWith("?")) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-ouverture",
        "la première phrase est une question"
      )
    );
  }
  const refs = vocab.referents.join("|");
  const attendue = new RegExp(
    `^(?:Un|Une) même (?:${refs}) ${vocab.verbe} toujours plusieurs ${vocab.formes}\\.$`
  );
  if (!definition || !attendue.test(definition)) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-ouverture",
        `deuxième phrase attendue : « Un même ${vocab.referents[0]} ${vocab.verbe} toujours plusieurs ${vocab.formes}. »`
      )
    );
  }

  if (type === "patronyme") {
    if (interieur !== "Nous cherchons la forme de la langue d'origine.") {
      trouvailles.push(
        trouvaille(
          numero,
          "gabarit-ouverture",
          "troisième phrase attendue : « Nous cherchons la forme de la langue d'origine. »"
        )
      );
    }
    if (
      exterieur !==
      "L'état civil en a créé d'autres, et certaines sont devenues plus courantes."
    ) {
      trouvailles.push(
        trouvaille(
          numero,
          "gabarit-ouverture",
          "quatrième phrase attendue : « L'état civil en a créé d'autres, et certaines sont devenues plus courantes. »"
        )
      );
    }
    return trouvailles;
  }

  if (nbInterieur === 1) {
    if (
      !interieur ||
      !/^Un seul vient d.+ : c'est l'endonyme, le nom de l'intérieur\.$/.test(
        interieur
      )
    ) {
      trouvailles.push(
        trouvaille(
          numero,
          "gabarit-ouverture",
          "un seul endonyme : « Un seul vient de … : c'est l'endonyme, le nom de l'intérieur. »"
        )
      );
    }
  } else {
    const plusieurs = interieur?.match(
      /^Ici, (?:il|elle) en emploie (deux|trois|quatre), selon .+ : ce sont des endonymes, les noms de l'intérieur\.$/
    );
    if (!plusieurs || NOMBRES[plusieurs[1]] !== nbInterieur) {
      trouvailles.push(
        trouvaille(
          numero,
          "gabarit-ouverture",
          `${MOTS_DU_NOMBRE[nbInterieur] ?? nbInterieur} endonymes : « Ici, il en emploie ${MOTS_DU_NOMBRE[nbInterieur] ?? "…"}, selon … : ce sont des endonymes, les noms de l'intérieur. »`
        )
      );
    }
  }
  if (
    !exterieur ||
    !/^Les autres viennent d'ailleurs : ce sont des exonymes, et certains sont plus connus que /.test(
      exterieur
    )
  ) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-ouverture",
        "quatrième phrase attendue : « Les autres viennent d'ailleurs : ce sont des exonymes, et certains sont plus connus que … »"
      )
    );
  }
  return trouvailles;
}

function verifierInventaire(paragraphe, numero, type) {
  const vocab = VOCABULAIRE[type];
  const refs = vocab.referents.join("|");
  const forme = new RegExp(
    `^(?:Ce|Cette) (?:${refs}) porte (deux|trois|quatre) ${vocab.formes} : (.+)\\.$`
  );
  const phrases = phrasesDe(paragraphe);
  const lu = phrases.length === 1 ? forme.exec(phrases[0]) : null;
  if (!lu) {
    return {
      noms: [],
      trouvailles: [
        trouvaille(
          numero,
          "gabarit-inventaire",
          `forme attendue : « Ce ${vocab.referents[0]} porte trois ${vocab.formes} : A, B et C. » (deux à quatre ${vocab.formes})`
        ),
      ],
    };
  }
  const liste = noms(lu[2]);
  const trouvailles = [];
  if (liste.length !== NOMBRES[lu[1]]) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-inventaire",
        `${lu[1]} ${vocab.formes} annoncés, ${liste.length} listés`
      )
    );
  }
  if (new Set(liste).size !== liste.length) {
    trouvailles.push(
      trouvaille(numero, "gabarit-inventaire", "un nom est listé deux fois")
    );
  }
  return { noms: liste, trouvailles };
}

function verifierBloc(paragraphe, numero, type, ouvreur) {
  const trouvailles = [];
  const phrases = phrasesDe(paragraphe);
  const interieur = ETIQUETTES_INTERIEUR.has(ouvreur.etiquette);

  if (phrases.length > PLAFOND_PHRASES_BLOC) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-bloc",
        `${phrases.length} phrases, ${PLAFOND_PHRASES_BLOC} au plus par nom`
      )
    );
  }
  const explications = phrases.filter((p) => EXPLICATION_OU_PISTE.test(p));
  if (explications.length > PLAFOND_EXPLICATIONS) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-bloc",
        `${explications.length} explications, ${PLAFOND_EXPLICATIONS} au plus par nom`
      )
    );
  }

  if (interieur) {
    if (!phrases.some((p) => LANGUE_DU_GROUPE.test(p))) {
      trouvailles.push(
        trouvaille(
          numero,
          "gabarit-bloc",
          "le bloc du nom de l'intérieur dit d'où il vient : « Ce nom vient de la langue … »"
        )
      );
    }
    if (
      !phrases.some((p) => EXPLICATION_LOCALE.test(p) || p === SILENCE_LOCAL)
    ) {
      trouvailles.push(
        trouvaille(
          numero,
          "gabarit-bloc",
          `le bloc du nom de l'intérieur donne l'explication de ses locuteurs (« … l'expliquent ainsi : … ») ou déclare le silence (« ${SILENCE_LOCAL} »)`
        )
      );
    }
  } else {
    const ecarts = phrases.filter((p) => ECART.test(p));
    if (ecarts.length !== 1) {
      trouvailles.push(
        trouvaille(
          numero,
          "gabarit-ecart",
          `une phrase d'écart exactement (« Ce nom dit la même chose que … », « Ce nom dit autre chose que … » ou « Nous ne savons pas si ce nom dit la même chose que … ») : ${ecarts.length} trouvée(s)`
        )
      );
    }
  }
  if (!ETIQUETTES_PAR_TYPE(type).has(ouvreur.etiquette)) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-bloc",
        `« ${ouvreur.etiquette} » n'existe pas dans le gabarit ${type}`
      )
    );
  }
  return trouvailles;
}

function verifierClassement(paragraphe, numero, type, interieurs, tousLesNoms) {
  const trouvailles = [];
  const phrases = phrasesDe(paragraphe);
  if (phrases.length < 2 || phrases.length > 3) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-classement",
        `deux ou trois phrases, ${phrases.length} trouvée(s)`
      )
    );
  }
  const premiere = phrases[0] ?? "";
  let ancre;
  if (type === "patronyme") {
    ancre = /^La forme d'origine est (.+)\.$/.exec(premiere);
  } else if (interieurs.length === 1) {
    ancre = /^L'endonyme de (?:ce|cette) .+ est (.+?) : /.exec(premiere);
  } else {
    ancre = /^Les endonymes de (?:ce|cette) .+ sont (.+?) : /.exec(premiere);
  }
  if (!ancre) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-classement",
        type === "patronyme"
          ? "première phrase attendue : « La forme d'origine est X. »"
          : interieurs.length === 1
            ? "première phrase attendue : « L'endonyme de ce … est X : … »"
            : "première phrase attendue : « Les endonymes de ce … sont X et Y : … »"
      )
    );
  } else if (!memesNoms(noms(ancre[1]), interieurs)) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-classement",
        `le classement nomme ${ancre[1]}, les blocs ont posé ${interieurs.join(" et ")}`
      )
    );
  }
  const absents = tousLesNoms.filter((nom) => !paragraphe.includes(nom));
  if (absents.length) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-classement",
        `le classement ne nomme pas : ${absents.join(", ")}`
      )
    );
  }
  if (!/d'ailleurs|s'en éloigne/.test(paragraphe)) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-classement",
        "le classement dit que les autres noms viennent d'ailleurs"
      )
    );
  }
  if (phrases.filter((p) => /évité/.test(p)).length > 1) {
    trouvailles.push(
      trouvaille(
        numero,
        "gabarit-classement",
        "une seule phrase sur les noms évités"
      )
    );
  }
  return trouvailles;
}

/**
 * The second patronyme skeleton: ouverture · cadrage · deux cas documentés au
 * moins · [discussion optionnelle] · synthèse des quatre questions (fixe) ·
 * synthèse libre · [transition vers le chapitre suivant] · clôture.
 *
 * What the comparison skeleton checks and this one does not, on purpose:
 * whether a case is properly attributed, whether its hedge is the right one
 * for its claim. A jamu-transmission subject varies too much in its number
 * and shape of documented cases for a fixed sentence per case; the fixed
 * points are the ones the doctrine actually requires — the methodological
 * synthesis, word for word, and at least one epistemic reserve somewhere
 * among the cases, so a case-only telling can't silently drop every caveat.
 */
function verifierPatronymeTransmission(paragraphes) {
  const trouvailles = [];

  if (paragraphes.length > PLAFOND_SCENES_TRANSMISSION) {
    trouvailles.push(
      trouvaille(
        paragraphes.length,
        "gabarit-plafond",
        `${paragraphes.length} scènes, ${PLAFOND_SCENES_TRANSMISSION} au plus`
      )
    );
  }

  const dernier = paragraphes.length;
  if (paragraphes[dernier - 1] !== CLOTURE_UNIQUE) {
    trouvailles.push(
      trouvaille(
        dernier,
        "gabarit-cloture",
        `la dernière scène est la clôture unique, mot pour mot : « ${CLOTURE_UNIQUE} »`
      )
    );
  }

  const ouverture = phrasesDe(paragraphes[0] ?? "");
  if (!ouverture.some((p) => p.endsWith("?"))) {
    trouvailles.push(
      trouvaille(1, "gabarit-ouverture", "l'ouverture pose une question")
    );
  }

  const indexSynthese = paragraphes.findIndex(
    (p) => phrasesDe(p)[0] === ANCRE_SYNTHESE_METHODE
  );
  if (indexSynthese === -1) {
    trouvailles.push(
      trouvaille(
        dernier,
        "gabarit-synthese-methode",
        `une scène reprend, mot pour mot, la synthèse des quatre questions : « ${SYNTHESE_METHODE_QUATRE_QUESTIONS} »`
      )
    );
    return ordonner(trouvailles, paragraphes, dernier);
  }
  if (
    !paragraphes[indexSynthese].startsWith(SYNTHESE_METHODE_QUATRE_QUESTIONS)
  ) {
    trouvailles.push(
      trouvaille(
        indexSynthese + 1,
        "gabarit-synthese-methode",
        `la synthèse commence, mot pour mot, par : « ${SYNTHESE_METHODE_QUATRE_QUESTIONS} » — une phrase de conclusion propre au sujet peut suivre dans la même scène`
      )
    );
  }

  const cas = paragraphes.slice(2, indexSynthese);
  if (cas.length < PLANCHER_CAS_TRANSMISSION) {
    trouvailles.push(
      trouvaille(
        3,
        "gabarit-cas",
        `au moins ${PLANCHER_CAS_TRANSMISSION} scènes de cas documentés entre le cadrage et la synthèse des quatre questions : ${cas.length} trouvée(s)`
      )
    );
  }
  if (cas.length && !cas.some((p) => RESERVE_EPISTEMIQUE.test(p))) {
    trouvailles.push(
      trouvaille(
        3,
        "gabarit-cas",
        "au moins une scène de cas documenté porte une réserve épistémique (ce que la source ne permet pas d'établir)"
      )
    );
  }

  return ordonner(trouvailles, paragraphes, dernier);
}

/**
 * @param {string} narration the text of a `narration.fr.txt`, one scene per paragraph
 * @param {string} type one of TYPES
 * @returns {{paragraphe: number, regle: string, detail: string}[]}
 */
export function verifierGabarit(narration, type) {
  if (!TYPES.includes(type)) {
    return [
      trouvaille(
        0,
        "gabarit-type",
        `type « ${type} » hors gabarit (attendus : ${TYPES.join(", ")})`
      ),
    ];
  }
  const paragraphes = normaliser(narration)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (
    type === "patronyme" &&
    paragraphes.some((p) => phrasesDe(p)[0] === ANCRE_SYNTHESE_METHODE)
  ) {
    return verifierPatronymeTransmission(paragraphes);
  }

  const trouvailles = [];

  if (paragraphes.length > PLAFOND_SCENES) {
    trouvailles.push(
      trouvaille(
        paragraphes.length,
        "gabarit-plafond",
        `${paragraphes.length} scènes, ${PLAFOND_SCENES} au plus`
      )
    );
  }

  const dernier = paragraphes.length;
  if (paragraphes[dernier - 1] !== CLOTURE_UNIQUE) {
    trouvailles.push(
      trouvaille(
        dernier,
        "gabarit-cloture",
        `la dernière scène est la clôture unique, mot pour mot : « ${CLOTURE_UNIQUE} »`
      )
    );
  }

  const inventaire = verifierInventaire(paragraphes[1] ?? "", 2, type);
  trouvailles.push(...inventaire.trouvailles);

  const debutBlocs = paragraphes.findIndex(
    (p, i) => i >= 2 && OUVREUR_DE_BLOC.test(phrasesDe(p)[0] ?? "")
  );
  if (debutBlocs === -1) {
    trouvailles.push(
      trouvaille(
        3,
        "gabarit-bloc",
        "aucun bloc d'appellation : « X est l'endonyme. »"
      )
    );
    trouvailles.push(...verifierOuverture(paragraphes[0] ?? "", 1, type, 1));
    return ordonner(trouvailles, paragraphes, dernier);
  }

  const variantes = paragraphes.slice(2, debutBlocs);
  if (variantes.length > 1) {
    trouvailles.push(
      trouvaille(
        3,
        "gabarit-variantes",
        `au plus un paragraphe de variantes avant les blocs : ${variantes.length} trouvés`
      )
    );
  }
  variantes.forEach((p, i) => {
    if (!VARIANTES.test(p) || phrasesDe(p).length > 4) {
      trouvailles.push(
        trouvaille(
          3 + i,
          "gabarit-variantes",
          "un paragraphe de variantes dit comment le nom s'écrit ou quel problème l'écriture pose (quatre phrases au plus)"
        )
      );
    }
  });

  let finBlocs = debutBlocs;
  const blocs = [];
  while (
    finBlocs < paragraphes.length &&
    OUVREUR_DE_BLOC.test(phrasesDe(paragraphes[finBlocs])[0] ?? "")
  ) {
    const lu = OUVREUR_DE_BLOC.exec(phrasesDe(paragraphes[finBlocs])[0]);
    blocs.push({
      numero: finBlocs + 1,
      nom: lu[1],
      etiquette: lu[2],
      paragraphe: paragraphes[finBlocs],
    });
    finBlocs += 1;
  }

  const interieurs = blocs.filter((b) => ETIQUETTES_INTERIEUR.has(b.etiquette));
  const exterieurs = blocs.filter((b) => ETIQUETTES_EXTERIEUR.has(b.etiquette));

  trouvailles.push(
    ...verifierOuverture(paragraphes[0] ?? "", 1, type, interieurs.length)
  );

  if (!interieurs.length || (type === "patronyme" && interieurs.length !== 1)) {
    trouvailles.push(
      trouvaille(
        debutBlocs + 1,
        "gabarit-bloc",
        type === "patronyme"
          ? "une forme d'origine exactement"
          : "au moins un endonyme : le gabarit ne couvre pas un nom dont le groupe n'a pas de nom pour lui-même"
      )
    );
  }
  if (!exterieurs.length) {
    trouvailles.push(
      trouvaille(
        debutBlocs + 1,
        "gabarit-bloc",
        type === "patronyme"
          ? "au moins une forme transformée"
          : "au moins un exonyme"
      )
    );
  }
  const premierExterieur = blocs.findIndex((b) =>
    ETIQUETTES_EXTERIEUR.has(b.etiquette)
  );
  if (
    premierExterieur !== -1 &&
    blocs
      .slice(premierExterieur)
      .some((b) => ETIQUETTES_INTERIEUR.has(b.etiquette))
  ) {
    trouvailles.push(
      trouvaille(
        debutBlocs + 1,
        "gabarit-bloc",
        "les blocs du nom de l'intérieur passent avant ceux des noms venus d'ailleurs"
      )
    );
  }
  if (type !== "patronyme" && interieurs.length > 1) {
    interieurs.forEach((b, i) => {
      const attendue = i === 0 ? "un endonyme" : "aussi un endonyme";
      if (b.etiquette !== attendue) {
        trouvailles.push(
          trouvaille(
            b.numero,
            "gabarit-bloc",
            `« ${b.nom} est ${attendue}. » attendu`
          )
        );
      }
    });
  } else if (
    type !== "patronyme" &&
    interieurs[0]?.etiquette !== "l'endonyme"
  ) {
    trouvailles.push(
      trouvaille(
        interieurs[0]?.numero ?? debutBlocs + 1,
        "gabarit-bloc",
        "un seul endonyme : « X est l'endonyme. »"
      )
    );
  }
  if (
    inventaire.noms.length &&
    !memesNoms(
      blocs.map((b) => b.nom),
      inventaire.noms
    )
  ) {
    trouvailles.push(
      trouvaille(
        debutBlocs + 1,
        "gabarit-bloc",
        `un bloc par nom, dans l'ordre de l'inventaire (${inventaire.noms.join(", ")}) : blocs trouvés ${blocs.map((b) => b.nom).join(", ")}`
      )
    );
  }
  for (const bloc of blocs) {
    trouvailles.push(
      ...verifierBloc(bloc.paragraphe, bloc.numero, type, {
        etiquette: bloc.etiquette,
      })
    );
  }

  const suite = paragraphes.slice(finBlocs);
  if (suite.length !== 3) {
    trouvailles.push(
      trouvaille(
        finBlocs + 1,
        "gabarit-ordre",
        `après les blocs : classement, synthèse, clôture (trois scènes) — ${suite.length} trouvée(s)`
      )
    );
  } else {
    trouvailles.push(
      ...verifierClassement(
        suite[0],
        finBlocs + 1,
        type,
        interieurs.map((b) => b.nom),
        blocs.map((b) => b.nom)
      )
    );
    const synthese = phrasesDe(suite[1]);
    if (synthese.length > PLAFOND_PHRASES_SYNTHESE) {
      trouvailles.push(
        trouvaille(
          finBlocs + 2,
          "gabarit-synthese",
          `${synthese.length} phrases, ${PLAFOND_PHRASES_SYNTHESE} au plus`
        )
      );
    }
  }
  return ordonner(trouvailles, paragraphes, dernier);
}

/**
 * The plain-language rule applies to every scene but the closing, whose
 * imperative (« Partagez-la ») is the operator's decision, not a fault.
 */
function ordonner(trouvailles, paragraphes, dernier) {
  const sansCloture =
    paragraphes[dernier - 1] === CLOTURE_UNIQUE
      ? paragraphes.slice(0, -1)
      : paragraphes;
  const lecture = verifierNarration(sansCloture.join("\n\n")).map((t) => ({
    paragraphe: t.paragraphe,
    regle: t.regle,
    detail: `${t.detail} — « ${t.phrase} »`,
  }));
  return [...trouvailles, ...lecture].sort(
    (a, b) => a.paragraphe - b.paragraphe
  );
}
