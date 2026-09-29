/**
 * A correction is proposed only where two systems that do not copy each other
 * agree on the same platform post: a live platform read (the audit) and the
 * name ledger's own URL. Everything else stays a lead for a person.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { proposeCorrections } from "./propose.mjs";

const TT = "https://www.tiktok.com/@c/video/111";
const IG = "https://www.instagram.com/reel/AAA/";
const YT = "https://www.youtube.com/shorts/yyy";

const ledger = new Map([
  [
    "sujet",
    {
      campaign: "sujet",
      file: "lieu/001-sujet.json",
      publications: [
        { network: "tiktok", format: "video", url: TT },
        { network: "instagram", format: "video", url: IG },
        { network: "facebook", format: "video" },
      ],
    },
  ],
]);

const row = (rowId, network, url, publishedAt = "2026-09-21") => ({
  rowId,
  network,
  url,
  publishedAt,
  format: "video",
  group: "sujet",
  groupMethod: "ledger-url",
});

// @req REQ-187
test("rows confirmed by the ledger's own url become one correction with two kinds of source", () => {
  const { corrections, leads } = proposeCorrections(
    [
      {
        edition: "sujet",
        format: "video",
        readiness: "pret",
        rows: [
          row("R1", "tiktok", TT),
          row("R2", "instagram", IG),
          row("R3", "youtube", YT),
        ],
      },
    ],
    ledger
  );
  assert.equal(corrections.length, 1);
  assert.deepEqual(corrections[0].channels, { tiktok: TT, instagram: IG });
  assert.equal(corrections[0].date, "2026-09-21");
  assert.deepEqual(corrections[0].sources.map((source) => source.kind).sort(), [
    "live-audit",
    "site-ledger",
  ]);
  assert.deepEqual(
    leads.map((lead) => lead.rowId),
    ["R3"]
  );
});

// @req REQ-187
test("rows that disagree on the date are left to a person", () => {
  const { corrections, leads } = proposeCorrections(
    [
      {
        edition: "sujet",
        rows: [
          row("R1", "tiktok", TT, "2026-09-21"),
          row("R2", "instagram", IG, "2026-09-22"),
        ],
      },
    ],
    ledger
  );
  assert.deepEqual(corrections, []);
  assert.deepEqual(
    leads.map((lead) => lead.rowId),
    ["R1", "R2"]
  );
});

// @req REQ-187
test("an edition with no ledger record proposes nothing", () => {
  const { corrections, leads } = proposeCorrections(
    [
      {
        edition: "orpheline",
        format: "video",
        readiness: "pret",
        rows: [row("R1", "tiktok", TT)],
      },
    ],
    ledger
  );
  assert.deepEqual(corrections, []);
  assert.equal(leads.length, 1);
});

// @req REQ-187
test("a live carousel never marks a video edition published", () => {
  const { corrections, leads } = proposeCorrections(
    [
      {
        edition: "sujet",
        format: "video",
        readiness: "pret",
        rows: [{ ...row("R1", "tiktok", TT), format: "carrousel" }],
      },
    ],
    ledger
  );
  assert.deepEqual(corrections, []);
  assert.deepEqual(
    leads.map((lead) => lead.rowId),
    ["R1"]
  );
});

// @req REQ-187
test("only a ready edition is proposed; a draft that is live is a different fault", () => {
  const { corrections, leads } = proposeCorrections(
    [
      {
        edition: "sujet",
        format: "video",
        readiness: "a-produire",
        rows: [row("R1", "tiktok", TT)],
      },
    ],
    ledger
  );
  assert.deepEqual(corrections, []);
  assert.equal(leads.length, 1);
});
