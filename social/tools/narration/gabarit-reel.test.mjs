import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CLOTURE_UNIQUE,
  SYNTHESE_METHODE_QUATRE_QUESTIONS,
  TYPES,
  verifierGabarit,
} from "./gabarit-reel.mjs";

const exemple = (nom) =>
  readFileSync(new URL(`./exemples/${nom}.fr.txt`, import.meta.url), "utf-8");
const regles = (texte, type) =>
  verifierGabarit(texte, type).map((t) => t.regle);

/** Fails loudly when the fragment is absent, so a mutation never silently no-ops. */
function remplacer(texte, avant, apres) {
  assert.ok(texte.includes(avant), `fragment absent de l'exemple : ${avant}`);
  return texte.replace(avant, apres);
}

// @req REQ-032
test("every canonical example passes its own type", () => {
  const parType = {
    peuple: ["peuple", "peuple-dialectes"],
    pays: ["pays"],
    patronyme: ["patronyme", "patronyme-transmission"],
    lieu: ["lieu"],
    langue: ["langue"],
  };
  for (const type of TYPES) {
    for (const nom of parType[type]) {
      assert.deepEqual(
        verifierGabarit(exemple(nom), type),
        [],
        `${nom} devrait passer comme « ${type} »`
      );
    }
  }
});

// @req REQ-032
test("an example fails when it is read as another type", () => {
  assert.notDeepEqual(verifierGabarit(exemple("peuple"), "pays"), []);
  assert.notDeepEqual(verifierGabarit(exemple("langue"), "lieu"), []);
  assert.notDeepEqual(verifierGabarit(exemple("patronyme"), "peuple"), []);
});

// @req REQ-032
test("a type outside the five is refused, « mot » included", () => {
  assert.deepEqual(regles(exemple("peuple"), "mot"), ["gabarit-type"]);
  assert.deepEqual(regles(exemple("peuple"), undefined), ["gabarit-type"]);
});

// @req REQ-032
test("the closing is the single decided text, word for word", () => {
  assert.ok(exemple("peuple").trimEnd().endsWith(CLOTURE_UNIQUE));
  const modifie = remplacer(
    exemple("peuple"),
    "Partagez-la sur EthniAfrica.",
    "Partagez-la sur notre site."
  );
  assert.ok(regles(modifie, "peuple").includes("gabarit-cloture"));
});

// @req REQ-032
test("a narration without its closing is refused", () => {
  const sans = exemple("peuple").replace(CLOTURE_UNIQUE, "").trimEnd();
  assert.ok(regles(sans, "peuple").length > 0);
});

// @req REQ-032
test("a narration without its synthesis is refused", () => {
  const sans = remplacer(
    exemple("peuple"),
    /Un seul de ces quatre noms[^\n]*\n\n/.exec(exemple("peuple"))[0],
    ""
  );
  assert.ok(regles(sans, "peuple").length > 0);
});

// @req REQ-032
test("a synthesis of more than three sentences is refused", () => {
  const longue = remplacer(
    exemple("peuple"),
    "Les trois autres viennent d'ailleurs, et disent parfois autre chose.",
    "Les trois autres viennent d'ailleurs. Ils disent parfois autre chose. Ils sont connus. Ils sont écrits."
  );
  assert.ok(regles(longue, "peuple").includes("gabarit-synthese"));
});

// @req REQ-032
test("the opening must define the endonym and the exonym", () => {
  const sans = remplacer(
    exemple("peuple"),
    "c'est l'endonyme, le nom de l'intérieur",
    "c'est le vrai nom"
  );
  assert.ok(regles(sans, "peuple").includes("gabarit-ouverture"));
});

// @req REQ-032
test("the opening says « ce sont des endonymes » exactly when several endonyms follow", () => {
  const pluriel = remplacer(
    exemple("peuple"),
    "Un seul vient de lui et de sa langue : c'est l'endonyme, le nom de l'intérieur.",
    "Ici, il en emploie deux, selon son dialecte : ce sont des endonymes, les noms de l'intérieur."
  );
  assert.ok(regles(pluriel, "peuple").includes("gabarit-ouverture"));
  const singulier = remplacer(
    exemple("peuple-dialectes"),
    "Ici, il en emploie deux, selon son dialecte : ce sont des endonymes, les noms de l'intérieur.",
    "Un seul vient de lui et de sa langue : c'est l'endonyme, le nom de l'intérieur."
  );
  assert.ok(regles(singulier, "peuple").includes("gabarit-ouverture"));
});

// @req REQ-032
test("more than four names are refused", () => {
  const cinq = remplacer(
    exemple("peuple"),
    "Ce peuple porte quatre noms : Ndoumba, Sarouk, Dombas et Kafouli.",
    "Ce peuple porte cinq noms : Ndoumba, Sarouk, Dombas, Kafouli et Zérou."
  );
  assert.ok(regles(cinq, "peuple").includes("gabarit-inventaire"));
});

