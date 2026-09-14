/**
 * node --test social/tools/etat-pipeline/
 *
 * The fixtures are the library's own shapes, trimmed: a published video, a
 * published carousel, and the two validated videos that were waiting to go out
 * on subjects already published in that format (measured 2026-09-13).
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { bilanSujet, decrirePost, regrouper } from "./sujets.mjs";

const KROU_VIDEO = `# En Côte d'Ivoire, « Krou » ne vient pas de l'anglais crew.

**✅ Publié** · publication : 2026-09-12

| | |
| --- | --- |
| Sujet | Familles · Krou |
| Pilier | Le vrai nom |
| Montages | \`video/krou-klao-fr.mp4\` |

## Diffusion

- **youtube** — publié le 2026-09-12, URL non enregistrée
- **tiktok** — publié le 2026-09-12, URL non enregistrée
`;

const PEUL_CARROUSEL_PUBLIE = `# Peul, Fula, Fulani

**✅ Publié** · publication : 2026-09-11

| | |
| --- | --- |
| Sujet | Peuples · Peul |
| Montages | — |

## Diffusion

- **instagram** — publié le 2026-09-11, URL non enregistrée
`;

const PEUL_CARROUSEL_A_PRODUIRE = `# Les Peul vivent dans douze pays.

**⚪️ À produire**

| | |
| --- | --- |
| Sujet | Peuple · Peul |
| Montages | — |

## Diffusion

_Pas encore publié._

## Liens balisés — un par réseau, à coller tels quels

- **tiktok** · carrousel
  \`https://ethniafrica.com/fr/atlas/peuples/PPL_FULA?utm_source=tiktok&utm_medium=social&utm_campaign=peul-douze-pays&utm_content=carrousel\`
`;

const NZEBI_VIDEO_PUBLIEE = `# Au Gabon, un homme retenait l'histoire des clans nzebi.

**✅ Publié** · publication : 2026-09-12

| | |
| --- | --- |
| Sujet | Peuples · Nzebi |
| Montages | \`video/nzebi-clans-fr.mp4\` |
`;

const NZEBI_VIDEO_VALIDEE = `# Le muyambili, maître de la parole

**🟢 Validé, en attente**

| | |
| --- | --- |
| Sujet | Peuples · Nzebi |
| Montages | \`video/nzebi.mp4\` · 51,6 s |
`;

const sans = { images: false, video: false };

// @req REQ-032
test("un post publié dit son sujet, son format et ses réseaux", () => {
  const post = decrirePost(KROU_VIDEO, { ...sans, chemin: "krou-klao" });
  assert.equal(post.cle, "krou");
  assert.equal(post.etat, "publie");
  assert.equal(post.format, "video");
  assert.deepEqual(post.reseaux, ["youtube", "tiktok"]);
  assert.equal(post.date, "2026-09-12");
});

// @req REQ-032
test("sans montage, le format se lit sur les liens balisés", () => {
  const post = decrirePost(PEUL_CARROUSEL_A_PRODUIRE, sans);
  assert.equal(post.format, "carrousel");
  assert.equal(post.etat, "traitement");
  assert.deepEqual(post.reseaux, []);
});

// @req REQ-032
test("sans montage ni lien, les images rendues font un carrousel", () => {
  const post = decrirePost(PEUL_CARROUSEL_PUBLIE, {
    images: true,
    video: false,
  });
  assert.equal(post.format, "carrousel");
});

// @req REQ-032
test("un format qui ne se lit nulle part ne se devine pas", () => {
  const post = decrirePost("# X\n\n**⚪️ Brouillon**\n", sans);
  assert.equal(post.format, null);
});

// @req REQ-032
test("« Peuple · Peul » et « Peuples · Peul » sont le même sujet", () => {
  const groupes = regrouper([
    decrirePost(PEUL_CARROUSEL_PUBLIE, { images: true, video: false }),
    decrirePost(PEUL_CARROUSEL_A_PRODUIRE, sans),
  ]);
  assert.deepEqual([...groupes.keys()], ["peul"]);
  assert.equal(groupes.get("peul").length, 2);
});

// @req REQ-032
test("une vidéo validée sur un sujet déjà publié en vidéo est un doublon", () => {
  // The case that made this module: build-etat told the operator to publish
  // this one, and Nzebi already had a video on five networks.
  const bilan = bilanSujet([
    decrirePost(NZEBI_VIDEO_PUBLIEE, sans),
    decrirePost(NZEBI_VIDEO_VALIDEE, sans),
  ]);
  assert.equal(bilan.doublons.length, 1);
  assert.equal(bilan.doublons[0].titre, "Le muyambili, maître de la parole");
  assert.equal(bilan.doublons[0].dejaPublie.date, "2026-09-12");
});

// @req REQ-032
test("un sujet publié en vidéo seulement propose le carrousel", () => {
  const bilan = bilanSujet([decrirePost(KROU_VIDEO, sans)]);
  assert.deepEqual(bilan.formatsPublies, ["video"]);
  assert.equal(bilan.formatManquant, "carrousel");
});

// @req REQ-032
test("un sujet publié dans les deux formats ne propose rien de plus", () => {
  const bilan = bilanSujet([
    decrirePost(KROU_VIDEO, sans),
    decrirePost(
      PEUL_CARROUSEL_PUBLIE.replace("Peuples · Peul", "Familles · Krou"),
      {
        images: true,
        video: false,
      }
    ),
  ]);
  assert.deepEqual(bilan.formatsPublies, ["carrousel", "video"]);
  assert.equal(bilan.formatManquant, null);
});

// @req REQ-032
test("un sujet jamais publié n'a ni doublon ni format manquant", () => {
  const bilan = bilanSujet([decrirePost(PEUL_CARROUSEL_A_PRODUIRE, sans)]);
  assert.deepEqual(bilan.formatsPublies, []);
  assert.equal(bilan.formatManquant, null);
  assert.deepEqual(bilan.doublons, []);
});
