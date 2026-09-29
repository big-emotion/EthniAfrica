/**
 * node --test social/tools/catalogue/
 *
 * The registry keeps one entry per format and one free-text string per network.
 * These tests pin how that is read as the contract's subject → angle → edition →
 * occurrence, and what the reader refuses to invent. Fixtures are synthetic:
 * they are shapes, not evidence about any real publication.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  buildCatalogue,
  editionFromPost,
  platformPostId,
  readyEditions,
  reconcileLive,
} from "./catalogue.mjs";

const post = (overrides = {}) => ({
  id: "exemple",
  dir: "Peuples-Exemple/exemple",
  title: "Exemple",
  subject: "Peuple · Exemple",
  pillar: "Ce que ce nom veut dire",
  status: "a-produire",
  date: "",
  dateKind: "",
  videos: [],
  channels: {},
  notes: "",
  links: { path: "/fr/atlas/peuples/PPL_EXEMPLE", content: "video" },
  ...overrides,
});

const ledgerRecord = (campaign, question) => ({
  campaign,
  question: { fr: question },
});
const ledgerBy = (...records) =>
  new Map(records.map((record) => [record.campaign, record]));

// @req REQ-187
test("one subject can carry two angles, each with its own editions", () => {
  const ledger = ledgerBy(
    ledgerRecord("exemple-origine", "D'où vient le nom Exemple ?"),
    ledgerRecord("exemple-frontiere", "Que dit la frontière d'Exemple ?")
  );
  const catalogue = buildCatalogue(
    [
      post({ id: "exemple-origine", links: { campaign: "exemple-origine" } }),
      post({
        id: "exemple-frontiere",
        links: { campaign: "exemple-frontiere" },
      }),
    ],
    { ledger }
  );
  assert.equal(catalogue.subjects.length, 1);
  assert.deepEqual(
    catalogue.subjects[0].angles.map((angle) => angle.id),
    ["exemple-origine", "exemple-frontiere"]
  );
});

// @req REQ-187
test("a carousel and a video on one angle are two editions of it, not a duplicate", () => {
  const ledger = ledgerBy(
    ledgerRecord("exemple", "D'où vient le nom Exemple ?")
  );
  const catalogue = buildCatalogue(
    [
      post({
        id: "exemple",
        status: "publie",
        date: "2026-09-12",
        dateKind: "publication",
        channels: { tiktok: "https://www.tiktok.com/@c/video/111" },
        links: { campaign: "exemple", content: "video" },
      }),
      post({
        id: "exemple-carrousel",
        status: "publie",
        date: "2026-09-12",
        dateKind: "publication",
        channels: { tiktok: "https://www.tiktok.com/@c/photo/222" },
        links: { campaign: "exemple", content: "carrousel" },
      }),
    ],
    { ledger }
  );
  const [angle] = catalogue.subjects[0].angles;
  assert.deepEqual(angle.editions.map((e) => e.format).sort(), [
    "carrousel",
    "video",
  ]);
  assert.deepEqual(catalogue.duplicates, []);
});

// @req REQ-187
test("a same-format republication is a distinct occurrence, never a duplicate", () => {
  const catalogue = buildCatalogue([
    post({
      status: "publie",
      date: "2026-09-12",
      dateKind: "publication",
      channels: { instagram: "https://www.instagram.com/reel/AAA111/" },
      occurrences: [
        {
          network: "instagram",
          status: "published",
          url: "https://www.instagram.com/reel/AAA111/",
          publishedAt: "2026-09-12",
        },
        {
          network: "instagram",
          status: "published",
          url: "https://www.instagram.com/reel/BBB222/",
          publishedAt: "2026-09-27",
        },
      ],
    }),
  ]);
  const [edition] = catalogue.editions;
  assert.equal(edition.occurrences.length, 2);
  assert.deepEqual(catalogue.duplicates, []);
  assert.deepEqual(edition.distribution.published, ["instagram"]);
});

// @req REQ-187
test("the same platform post filed under two entries is reported once", () => {
  const catalogue = buildCatalogue([
    post({
      id: "a",
      status: "publie",
      date: "2026-09-12",
      dateKind: "publication",
      channels: {
        tiktok: "https://www.tiktok.com/@c/video/7682860953662262550",
      },
    }),
    post({
      id: "b",
      status: "publie",
      date: "2026-09-12",
      dateKind: "publication",
      channels: {
        tiktok: "https://www.tiktok.com/@c/photo/7682860953662262550",
      },
    }),
  ]);
  assert.equal(catalogue.duplicates.length, 1);
  assert.deepEqual(catalogue.duplicates[0].editions.sort(), ["a", "b"]);
});

// @req REQ-187
test("one edition published on one of two intended networks is partial", () => {
  const catalogue = buildCatalogue([
    post({
      id: "lecture",
      status: "publie",
      date: "2026-09-27",
      dateKind: "publication",
      intendedChannels: ["tiktok", "instagram"],
      channels: { tiktok: "publié le 2026-09-27, URL non enregistrée" },
    }),
    post({ id: "voisine", subject: "Peuple · Exemple", status: "pret" }),
  ]);
  const lecture = catalogue.editions.find((e) => e.id === "lecture");
  assert.equal(lecture.distribution.state, "partial");
  assert.deepEqual(lecture.distribution.pending, ["instagram"]);
  const voisine = catalogue.editions.find((e) => e.id === "voisine");
  assert.equal(voisine.distribution.state, "none");
});

// @req REQ-187
test("ready with no date stays ready, and a render date is never a planned date", () => {
  const catalogue = buildCatalogue([
    post({ id: "pret-sans-date", status: "pret" }),
    post({
      id: "rendu-le",
      status: "brouillon",
      date: "2026-09-20",
      dateKind: "rendu",
    }),
    post({ id: "planifie", status: "pret", plannedDate: "2026-10-05" }),
  ]);
  const byId = Object.fromEntries(catalogue.editions.map((e) => [e.id, e]));
  assert.equal(byId["pret-sans-date"].readiness, "pret");
  assert.equal(byId["pret-sans-date"].plannedDate, undefined);
  assert.equal(byId["rendu-le"].plannedDate, undefined);
  assert.equal(byId["planifie"].plannedDate, "2026-10-05");
  assert.deepEqual(
    readyEditions(catalogue).map((e) => e.id),
    ["pret-sans-date", "planifie"]
  );
});

// @req REQ-187
test("a missing url or date is kept as unknown, never filled in", () => {
  const edition = editionFromPost(
    post({
      status: "publie",
      date: "",
      dateKind: "",
      channels: {
        youtube: "publié le 2026-09-12, URL non enregistrée",
        tiktok: "https://www.tiktok.com/@c/video/333",
        facebook: "publié le 2026-09-12, https://www.facebook.com/reel/444",
      },
    })
  );
  const by = Object.fromEntries(edition.occurrences.map((o) => [o.network, o]));
  assert.equal(by.youtube.url, null);
  assert.equal(by.youtube.publishedAt, "2026-09-12");
  assert.equal(by.tiktok.url, "https://www.tiktok.com/@c/video/333");
  assert.equal(by.tiktok.publishedAt, null);
  assert.equal(by.facebook.platformPostId, "444");
  assert.equal(by.facebook.publishedAt, "2026-09-12");
});

// @req REQ-187
test("the entry's own publication date is inherited, and labelled as inherited", () => {
  const edition = editionFromPost(
    post({
      status: "publie",
      date: "2026-09-16",
      dateKind: "publication",
      channels: { tiktok: "https://www.tiktok.com/@c/video/555" },
    })
  );
  const [occurrence] = edition.occurrences;
  assert.equal(occurrence.publishedAt, "2026-09-16");
  assert.equal(occurrence.dateSource, "entry");
});

// @req REQ-187
test("platform identity survives the path variants of one post", () => {
  assert.equal(
    platformPostId("tiktok", "https://www.tiktok.com/@c/photo/123"),
    platformPostId("tiktok", "https://www.tiktok.com/@c/video/123")
  );
  assert.equal(
    platformPostId("youtube", "https://www.youtube.com/shorts/abc_DEF-1"),
    "abc_DEF-1"
  );
  assert.equal(
    platformPostId(
      "youtube",
      "https://www.youtube.com/watch?v=abc_DEF-1&feature=youtu.be"
    ),
    "abc_DEF-1"
  );
  assert.equal(
    platformPostId("instagram", "https://www.instagram.com/p/Xy-9/"),
    "Xy-9"
  );
  assert.equal(platformPostId("tiktok", null), null);
});

// @req REQ-187
test("family is resolved from the name ledger only, otherwise left unresolved", () => {
  const ledger = ledgerBy(ledgerRecord("connu", "D'où vient le nom Connu ?"));
  const catalogue = buildCatalogue(
    [
      post({ id: "connu", links: { campaign: "connu", content: "video" } }),
      post({ id: "inconnu", links: { campaign: "inconnu", content: "video" } }),
      post({
        id: "declare",
        family: "historical-portrait",
        angle: { id: "a", question: "q" },
      }),
    ],
    { ledger }
  );
  const byId = Object.fromEntries(catalogue.editions.map((e) => [e.id, e]));
  assert.equal(byId.connu.family, "name-investigation");
  assert.equal(byId.connu.series, "name-origin");
  assert.equal(byId.connu.angle.question, "D'où vient le nom Connu ?");
  assert.equal(byId.inconnu.family, null);
  assert.deepEqual(byId.inconnu.unresolved, ["family", "angle"]);
  assert.equal(byId.declare.family, "historical-portrait");
  assert.deepEqual(
    catalogue.unresolved.map((entry) => entry.id),
    ["inconnu"]
  );
});

// @req REQ-187
test("an unknown declared family is refused, not passed through", () => {
  assert.throws(
    () => editionFromPost(post({ family: "free" })),
    /unknown narrative family "free"/
  );
});

// @req REQ-187
test("a fixture occurrence never counts as live", () => {
  const catalogue = buildCatalogue([
    post({
      status: "pret",
      occurrences: [
        {
          network: "tiktok",
          status: "published",
          url: "https://example.invalid/x",
          publishedAt: "2026-01-01",
          fixture: true,
        },
      ],
    }),
  ]);
  assert.equal(catalogue.editions[0].distribution.state, "none");
});

// @req REQ-187
test("a live post absent from the registry is listed, and a registry post absent from a fully read network is listed", () => {
  const catalogue = buildCatalogue([
    post({
      id: "connue",
      status: "publie",
      date: "2026-09-16",
      dateKind: "publication",
      channels: {
        tiktok: "https://www.tiktok.com/@c/video/111",
        x: "https://x.com/c/status/999",
      },
    }),
  ]);
  const report = reconcileLive(
    catalogue,
    [
      {
        rowId: "R1",
        network: "tiktok",
        url: "https://www.tiktok.com/@c/video/111",
      },
      {
        rowId: "R2",
        network: "tiktok",
        url: "https://www.tiktok.com/@c/video/222",
      },
    ],
    { coverage: ["tiktok", "x"] }
  );
  assert.deepEqual(
    report.matched.map((m) => [m.rowId, m.edition]),
    [["R1", "connue"]]
  );
  assert.deepEqual(
    report.liveNotInRegistry.map((r) => r.rowId),
    ["R2"]
  );
  assert.deepEqual(
    report.registryNotLive.map((o) => [o.edition, o.network]),
    [["connue", "x"]]
  );
});

// @req REQ-187
test("a network the live read did not cover is never judged absent", () => {
  const catalogue = buildCatalogue([
    post({
      id: "connue",
      status: "publie",
      date: "2026-09-16",
      dateKind: "publication",
      channels: { linkedin: "publié le 2026-09-16, URL non enregistrée" },
    }),
  ]);
  const report = reconcileLive(catalogue, [], { coverage: ["tiktok"] });
  assert.deepEqual(report.registryNotLive, []);
});

// @req REQ-187
test("a ready entry whose live rows and name-ledger URLs agree is reported, not flipped", () => {
  const catalogue = buildCatalogue([
    post({ id: "sortie-en-douce", status: "pret" }),
  ]);
  const report = reconcileLive(
    catalogue,
    [
      {
        rowId: "R7",
        network: "instagram",
        url: "https://www.instagram.com/reel/ZZZ/",
        group: "sortie-en-douce",
        publishedAt: "2026-09-21",
        groupMethod: "ledger-url",
      },
    ],
    { coverage: ["instagram"] }
  );
  assert.equal(catalogue.editions[0].readiness, "pret");
  assert.deepEqual(
    report.readyButLive.map((entry) => entry.edition),
    ["sortie-en-douce"]
  );
  assert.equal(report.readyButLive[0].rows[0].rowId, "R7");
});

// @req REQ-187
test("a live row grouped only by caption text is a lead, not a match", () => {
  const catalogue = buildCatalogue([post({ id: "sujet", status: "pret" })]);
  const report = reconcileLive(
    catalogue,
    [
      {
        rowId: "R8",
        network: "facebook",
        url: null,
        group: "sujet",
        groupMethod: "text-rule",
      },
    ],
    { coverage: ["facebook"] }
  );
  assert.deepEqual(report.readyButLive, []);
  assert.deepEqual(
    report.inferredOnly.map((row) => row.rowId),
    ["R8"]
  );
});

// @req REQ-187
test("an entry filed as published with no channel recorded is neither ready nor unpublished", () => {
  const catalogue = buildCatalogue([
    post({
      id: "ancienne",
      status: "publie",
      date: "2026-09-07",
      dateKind: "publication",
      channels: {},
    }),
  ]);
  assert.deepEqual(readyEditions(catalogue), []);
  assert.deepEqual(
    catalogue.publishedWithoutOccurrence.map((edition) => edition.id),
    ["ancienne"]
  );
  assert.equal(catalogue.editions[0].distribution.state, "none");
});

// @req REQ-187
test("the Mémoires sonores profile is the contract's guided-listening series", () => {
  const [edition] = buildCatalogue([
    post({ profile: "memoires-sonores", links: undefined }),
  ]).editions;
  assert.equal(edition.family, "guided-listening");
  assert.equal(edition.series, "memoires-sonores");
  assert.equal(edition.format, "carrousel");
});
