/**
 * Register one post in the library ledger, so a subject the chain has written
 * lands on a library shelf instead of staying in the workshop.
 *
 *     node social/tools/library/register-post.mjs --id <slug> --dir <Prefixe-Sujet>/<slug> \
 *       --title "…" --subject "Peuple · X" --pillar "…" --status a-produire \
 *       [--copy _legendes/<slug>.md] [--link-path /fr/atlas/… [--content carrousel]] \
 *       [--video <name>.mp4=<Sujet>/video/<name>.mp4] [--notes "…"] [--write]
 *       [--profile memoires-sonores]
 *     node social/tools/library/register-post.mjs --where <slug>
 *
 * The library's `publications.json` is its single source of truth: every
 * `post.md`, the dashboard and the CSV are generated from it, and a post's shelf
 * is derived from its `status`. No step of the chain ever wrote an entry, so a
 * subject that `structure` validated and `produire` rendered existed only in the
 * workshop, where `build-etat.mjs` does not look — the pipeline state reported it
 * nowhere.
 *
 * This tool does the one thing that was missing and nothing the library's own
 * tools already do: it upserts the entry and creates the post's folder once.
 * Moving folders, regenerating views and copying renders stay with the library.
 * The shelf rule is imported from the library's `library-paths.mjs` rather than
 * restated here, because a second copy of that rule is the one that would drift.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { publicationsRoot } from "../paths.mjs";

/**
 * `publie` is absent on purpose: publishing is the operator's act, and the
 * ledger only files a published post once `date`, `dateKind` and `channels` are
 * filled together — three facts no skill can know.
 */
const CHAIN_STATUSES = ["brouillon", "a-produire", "bloque", "pret"];

function fail(message) {
  console.error(message);
  process.exit(1);
}

let values;
try {
  ({ values } = parseArgs({
    options: {
      id: { type: "string" },
      dir: { type: "string" },
      title: { type: "string" },
      subject: { type: "string" },
      pillar: { type: "string" },
      status: { type: "string" },
      notes: { type: "string" },
      copy: { type: "string" },
      "link-path": { type: "string" },
      campaign: { type: "string" },
      content: { type: "string" },
      profile: { type: "string" },
      video: { type: "string", multiple: true },
      where: { type: "string" },
      write: { type: "boolean", default: false },
    },
  }));
} catch (error) {
  fail(error.message);
}

let profile;
// Intended distribution is distinct from the operator's publication record.
// Read the renderer's profile rather than keeping another network list here.
if (values.profile !== undefined) {
  const profileFile = new URL(
    `../../harness/carousel-profiles/${encodeURIComponent(values.profile)}.json`,
    import.meta.url
  );
  if (!/^[a-z][a-z0-9-]*$/.test(values.profile) || !existsSync(profileFile)) {
    fail(`profil de carrousel inconnu : ${values.profile}`);
  }
  profile = JSON.parse(readFileSync(profileFile, "utf8"));
}

const postsRoot = publicationsRoot();
if (!postsRoot) {
  fail(
    "ETHNIAFRICA_SOCIAL_POSTS n'est pas renseignée — aucune bibliothèque où inscrire le post."
  );
}

// The library keeps its index beside the posts shelf, not inside it:
// `library-paths.mjs` names the shelf directory relative to the library root,
// and the index tools resolve both from that root. So the ledger is found from
// the shelf's parent, and a shelf with no index beside it is refused rather
// than given a new, empty ledger.
const indexDir = path.join(path.dirname(postsRoot), "00-Index");
const ledgerFile = path.join(indexDir, "publications.json");
if (!existsSync(ledgerFile)) fail(`registre introuvable : ${ledgerFile}`);

const original = readFileSync(ledgerFile, "utf8");
const ledger = JSON.parse(original);

