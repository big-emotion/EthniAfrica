#!/usr/bin/env node
// @req REQ-186
// Local retention only. Reported publication facts still require agent verification.
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  rmdirSync,
  rmSync,
  openSync,
  fsyncSync,
  closeSync,
} from "node:fs";
import {
  join,
  resolve,
  relative,
  isAbsolute,
  sep,
  dirname,
  extname,
} from "node:path";
import { pathToFileURL } from "node:url";
import { inspectPackage } from "./package.mjs";
import { loadPiece, withPieceLock } from "./workflow.mjs";

const fail = (message) => {
  throw new Error(message);
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const need = (value, name) =>
  typeof value === "string" && value.trim()
    ? value
    : fail(`${name} is required`);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Reject symlinks even when they resolve inside the project: cleanup must own each entry.
function safe(root, path) {
  need(path, "Path");
  const absolute = resolve(root, path);
  const rel = relative(resolve(root), absolute);
  if (isAbsolute(path) || rel === ".." || rel.startsWith(`..${sep}`))
    fail("Path must stay inside the project");
  let at = resolve(root);
  try {
    if (lstatSync(at).isSymbolicLink()) fail("Retention refuses symlinks");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  for (const part of rel.split(sep).filter(Boolean)) {
    at = join(at, part);
    try {
      if (lstatSync(at).isSymbolicLink()) fail("Retention refuses symlinks");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return absolute;
}
function paths(root, id) {
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/.test(id)) fail("Invalid piece identifier");
  return {
    work: safe(root, `.local/productions/${id}`),
    archive: safe(root, `.local/publications/${id}`),
  };
}
function durableWrite(file, bytes) {
  mkdirSync(dirname(file), { recursive: true });
  const fd = openSync(file, "wx");
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function retainFile(root, file, target, category) {
  const bytes = readFileSync(safe(root, file));
  const hash = sha(bytes);
  const extension = /^\.[a-z0-9]{1,8}$/i.test(extname(file))
    ? extname(file).toLowerCase()
    : ".bin";
  const retained = `${category}/${hash}${extension}`;
  const output = safe(target, retained);
  if (!existsSync(output)) durableWrite(output, bytes);
  if (sha(readFileSync(output)) !== hash) fail("Retained file hash changed");
  return { original: file, retained, sha256: hash };
}
function inventory(directory, prefix = "") {
  const files = {};
  for (const name of readdirSync(directory).sort()) {
    if (!prefix && name === ".suivi.lock") continue;
    const file = join(directory, name);
    const rel = prefix + name;
    const stat = lstatSync(file);
    if (stat.isSymbolicLink()) fail("Retention refuses symlinks");
    if (stat.isDirectory()) Object.assign(files, inventory(file, rel + "/"));
    else if (stat.isFile()) files[rel] = sha(readFileSync(file));
    else fail("Unsupported file in production folder");
  }
  return files;
}

export function capturePublication(root, state, network) {
  const { work } = paths(root, state.id);
  const delivery = inspectPackage(
    root,
    state.package.directory,
    state.networks
  );
  const readJSON = (file) => JSON.parse(readFileSync(safe(root, file), "utf8"));
  const config = readJSON(delivery.configFile);
  const dossier = readJSON(delivery.researchFile);
  const copy = readJSON(`${state.package.directory}/public-copy.json`);
  const adaptation = config.networks.find((n) => n.network === network);
  const destination = join(work, ".published");
  const media = delivery.media.map((m) => ({
    ...m,
    ...retainFile(
      root,
      `${state.package.directory}/${m.file}`,
      destination,
      "media"
    ),
  }));
  const evidence = [
    ...new Set([
      ...dossier.sources.map((s) => s.recordFile),
      ...dossier.images.map((i) => i.rightsEvidence),
    ]),
  ].map((file) => retainFile(root, file, destination, "evidence"));
  for (const [file, hash] of Object.entries(delivery.files)) {
    if (sha(readFileSync(safe(root, file))) !== hash)
      fail("Package changed while preserving the publication");
  }
  for (const file of [...media, ...evidence]) {
    if (delivery.files[file.original] !== file.sha256)
      fail("Captured publication differs from the verified package");
  }
  return {
    packageHash: sha(
      readFileSync(safe(root, `${state.package.directory}/package.json`))
    ),
    recordedAt: new Date().toISOString(),
    verification:
      "Reported as the exact approved package; not an automatic check of the social platform",
    cards: copy.cards,
    copy: {
      caption: adaptation.caption,
      firstComment: adaptation.firstComment,
      link: adaptation.link,
      accessibility: {
        route: adaptation.capability.altRoute,
        instruction: adaptation.capability.altInstruction,
        alternativeText: media.map((m) => m.alt),
      },
    },
    sources: dossier.sources,
    claims: dossier.claims,
    images: dossier.images,
    media,
    evidence,
  };
}

function outcomes(state) {
  if (Object.keys(state.reviews).length)
    fail("An editorial review is still pending");
  const lastPublication = state.publications.at(-1);
  if (
    lastPublication &&
    state.corrections.some(
      (c) =>
        c.kind !== "networks" &&
        (c.atRevision && lastPublication.atRevision
          ? c.atRevision > lastPublication.atRevision
          : c.at > lastPublication.snapshot?.recordedAt)
    )
  )
    fail("An unfinished editorial correction is pending after publication");
  const intended = state.intendedNetworks ?? state.networks;
  for (const network of intended) {
    if (
      !state.publications.some((p) => p.network === network) &&
      !state.cancellations?.[network]
    )
      fail(`Missing publication outcome for ${network}`);
  }
  for (const publication of state.publications) {
    if (!publication.snapshot?.media?.length)
      fail(
        "Publication has no preserved version snapshot; reconcile the actual published files before closure"
      );
  }
  for (const proposal of Object.keys(state.corpusProposals ?? {})) {
    const progress = (state.corpusProgress ?? []).filter(
      (p) => p.proposal === proposal
    );
    if (progress.at(-1)?.status !== "verified-live")
      fail(`Corpus correction pending: ${proposal}`);
    if (progress.some((p) => !p.evidenceCurrent))
      fail("Corpus progress evidence changed or missing");
  }
}
function historyText(history) {
  const publications = history.publications
    .map((p) => {
      const s = p.snapshot;
      return `## ${p.network} — ${p.publishedAt}\n\nURL: ${p.url ?? "Unknown (reported publication)"}\n\nEvidence: ${p.evidence}\n\n### Published cards\n\n${s.cards.map((c, i) => `${i + 1}. ${c.text}\n\nAlternative text: ${c.alt}`).join("\n\n")}\n\n### Caption\n\n${s.copy.caption}\n\nFirst comment: ${s.copy.firstComment ?? "None"}\n\n### Final exports\n\n${s.media.map((m) => `- [${m.file}](${m.retained})`).join("\n")}`;
    })
    .join("\n\n");
  // A single embedded record keeps retrieval possible without a permanent approval log.
  return `# Publication history — ${history.subject}\n\n${history.summary}\n\nLessons: ${history.lessons}\n\n${publications}\n\n## Sources, outcomes and retained evidence\n\nThe record below preserves source passages, image URLs/credits, link placement, cancellations and corpus integration evidence. Original paths describe provenance; retained paths resolve inside this history folder.\n\n<!-- retained-record -->\n\`\`\`json\n${JSON.stringify(history, null, 2)}\n\`\`\`\n`;
}
function parseHistory(directory) {
  const text = readFileSync(safe(directory, "history.md"), "utf8");
  const json = /<!-- retained-record -->\n```json\n([\s\S]*)\n```\n$/.exec(
    text
  )?.[1];
  if (!json) fail("Incomplete history record");
  return JSON.parse(json);
}
export function inspectHistory(root, id) {
  const { archive } = paths(root, id);
  const h = parseHistory(archive);
  if (h.schema !== 1 || h.id !== id) fail("Invalid history identity");
  if (historyText(h) !== readFileSync(join(archive, "history.md"), "utf8"))
    fail("History text changed outside its retained record");
  for (const f of h.files) {
    if (sha(readFileSync(safe(archive, f.retained))) !== f.sha256)
      fail("Retained export or evidence hash changed");
  }
  return h;
}
export function listHistory(root, query = "") {
  const area = safe(root, ".local/publications");
  if (!existsSync(area)) return [];
  return readdirSync(area)
    .filter((id) => /^[a-z0-9][a-z0-9-]{0,95}$/.test(id))
    .map((id) => {
      try {
        const h = inspectHistory(root, id);
        return {
          id,
          subject: h.subject,
          publications: h.publications.map(({ network, url, publishedAt }) => ({
            network,
            url,
            publishedAt,
          })),
        };
      } catch (error) {
        return { id, error: error.message };
      }
    })
    .filter((h) =>
      `${h.id} ${h.subject ?? ""}`.toLowerCase().includes(query.toLowerCase())
    );
}

export function archivePiece(root, id, options) {
  const { work, archive } = paths(root, id);
  if (existsSync(archive)) return inspectHistory(root, id);
  need(options.summary, "Consolidated decisions");
  need(options.lessons, "Lessons (or explicitly none)");
  if (!Array.isArray(options.retain))
    fail(
      "List additional irreplaceable evidence, or explicitly use an empty retain list"
    );
  return withPieceLock(root, id, () => {
    const state = loadPiece(root, id);
    outcomes(state);
    const before = inventory(work);
    const staging = archive + `.tmp-${randomUUID()}`;
    mkdirSync(staging, { recursive: true });
    try {
      const retained = [];
      for (const p of state.publications) {
        for (const f of [...p.snapshot.media, ...p.snapshot.evidence]) {
          const source = safe(work, `.published/${f.retained}`);
          if (sha(readFileSync(source)) !== f.sha256)
            fail("Published snapshot hash changed");
          const target = safe(staging, f.retained);
          if (!existsSync(target)) durableWrite(target, readFileSync(source));
          retained.push({
            original: f.original,
            retained: f.retained,
            sha256: f.sha256,
          });
        }
      }
      for (const file of [
        ...new Set([
          ...options.retain,
          ...(state.corpusProgress ?? []).map((p) => p.evidence),
        ]),
      ])
        retained.push(retainFile(root, file, staging, "evidence"));
      const h = {
        schema: 1,
        id,
        subject: state.subject,
        archivedAt: new Date().toISOString(),
        summary: options.summary,
        lessons: options.lessons,
        context: state.context,
        intendedNetworks: state.intendedNetworks ?? state.networks,
        cancellations: state.cancellations ?? {},
        publications: state.publications,
        corpusProposals: state.corpusProposals ?? {},
        corpusProgress: state.corpusProgress ?? [],
        corrections: state.corrections,
        files: [
          ...new Map(
            retained.map((f) => [f.original + f.retained, f])
          ).values(),
        ],
      };
      const text = historyText(h);
      durableWrite(join(staging, "history.md"), text);
      if (!equal(before, inventory(work)))
        fail("Production changed during consolidation");
      // This temporary journal survives an interrupted cleanup; it is not a permanent log.
      durableWrite(
        join(staging, ".cleanup.json"),
        JSON.stringify({ schema: 1, id, historyHash: sha(text), files: before })
      );
      renameSync(staging, archive);
      return inspectHistory(root, id);
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
  });
}
function removeEmpty(directory) {
  for (const name of readdirSync(directory)) {
    if (name === ".suivi.lock") continue;
    const child = join(directory, name);
    if (!lstatSync(child).isDirectory() || lstatSync(child).isSymbolicLink())
      fail("Unexpected file during cleanup; preserve for inspection");
    removeEmpty(child);
    rmdirSync(child);
  }
}
export function cleanupPiece(root, id, afterDelete = () => {}) {
  const { work, archive } = paths(root, id);
  const history = inspectHistory(root, id);
  const journal = join(archive, ".cleanup.json");
  if (!existsSync(work)) {
    if (existsSync(journal)) unlinkSync(journal);
    return history;
  }
  if (!existsSync(journal)) fail("No consolidation journal; refuse cleanup");
  withPieceLock(root, id, () => {
    const plan = JSON.parse(readFileSync(journal, "utf8"));
    if (
      plan.schema !== 1 ||
      plan.id !== id ||
      plan.historyHash !== sha(readFileSync(join(archive, "history.md")))
    )
      fail("Consolidated history changed; refuse cleanup");
    const remaining = inventory(work);
    for (const [file, hash] of Object.entries(remaining)) {
      if (plan.files[file] !== hash)
        fail("Production changed or unexpected file appeared; refuse cleanup");
    }
    for (const [file, hash] of Object.entries(remaining)) {
      const target = safe(work, file);
      if (sha(readFileSync(target)) !== hash)
        fail("Production changed during cleanup");
      unlinkSync(target);
      afterDelete(file);
    }
    removeEmpty(work);
    return history;
  });
  rmdirSync(work);
  unlinkSync(journal);
  return history;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [command, id] = process.argv.slice(2);
    const root = process.cwd();
    const result =
      command === "archive"
        ? archivePiece(root, id, JSON.parse(readFileSync(0, "utf8")))
        : command === "inspect"
          ? inspectHistory(root, id)
          : command === "list"
            ? listHistory(root, id)
            : command === "cleanup"
              ? cleanupPiece(root, id)
              : fail(
                  "Usage: history.mjs archive ID < closure.json | inspect ID | list [QUERY] | cleanup ID"
                );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
