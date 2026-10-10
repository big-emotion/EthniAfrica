#!/usr/bin/env node
// @req REQ-186
// Assemble verified local media and operator-supplied copy. Never post or schedule.
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  copyFileSync,
} from "node:fs";
import { resolve, relative, isAbsolute, dirname, join, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assessResearch } from "./research.mjs";
const TOOL_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const fail = (m) => {
  throw new Error(m);
};
const text = (s, label) =>
  typeof s === "string" && s.trim() ? s : fail(`${label} is required`);
const sha = (b) => createHash("sha256").update(b).digest("hex");
function path(root, file) {
  text(file, "Path");
  const abs = resolve(root, file),
    rel = relative(resolve(root), abs);
  if (
    isAbsolute(file) ||
    rel === ".." ||
    rel.startsWith(`..${sep}`) ||
    file !== rel.split(sep).join("/")
  )
    fail("Path must be canonical inside the project");
  let parent = abs;
  while (!existsSync(parent)) parent = dirname(parent);
  const real = relative(realpathSync(root), realpathSync(parent));
  if (real === ".." || real.startsWith(`..${sep}`))
    fail("Path resolves outside the project");
  return abs;
}
function https(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") throw Error();
    return value;
  } catch {
    fail("HTTPS link is required");
  }
}
function date(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    fail("Account verification date is required");
}
function limit(value, max, label) {
  if (!Number.isInteger(max) || max < 1)
    fail(`Verified ${label} limit is required`);
  if ([...value].length > max)
    fail(`${label} exceeds the verified account limit`);
}
function run(script, args) {
  try {
    return execFileSync(process.execPath, [script, ...args], {
      cwd: TOOL_ROOT,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: 60000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    fail(String(e.stderr || e.stdout || e.message).trim());
  }
}
function assemble(root, configFile, networks) {
  const dependencies = {};
  const read = (file) => {
    const bytes = readFileSync(path(root, file));
    dependencies[file] = sha(bytes);
    return bytes;
  };
  const config = JSON.parse(read(configFile));
  if (config.schema !== 1) fail("Unsupported package schema");
  if (
    !Array.isArray(networks) ||
    !networks.length ||
    new Set(networks).size !== networks.length
  )
    fail("Selected networks are required");
  if (
    !Array.isArray(config.networks) ||
    config.networks.length !== networks.length ||
    new Set(config.networks.map((n) => n.network)).size !== networks.length ||
    config.networks.some((n) => !networks.includes(n.network))
  )
    fail("Package networks do not match the selected networks");
  const research = assessResearch(root, config.research, { forDelivery: true });
  Object.assign(dependencies, research.dependencies);
  for (const file of [
    config.input,
    config.render,
    config.design,
    config.assets,
  ])
    path(root, file);
  run(join(TOOL_ROOT, "social/renderer/render.mjs"), [
    "verify",
    path(root, config.input),
    path(root, config.render),
    `--design=${path(root, config.design)}`,
    `--assets=${path(root, config.assets)}`,
  ]);
  const report = JSON.parse(read(`${config.render}/report.json`));
  if (report.mode !== "final" || !report.productionReady)
    fail("Only a final render may enter the package");
  read(config.input);
  read(`${config.render}/review.html`);
  for (const d of report.dependencies) {
    const base = d.kind === "renderer" ? "social/renderer" : config[d.kind];
    if (!base) fail("Unknown renderer dependency");
    const file = `${base}/${d.path}`;
    if (sha(read(file)) !== d.sha256) fail("Renderer dependency changed");
  }
  const media = report.cards.map((c) => {
    read(`${config.render}/${c.file}`);
    return {
      id: c.id,
      file: c.file,
      sha256: c.sha256,
      alt: text(c.alt, "Alternative text"),
    };
  });
  const sourceInput = JSON.parse(read(config.input));
  const dossier = JSON.parse(read(config.research));
  for (const card of sourceInput.cards) {
    for (const asset of [
      card.image?.src,
      ...(card.insets ?? []).map((i) => i.src),
    ].filter(Boolean)) {
      if (!dossier.images.some((i) => i.file === `${config.assets}/${asset}`))
        fail(`Rendered image has no research/rights record: ${asset}`);
    }
  }
  const credits = sourceInput.cards.map((c, i) => ({
    file: media[i].file,
    source: c.source ?? "",
    credit: c.credit ?? "",
  }));
  const blocks = [];
  const publicCopy = {
    cards: report.cards.map((c) => ({ text: c.visibleText, alt: c.alt })),
    networks: [],
  };
  for (const n of config.networks) {
    if (
      !["instagram", "facebook", "tiktok", "youtube", "x"].includes(n.network)
    )
      fail("Unknown network");
    text(n.caption, "Caption");
    if (n.firstComment !== null) text(n.firstComment, "First comment");
    const c = n.capability;
    if (!c || c.format !== "photo-carousel")
      fail("Verified photo-carousel account route is required");
    text(c.account, "Account");
    date(c.checkedAt);
    text(c.observation, "Account observation");
    read(c.evidence);
    if (!Number.isInteger(c.maxCards) || c.maxCards < media.length)
      fail("Media count exceeds verified account limit");
    limit(n.caption, c.captionMax, "caption");
    if (n.firstComment !== null) limit(n.firstComment, c.commentMax, "comment");
    if (!["native", "description", "unavailable"].includes(c.altRoute))
      fail("Verified alternative text route is required");
    text(c.altInstruction, "Alternative text instruction");
    if (c.altRoute === "native")
      for (const m of media) limit(m.alt, c.altMax, "alternative text");
    if (
      c.altRoute === "description" &&
      !media.every((m) => n.caption.includes(m.alt))
    )
      fail("Description must contain the complete alternative text");
    if (n.network === "tiktok") {
      const p = n.captionPreference;
      if (!p) fail("TikTok caption preference must be recorded");
      read(p.evidence);
      limit(n.caption, p.maxLength, "TikTok preferred caption");
    }
    const link = n.link;
    if (
      !link ||
      !["none", "profile", "first-comment", "caption"].includes(link.placement)
    )
      fail("Unsupported link route; no pinned-comment assumption");
    let instruction = "Aucun lien à ajouter.";
    if (link.placement !== "none") {
      https(link.url);
      if (
        research.destination.status !== "verified" ||
        research.destination.url !== link.url
      )
        fail("Link does not match the verified destination");
      if (
        !Array.isArray(c.linkPlacements) ||
        !c.linkPlacements.includes(link.placement)
      )
        fail("Account link route was not verified");
      if (
        link.placement === "caption" &&
        ["instagram", "facebook", "tiktok"].includes(n.network)
      )
        fail(
          "This workflow does not rely on a clickable caption link for this network"
        );
      if (link.placement === "first-comment" && n.network !== "facebook")
        fail(
          "First-comment link route is reserved for verified Facebook delivery"
        );
      if (link.placement === "first-comment") {
        if (!n.firstComment?.includes(link.url))
          fail("First comment must contain the destination URL");
        instruction =
          "Ajouter le premier commentaire ci-dessus après la publication.";
      }
      if (link.placement === "caption") {
        if (!n.caption.includes(link.url))
          fail("Caption must contain the destination URL");
        instruction = "Le lien se trouve dans la légende ci-dessus.";
      }
      if (link.placement === "profile")
        instruction = `Le lien du profil a été vérifié : ${link.url}`;
    } else if (
      n.caption.includes("https://") ||
      n.firstComment?.includes("https://")
    )
      fail("Copy includes a URL but declares no link route");
    blocks.push(
      `## ${n.network}\n\n### Légende\n\n${n.caption}\n\n### Premier commentaire\n\n${n.firstComment ?? "Aucun"}\n\n### Placement du lien\n\n${instruction}\n\n### Accessibility\n\n${c.altInstruction}\n\n${media.map((m) => `**${m.file}**\n\n${m.alt}`).join("\n\n")}`
    );
    publicCopy.networks.push({
      caption: n.caption,
      comment: n.firstComment ?? "Aucun",
      alternativeText: media.map((m) => m.alt),
    });
  }
  const bibliography = dossier.sources
    .map((s) => `${s.citation} · ${s.locator}`)
    .join("\n\n");
  const imageRights = dossier.images
    .map((i) => `${i.credit} · ${i.sourcePage} · ${i.reuseBasis}`)
    .join("\n\n");
  publicCopy.credits = dossier.images.map((i) => ({ text: i.credit }));
  const post = `# Publication package\n\nReady for approval 3. Package generation does not publish or schedule.\n\n## Media order\n\n${media.map((m) => `- [${m.file}](${m.file})`).join("\n")}\n\n${blocks.join("\n\n")}\n\n## Sources and credits\n\n${credits.map((c) => `**${c.file}**\n\n${c.source}\n\n${c.credit}`).join("\n\n")}\n\n## Full references\n\n${bibliography}\n\n## Image reuse\n\n${imageRights || "No additional image record supplied; review completeness before approval."}\n`;
  return {
    schema: 1,
    configFile,
    networks: [...networks],
    dependencies,
    media,
    post,
    publicCopy,
    researchFile: config.research,
  };
}
function checkLanguage(root, config, copyFile) {
  const output = run(join(TOOL_ROOT, "node_modules/tsx/dist/cli.mjs"), [
    join(TOOL_ROOT, "scripts/ci/checkPlainLanguage.ts"),
    "--strict",
    path(root, config.input),
    path(root, `${config.render}/report.json`),
    copyFile,
  ]);
  return output;
}
export function createPackage(root, configFile, output, networks) {
  const target = path(root, output);
  if (existsSync(target)) fail("Package output already exists");
  const data = assemble(root, configFile, networks);
  const { post, publicCopy, ...manifest } = data;
  const config = JSON.parse(readFileSync(path(root, configFile)));
  mkdirSync(dirname(target), { recursive: true });
  const lock = target + ".lock";
  mkdirSync(lock);
  const staging = target + `.tmp-${randomUUID()}`;
  try {
    if (existsSync(target)) fail("Package output already exists");
    mkdirSync(staging);
    writeFileSync(join(staging, "post.md"), post);
    writeFileSync(
      join(staging, "public-copy.json"),
      JSON.stringify(publicCopy, null, 2) + "\n"
    );
    for (const m of data.media)
      copyFileSync(
        path(root, `${config.render}/${m.file}`),
        join(staging, m.file)
      );
    const log = checkLanguage(root, config, join(staging, "public-copy.json"));
    writeFileSync(join(staging, "editorial-check.txt"), log);
    const files = Object.fromEntries(
      readdirSync(staging).map((f) => [f, sha(readFileSync(join(staging, f)))])
    );
    writeFileSync(
      join(staging, "package.json"),
      JSON.stringify({ ...manifest, files }, null, 2) + "\n"
    );
    // Inspect the complete revision before its atomic publication to the output folder.
    inspectPackage(
      root,
      relative(root, staging).split(sep).join("/"),
      networks
    );
    renameSync(staging, target);
    return manifest;
  } finally {
    rmSync(staging, { recursive: true, force: true });
    rmSync(lock, { recursive: true, force: true });
  }
}
export function inspectPackage(root, output, networks) {
  const target = path(root, output);
  const manifestFile = `${output}/package.json`;
  const m = JSON.parse(readFileSync(path(root, manifestFile)));
  const data = assemble(root, m.configFile, networks);
  for (const field of [
    "schema",
    "configFile",
    "networks",
    "dependencies",
    "media",
    "researchFile",
  ])
    if (JSON.stringify(m[field]) !== JSON.stringify(data[field]))
      fail(`Package ${field} changed; regenerate this revision`);
  const expectedFiles = [
    "post.md",
    "public-copy.json",
    "editorial-check.txt",
    ...data.media.map((x) => x.file),
  ].sort();
  if (
    JSON.stringify(Object.keys(m.files ?? {}).sort()) !==
      JSON.stringify(expectedFiles) ||
    JSON.stringify(readdirSync(target).sort()) !==
      JSON.stringify([...expectedFiles, "package.json"].sort())
  )
    fail("Package file list is incomplete or unexpected");
  const files = { ...data.dependencies };
  for (const [name, digest] of Object.entries(m.files)) {
    const file = `${output}/${name}`;
    const actual = sha(readFileSync(path(root, file)));
    if (actual !== digest) fail(`Package file changed: ${name}`);
    files[file] = actual;
  }
  if (
    readFileSync(join(target, "post.md"), "utf8") !== data.post ||
    readFileSync(join(target, "public-copy.json"), "utf8") !==
      JSON.stringify(data.publicCopy, null, 2) + "\n"
  )
    fail("Package copy differs from the supplied copy");
  for (const card of data.media)
    if (m.files[card.file] !== card.sha256)
      fail("Packaged media differs from the verified render");
  checkLanguage(
    root,
    JSON.parse(readFileSync(path(root, m.configFile))),
    join(target, "public-copy.json")
  );
  files[manifestFile] = sha(readFileSync(path(root, manifestFile)));
  return { ...m, files };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const [command, input, output, ...networks] = process.argv.slice(2);
    const result =
      command === "create"
        ? createPackage(process.cwd(), input, output, networks)
        : command === "verify"
          ? inspectPackage(
              process.cwd(),
              input,
              [output, ...networks].filter(Boolean)
            )
          : fail(
              "Usage: package.mjs create CONFIG OUTPUT NETWORK... | verify OUTPUT NETWORK..."
            );
    console.log(
      JSON.stringify(
        {
          media: result.media.length,
          networks: result.networks,
          publication: "not performed",
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
