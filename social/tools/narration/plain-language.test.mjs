import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { appliquerRevues, verifierNarration } from "./plain-language.mjs";

const regles = (texte) => verifierNarration(texte).map((f) => f.regle);

// @req REQ-032
test("a book that is itself the subject is not an authority put in front", () => {
  for (const phrase of [
    "Ce livre raconte la vie de son auteur.",
    "Ce livre est un récit de voyage.",
  ]) {
    assert.deepEqual(regles(phrase), [], phrase);
  }
});

// @req REQ-032
test("« selon » or « d'après » in front of a document or a scholar is refused", () => {
  for (const phrase of [
    "Selon ce dictionnaire, le mot vient du peul.",
    "D'après ce dictionnaire, le mot vient du peul.",
    "Selon l'historien, le mot est récent.",
  ]) {
    assert.ok(regles(phrase).includes("attribution-en-tete"), phrase);
  }
});

// @req REQ-032
test("a surname alone is not judged by the lexical rule", () => {
  assert.ok(
    !regles("Selon Delafosse, le mot est récent.").includes(
      "attribution-en-tete"
    )
  );
});

const PHRASE_AMBIGUE = "Ce livre décrit la vie de son auteur.";
const RAISON =
  "Le livre est le sujet de la carte : une recommandation de lecture.";

// @req REQ-032
test("a document that describes something stays refused until a reviewer says why it is the subject", () => {
  assert.ok(regles(PHRASE_AMBIGUE).includes("attribution-en-tete"));
  const { bloquantes, revues } = appliquerRevues(
    verifierNarration(PHRASE_AMBIGUE),
    [{ phrase: PHRASE_AMBIGUE, regle: "attribution-en-tete", raison: RAISON }]
  );
  assert.deepEqual(bloquantes, []);
  assert.equal(revues.length, 1);
  assert.equal(revues[0].raison, RAISON);
});

// @req REQ-032
test("a review with no reason does not unblock anything", () => {
  const { bloquantes, invalides } = appliquerRevues(
    verifierNarration(PHRASE_AMBIGUE),
    [{ phrase: PHRASE_AMBIGUE, regle: "attribution-en-tete", raison: "  " }]
  );
  assert.equal(bloquantes.length, 1);
  assert.equal(invalides.length, 1);
});

// @req REQ-032
test("the command line accepts a reviewed sentence only with its reason, and reports a stale review", () => {
  const dossier = mkdtempSync(join(tmpdir(), "narration-revue-"));
  try {
    const narration = join(dossier, "narration.fr.txt");
    const revues = join(dossier, "revues.json");
    const lancer = (...args) =>
      spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL("./check-narration.mjs", import.meta.url)),
          ...args,
        ],
        { encoding: "utf-8" }
      );
    writeFileSync(narration, `${PHRASE_AMBIGUE}\n`);

    assert.equal(lancer(narration).status, 1);

    writeFileSync(
      revues,
      JSON.stringify([
        {
          phrase: PHRASE_AMBIGUE,
          regle: "attribution-en-tete",
          raison: RAISON,
        },
      ])
    );
    const acceptee = lancer(narration, "--revues", revues);
    assert.equal(acceptee.status, 0, acceptee.stdout);
    assert.match(acceptee.stdout, /relue/);
    assert.ok(acceptee.stdout.includes(RAISON));

    writeFileSync(narration, "Ils se nomment Peuls.\n");
    const perimee = lancer(narration, "--revues", revues);
    assert.equal(perimee.status, 1);
    assert.match(perimee.stdout, /périmée/);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

// @req REQ-032
test("a review that matches no sentence is reported as stale, never silently kept", () => {
  const { perimees } = appliquerRevues(
    verifierNarration("Ils se nomment Peuls."),
    [{ phrase: PHRASE_AMBIGUE, regle: "attribution-en-tete", raison: RAISON }]
  );
  assert.equal(perimees.length, 1);
});

// @req REQ-032
test("a sentence that opens on its subject passes", () => {
  assert.deepEqual(regles("Lapouge propose un mot. Il l'écrit en 1899."), []);
});

// @req REQ-032
test("a question may open on a complement", () => {
  assert.deepEqual(regles("D'où vient le nom « ethnie » ?"), []);
});