// @req REQ-032
test("the declared number of names must match the names listed", () => {
  const faux = remplacer(
    exemple("peuple"),
    "Ce peuple porte quatre noms :",
    "Ce peuple porte trois noms :"
  );
  assert.ok(regles(faux, "peuple").includes("gabarit-inventaire"));
});

// @req REQ-032
test("every listed name gets exactly one block, in the listed order", () => {
  const inverse = remplacer(
    exemple("peuple"),
    "Ndoumba, Sarouk, Dombas et Kafouli",
    "Ndoumba, Dombas, Sarouk et Kafouli"
  );
  assert.ok(regles(inverse, "peuple").includes("gabarit-bloc"));
});

// @req REQ-032
test("the endonym block comes before every exonym block", () => {
  const texte = exemple("peuple");
  const blocs = texte.split("\n\n");
  const [ouverture, inventaire, variantes, endonyme, sarouk, ...reste] = blocs;
  const inverse = [
    ouverture,
    inventaire,
    variantes,
    sarouk,
    endonyme,
    ...reste,
  ].join("\n\n");
  assert.ok(regles(inverse, "peuple").includes("gabarit-bloc"));
});

// @req REQ-032
test("an endonym block must say it comes from the group's own language", () => {
  const sans = remplacer(
    exemple("peuple"),
    "Ce nom vient de la langue des Ndoumba. ",
    ""
  );
  assert.ok(regles(sans, "peuple").includes("gabarit-bloc"));
});

// @req REQ-032
test("an endonym block gives the local explanation, or declares the silence", () => {
  const sans = remplacer(
    exemple("peuple"),
    "Les anciens l'expliquent ainsi : le nom viendrait du fleuve Ndou. ",
    ""
  );
  assert.ok(regles(sans, "peuple").includes("gabarit-bloc"));

  const silence = remplacer(
    exemple("peuple"),
    "Les anciens l'expliquent ainsi : le nom viendrait du fleuve Ndou. ",
    "Nous n'avons pas encore leur explication. "
  );
  assert.deepEqual(verifierGabarit(silence, "peuple"), []);
});

// @req REQ-032
test("an exonym block carries exactly one gap sentence against the endonym", () => {
  const sans = remplacer(
    exemple("peuple"),
    "Ce nom dit autre chose que Ndoumba. ",
    ""
  );
  assert.ok(regles(sans, "peuple").includes("gabarit-ecart"));

  const deux = remplacer(
    exemple("peuple"),
    "Ce nom dit autre chose que Ndoumba. ",
    "Ce nom dit autre chose que Ndoumba. Ce nom dit la même chose que Ndoumba. "
  );
  assert.ok(regles(deux, "peuple").includes("gabarit-ecart"));
});

// @req REQ-032
test("the gap sentence has three wordings and no fourth", () => {
  const libre = remplacer(
    exemple("peuple"),
    "Ce nom dit autre chose que Ndoumba.",
    "Ce sens n'a aucun rapport avec Ndoumba."
  );
  assert.ok(regles(libre, "peuple").includes("gabarit-ecart"));
});

// @req REQ-032
test("a block carries at most two explanations", () => {
  const trois = remplacer(
    exemple("peuple"),
    "Une autre y voit un mélange avec le mot Sarouk.",
    "Une autre y voit un mélange avec le mot Sarouk. Une troisième piste y voit un nom de rivière."
  );
  assert.ok(regles(trois, "peuple").includes("gabarit-bloc"));
});

// @req REQ-032
test("a paragraph outside the template is refused", () => {
  const ajout = remplacer(
    exemple("peuple"),
    "Un seul de ces quatre noms",
    "Le contexte colonial explique tout cela.\n\nUn seul de ces quatre noms"
  );
  assert.ok(regles(ajout, "peuple").length > 0);
});

