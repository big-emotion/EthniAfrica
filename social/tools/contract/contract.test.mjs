import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  FAMILIES,
  validateEdition,
  distribution,
  findDuplicateOccurrences,
  applicableChecks,
  staleApprovals,
} from "./contract.mjs";

const fixtures = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./fixtures/editions.json", import.meta.url)),
    "utf8"
  )
);
const clone = (name) => structuredClone(fixtures[name]);
const required = (checks) =>
  checks
    .filter((check) => check.applicability === "required")
    .map((check) => check.id);
const UNIVERSAL = [
  "provenance",
  "uncertainty",
  "attribution",
  "intelligibility",
  "non-essentialising",
];
const published = (extra = {}) => ({
  network: "tiktok",
  status: "published",
  url: null,
  publishedAt: null,
  ...extra,
});

test("exactly six narrative families are recognised", () => {
  assert.deepEqual([...FAMILIES].sort(), [
    "circulation-connections",
    "comparison",
    "guided-listening",
    "historical-portrait",
    "material-biography",
    "name-investigation",
  ]);
});

test("an approved existing name story is a valid edition", () => {
  assert.deepEqual(validateEdition(clone("legacyNameOrigin")), {
    ok: true,
    errors: [],
  });
});

test("a sourced social-only portrait needs no site record and no myth", () => {
  const portrait = clone("socialOnlyPortrait");
  assert.equal(portrait.subject.corpusRef, undefined);
  assert.equal(portrait.myth, undefined);
  assert.equal(validateEdition(portrait).ok, true);
  const checks = applicableChecks(portrait);
  assert.equal(required(checks).includes("myth"), false);
  assert.equal(required(checks).includes("name"), false);
  const myth = checks.find((check) => check.id === "myth");
  assert.equal(myth.applicability, "not-applicable");
  assert.ok(myth.reason.length > 0);
});

test("a repeated angle stays eligible and is not a duplicate", () => {
  const carousel = clone("socialOnlyPortrait");
  const video = {
    ...clone("socialOnlyPortrait"),
    id: "fx-portrait-001-video",
    format: "video",
  };
  carousel.occurrences = [published({ platformPostId: "A1" })];
  video.occurrences = [published({ platformPostId: "B2" })];
  assert.deepEqual(findDuplicateOccurrences([carousel, video]), []);
});

test("the same platform post recorded twice is a duplicate", () => {
  const first = clone("socialOnlyPortrait");
  const second = {
    ...clone("socialOnlyPortrait"),
    id: "fx-portrait-001-again",
  };
  first.occurrences = [published({ platformPostId: "A1" })];
  second.occurrences = [published({ platformPostId: "A1" })];
  assert.equal(findDuplicateOccurrences([first, second]).length, 1);
});

test("publishing on one network does not mark the edition fully distributed", () => {
  const edition = clone("socialOnlyPortrait");
  edition.occurrences = [published()];
  assert.deepEqual(distribution(edition), {
    state: "partial",
    published: ["tiktok"],
    pending: ["instagram"],
  });
});

test("a planned occurrence is not a publication", () => {
  const edition = clone("socialOnlyPortrait");
  edition.occurrences = [{ network: "tiktok", status: "planned" }];
  assert.equal(distribution(edition).state, "none");
});

test("a test-fixture URL never counts as a live publication", () => {
  const edition = clone("socialOnlyPortrait");
  edition.occurrences = [
    published({
      url: "https://example.invalid/x",
      publishedAt: "2026-01-01",
      fixture: true,
    }),
  ];
  assert.equal(distribution(edition).state, "none");
});

test("ready without a date is valid", () => {
  const edition = clone("socialOnlyPortrait");
  assert.equal(edition.plannedDate, undefined);
  assert.equal(validateEdition(edition).ok, true);
});

test("a malformed date is refused, an absent one is not", () => {
  const edition = clone("socialOnlyPortrait");
  edition.plannedDate = "next sunday";
  assert.equal(validateEdition(edition).ok, false);
});

