/**
 * @req REQ-032 — Remove proven render scratch only after actual library filing.
 * CLI: node social/tools/library/cleanup-workshop.mjs --subject <folder> [--write]
 * --post <id> may associate a legacy edition for a read-only backlog survey.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { productionsRoot, publicationsRoot, registryFile } from "../paths.mjs";

const RECORD = "production-record.md";
const SECTIONS = [
  "Subject and angle",
  "Steps and decisions",
  "Cuts",
  "Sources",
  "Reviews",
  "Voice choice",
  "Open points",
];
const STATUS = new Set(["pret", "publie"]);
const digest = (file) =>
  createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function relative(value) {
  if (
    typeof value !== "string" ||
    !value ||
    path.isAbsolute(value) ||
    value
      .split(/[\\/]/)
      .some(
        (part) =>
          !part ||
          part === "." ||
          part === ".." ||
          part.startsWith("_shared-assets")
      )
  )
    throw new Error(`Unsafe relative path: ${value}`);
  return value;
}

/** Check each component, not just the resolved leaf. Never traverse a symlink. */
function checked(root, name = "") {
  if (name) relative(name);
  const target = path.join(root, name);
  let current = path.parse(target).root;
  for (const part of target
    .slice(current.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink())
      throw new Error(`Symlink refused: ${current}`);
  }
  return target;
}

function walk(root, prefix = "", deckAliases = false) {
  const files = [];
  for (const entry of fs.readdirSync(path.join(root, prefix), {
    withFileTypes: true,
  })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.name === ".git" || entry.name === "_shared-assets")
      throw new Error(`Protected directory refused: ${name}`);
    if (entry.isSymbolicLink()) {
      const target = fs.readlinkSync(path.join(root, name));
      const counterpart =
        entry.name === "cards.json"
          ? "cartes.json"
          : entry.name === "cartes.json"
            ? "cards.json"
            : null;
      if (
        !deckAliases ||
        target !== counterpart ||
        !fs.lstatSync(path.join(root, prefix, target)).isFile()
      )
        throw new Error(`Symlink refused: ${name}`);
      files.push({
        path: name,
        bytes: 0,
        nlink: 0,
        mtime: fs.lstatSync(path.join(root, name)).mtimeMs,
        alias: target,
      });
      continue;
    }
    if (entry.isDirectory()) files.push(...walk(root, name, deckAliases));
    else if (entry.isFile()) {
      const stat = fs.lstatSync(path.join(root, name));
      files.push({
        path: name,
        bytes: stat.size,
        ino: stat.ino,
        dev: stat.dev,
        mtime: stat.mtimeMs,
        nlink: stat.nlink,
      });
    } else throw new Error(`Special file refused: ${name}`);
  }
  return files.sort((a, b) => a.path.localeCompare(b.path, "en"));
}

