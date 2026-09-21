import { test } from "node:test";
import assert from "node:assert/strict";

import { verifierNarration } from "./plain-language.mjs";

const regles = (texte) => verifierNarration(texte).map((f) => f.regle);

test("a sentence that opens on its subject passes", () => {
  assert.deepEqual(regles("Lapouge écrit un livre. Il propose un mot."), []);
});

test("a question may open on a complement", () => {
  assert.deepEqual(regles("D'où vient le nom « ethnie » ?"), []);
});

test("a statement may not open on a complement, an adverb or a conjunction", () => {
  for (const phrase of [
    "En 1994, elle écrit un article.",
    "Vers 1950, le mot change de sens.",
    "Selon lui, ce groupe n'est pas une race.",
    "Dans notre projet, nous partons du nom.",
    "Mais le livre parle de races.",
    "Page 10, il écrit une phrase.",
    "Voici ce que disent les sources.",
    "Parce que nommer un peuple demande de la précision.",
  ]) {
    assert.deepEqual(regles(phrase), ["sujet-en-premier"], phrase);
  }
});

test("an imperative has no subject and is refused", () => {
  assert.deepEqual(regles("Aidez-nous à le vérifier."), ["sujet-en-premier"]);
  assert.deepEqual(regles("Partagez-la sur EthniAfrica."), [
    "sujet-en-premier",
  ]);
});

test("a speech verb placed after its quotation is refused", () => {
  assert.deepEqual(regles("Le mot est péjoratif, écrit-elle."), [
    "verbe-inverse",
  ]);
});

test("a sentence longer than twenty words is refused", () => {
  const vingtEtUn = Array.from({ length: 21 }, () => "mot").join(" ");
  assert.deepEqual(regles(`Il écrit ${vingtEtUn}.`), ["phrase-trop-longue"]);
  const vingt = Array.from({ length: 17 }, () => "mot").join(" ");
  assert.deepEqual(regles(`Il écrit ${vingt}.`), []);
});

test("quoted words are not counted, they cannot be rewritten", () => {
  const citation =
    "« Peuple, nation, nationalité sont des termes également impropres, ils ont un sens exact, préexistant »";
  assert.deepEqual(regles(`Lapouge écrit ${citation}.`), []);
});

test("a full stop inside a quotation does not cut the sentence", () => {
  assert.deepEqual(
    regles("Il écrit : « J'ai proposé ethne ou ethnie. » Le mot est né."),
    []
  );
});

test("each finding names the sentence and the paragraph it comes from", () => {
  const [trouvaille] = verifierNarration(
    "Il écrit un livre.\n\nEn 1994, elle écrit un article."
  );
  assert.equal(trouvaille.paragraphe, 2);
  assert.equal(trouvaille.phrase, "En 1994, elle écrit un article.");
});

test("the narration refused on 2026-09-21 is caught sentence by sentence", () => {
  const refusee = [
    "Du grec ethnos, dit le Trésor de la langue française.",
    "Page 10 de son livre Les Sélections sociales, Lapouge juge « peuple, nation, nationalité » « également impropres ».",
    "Vers 1950, écrit l'historienne Catherine Coquery-Vidrovitch, le mot « tribu » devient péjoratif en Afrique noire.",
    "En 1994, Catherine Coquery-Vidrovitch écrit que « ethnie » et « ethnicité » servent « aujourd'hui à tout, donc à rien ».",
    "Dans notre projet, on part du nom que chaque peuple se donne.",
  ].join("\n\n");
  const parParagraphe = new Set(
    verifierNarration(refusee).map((f) => f.paragraphe)
  );
  assert.deepEqual([...parParagraphe].sort(), [1, 2, 3, 4, 5]);
});