test("a published occurrence with unknown url and date keeps them explicit", () => {
  const edition = clone("socialOnlyPortrait");
  edition.occurrences = [{ network: "tiktok", status: "published" }];
  assert.equal(validateEdition(edition).ok, false);
  edition.occurrences = [published()];
  assert.equal(validateEdition(edition).ok, true);
});

test("an unknown family fails clearly", () => {
  const edition = clone("socialOnlyPortrait");
  edition.family = "free";
  const verdict = validateEdition(edition);
  assert.equal(verdict.ok, false);
  assert.match(verdict.errors.join("\n"), /unknown narrative family "free"/);
  assert.throws(() => applicableChecks(edition), /unknown narrative family/);
});

test("a claim without source evidence fails whatever the family", () => {
  for (const family of FAMILIES) {
    const edition = clone("socialOnlyPortrait");
    edition.family = family;
    edition.claims = [{ id: "c1", kind: "event", sources: [] }];
    const verdict = validateEdition(edition);
    assert.equal(verdict.ok, false, family);
    assert.match(verdict.errors.join("\n"), /claim c1 has no source/);
  }
});

test("universal checks stay required in every family", () => {
  for (const family of FAMILIES) {
    const edition = clone("socialOnlyPortrait");
    edition.family = family;
    const ids = required(applicableChecks(edition));
    assert.deepEqual(
      UNIVERSAL.filter((id) => ids.includes(id)),
      UNIVERSAL,
      family
    );
  }
});

test("conditional checks follow the actual claims and media, not the family", () => {
  const portrait = clone("socialOnlyPortrait");
  portrait.claims.push({ id: "c2", kind: "name-origin" });
  portrait.claims.push({ id: "c3", kind: "route" });
  portrait.myth = { fr: "A widely held belief ?" };
  portrait.media.push({ kind: "music" });
  const ids = required(applicableChecks(portrait));
  for (const id of ["name", "myth", "geography", "music"]) {
    assert.ok(ids.includes(id), id);
  }
});

test("the legacy name series keeps its name-origin gabarit check", () => {
  assert.ok(
    required(applicableChecks(clone("legacyNameOrigin"))).includes(
      "name-origin-gabarit"
    )
  );
  assert.equal(
    required(applicableChecks(clone("socialOnlyPortrait"))).includes(
      "name-origin-gabarit"
    ),
    false
  );
});

test("a changed crop keeps unrelated text approval", () => {
  const approved = [
    { check: "text:card3", inputs: { "copy:card3": "h1", "claim:c1": "h2" } },
    {
      check: "crop:card3:tiktok",
      inputs: { "layout:card3": "h3", "destination:tiktok": "h4" },
    },
  ];
  const current = {
    "copy:card3": "h1",
    "claim:c1": "h2",
    "layout:card3": "CHANGED",
    "destination:tiktok": "h4",
  };
  assert.deepEqual(staleApprovals(approved, current), ["crop:card3:tiktok"]);
});

test("a changed claim invalidates every dependant and nothing else", () => {
  const approved = [
    { check: "text:card3", inputs: { "copy:card3": "h1", "claim:c1": "h2" } },
    { check: "cover:tiktok", inputs: { "copy:cover": "h5", "claim:c1": "h2" } },
    { check: "crop:card3:tiktok", inputs: { "layout:card3": "h3" } },
    { check: "text:card4", inputs: { "copy:card4": "h6", "claim:c9": "h7" } },
  ];
  const current = {
    "copy:card3": "h1",
    "claim:c1": "CHANGED",
    "copy:cover": "h5",
    "layout:card3": "h3",
    "copy:card4": "h6",
    "claim:c9": "h7",
  };
  assert.deepEqual(staleApprovals(approved, current).sort(), [
    "cover:tiktok",
    "text:card3",
  ]);
});

test("an approval whose input has disappeared is stale", () => {
  const approved = [{ check: "audio", inputs: { "audio:mix": "h1" } }];
  assert.deepEqual(staleApprovals(approved, {}), ["audio"]);
});
