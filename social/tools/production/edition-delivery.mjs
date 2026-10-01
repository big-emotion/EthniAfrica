/**
 * Per-destination delivery of one edition.
 *
 * Three things are kept apart on purpose, because the previous progress file
 * fused them: editorial readiness (are the applicable reviews valid for the
 * inputs as they are now), the package (files sealed for one network), and the
 * publication occurrence (a human posting, recorded from evidence). Building a
 * package never records a publication; nothing in this module talks to a
 * network.
 *
 * Contract and meanings: docs/design/gabarits-social/EDITORIAL-CONTRACT.md
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import {
  applicableChecks,
  staleApprovals,
  validateEdition,
} from "../contract/contract.mjs";
import { platformPostId } from "../catalogue/catalogue.mjs";
import { artifact, requireValue } from "./artifacts.mjs";
import { checkDestination } from "./destinations.mjs";
import {
  readFinalDelivery,
  validatePublicationKit,
} from "./publication-kit.mjs";

const nonBlank = (value) => typeof value === "string" && value.trim() !== "";

/**
 * An approval is only as good as the person and evidence behind it. The
 * producer of an artifact cannot be the one who approves it; that is what
 * keeps the review independent when an executor agent rendered the file.
 */
export function recordApproval(approval, { producedBy = null } = {}) {
  requireValue(
    nonBlank(approval?.reviewer?.role) && nonBlank(approval?.reviewer?.id),
    `Approval of ${approval?.check} needs a reviewer role and id`
  );
  requireValue(
    nonBlank(approval.reference),
    `Approval of ${approval.check} needs the actual approval reference`
  );
  requireValue(
    approval.inputs && Object.keys(approval.inputs).length > 0,
    `Approval of ${approval.check} must record the inputs it read`
  );
  requireValue(
    !producedBy || approval.reviewer.id !== producedBy,
    `${approval.reviewer.id} cannot review its own work`
  );
  return approval;
}

// Rights to a piece of music are granted per platform, so that one review is
// bound to its destination. Every other review reads content, which does not
// change with the network.
const DESTINATION_BOUND = new Set(["music"]);

/** Where each applicable review stands for these inputs, and nothing else. */
export function reviewPlan({ edition, network, approvals, inputs }) {
  return applicableChecks(edition).map((check) => {
    if (check.applicability === "not-applicable") {
      return {
        check: check.id,
        status: "not-applicable",
        reason: check.reason,
      };
    }
    const candidates = approvals.filter(
      (approval) =>
        approval.check === check.id &&
        (!DESTINATION_BOUND.has(check.id) ||
          `destination:${network}` in approval.inputs)
    );
    const current = candidates.at(-1);
    if (!current) return { check: check.id, status: "missing" };
    const stale = staleApprovals([current], inputs).length > 0;
    return {
      check: check.id,
      status: stale ? "stale" : "valid",
      reviewer: current.reviewer,
      reference: current.reference,
    };
  });
}

const incompleteChecks = (plan) =>
  plan.filter((row) => !["valid", "not-applicable"].includes(row.status));

const ROLES = ["card", "video", "subtitles", "credits", "copy", "cover"];
const filesOf = (root, artifacts) =>
  ROLES.flatMap((role) => {
    const key = role === "card" ? "cards" : role;
    const paths = [].concat(artifacts[key] ?? []);
    return paths.map((path) => ({ role, ...artifact(root, path) }));
  });

/**
 * Video delivery reuses the sealed engine export and its publication kit as
 * they are; this only reads their paths and length into the shape above.
 */
export function videoArtifacts(root, { delivery, kit }) {
  const { report } = readFinalDelivery(root, delivery);
  const { paths } = validatePublicationKit(root, kit, delivery);
  const folder = dirname(delivery);
  return {
    kind: "video",
    durationSeconds: report.video?.duration,
    video: join(folder, "video.mp4"),
    subtitles: join(folder, "captions.srt"),
    credits: join(folder, "CREDITS.md"),
    copy: paths["publication-copy.md"],
    cover: paths["thumbnail.png"],
  };
}

export function buildEditionManifest(
  root,
  { edition, network, artifacts, approvals, inputs, asOf, producedBy = null }
) {
  const validation = validateEdition(edition);
  requireValue(
    validation.ok,
    `Invalid edition: ${validation.errors.join("; ")}`
  );
  requireValue(
    !edition.intendedNetworks || edition.intendedNetworks.includes(network),
    `${network} is not an intended destination of ${edition.id}`
  );
  const destination = checkDestination(
    {
      network,
      format: edition.format,
      durationSeconds: artifacts.durationSeconds,
      cardCount: artifacts.cards?.length,
    },
    { asOf }
  );
  requireValue(destination.ok, destination.problems.join("; "));
  for (const approval of approvals) recordApproval(approval, { producedBy });
  const plan = reviewPlan({ edition, network, approvals, inputs });
  const open = incompleteChecks(plan);
  requireValue(
    open.length === 0,
    `review not complete: ${open.map((row) => `${row.check} ${row.status}`).join(", ")}`
  );
  return {
    version: 1,
    edition: {
      id: edition.id,
      subject: edition.subject,
      angle: edition.angle,
      family: edition.family,
      format: edition.format,
      ...(edition.series ? { series: edition.series } : {}),
      ...(edition.plannedDate ? { plannedDate: edition.plannedDate } : {}),
    },
    destination: { network, unverifiedLimits: destination.unverified },
    sources: (edition.claims ?? []).map((claim) => ({
      claim: claim.id,
      sources: claim.sources,
    })),
    output: { kind: artifacts.kind, files: filesOf(root, artifacts) },
    reviews: plan,
    // Rendering and review can be complete while nothing has been posted.
    publication: { performed: false },
  };
}

