/**
 * The catalogue report is a generated view: it may not say anything the
 * catalogue does not, and it must not turn "not yet published" into a count of
 * subjects the workshop owes.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildCatalogue } from "./catalogue.mjs";
import { renderReport } from "./report-view.mjs";

const entry = (overrides) => ({
  id: "a",
  dir: "S/a",
  title: "A",
  subject: "Peuple · A",
  pillar: "p",
  status: "pret",
  date: "",
  dateKind: "",
  videos: [],
  channels: {},
  notes: "",
  links: { content: "video" },
  ...overrides,
});

// @req REQ-187
test("ready editions, partial ones and unresolved identities are separate lists that add up", () => {
  const catalogue = buildCatalogue([
    entry({ id: "ready" }),
    entry({
      id: "half",
      status: "publie",
      date: "2026-09-27",
      dateKind: "publication",
      intendedChannels: ["tiktok", "instagram"],
      channels: { tiktok: "publié le 2026-09-27, URL non enregistrée" },
    }),
    entry({
      id: "out",
      status: "publie",
      date: "2026-09-12",
      dateKind: "publication",
      channels: { youtube: "publié le 2026-09-12, URL non enregistrée" },
    }),
  ]);
  const text = renderReport(catalogue);
  assert.match(text, /3 éditions/);
  assert.match(text, /Prêtes, jamais publiées \(1\)[\s\S]*ready/);
  assert.match(text, /Publiées en partie \(1\)[\s\S]*half[\s\S]*instagram/);
  assert.match(text, /Identité à résoudre \(3\)/);
});

// @req REQ-187
test("no line invites a count of unpublished subjects", () => {
  const text = renderReport(buildCatalogue([entry({})]));
  assert.doesNotMatch(text, /sujets? non publiés?|à publier\b/i);
});

// @req REQ-187
test("a reconciliation section appears only when a live read was given", () => {
  const catalogue = buildCatalogue([entry({})]);
  assert.doesNotMatch(renderReport(catalogue), /Lecture en ligne/);
  const withLive = renderReport(catalogue, {
    reconciliation: {
      matched: [],
      liveNotInRegistry: [{ rowId: "R9", network: "tiktok", url: null }],
      readyButLive: [],
      inferredOnly: [],
      registryNotLive: [],
      unjudged: 0,
    },
    proposals: { corrections: [], leads: [] },
  });
  assert.match(withLive, /Lecture en ligne/);
  assert.match(withLive, /R9/);
});