// @req REQ-032
test("a statement may not open on a complement, an adverb or a conjunction", () => {
  for (const phrase of [
    "En 1994, elle écrit un nom.",
    "Vers 1950, le mot change de sens.",
    "Selon lui, ce groupe n'est pas une race.",
    "Dans notre projet, nous partons du nom.",
    "Mais le mot parle de races.",
    "Page 10, il écrit une phrase.",
    "Voici ce que disent les sources.",
    "Parce que nommer un peuple demande de la précision.",
  ]) {
    assert.deepEqual(regles(phrase), ["sujet-en-premier"], phrase);
  }
});

// @req REQ-032
test("an imperative has no subject and is refused", () => {
  assert.deepEqual(regles("Aidez-nous à le vérifier."), ["sujet-en-premier"]);
  assert.deepEqual(regles("Partagez-la sur EthniAfrica."), [
    "sujet-en-premier",
  ]);
});

// @req REQ-032
test("a sentence led by a scholar, an author or a book is refused", () => {
  for (const phrase of [
    "Le linguiste Denis Creissels publie leur mot en 2013.",
    "Un livre français de 1912 le montre.",
    "Ce livre écrit que les Malinké se disent Mandenka.",
    "Un auteur français pense que Malinké est un mot peul.",
    "L'historienne Catherine Coquery-Vidrovitch écrit que le mot est récent.",
    "D'après ce dictionnaire, le mot vient du peul.",
  ]) {
    assert.ok(regles(phrase).includes("attribution-en-tete"), phrase);
  }
});

// @req REQ-032
test("a sentence that says what peoples call each other passes", () => {
  for (const phrase of [
    "Les Peuls les appelaient Malinké ou Mellinké en 1912.",
    "Les Bambara les appellent Maninka.",
    "On imprime Mandingas à Lisbonne en 1502.",
    "Une explication dit que Malinké est un mot peul.",
  ]) {
    assert.deepEqual(regles(phrase), [], phrase);
  }
});

// @req REQ-032
test("a scholar who gave the name is the history of the name, not a source hidden behind", () => {
  for (const phrase of [
    "Un linguiste européen inscrit la langue dans un catalogue en 1934.",
    "Un linguiste retire le préfixe et ajoute un i final.",
    "Un missionnaire donne ce nom au fleuve.",
  ]) {
    assert.deepEqual(regles(phrase), [], phrase);
  }
});

// @req REQ-032
test("the finding says where the source goes instead", () => {
  const [trouvaille] = verifierNarration(
    "Ce livre écrit que les Malinké se disent Mandenka."
  );
  assert.equal(trouvaille.regle, "attribution-en-tete");
  assert.match(trouvaille.detail, /carte de source/);
});

// @req REQ-032
test("words inside a quotation are not inspected for attribution", () => {
  assert.deepEqual(regles("Le mot revient dans « le livre de 1912 »."), []);
});

// @req REQ-032
test("a speech verb placed after its quotation is refused", () => {
  assert.deepEqual(regles("Le mot est péjoratif, écrit-elle."), [
    "verbe-inverse",
  ]);
});

// @req REQ-032
test("a sentence longer than twenty words is refused", () => {
  const vingtEtUn = Array.from({ length: 21 }, () => "mot").join(" ");
  assert.deepEqual(regles(`Il écrit ${vingtEtUn}.`), ["phrase-trop-longue"]);
  const vingt = Array.from({ length: 17 }, () => "mot").join(" ");
  assert.deepEqual(regles(`Il écrit ${vingt}.`), []);
});

// @req REQ-032
test("quoted words are not counted, they cannot be rewritten", () => {
  const citation =
    "« Peuple, nation, nationalité sont des termes également impropres, ils ont un sens exact, préexistant »";
  assert.deepEqual(regles(`Lapouge écrit ${citation}.`), []);
});

// @req REQ-032
test("a full stop inside a quotation does not cut the sentence", () => {
  assert.deepEqual(
    regles("Il écrit : « J'ai proposé ethne ou ethnie. » Le mot est né."),
    []
  );
});

// @req REQ-032
test("each finding names the sentence and the paragraph it comes from", () => {
  const [trouvaille] = verifierNarration(
    "Il écrit un mot.\n\nEn 1994, elle écrit un nom."
  );
  assert.equal(trouvaille.paragraphe, 2);
  assert.equal(trouvaille.phrase, "En 1994, elle écrit un nom.");
});

// @req REQ-032
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