export function buildDeliverySet(root, { networks, ...rest }) {
  return Object.fromEntries(
    networks.map((network) => [
      network,
      buildEditionManifest(root, { ...rest, network }),
    ])
  );
}

export function writeEditionManifest(root, manifest, output) {
  requireValue(
    !isAbsolute(output) && !output.split("/").includes(".."),
    "Package output must be relative and inside the private package"
  );
  const folder = resolve(root, output);
  requireValue(
    !existsSync(folder),
    "Package destination already exists; choose a new version"
  );
  mkdirSync(dirname(folder), { recursive: true });
  mkdirSync(folder);
  writeFileSync(
    join(folder, "edition-package.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { flag: "wx" }
  );
  return artifact(root, join(output, "edition-package.json"));
}

function packageState(root, folder) {
  const path = join(folder, "edition-package.json");
  if (!existsSync(resolve(root, path))) return false;
  const manifest = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  for (const file of manifest.output.files) {
    if (!existsSync(resolve(root, file.path))) return "stale";
    if (artifact(root, file.path).sha256 !== file.sha256) return "stale";
  }
  return true;
}

/**
 * Where each destination stands, read from the disk and the approvals alone, so
 * a session that starts cold resumes without repeating a review or a render.
 */
export function deliveryStatus(
  root,
  { edition, networks, approvals, inputs, packageDir }
) {
  return networks.map((network) => {
    const open = incompleteChecks(
      reviewPlan({ edition, network, approvals, inputs })
    );
    const posted = (edition.occurrences ?? []).some(
      (occurrence) =>
        occurrence.network === network &&
        occurrence.status === "published" &&
        !occurrence.fixture
    );
    return {
      network,
      review: open.length ? "incomplete" : "complete",
      open: open.map((row) => `${row.check} ${row.status}`),
      packaged: packageState(root, packageDir(network)),
      published: posted ? "published" : "none",
    };
  });
}

// Stable identity facts about where each network lives, not platform limits.
const HOSTS = {
  tiktok: ["tiktok.com"],
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.watch"],
  youtube: ["youtube.com", "youtu.be"],
  linkedin: ["linkedin.com"],
  x: ["x.com", "twitter.com"],
};
const onDomain = (host, domain) =>
  host === domain || host.endsWith(`.${domain}`);

function urlOf(value, network) {
  let host;
  try {
    host = new URL(value).hostname;
  } catch {
    throw new Error(`${value} is not a ${network} address`);
  }
  requireValue(
    HOSTS[network]?.some((domain) => onDomain(host, domain)),
    `${value} is not a ${network} address`
  );
}

/**
 * Builds one occurrence entry from what a person actually observed. It cannot
 * invent a URL or a date: unknown is written null and needs the evidence that
 * the post exists. A test record is labelled and unroutable, so no reader can
 * mistake it for a live one.
 */
export function recordOccurrence(edition, entry) {
  const { network, status } = entry;
  requireValue(
    HOSTS[network] && ["planned", "published"].includes(status),
    `Unknown network or status: ${network} ${status}`
  );
  requireValue(
    checkDestination({ network, format: edition.format }).ok,
    `${network} does not accept ${edition.format}`
  );
  if (status === "planned") return { network, status };
  requireValue(
    "url" in entry,
    `A published occurrence must state url (null when unknown)`
  );
  requireValue(
    "publishedAt" in entry,
    `A published occurrence must state publishedAt (null when unknown)`
  );
  const { url, publishedAt } = entry;
  if (entry.fixture) {
    requireValue(
      url === null || new URL(url).hostname.endsWith(".invalid"),
      "A fixture url must be a .invalid address"
    );
    return {
      network,
      status,
      url,
      publishedAt,
      platformPostId: entry.platformPostId ?? null,
      fixture: true,
    };
  }
  const evidence = entry.evidence;
  requireValue(
    (evidence?.attestation === "operator" && nonBlank(evidence.reference)) ||
      (nonBlank(evidence?.path) && nonBlank(evidence?.sha256)),
    "A live occurrence needs evidence: an operator attestation with its reference, or a filed artifact"
  );
  if (url !== null) urlOf(url, network);
  return {
    network,
    status,
    url,
    publishedAt,
    platformPostId: entry.platformPostId ?? platformPostId(network, url),
    evidence,
  };
}
