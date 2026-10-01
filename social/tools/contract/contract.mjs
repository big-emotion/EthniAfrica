/**
 * The shared meaning of family, readiness, publication and approval for the
 * social workshop. Pure functions over plain records: no I/O, no registry
 * access. The private registry, the progress files and the skills each store
 * their own shape; this module is what they must all agree on.
 *
 * Doctrine and field mapping: docs/design/gabarits-social/EDITORIAL-CONTRACT.md
 */

export const CONTRACT_VERSION = 1;

export const FAMILIES = Object.freeze([
  "name-investigation",
  "historical-portrait",
  "circulation-connections",
  "guided-listening",
  "comparison",
  "material-biography",
]);

export const FORMATS = Object.freeze(["video", "carrousel", "texte"]);
// The registry's own vocabulary: `publie` is absent on purpose, publication is
// an occurrence, never a state an edition reaches and stays in.
export const READINESS = Object.freeze([
  "brouillon",
  "a-produire",
  "bloque",
  "pret",
]);
export const NETWORKS = Object.freeze([
  "tiktok",
  "instagram",
  "facebook",
  "youtube",
  "linkedin",
  "x",
]);
const SOURCE_TIERS = ["official", "referenced", "unverified"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const UNIVERSAL_CHECKS = Object.freeze([
  "provenance",
  "uncertainty",
  "attribution",
  "intelligibility",
  "non-essentialising",
]);

const isFamily = (family) => FAMILIES.includes(family);

export function validateEdition(edition) {
  const errors = [];
  if (!edition?.id) errors.push("edition has no id");
  if (!edition?.subject?.key || !edition?.subject?.label) {
    errors.push("subject needs a key and a label");
  }
  if (!edition?.angle?.id) errors.push("angle needs an id");
  if (!isFamily(edition?.family)) {
    errors.push(
      `unknown narrative family "${edition?.family}"; expected one of ${FAMILIES.join(", ")}`
    );
  }
  if (!FORMATS.includes(edition?.format)) {
    errors.push(`unknown format "${edition?.format}"`);
  }
  if (!READINESS.includes(edition?.readiness)) {
    errors.push(`unknown readiness "${edition?.readiness}"`);
  }
  if (edition?.plannedDate !== undefined && !DATE.test(edition.plannedDate)) {
    errors.push(`plannedDate "${edition.plannedDate}" is not YYYY-MM-DD`);
  }

  const claims = edition?.claims ?? [];
  for (const claim of claims) {
    const sources = claim.sources ?? [];
    if (sources.length === 0) {
      errors.push(`claim ${claim.id} has no source`);
    } else if (sources.some((source) => !SOURCE_TIERS.includes(source.tier))) {
      errors.push(`claim ${claim.id} has a source without a valid tier`);
    }
  }
  if (
    edition?.family === "name-investigation" &&
    !claims.some((claim) => claim.kind === "name-origin")
  ) {
    errors.push("a name investigation needs at least one name-origin claim");
  }

  for (const occurrence of edition?.occurrences ?? []) {
    if (!NETWORKS.includes(occurrence.network)) {
      errors.push(`unknown network "${occurrence.network}"`);
    }
    if (!["planned", "published"].includes(occurrence.status)) {
      errors.push(`occurrence status "${occurrence.status}" is not allowed`);
    }
    if (occurrence.status === "published") {
      // Unknown is written null, never omitted: an absent key reads as a
      // forgotten field, an explicit null as a recorded gap.
      for (const key of ["url", "publishedAt"]) {
        if (!(key in occurrence)) {
          errors.push(
            `published occurrence on ${occurrence.network} must state ${key} (null when unknown)`
          );
        }
      }
      if (occurrence.publishedAt && !DATE.test(occurrence.publishedAt)) {
        errors.push(
          `publishedAt "${occurrence.publishedAt}" is not YYYY-MM-DD`
        );
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

const livePublished = (edition) =>
  (edition.occurrences ?? []).filter(
    (occurrence) => occurrence.status === "published" && !occurrence.fixture
  );

export function distribution(edition) {
  const published = [
    ...new Set(livePublished(edition).map((occurrence) => occurrence.network)),
  ];
  const pending = (edition.intendedNetworks ?? []).filter(
    (network) => !published.includes(network)
  );
  const state =
    published.length === 0 ? "none" : pending.length ? "partial" : "complete";
  return { state, published, pending };
}

// Repeated coverage is legitimate; only one platform post filed twice is a
// duplicate, so the key is the platform identity and nothing editorial.
export function findDuplicateOccurrences(editions) {
  const seen = new Map();
  for (const edition of editions) {
    for (const occurrence of livePublished(edition)) {
      const identity = occurrence.platformPostId ?? occurrence.url;
      if (!identity) continue;
      const key = `${occurrence.network}|${identity}`;
      seen.set(key, [...(seen.get(key) ?? []), edition.id]);
    }
  }
  return [...seen]
    .filter(([, owners]) => owners.length > 1)
    .map(([key, editions]) => ({ key, editions }));
}

const claimKinds = (edition) =>
  (edition.claims ?? []).map((claim) => claim.kind);
const mediaKinds = (edition) => (edition.media ?? []).map((item) => item.kind);

export function applicableChecks(edition) {
  if (!isFamily(edition?.family)) {
    throw new Error(`unknown narrative family "${edition?.family}"`);
  }
  const claims = claimKinds(edition);
  const media = mediaKinds(edition);
  const conditional = (id, applies, reason) => ({
    id,
    applicability: applies ? "required" : "not-applicable",
    ...(applies ? {} : { reason }),
  });
  return [
    ...UNIVERSAL_CHECKS.map((id) => ({ id, applicability: "required" })),
    conditional(
      "name",
      claims.includes("name-origin"),
      "no claim about where a name comes from"
    ),
    conditional(
      "myth",
      Boolean(edition.myth),
      "no attested belief is being corrected"
    ),
    conditional(
      "geography",
      claims.some((kind) => ["place", "route", "map"].includes(kind)) ||
        media.includes("map"),
      "no claim or media locates anything"
    ),
    conditional(
      "music",
      claims.includes("music") ||
        media.some((kind) => ["music", "audio-excerpt"].includes(kind)),
      "no music or audio excerpt is used"
    ),
    conditional(
      "name-origin-gabarit",
      edition.series === "name-origin",
      "not part of the name-origin series"
    ),
  ];
}

// An approval is bound to the exact inputs it read, keyed "role:id". Anything
// that changed, or vanished, makes the approval stale; nothing else does. That
// is what lets a crop change leave a text approval standing.
export function staleApprovals(approvals, currentInputs) {
  return approvals
    .filter(({ inputs }) =>
      Object.entries(inputs).some(([key, hash]) => currentInputs[key] !== hash)
    )
    .map(({ check }) => check);
}