// The ledger is edited by hand with targeted replacements and has no version
// history. If parsing and re-serialising it would change a single byte of
// content this registration does not touch — a mixed indentation, a `\u`
// escape, a number written `1.0` — the write would be an unreviewable rewrite
// of the whole file, so it is refused instead.
const indent = original.match(/^[ \t]+(?=")/m)?.[0] ?? "  ";
const trailing = original.endsWith("\n") ? "\n" : "";
const serialize = (value) => JSON.stringify(value, null, indent) + trailing;
if (serialize(ledger) !== original) {
  fail(
    `refus : réécrire ${ledgerFile} changerait des octets que cette inscription ne touche pas ` +
      "(indentation mêlée, échappement \\u, nombre écrit autrement). Rien n'a été écrit."
  );
}

const shelves = await import(
  pathToFileURL(path.join(indexDir, "library-paths.mjs")).href
);

/** The folder a post sits in on disk, or the one its status derives when it has none yet. */
function shelfOf(post) {
  return (
    shelves.findPostRelPath(
      postsRoot,
      post.dir,
      existsSync,
      path.join,
      readdirSync
    ) ?? shelves.postRelPath(post)
  );
}

if (values.where) {
  const post = ledger.posts.find((p) => p.id === values.where);
  if (!post) fail(`aucun post « ${values.where} » dans ${ledgerFile}`);
  console.log(path.join(postsRoot, shelfOf(post)));
  process.exit(0);
}

if (!values.id) fail("--id est obligatoire.");
if (values.status && !CHAIN_STATUSES.includes(values.status)) {
  fail(
    `statut « ${values.status} » refusé : la chaîne n'inscrit que ${CHAIN_STATUSES.join(", ")}. ` +
      "Marquer un post publie est un geste d'opérateur."
  );
}

const existing = ledger.posts.find((p) => p.id === values.id);
if (!existing) {
  for (const field of ["dir", "title", "subject", "pillar", "status"]) {
    if (!values[field])
      fail(`--${field} est obligatoire pour un nouveau post.`);
  }
}
if (values.dir && !/^[^/.][^/]*\/[^/.][^/]*$/.test(values.dir)) {
  fail(`--dir doit être <Prefixe-Sujet>/<slug>, reçu « ${values.dir} ».`);
}
const holder =
  values.dir &&
  ledger.posts.find((p) => p.dir === values.dir && p.id !== values.id);
if (holder)
  fail(`le dossier ${values.dir} appartient déjà à « ${holder.id} ».`);

// A new entry carries every field build-index dereferences without a guard
// (`videos`, `channels`) and the empty values the hand-written entries use.
const post = existing ?? {
  id: values.id,
  dir: values.dir,
  title: values.title,
  subject: values.subject,
  pillar: values.pillar,
  status: values.status,
  date: "",
  dateKind: "",
  videos: [],
  channels: {},
  views: "",
  notes: "",
};

// Assigning an existing key keeps its position and a new key is appended, so
// an entry's field order survives an update. The order of the blocks below is
// the order new keys take, matching the most common hand-written shape.
for (const field of ["dir", "title", "subject", "pillar", "status", "notes"]) {
  if (values[field] !== undefined) post[field] = values[field];
}

const renders = (values.video ?? []).map((pair) => {
  const at = pair.indexOf("=");
  if (at <= 0 || at === pair.length - 1) {
    fail(
      `--video attend <fichier>=<chemin du rendu sous l'atelier>, reçu « ${pair} ».`
    );
  }
  return [pair.slice(0, at), pair.slice(at + 1)];
});

if (values["link-path"] || values.campaign || values.content) {
  const previous = post.links ?? {};
  post.links = {
    ...previous,
    path: values["link-path"] ?? previous.path,
    campaign: values.campaign ?? previous.campaign ?? post.id,
    content:
      values.content ??
      previous.content ??
      (renders.length ? "video" : "carrousel"),
  };
}
if (values.copy !== undefined) post.copy = values.copy;
if (profile) {
  post.profile = profile.id;
  post.intendedChannels = profile.formats.carrousel.map((network) =>
    network.toLowerCase()
  );
}
if (renders.length) {
  // The delivered set replaces the previous one: `sync-deliverables.mjs` copies
  // exactly what `renderedFrom` names, and a stale name would be reported as a
  // missing render on every run.
  post.videos = renders.map(([name]) => name);
  post.renderedFrom = Object.fromEntries(renders);
}

if (!existing) ledger.posts.push(post);

const shelf = shelfOf(post);
console.log(
  `${values.write ? "→" : "·"} ${existing ? "mise à jour" : "ajout"} de « ${post.id} » — ${shelf}`
);
console.log(JSON.stringify(post, null, 2));

if (!values.write) {
  console.log("\nSimulation : rien n'a été écrit. Relancer avec --write.");
  process.exit(0);
}

writeFileSync(ledgerFile, serialize(ledger));

// Created only when the post has no folder anywhere. One sitting in another
// bucket is moved by `migrate-library.mjs`; creating a second would make the
// reconcile refuse the post as present in two buckets.
const folder = path.join(postsRoot, shelf);
if (!existsSync(folder)) {
  mkdirSync(folder, { recursive: true });
  console.log(`dossier créé : ${folder}`);
}

console.log(`
Ensuite :
  node ${path.join(indexDir, "migrate-library.mjs")} --write     # si le statut a changé de bac
  node ${path.join(indexDir, "build-index.mjs")}                 # régénère post.md, README.md, PUBLICATIONS.csv
  node ${path.join(indexDir, "sync-deliverables.mjs")} --write   # si une vidéo est inscrite
  node social/tools/etat-pipeline/build-etat.mjs`);
