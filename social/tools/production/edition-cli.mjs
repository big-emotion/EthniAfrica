#!/usr/bin/env node
/**
 * Manual entry point for per-destination delivery, occurrences and readings.
 * Every command reads and writes files inside one private package folder; none
 * of them contacts a network or posts anything.
 *
 *   inputs      hash the inputs an approval reads (claims, copy, crops, audio)
 *   status      where each destination stands: review, package, publication
 *   package     seal one destination's files after every applicable review holds
 *   occurrence  file what a person actually posted, from evidence (or a labelled fixture)
 *   observe     add a 7-day / 28-day reading of one filed occurrence
 *
 * Procedure and file shapes: docs/design/gabarits-social/EDITION-DELIVERY.md
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { artifact, digest, requireValue } from "./artifacts.mjs";
import {
  buildEditionManifest,
  deliveryStatus,
  recordOccurrence,
  videoArtifacts,
  writeEditionManifest,
} from "./edition-delivery.mjs";
import { appendObservations, buildObservation } from "./observations.mjs";

const OCCURRENCES = "occurrences.json";
const OBSERVATIONS = "observations.jsonl";
const readJson = (root, path) =>
  JSON.parse(readFileSync(resolve(root, path), "utf8"));

const storedOccurrences = (root) =>
  existsSync(join(root, OCCURRENCES)) ? readJson(root, OCCURRENCES) : [];

function loadEdition(root, path) {
  const edition = readJson(root, path);
  const filed = storedOccurrences(root)
    .filter((entry) => entry.editionId === edition.id)
    .map(({ editionId, ...occurrence }) => occurrence);
  return {
    ...edition,
    occurrences: [...(edition.occurrences ?? []), ...filed],
  };
}

export function computeInputs(root, spec) {
  return Object.fromEntries(
    Object.entries(spec).map(([key, source]) => {
      requireValue(
        typeof source?.text === "string" || typeof source?.path === "string",
        `Input ${key} needs a text or a path`
      );
      return [
        key,
        source.path
          ? artifact(root, source.path).sha256
          : digest(Buffer.from(source.text)),
      ];
    })
  );
}

function artifactsOf(root, spec) {
  return spec.kind === "video" && spec.delivery
    ? videoArtifacts(root, spec)
    : spec;
}

export function run(argv) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      edition: { type: "string" },
      approvals: { type: "string" },
      inputs: { type: "string" },
      spec: { type: "string" },
      artifacts: { type: "string" },
      networks: { type: "string" },
      network: { type: "string" },
      output: { type: "string" },
      "produced-by": { type: "string" },
      "as-of": { type: "string" },
      status: { type: "string" },
      url: { type: "string" },
      "published-at": { type: "string" },
      "evidence-reference": { type: "string" },
      fixture: { type: "boolean" },
      metrics: { type: "string" },
      "observed-at": { type: "string" },
      source: { type: "string" },
      scope: { type: "string" },
      "paid-status": { type: "string" },
      "paid-checked-at": { type: "string" },
      note: { type: "string" },
    },
  });
  const [command, project] = positionals;
  requireValue(project, "Usage: edition-cli.mjs COMMAND PROJECT [options]");
  const root = resolve(project);

  if (command === "inputs")
    return computeInputs(root, readJson(root, values.spec));

  const edition = loadEdition(root, values.edition);
  const context = () => ({
    edition,
    approvals: readJson(root, values.approvals),
    inputs: readJson(root, values.inputs),
    asOf: values["as-of"],
  });

  if (command === "status") {
    return deliveryStatus(root, {
      ...context(),
      networks: values.networks.split(","),
      packageDir: (network) => `package/${edition.id}/${network}`,
    });
  }
  if (command === "package") {
    const manifest = buildEditionManifest(root, {
      ...context(),
      network: values.network,
      artifacts: artifactsOf(root, readJson(root, values.artifacts)),
      producedBy: values["produced-by"] ?? null,
    });
    return writeEditionManifest(
      root,
      manifest,
      values.output ?? `package/${edition.id}/${values.network}`
    );
  }
  if (command === "occurrence") {
    const entry = recordOccurrence(edition, {
      network: values.network,
      status: values.status ?? "published",
      url: values.url ?? null,
      publishedAt: values["published-at"] ?? null,
      ...(values.fixture ? { fixture: true } : {}),
      ...(values["evidence-reference"]
        ? {
            evidence: {
              attestation: "operator",
              reference: values["evidence-reference"],
            },
          }
        : {}),
    });
    const filed = storedOccurrences(root);
    const same = (other) =>
      other.editionId === edition.id &&
      other.network === entry.network &&
      other.status === entry.status &&
      (other.platformPostId ?? other.url) ===
        (entry.platformPostId ?? entry.url) &&
      Boolean(other.fixture) === Boolean(entry.fixture);
    requireValue(
      !filed.some(same) || entry.status === "planned",
      "This occurrence is already filed"
    );
    writeFileSync(
      join(root, OCCURRENCES),
      JSON.stringify([...filed, { editionId: edition.id, ...entry }], null, 2) +
        "\n"
    );
    return entry;
  }
  if (command === "observe") {
    const occurrence = edition.occurrences.find(
      (candidate) =>
        candidate.network === values.network &&
        candidate.status === "published" &&
        Boolean(candidate.fixture) === Boolean(values.fixture)
    );
    const reading = buildObservation({
      editionId: edition.id,
      occurrence,
      observedAt: values["observed-at"],
      source: values.source ?? "manual",
      metrics: readJson(root, values.metrics),
      scope: values.scope,
      paidStatus: values["paid-status"],
      paidCheckedAt: values["paid-checked-at"],
      fixture: Boolean(values.fixture),
      note: values.note,
    });
    return {
      reading,
      ...appendObservations(join(root, OBSERVATIONS), [reading]),
    };
  }
  throw new Error(`Unknown command ${command}`);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(JSON.stringify(run(process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