// @req REQ-032
test("the optional spelling paragraph appears at most once", () => {
  const deux = remplacer(
    exemple("peuple"),
    "Ndoumba est l'endonyme.",
    "Le nom Sarouk s'écrit aussi Saroug.\n\nNdoumba est l'endonyme."
  );
  assert.ok(regles(deux, "peuple").length > 0);

  const sans = exemple("pays").replace(/Le nom Ombéra s'écrit[^\n]*\n\n/, "");
  assert.deepEqual(verifierGabarit(sans, "pays"), []);
});

// @req REQ-032
test("the classification names every listed name and answers to the endonym", () => {
  const oublie = remplacer(
    exemple("peuple"),
    " Le nom Kafouli est évité, parce qu'il se moque de ceux qu'il désigne.",
    ""
  );
  assert.ok(regles(oublie, "peuple").includes("gabarit-classement"));
});

// @req REQ-032
test("the plain-language rule still applies to every scene but the closing", () => {
  const complement = remplacer(
    exemple("peuple"),
    "Un missionnaire l'écrit en 1912.",
    "En 1912, un missionnaire l'écrit."
  );
  assert.ok(regles(complement, "peuple").includes("sujet-en-premier"));
});

// @req REQ-032
test("the patronyme names a single form of origin, not an endonym", () => {
  const avecEndonyme = remplacer(
    exemple("patronyme"),
    "Kandélou est la forme d'origine.",
    "Kandélou est l'endonyme."
  );
  assert.ok(regles(avecEndonyme, "patronyme").includes("gabarit-bloc"));
});

// @req REQ-032
test("no more than ten scenes", () => {
  const onze = remplacer(
    exemple("peuple"),
    "Un seul de ces quatre noms",
    "Le contexte colonial explique tout cela.\n\nUn seul de ces quatre noms"
  );
  assert.ok(regles(onze, "peuple").includes("gabarit-plafond"));
});

// @req REQ-032
test("a patronyme without the four-questions synthesis reads as the comparison sub-case, and is refused there", () => {
  // The dispatch is structural: the fixed synthesis paragraph, not a flag,
  // decides which patronyme sub-case governs a text (see gabarit-reel-nom.md).
  const sansSynthese = remplacer(
    exemple("patronyme-transmission"),
    `${SYNTHESE_METHODE_QUATRE_QUESTIONS}\n\n`,
    ""
  );
  assert.ok(regles(sansSynthese, "patronyme").length > 0);
});

// @req REQ-032
test("the four-questions synthesis must be word for word", () => {
  const alteree = remplacer(
    exemple("patronyme-transmission"),
    "La généalogie cherche à établir les filiations entre des personnes précises.",
    "La généalogie cherche les liens de sang entre des personnes précises."
  );
  assert.ok(regles(alteree, "patronyme").includes("gabarit-synthese-methode"));
});

// @req REQ-032
test("at least two documented-case scenes stand between the framing and the four-questions synthesis", () => {
  const blocs = exemple("patronyme-transmission").split("\n\n");
  const [ouverture, cadrage, cas1, ...reste] = blocs;
  const indexSynthese = reste.findIndex((p) =>
    p.startsWith("Nous devons donc distinguer quatre questions.")
  );
  assert.ok(indexSynthese !== -1);
  const uneSeule = [
    ouverture,
    cadrage,
    cas1,
    ...reste.slice(indexSynthese),
  ].join("\n\n");
  assert.ok(regles(uneSeule, "patronyme").includes("gabarit-cas"));
});

// @req REQ-032
test("the documented-case scenes carry at least one epistemic reserve, somewhere in the group", () => {
  const texte = exemple("patronyme-transmission");
  const sansReserves = texte
    .replace(
      "Nous rapportons leur récit ; nous n'établissons pas la descendance de tous les Kondobô.",
      "Nous rapportons leur récit, largement transmis dans la région."
    )
    .replace(
      "Ce récit et celui de Sorowa évoquent des épisodes différents. Nous ne pouvons pas les assembler en une généalogie unique.",
      "Ce récit et celui de Sorowa évoquent des épisodes différents et complémentaires."
    )
    .replace(
      "Cette discussion ne rend pas les récits sans valeur.",
      "Cette discussion confirme la valeur historique des récits."
    )
    .replace(
      "Il ne fournit pas un acte de naissance ni une règle suivie par chaque personne aujourd'hui.",
      "Il vaut pour toute personne portant ce nom aujourd'hui."
    );
  assert.notEqual(sansReserves, texte);
  assert.ok(regles(sansReserves, "patronyme").includes("gabarit-cas"));
});

// @req REQ-032
test("a patronyme-transmission narration may run to twelve scenes, one more than the comparison ceiling", () => {
  assert.deepEqual(
    verifierGabarit(exemple("patronyme-transmission"), "patronyme"),
    []
  );
  const remplissage = [
    "Un premier cas de plus s'ajoute ici, à part.",
    "Un deuxième cas de plus s'ajoute ici, à part.",
    "Un troisième cas de plus s'ajoute ici, à part.",
    "Un quatrième cas de plus s'ajoute ici, à part.",
  ].join("\n\n");
  const treize = remplacer(
    exemple("patronyme-transmission"),
    "Le nom transmis peut porter une appartenance, des récits et des relations.",
    `${remplissage}\n\nLe nom transmis peut porter une appartenance, des récits et des relations.`
  );
  assert.ok(regles(treize, "patronyme").includes("gabarit-plafond"));
});

// @req REQ-032
test("the closing in the spec is the closing the checker enforces", () => {
  const spec = readFileSync(
    new URL(
      "../../../docs/design/gabarits-social/GABARITS-SOCIAL.md",
      import.meta.url
    ),
    "utf-8"
  );
  // §7 ter gives the card as two table cells: title = first sentence, body = the rest.
  const [titre, corps] = CLOTURE_UNIQUE.split(/(?<=sources\.) /);
  for (const moitie of [titre, corps]) {
    assert.ok(
      spec.includes(`« ${moitie} »`),
      `GABARITS-SOCIAL.md §7 ter ne porte plus « ${moitie} »`
    );
  }
});