function recordAt(root) {
  const text = fs.readFileSync(checked(root, RECORD), "utf8");
  for (const heading of SECTIONS) {
    const body = text.split(`## ${heading}\n`)[1]?.split(/\n## /)[0]?.trim();
    if (!body || /\b(?:TODO|TBD|PLACEHOLDER)\b|<[^>]+>/.test(body))
      throw new Error(`Incomplete record section: ${heading}`);
  }
  const metadata = JSON.parse(
    text.match(/```production-metadata\s*\n([\s\S]*?)\n```/)?.[1] ?? "null"
  );
  if (
    !metadata ||
    !Array.isArray(metadata.postIds) ||
    !metadata.postIds.length ||
    metadata.postIds.some((id) => typeof id !== "string" || !id)
  )
    throw new Error("Record must declare edition postIds");
  if (!Array.isArray(metadata.keep) || !Array.isArray(metadata.sources))
    throw new Error("Record must declare keep and sources arrays");
  metadata.keep.forEach(relative);
  return { text, metadata };
}

function belongs(post, subject) {
  return (
    post.workshopSubject === subject ||
    post.dir?.split("/")[0] === subject ||
    [post.copy, ...Object.values(post.renderedFrom ?? {})].some(
      (name) => typeof name === "string" && name.startsWith(`${subject}/`)
    )
  );
}

/** Verify the status-derived shelf, all named outputs, and all existing sync sources. */
async function delivered(posts, postsRoot, projects) {
  const shelves = await import(
    pathToFileURL(
      path.join(path.dirname(postsRoot), "00-Index/library-paths.mjs")
    )
  );
  const evidence = [];
  for (const post of posts) {
    if (!STATUS.has(post.status) || post.archived)
      throw new Error(
        `Edition ${post.id} is not filed/published: ${post.status}`
      );
    const shelf = shelves.postRelPath(post);
    if (!/^(Valide\/|Publie\/)/.test(shelf))
      throw new Error(`Edition ${post.id} is not on a deliverable shelf`);
    const folder = checked(postsRoot, shelf);
    const files = walk(folder);
    const media = files.filter(
      (file) =>
        !file.path
          .split("/")
          .some(
            (part) => part.startsWith("_") || /epreuve|proof/i.test(part)
          ) &&
        /\.(mp4|mov|png|jpe?g|webp)$/i.test(file.path) &&
        file.bytes > 0
    );
    if (!media.length)
      throw new Error(`No non-empty deliverable for ${post.id}`);
    for (const name of new Set([
      ...(post.videos ?? []),
      ...Object.keys(post.renderedFrom ?? {}),
    ])) {
      const destination = checked(folder, `video/${relative(name)}`);
      if (!fs.statSync(destination).isFile() || !fs.statSync(destination).size)
        throw new Error(`Empty deliverable: ${post.id}/${name}`);
      const source = post.renderedFrom?.[name];
      if (source && fs.existsSync(path.join(projects, relative(source)))) {
        if (digest(checked(projects, source)) !== digest(destination))
          throw new Error(`Library copy differs: ${post.id}/${name}`);
      }
    }
    evidence.push({
      id: post.id,
      status: post.status,
      shelf,
      date: post.date ?? null,
      channels: post.channels ?? {},
      media: media.map(({ path: name, bytes }) => ({ path: name, bytes })),
    });
  }
  return evidence;
}

/** Public CLI and register-post use the same refuse-by-default implementation. */
export async function cleanupWorkshop({
  subject,
  write = false,
  postIds = [],
}) {
  relative(subject);
  if (
    subject.includes("/") ||
    subject.includes("\\") ||
    subject.startsWith("_")
  )
    throw new Error(
      "Select one top-level subject, never shared/global material"
    );
  const projects = productionsRoot();
  const root = checked(projects, subject);
  const postsRoot = publicationsRoot();
  if (!postsRoot) throw new Error("ETHNIAFRICA_SOCIAL_POSTS is required");
  // Neither overlapping roots nor a subject inside a Git checkout is disposable.
  const library = checked(postsRoot);
  if (
    library === root ||
    library.startsWith(root + path.sep) ||
    root.startsWith(library + path.sep)
  )
    throw new Error("Workshop and library overlap");
  for (let dir = root; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, ".git")))
      throw new Error("Cleanup inside a Git checkout is refused");
    if (dir === path.dirname(dir)) break;
  }
  const ledgerText = fs.readFileSync(registryFile(), "utf8");
  const ledger = JSON.parse(ledgerText);
  const blockers = [];
  let record;
  try {
    record = recordAt(root);
  } catch (error) {
    blockers.push(`Record: ${error.message}`);
  }
  const ids = new Set([...(record?.metadata.postIds ?? []), ...postIds]);
  const posts = ledger.posts.filter(
    (post) => ids.has(post.id) || belongs(post, subject)
  );
  for (const id of ids)
    if (!posts.some((post) => post.id === id))
      blockers.push(`Unknown edition: ${id}`);
  if (!posts.length)
    blockers.push("No ledger edition is bound to this subject");
  if (
    record &&
    posts.some((post) => !record.metadata.postIds.includes(post.id))
  )
    blockers.push("Record omits an associated edition");
  if (write && postIds.some((id) => !record?.metadata.postIds.includes(id)))
    blockers.push(
      "Survey associations cannot authorize deletion; complete the record first"
    );
  let evidence = [];
  try {
    evidence = await delivered(posts, library, projects);
  } catch (error) {
    blockers.push(`Delivery: ${error.message}`);
  }
  const files = walk(root, "", true);
  // Explicit evidence or authored references always win over a generated filename.
  const references = new Set(record?.metadata.keep ?? []);
  const documents = new Map();
  for (const file of files.filter(
    (file) => !file.alias && /\.(json|md|txt|py|sh)$/i.test(file.path)
  )) {
    const text = fs.readFileSync(path.join(root, file.path), "utf8");
    documents.set(file.path, text);
    for (const match of text.matchAll(
      /[\w./-]+\.(?:png|wav|log|pyc|ffconcat)/g
    ))
      references.add(match[0]);
    for (const match of text.matchAll(/["'`]([^"'`\n]+)["'`]/g))
      references.add(match[1]);
  }
  const referencedNames = new Set(
    [...references].map((ref) => path.basename(ref))
  );
  const byPath = new Map(files.map((file) => [file.path, file]));
  const nonempty = (name) => (byPath.get(name)?.bytes ?? 0) > 0;
  const retiredTakes = record?.metadata.retiredTakes ?? [];
  if (!Array.isArray(retiredTakes))
    throw new Error("retiredTakes must be an array");
  const retired = new Map();
  for (const take of retiredTakes) {
    try {
      for (const name of [take.path, take.replacement, take.evidence])
        relative(name);
      if (
        !/(^|\/)work\/.*(?:non-retenue|rejected|discarded).*\.(wav|mp3|m4a)$/.test(
          take.path
        ) ||
        !/^[a-f0-9]{64}$/.test(take.sha256) ||
        !take.reason?.trim()
      )
        throw new Error("Only explicitly rejected audio takes may be retired");
      if (
        !/\.(wav|mp3|m4a)$/.test(take.replacement) ||
        !nonempty(take.replacement) ||
        retiredTakes.some((other) => other.path === take.replacement)
      )
        throw new Error("A retained replacement take is required");
      const work = take.path.slice(0, take.path.indexOf("work/") + 4);
      if (
        !nonempty(`${work}/narration.wav`) ||
        !nonempty(`${work}/aligned-words.json`)
      )
        throw new Error("Approved master and alignment must survive");
      const decision = fs.readFileSync(checked(root, take.evidence), "utf8");
      if (
        !/non.retenu|not retained|rejected|discarded/i.test(decision) ||
        ![
          path.basename(take.path),
          path.basename(path.dirname(take.path)),
        ].some((name) => name !== "work" && decision.includes(name))
      )
        throw new Error("The decision must identify the rejected take");
      if (!byPath.has(take.path)) continue;
      if (digest(checked(root, take.path)) !== take.sha256)
        throw new Error("Rejected take changed");
      for (const [document, text] of documents) {
        if (document === RECORD || document === take.evidence) continue;
        if (text.includes(take.path) || text.includes(path.basename(take.path)))
          throw new Error(`Still referenced by ${document}`);
      }
      if (
        (record.metadata.keep ?? []).some(
          (name) => take.path === name || take.path.startsWith(name + "/")
        )
      )
        throw new Error("Explicit keep overrides retirement");
      retired.set(take.path, {
        ...take,
        replacementSha256: digest(checked(root, take.replacement)),
        evidenceSha256: digest(checked(root, take.evidence)),
      });
    } catch (error) {
      blockers.push(`Retirement ${take.path}: ${error.message}`);
    }
  }
  const frame = (name) =>
    /(^|\/)work\/images(?:-controle)?\/\d{6}\.png$/.test(name);
  function disposable(name) {
    if (frame(name)) return true;
    if (/(^|\/)work\/(?:[^/]+\/)*[^/]+\.(log|ffconcat|pyc)$/.test(name))
      return true;
    if (/(^|\/)work\/(source|paused)\.wav$/.test(name)) {
      const work = path.dirname(name);
      return (
        nonempty(`${work}/narration.wav`) &&
        nonempty(`${work}/aligned-words.json`) &&
        ["tts-corrected.wav", "tts-original.wav"].some((take) =>
          nonempty(`${work}/${take}`)
        )
      );
    }
    return false;
  }
  const candidates = files.filter(
    (file) =>
      (disposable(file.path) || retired.has(file.path)) &&
      file.nlink === 1 &&
      (retired.has(file.path) ||
        (!references.has(file.path) &&
          !referencedNames.has(path.basename(file.path)))) &&
      !(record?.metadata.keep ?? []).some((ref) =>
        file.path.startsWith(ref + "/")
      )
  );
  for (const work of new Set(
    candidates
      .filter((file) => frame(file.path))
      .map((file) => path.dirname(path.dirname(file.path)))
  )) {
    const parent = path.dirname(work);
    for (const name of [
      "narration.wav",
      "aligned-words.json",
      "scene-starts.json",
    ]) {
      if (!nonempty(path.join(work, name)))
        blockers.push(`Missing replay input: ${work}/${name}`);
    }
    if (
      !["cards.json", "cartes.json"].some((name) =>
        nonempty(path.join(parent, name))
      )
    )
      blockers.push(`Missing replay deck beside ${work}`);
  }
  const assets = files.filter(
    (file) =>
      /(^|\/)(assets|photos|couvertures|references|originals|cutouts)\//.test(
        file.path
      ) || /\.(tif|tiff|geojson|zip)$/i.test(file.path)
  );
  const sources = record?.metadata.sources ?? [];
  const assetsWithoutLocator = assets
    .filter(
      (file) =>
        !sources.some(
          (source) =>
            source.file === file.path &&
            typeof source.url === "string" &&
            /^(https?:\/\/|ark:|doi:)/.test(source.url) &&
            [source.author, source.license, source.tier, source.variant].every(
              (value) => String(value ?? "").trim()
            )
        )
    )
    .map((file) => file.path);
  const candidateSet = new Set(candidates.map((file) => file.path));
  const retained = files.filter((file) => !candidateSet.has(file.path));
  const report = {
    subject,
    mode: write ? "write" : "dry-run",
    blockers,
    editions: posts.map((post) => ({ id: post.id, status: post.status })),
    candidateBytes: candidates.reduce((sum, file) => sum + file.bytes, 0),
    candidates: candidates.map(({ path: name, bytes }) => ({
      path: name,
      bytes,
    })),
    delete: blockers.length
      ? []
      : candidates.map(({ path: name, bytes }) => ({ path: name, bytes })),
    bytes: blockers.length
      ? 0
      : candidates.reduce((sum, file) => sum + file.bytes, 0),
    assetsWithoutLocator,
    // Potential only copies, not a claim that a lossy MP4 reconstructs its sources.
    onlyCopyRisks: retained
      .filter((file) => /\.(wav|mp3|m4a|mp4|mov|py|sh)$/i.test(file.path))
      .map((file) => file.path),
    retainedFiles: retained.length,
    retainedBytes: retained.reduce((sum, file) => sum + file.bytes, 0),
    retiredTakes: [...retired.values()],
  };
  if (!write || blockers.length) return report;

  // Revalidate before the first mutation; the library is always read-only here.
  await delivered(posts, library, projects);
  if (fs.readFileSync(registryFile(), "utf8") !== ledgerText)
    throw new Error("Ledger changed during cleanup");
  if (recordAt(root).text !== record.text)
    throw new Error("Production record changed during cleanup");
  for (const take of retired.values()) {
    if (
      digest(checked(root, take.path)) !== take.sha256 ||
      digest(checked(root, take.replacement)) !== take.replacementSha256 ||
      digest(checked(root, take.evidence)) !== take.evidenceSha256
    )
      throw new Error("Retirement evidence or audio changed during cleanup");
  }
  const receipt = (state) =>
    `\n## Cleanup verification\n\n${new Date().toISOString()} — ${report.bytes} bytes of disposable scratch selected.\nThe verified delivery and retained replay inputs are exceptions to the single-record goal.\nAny rejected voice removal is explicitly documented below.\n\n\`\`\`cleanup-state\n${JSON.stringify({ state, bytes: report.bytes, files: candidates.length, evidence, retiredTakes: report.retiredTakes }, null, 2)}\n\`\`\`\n`;
  function writeRecord(state) {
    const written = record.text + receipt(state);
    const descriptor = fs.openSync(
      checked(root, RECORD),
      fs.constants.O_RDWR | fs.constants.O_NOFOLLOW
    );
    try {
      if (fs.fstatSync(descriptor).nlink !== 1)
        throw new Error("Hard-linked record refused");
      fs.writeFileSync(descriptor, written);
      fs.ftruncateSync(descriptor, Buffer.byteLength(written));
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    if (fs.readFileSync(checked(root, RECORD), "utf8") !== written)
      throw new Error("Record re-read verification failed");
  }
  writeRecord("verified-before-deletion");
  for (const file of candidates) {
    const target = checked(root, file.path);
    const stat = fs.lstatSync(target);
    if (
      !stat.isFile() ||
      stat.nlink !== 1 ||
      stat.ino !== file.ino ||
      stat.dev !== file.dev ||
      stat.size !== file.bytes ||
      stat.mtimeMs !== file.mtime
    )
      throw new Error(`File changed during cleanup: ${file.path}`);
    fs.unlinkSync(target);
  }
  writeRecord("complete");
  return report;
}

/** Reporting never runs cleanup or changes the publication/readiness state. */
export function workshopCleanupState(post) {
  if (!post?.workshopSubject) return "workshop unlinked";
  try {
    relative(post.workshopSubject);
    if (
      post.workshopSubject.includes("/") ||
      post.workshopSubject.startsWith("_")
    )
      throw new Error("Invalid subject");
    const root = checked(productionsRoot(), post.workshopSubject);
    const record = recordAt(root);
    const states = [
      ...record.text.matchAll(/```cleanup-state\s*\n([\s\S]*?)\n```/g),
    ];
    const last = JSON.parse(states.at(-1)?.[1] ?? "null");
    const verified = last?.evidence?.find((entry) => entry.id === post.id);
    if (
      last?.state !== "complete" ||
      verified?.status !== post.status ||
      verified?.date !== (post.date ?? null) ||
      JSON.stringify(verified?.channels) !== JSON.stringify(post.channels ?? {})
    )
      return "cleanup pending";
    const writtenAt = fs.statSync(path.join(root, RECORD)).mtimeMs;
    if (walk(root, "", true).some((file) => file.mtime > writtenAt))
      return "cleanup pending (workshop changed)";
    return "scratch cleaned; required inputs kept";
  } catch {
    return "cleanup pending (record or path needs review)";
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const { values } = parseArgs({
      options: {
        subject: { type: "string" },
        post: { type: "string", multiple: true },
        write: { type: "boolean", default: false },
      },
    });
    const report = await cleanupWorkshop({
      subject: values.subject,
      write: values.write,
      postIds: values.post,
    });
    console.log(JSON.stringify(report, null, 2));
    if (report.blockers.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
