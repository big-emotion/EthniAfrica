import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildObservation, appendObservations } from "./observations.mjs";

const occurrence = (over = {}) => ({
  network: "tiktok",
  status: "published",
  url: "https://www.tiktok.com/@ethniafrica/photo/7000000000000000001",
  platformPostId: "7000000000000000001",
  publishedAt: "2026-10-02T09:00:00+02:00",
  ...over,
});
const views = {
  views: { value: 320, status: "observed", label: "Video views" },
  saves: { value: null, status: "hidden", label: "Saves" },
};
const observe = (over = {}) =>
  buildObservation({
    editionId: "portrait-carrousel",
    occurrence: occurrence(),
    observedAt: "2026-10-09T09:30:00+02:00",
    source: "manual",
    metrics: views,
    ...over,
  });

// @req REQ-186
test("a snapshot starts from a published occurrence, not from a render", () => {
  assert.throws(
    () => observe({ occurrence: occurrence({ status: "planned" }) }),
    /published occurrence/
  );
  assert.throws(
    () => observe({ occurrence: undefined }),
    /published occurrence/
  );
});

// @req REQ-186
test("a fixture occurrence cannot produce a live observation, and stays labelled", () => {
  const fixture = occurrence({
    fixture: true,
    url: "https://fixture.invalid/tiktok/1",
    platformPostId: "1",
  });
  assert.throws(() => observe({ occurrence: fixture }), /fixture/);
  assert.equal(observe({ occurrence: fixture, fixture: true }).fixture, true);
});

// @req REQ-186
test("an occurrence with no identity cannot be observed", () => {
  assert.throws(
    () =>
      observe({ occurrence: occurrence({ url: null, platformPostId: null }) }),
    /identity/
  );
});

// @req REQ-186
test("age and window are computed from the two timestamps, never typed", () => {
  const seven = observe();
  assert.equal(seven.ageHours, 168.5);
  assert.equal(seven.window, "7d");
  assert.equal(seven.windowMet, true);
  const twentyEight = observe({ observedAt: "2026-10-30T09:00:00+02:00" });
  assert.equal(twentyEight.window, "28d");
  const early = observe({ observedAt: "2026-10-04T09:00:00+02:00" });
  assert.equal(early.window, "other");
  assert.equal(early.windowMet, false);
});

// @req REQ-186
test("a date-only publication leaves the window unverifiable rather than guessed", () => {
  const dated = observe({
    occurrence: occurrence({ publishedAt: "2026-10-02" }),
  });
  assert.equal(dated.window, "other");
  assert.equal(dated.windowMet, null);
  assert.match(dated.note, /publication time unknown/);
});

// @req REQ-186
test("missing is not zero: each status carries only the value it allows", () => {
  const snapshot = observe();
  assert.equal(snapshot.metrics.saves.value, null);
  assert.equal(snapshot.metrics.saves.status, "hidden");
  assert.throws(
    () =>
      observe({
        metrics: { views: { value: 0, status: "hidden", label: "Views" } },
      }),
    /hidden.*null/
  );
  assert.throws(
    () =>
      observe({
        metrics: {
          views: { value: null, status: "zero_shown", label: "Views" },
        },
      }),
    /zero_shown.*0/
  );
  assert.throws(
    () => observe({ metrics: { views: { value: 5, status: "observed" } } }),
    /label as shown/
  );
  assert.throws(
    () =>
      observe({
        metrics: { views: { value: 5, status: "guessed", label: "Views" } },
      }),
    /status/
  );
});

// @req REQ-186
test("a combined Meta reading stays one record and is never split", () => {
  const combined = observe({
    occurrence: occurrence({
      network: "instagram",
      url: "https://www.instagram.com/reel/abc/",
      platformPostId: "abc",
    }),
    scope: "meta-combined",
  });
  assert.equal(combined.scope, "combined_meta");
  assert.throws(
    () => observe({ scope: "combined_meta" }),
    /combined_meta.*instagram or facebook/
  );
});

// @req REQ-186
test("paid status defaults to unknown and is verified only with a check date", () => {
  assert.equal(observe().paidStatus, "unknown");
  assert.throws(
    () => observe({ paidStatus: "organic_verified" }),
    /paid_checked_at/
  );
  const verified = observe({
    paidStatus: "organic_verified",
    paidCheckedAt: "2026-10-09T09:31:00+02:00",
  });
  assert.equal(verified.paidStatus, "organic_verified");
});

// @req REQ-186
test("import is append-only and idempotent on the same reading", () => {
  const dir = mkdtempSync(join(tmpdir(), "observations-"));
  try {
    const file = join(dir, "observations.jsonl");
    const snapshot = observe();
    assert.deepEqual(appendObservations(file, [snapshot]), {
      added: 1,
      skipped: 0,
    });
    assert.deepEqual(appendObservations(file, [snapshot]), {
      added: 0,
      skipped: 1,
    });
    const later = observe({ observedAt: "2026-10-30T09:00:00+02:00" });
    assert.deepEqual(appendObservations(file, [later]), {
      added: 1,
      skipped: 0,
    });
    assert.equal(readFileSync(file, "utf8").trim().split("\n").length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
