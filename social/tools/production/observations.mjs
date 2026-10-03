/**
 * Timestamped readings of one publication occurrence, taken by a person.
 * The method — windows, tolerances, "missing is not zero", paid status — is
 * docs/audience/format-audit-2026-09-26/measurement-protocol.md; this module
 * only refuses a record the protocol would call a note.
 *
 * A reading starts from an occurrence someone actually posted. Finishing a
 * render starts nothing, and a test occurrence can only yield a test reading.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { requireValue } from "./artifacts.mjs";

const HOUR = 3_600_000;
// Protocol: 7 days ± 12 h and 28 days ± 12 h, read as lifetime totals.
const WINDOWS = [
  { name: "7d", days: 7, from: 156, to: 180 },
  { name: "28d", days: 28, from: 648, to: 696 },
];
const METRIC_STATUSES = [
  "observed",
  "zero_shown",
  "hidden",
  "not_read",
  "not_applicable",
];
const PAID = [
  "organic_verified",
  "paid_verified",
  "collaboration_verified",
  "unknown",
];
const WITH_TIMEZONE = /^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/;

function checkMetric(name, metric) {
  const { value, status, label } = metric ?? {};
  requireValue(
    METRIC_STATUSES.includes(status),
    `Metric ${name}: status must be one of ${METRIC_STATUSES.join(", ")}`
  );
  if (["observed", "zero_shown", "hidden"].includes(status))
    requireValue(
      typeof label === "string" && label.trim(),
      `Metric ${name}: copy the label as shown by the tool (label as shown)`
    );
  if (status === "observed")
    requireValue(
      Number.isFinite(value) && value > 0,
      `Metric ${name}: observed needs a positive number; a shown 0 is zero_shown`
    );
  if (status === "zero_shown")
    requireValue(value === 0, `Metric ${name}: zero_shown needs value 0`);
  if (["hidden", "not_read", "not_applicable"].includes(status))
    requireValue(
      value === null,
      `Metric ${name}: ${status} must have value null, never a number`
    );
}

export function buildObservation({
  editionId,
  occurrence,
  observedAt,
  source,
  metrics,
  scope = "single_platform",
  paidStatus = "unknown",
  paidCheckedAt,
  fixture = false,
  note,
}) {
  requireValue(
    occurrence?.status === "published",
    "An observation starts from a published occurrence"
  );
  requireValue(
    Boolean(occurrence.fixture) === fixture,
    fixture
      ? "fixture: true on a live occurrence would label a real record as a test"
      : "A fixture occurrence can only yield a reading labelled fixture: true"
  );
  const identity = occurrence.platformPostId ?? occurrence.url;
  requireValue(identity, "The occurrence has no identity (post id or url)");
  requireValue(
    ["manual", "export"].includes(source),
    "source must be manual or export"
  );
  requireValue(
    WITH_TIMEZONE.test(observedAt ?? ""),
    "observedAt needs a time and a time zone"
  );
  requireValue(
    metrics && Object.keys(metrics).length > 0,
    "An observation needs at least one metric"
  );
  for (const [name, metric] of Object.entries(metrics))
    checkMetric(name, metric);

  const normalisedScope = scope === "meta-combined" ? "combined_meta" : scope;
  requireValue(
    ["single_platform", "combined_meta"].includes(normalisedScope),
    `Unknown scope ${scope}`
  );
  requireValue(
    normalisedScope === "single_platform" ||
      ["instagram", "facebook"].includes(occurrence.network),
    "combined_meta applies to instagram or facebook readings only"
  );
  requireValue(PAID.includes(paidStatus), `Unknown paid status ${paidStatus}`);
  requireValue(
    paidStatus === "unknown" || paidCheckedAt,
    "A verified paid status needs paid_checked_at"
  );

  const timed = WITH_TIMEZONE.test(occurrence.publishedAt ?? "");
  let age = null;
  let window = { name: "other", days: null };
  let windowMet = null;
  const notes = note ? [note] : [];
  if (timed) {
    age = (Date.parse(observedAt) - Date.parse(occurrence.publishedAt)) / HOUR;
    age = Math.round(age * 100) / 100;
    const hit = WINDOWS.find((w) => age >= w.from && age <= w.to);
    window = hit ?? window;
    windowMet = Boolean(hit);
  } else {
    notes.push("publication time unknown: the window cannot be verified");
  }
  return {
    version: 1,
    editionId,
    network: occurrence.network,
    platformPostId: occurrence.platformPostId ?? null,
    url: occurrence.url ?? null,
    publishedAt: occurrence.publishedAt ?? null,
    observedAt,
    ageHours: age,
    window: window.name,
    windowDays: window.days,
    windowMet,
    source,
    scope: normalisedScope,
    paidStatus,
    ...(paidCheckedAt ? { paidCheckedAt } : {}),
    metrics,
    ...(fixture ? { fixture: true } : {}),
    ...(notes.length ? { note: notes.join("; ") } : {}),
  };
}

const keyOf = (o) =>
  [
    o.network,
    o.platformPostId ?? o.url,
    o.observedAt,
    o.scope,
    o.fixture ? "fixture" : "live",
  ].join("|");

/** Append-only; the same reading imported twice is skipped, not duplicated. */
export function appendObservations(file, observations) {
  const known = new Set(
    existsSync(file)
      ? readFileSync(file, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((line) => keyOf(JSON.parse(line)))
      : []
  );
  mkdirSync(dirname(file), { recursive: true });
  let added = 0;
  let skipped = 0;
  for (const observation of observations) {
    if (known.has(keyOf(observation))) {
      skipped += 1;
      continue;
    }
    known.add(keyOf(observation));
    appendFileSync(file, JSON.stringify(observation) + "\n");
    added += 1;
  }
  return { added, skipped };
}
