/**
 * node --test social/tools/etat-pipeline/
 *
 * `aDesImages` has to survive a §1 bis revision without an edit here, so it is
 * exercised on the shape (a sibling folder holding image files) rather than on
 * `images/` or any other single literal name.
 */
import { strict as assert } from "node:assert";
import fs from "node:fs";
import { test } from "node:test";
import os from "node:os";
import path from "node:path";

import { aDesImages } from "./rendu-reseaux.mjs";

function dossierEssai() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "rendu-reseaux-"));
}

// @req REQ-032
test("un dossier-réseau qui porte des images est détecté, quel que soit son nom", () => {
  const post = dossierEssai();
  const reseau = path.join(post, "TikTok-Instagram");
  fs.mkdirSync(reseau);
  fs.writeFileSync(path.join(reseau, "un.png"), "");
  assert.equal(aDesImages(post), true);
});

// @req REQ-032
test("_epreuves/ et _rendus-remplaces/ ne comptent pas comme un rendu publiable", () => {
  const post = dossierEssai();
  fs.mkdirSync(path.join(post, "_epreuves"));
  fs.writeFileSync(path.join(post, "_epreuves", "un-epreuve.png"), "");
  fs.mkdirSync(path.join(post, "_rendus-remplaces"));
  fs.writeFileSync(path.join(post, "_rendus-remplaces", "ancien.png"), "");
  assert.equal(aDesImages(post), false);
});

// @req REQ-032
test("video/ seul ne compte pas comme des images", () => {
  const post = dossierEssai();
  fs.mkdirSync(path.join(post, "video"));
  fs.writeFileSync(path.join(post, "video", "post.mp4"), "");
  assert.equal(aDesImages(post), false);
});

// @req REQ-032
test("un dossier vide n'a pas d'images", () => {
  assert.equal(aDesImages(dossierEssai()), false);
});

// @req REQ-032
test("un dossier-réseau vide ne compte pas — le rendu doit avoir écrit un fichier", () => {
  const post = dossierEssai();
  fs.mkdirSync(path.join(post, "Instagram-Facebook-YouTube-X"));
  assert.equal(aDesImages(post), false);
});
