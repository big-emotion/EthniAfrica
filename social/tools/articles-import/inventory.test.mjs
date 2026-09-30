/**
 * The inventory is two registries that do not share identifiers. These tests
 * pin down how an occurrence in one is tied to an occurrence in the other: by
 * identity or by a URL both recorded, never by a similar-looking title.
 *
 *     node --test social/tools/articles-import/
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  extractUrls,
  normalizeUrl,
  reconcile,
  tiktokCreatedOn,
} from "./inventory.mjs";

test("a URL is keyed by what identifies the post, not by its spelling", () => {
  assert.equal(
    normalizeUrl(
      "https://www.youtube.com/watch?v=A99ETtxdxiU&feature=youtu.be"
    ),
    "youtube:A99ETtxdxiU"
  );
  assert.equal(
    normalizeUrl("https://youtube.com/shorts/A99ETtxdxiU"),
    "youtube:A99ETtxdxiU"
  );
  assert.equal(
    normalizeUrl(
      "https://www.tiktok.com/@ethniafrica/photo/7685962182923767062"
    ),
    "tiktok:7685962182923767062"
  );
  assert.equal(
    normalizeUrl("https://www.instagram.com/reel/Ddm53XToG7y/"),
    "instagram:Ddm53XToG7y"
  );
  assert.equal(
    normalizeUrl("https://www.instagram.com/p/Ddm53XToG7y"),
    "instagram:Ddm53XToG7y"
  );
});

test("URLs are read out of the free-text channel notes the library keeps", () => {
  assert.deepEqual(
    extractUrls(
      "publié le 2026-09-16, https://www.youtube.com/shorts/vESK91smqxQ"
    ),
    ["https://www.youtube.com/shorts/vESK91smqxQ"]
  );
  assert.deepEqual(
    extractUrls("publié le 2026-09-16, URL non enregistrée"),
    []
  );
});

test("a TikTok id carries its own creation day", () => {
  assert.equal(
    tiktokCreatedOn(
      "https://www.tiktok.com/@ethniafrica/photo/7685962182923767062"
    ),
    "2026-09-16"
  );
  assert.equal(tiktokCreatedOn("https://youtube.com/shorts/A99ETtxdxiU"), null);
});

const record = (id, extra = {}) => ({
  id,
  title: id,
  status: "publie",
  date: "2026-09-10",
  channels: {},
  links: {},
  ...extra,
});
const campaign = (id, publications = []) => ({
  campaign: id,
  file: `x/${id}.json`,
  publications,
});

test("identity and shared URLs tie records to campaigns; titles never do", () => {
  const result = reconcile({
    records: [
      record("same-id"),
      record("by-url", {
        channels: { youtube: "https://youtube.com/shorts/AAAAAAAAAAA" },
      }),
      record("look-alike", { title: "Lingala" }),
      record("by-campaign-link", { links: { campaign: "grouped" } }),
    ],
    campaigns: [
      campaign("same-id"),
      campaign("other", [
        {
          network: "youtube",
          format: "video",
          url: "https://www.youtube.com/shorts/AAAAAAAAAAA",
        },
      ]),
      campaign("lingala"),
      campaign("grouped"),
    ],
    links: [],
  });
  const groupOf = (id) =>
    result.groups.find((g) => g.records.includes(id))?.campaigns;
  assert.deepEqual(groupOf("same-id"), ["same-id"]);
  assert.deepEqual(groupOf("by-url"), ["other"]);
  assert.deepEqual(groupOf("by-campaign-link"), ["grouped"]);
  assert.deepEqual(groupOf("look-alike"), []);
  assert.ok(
    result.groups.some(
      (g) => g.campaigns.includes("lingala") && g.records.length === 0
    )
  );
  const byUrl = result.groups.find((g) => g.records.includes("by-url"));
  assert.match(byUrl.evidence.join("\n"), /youtube:AAAAAAAAAAA/);
});

test("a curated link needs written evidence, and names records that exist", () => {
  assert.throws(
    () =>
      reconcile({
        records: [record("a")],
        campaigns: [campaign("b")],
        links: [{ record: "a", campaign: "b" }],
      }),
    /evidence/
  );
  assert.throws(
    () =>
      reconcile({
        records: [record("a")],
        campaigns: [campaign("b")],
        links: [{ record: "ghost", campaign: "b", evidence: "x" }],
      }),
    /ghost/
  );
  const result = reconcile({
    records: [record("a")],
    campaigns: [campaign("b")],
    links: [
      { record: "a", campaign: "b", evidence: "same subject, same date" },
    ],
  });
  assert.deepEqual(result.groups[0].records, ["a"]);
  assert.deepEqual(result.groups[0].campaigns, ["b"]);
});

test("a video and its carousel from one workshop subject are one angle", () => {
  const result = reconcile({
    records: [
      record("intro", { workshopSubject: "Intro" }),
      record("intro-carrousel", { workshopSubject: "Intro" }),
    ],
    campaigns: [campaign("intro")],
    links: [],
  });
  assert.deepEqual(result.groups[0].records, ["intro", "intro-carrousel"]);
});

test("the grouping does not depend on input order", () => {
  const records = [
    record("r1", { links: { campaign: "c1" } }),
    record("r2", { links: { campaign: "c1" } }),
    record("r3"),
  ];
  const campaigns = [campaign("c1"), campaign("c2")];
  const a = reconcile({ records, campaigns, links: [] });
  const b = reconcile({
    records: [...records].reverse(),
    campaigns: [...campaigns].reverse(),
    links: [],
  });
  assert.deepEqual(a, b);
});
