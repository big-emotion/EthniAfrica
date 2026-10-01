/**
 * node --test social/tools/etat-pipeline/
 *
 * The subject view is a projection of the registry through the catalogue. These
 * tests hold it to the contract's meanings: a missing companion format is not a
 * defect, repeated coverage is not a duplicate, and only one platform post filed
 * twice is.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildCatalogue } from "../catalogue/catalogue.mjs";
import { renderBilan } from "./bilan.mjs";

const post = (overrides) => ({
  id: "x",
  dir: "Peuples-Exemple/x",
  title: "Exemple",
  subject: "Peuple · Exemple",
  pillar: "p",
  status: "publie",
  date: "2026-09-12",
  dateKind: "publication",
  videos: [],
  channels: { tiktok: "publié le 2026-09-12, URL non enregistrée" },
  notes: "",
  links: { content: "video", campaign: "x" },
  ...overrides,
});

const bilan = (posts, search) => renderBilan(buildCatalogue(posts), { search });

// @req REQ-187
test("a subject published in one format is never told to make the other", () => {
  const text = bilan([post({})], "exemple");
  assert.match(text, /Déjà publié : vidéo/);
  assert.doesNotMatch(text, /Jamais publié/);
});

// @req REQ-187
test("an unpublished edition beside a published one of the same format is information, not a duplicate", () => {
  const text = bilan([
    post({}),
    post({ id: "y", status: "pret", date: "", dateKind: "", channels: {} }),
  ]);
  assert.doesNotMatch(text, /Doublon|Ne pas la publier/);
  assert.match(text, /même format déjà publié/);
});

// @req REQ-187
test("one platform post filed twice is the duplicate", () => {
  const text = bilan([
    post({
      id: "a",
      channels: { tiktok: "https://www.tiktok.com/@c/video/9" },
    }),
    post({
      id: "b",
      channels: { tiktok: "https://www.tiktok.com/@c/photo/9" },
    }),
  ]);
  assert.match(text, /Doublon d'enregistrement/);
  assert.match(text, /tiktok/);
});

// @req REQ-187
test("the view lists what the catalogue lists: angles, formats and networks", () => {
  const catalogue = buildCatalogue([
    post({}),
    post({
      id: "x-carrousel",
      links: { content: "carrousel", campaign: "x" },
      channels: { instagram: "publié le 2026-09-13, URL non enregistrée" },
    }),
  ]);
  const text = renderBilan(catalogue, { search: "exemple" });
  assert.match(text, /2 éditions/);
  assert.match(text, /vidéo et carrousel/);
  assert.match(text, /tiktok/);
  assert.match(text, /instagram/);
});

// @req REQ-187
test("a search narrows to the matching subject, accents and case ignored", () => {
  const posts = [
    post({}),
    post({ id: "z", title: "Ivoire", subject: "Pays · Côte d'Ivoire" }),
  ];
  const text = bilan(posts, "cote d'ivoire");
  assert.match(text, /Côte d'Ivoire|cote d'ivoire/i);
  assert.doesNotMatch(text, /Exemple/);
});

// @req REQ-187
test("an edition with no readable format is listed as such rather than guessed", () => {
  const text = bilan([post({ links: undefined, videos: [] })], "exemple");
  assert.match(text, /format non renseigné/);
});
