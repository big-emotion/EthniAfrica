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
  mkdtempSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, relative, isAbsolute, dirname, join, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assessResearch } from "./research.mjs";
import {
  loadSequence,
  frameCount,
} from "../../../../social/video/sequence.mjs";
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
function urls(value) {
  return (value.match(/https?:\/\/[^\s<>"`]+/g) ?? []).map((url) =>
    url.replace(/[.,;]+$/, "")
  );
}
function networkMedia(media, alternatives) {
  if (alternatives === undefined) return media;
  if (
    !Array.isArray(alternatives) ||
    alternatives.length !== media.length ||
    new Set(alternatives.map((a) => a?.file)).size !== media.length ||
    alternatives.some((a) => !media.some((m) => m.file === a?.file))
  )
    fail("Network alternative text must cover each image exactly once");
  return media.map((m) => ({
    ...m,
    alt: text(
      alternatives.find((a) => a.file === m.file).text,
      "Alternative text"
    ),
  }));
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
function researchRecords(read, config) {
  const dossier = JSON.parse(read(config.research));
  const creditUrls = new Set(
    dossier.images.flatMap((i) => [
      i.sourcePage,
      ...urls(read(i.rightsEvidence).toString("utf8")),
    ])
  );
  return { dossier, creditUrls };
}
function cardDelivery(root, config, read) {
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
  const payload = {};
  const media = report.cards.map((c) => {
    payload[c.file] = read(`${config.render}/${c.file}`);
    return {
      id: c.id,
      file: c.file,
      sha256: c.sha256,
      alt: text(c.alt, "Alternative text"),
    };
  });
  const sourceInput = JSON.parse(read(config.input));
  const records = researchRecords(read, config);
  for (const card of sourceInput.cards) {
    for (const asset of [
      card.image?.src,
      ...(card.insets ?? []).map((i) => i.src),
    ].filter(Boolean)) {
      if (
        !records.dossier.images.some(
          (i) => i.file === `${config.assets}/${asset}`
        )
      )
        fail(`Rendered image has no research/rights record: ${asset}`);
    }
  }
  const credits = sourceInput.cards.map((c, i) => ({
    file: media[i].file,
    source: c.source ?? "",
    credit: c.credit ?? "",
  }));
  return {
    ...records,
    media,
    payload,
    describable: media,
    format: "photo-carousel",
    checkCapability(c) {
      if (!Number.isInteger(c.maxCards) || c.maxCards < media.length)
        fail("Media count exceeds verified account limit");
    },
    accessibility: () => "",
    publicCopy: {
      cards: report.cards.map((c) => ({ text: c.visibleText, alt: c.alt })),
    },
    mediaOrder: media.map((m) => `- [${m.file}](${m.file})`).join("\n"),
    screenSection: "",
    credits: credits
      .map((c) => `**${c.file}**\n\n${c.source}\n\n${c.credit}`)
      .join("\n\n"),
  };
}
// Every text the viewer reads in the video, in screen order, so the strict
// language check covers subtitles and map text, not only the captions.
function screenText(seq) {
  const strings = (items, key) =>
    (items ?? []).map((item) => item[key]).filter((v) => typeof v === "string");
  const map = (part) => [
    ...strings(part.names, "name"),
    ...strings(part.places, "name"),
    ...strings(part.features, "name"),
    ...strings(part.legend, "label"),
    ...(part.caption
      ? [
          `Carte : ${part.caption.carte}`,
          `Période : ${part.caption.periode}`,
          `Source : ${part.caption.source}`,
        ]
      : []),
  ];
  if (!seq.chapters) return [seq.title, ...map(seq)];
  const chunks = (part) =>
    (part?.sentences ?? []).flat().map((chunk) => chunk.text);
  return [
    seq.title,
    ...chunks(seq.intro),
    ...seq.chapters.flatMap((chapter) => [
      chapter.title,
      ...map(chapter),
      ...chunks(chapter),
    ]),
    ...chunks(seq.outro),
    ...(seq.ending?.sentence ? [seq.ending.sentence] : []),
  ];
}
function probeVideo(file) {
  const { streams } = JSON.parse(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,width,height,nb_frames,avg_frame_rate",
      "-of",
      "json",
      file,
    ])
  );
  return {
    video: streams.find((s) => s.codec_type === "video"),
    audio: streams.some((s) => s.codec_type === "audio"),
  };
}
// The cover is extracted again at every verification, so a hand-edited cover
// cannot pass; bit-exact flags keep its PNG bytes stable on one machine.
function extractCover(file, frame) {
  const scratch = mkdtempSync(join(tmpdir(), "ethnia-cover-"));
  try {
    const cover = join(scratch, "cover.png");
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-i",
      file,
      "-vf",
      `select=eq(n\\,${frame})`,
      "-frames:v",
      "1",
      "-map_metadata",
      "-1",
      "-flags",
      "+bitexact",
      "-fflags",
      "+bitexact",
      cover,
    ]);
    return readFileSync(cover);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
const ALT_ROUTE = {
  native: "la plateforme propose un champ dédié",
  description: "il figure dans la légende",
  unavailable: "la plateforme n'en propose pas",
};
function videoDelivery(root, config, read) {
  const design = JSON.parse(read(config.design));
  if (design.status !== "accepted")
    fail("The video design must be accepted by the operator");
  const sequenceDir = dirname(path(root, config.sequence));
  const raw = JSON.parse(read(config.sequence));
  if (raw.demo)
    fail("A demo sequence is a proof; only a final sequence may be packaged");
  let seq;
  try {
    seq = loadSequence(raw, { dir: sequenceDir });
  } catch (error) {
    fail(`Sequence refused: ${error.message}`);
  }
  // The sequence names its own voice; a second input field would be a
  // second source of truth for the same files.
  for (const file of raw.voice ? [raw.voice.audio, raw.voice.words] : [])
    read(relative(root, resolve(sequenceDir, file)).split(sep).join("/"));
  const manifest = JSON.parse(read(`${config.video}/manifest.json`));
  const videoFile = `${config.video}/video.mp4`;
  const bytes = read(videoFile);
  if (manifest.schema !== 1) fail("Unsupported video manifest");
  if (manifest.demo !== false)
    fail("A demo video is a proof; only a final video may be packaged");
  if (manifest.range)
    fail("An excerpt is a proof; only the full video may be packaged");
  if (
    seq.design !== `${design.name} ${design.version}` ||
    manifest.design !== seq.design
  )
    fail("The video was not made with the accepted design");
  if (manifest.hashes?.video !== sha(bytes))
    fail("The video manifest does not match video.mp4");
  // encodeVideo hashes the loaded sequence, whose voice paths are absolute:
  // a piece moved after encoding needs a new encode.
  if (manifest.hashes?.sequence !== sha(JSON.stringify(seq)))
    fail("The video manifest does not match the sequence");
  if (manifest.frames !== frameCount(seq))
    fail("The video manifest frame count differs from the sequence");
  if (
    seq.voice
      ? manifest.audio?.sha256 !== seq.voice.sha256
      : manifest.audio != null
  )
    fail("The video audio does not match the sequence voice");
  const probe = probeVideo(path(root, videoFile));
  if (
    !probe.video ||
    probe.video.width !== manifest.width ||
    probe.video.height !== manifest.height ||
    Number(probe.video.nb_frames) !== manifest.frames ||
    probe.video.avg_frame_rate !== `${manifest.fps}/1`
  )
    fail("video.mp4 differs from its manifest's size, frame count or rate");
  if (probe.audio !== !!seq.voice)
    fail("The video audio track does not match the sequence voice");
  const duration = manifest.frames / manifest.fps;
  const video = {
    id: "video",
    file: "video.mp4",
    sha256: sha(bytes),
    alt: null,
  };
  const media = [video];
  const payload = { "video.mp4": bytes };
  let coverLine = "";
  if (config.cover !== undefined) {
    const frame = config.cover?.frame;
    if (!Number.isInteger(frame) || frame < 0 || frame >= manifest.frames)
      fail("The cover frame must be a frame of the video");
    payload["cover.png"] = extractCover(path(root, videoFile), frame);
    media.push({
      id: "cover",
      file: "cover.png",
      sha256: sha(payload["cover.png"]),
      alt: null,
    });
    coverLine = `\n- [cover.png](cover.png) : image de couverture, image ${frame} de la vidéo`;
  }
  const screen = screenText(seq);
  const seconds = String(Math.round(duration * 10) / 10).replace(".", ",");
  return {
    ...researchRecords(read, config),
    media,
    payload,
    describable: [video],
    format: "video",
    checkCapability(c) {
      if (
        typeof c.maxDurationSeconds !== "number" ||
        !(c.maxDurationSeconds > 0)
      )
        fail("Verified video duration limit is required");
      if (duration > c.maxDurationSeconds)
        fail("Video duration exceeds the verified account limit");
      const [w, h] = (/^(\d+):(\d+)$/.exec(c.aspect ?? "") ?? [])
        .slice(1)
        .map(Number);
      if (!w || !h || manifest.width * h !== manifest.height * w)
        fail("Video aspect differs from the verified account aspect");
      if (!["available", "unavailable"].includes(c.autoCaptions))
        fail("Verified automatic captions route is required");
    },
    accessibility: (c) =>
      `Les sous-titres sont incrustés dans la vidéo.\n\nTexte alternatif : ${ALT_ROUTE[c.altRoute]}.\n\nSous-titres automatiques : ${c.autoCaptions === "available" ? "la plateforme en propose" : "la plateforme n'en propose pas"}.\n\n`,
    publicCopy: { screen },
    mediaOrder: `- [video.mp4](video.mp4) : ${seconds} s, ${manifest.width} × ${manifest.height}, ${seq.voice ? "voix incluse" : "sans voix"}${coverLine}`,
    screenSection: `## On-screen text\n\n${screen.map((line) => `- ${line.replaceAll("\n", " ")}`).join("\n")}\n\n`,
    credits: [
      ...new Set(screen.filter((line) => line.startsWith("Source : "))),
    ].join("\n\n"),
  };
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
  if (config.kind !== undefined && config.kind !== "video")
    fail("Unsupported package kind");
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
  const delivery =
    config.kind === "video"
      ? videoDelivery(root, config, read)
      : cardDelivery(root, config, read);
  const { dossier, creditUrls, media } = delivery;
  const blocks = [];
  const publicCopy = { ...delivery.publicCopy, networks: [] };
  for (const n of config.networks) {
    const adaptedMedia = networkMedia(delivery.describable, n.alternativeText);
    if (
      !["instagram", "facebook", "tiktok", "youtube", "x"].includes(n.network)
    )
      fail("Unknown network");
    text(n.caption, "Caption");
    if (n.firstComment !== null) text(n.firstComment, "First comment");
    const c = n.capability;
    if (!c || c.format !== delivery.format)
      fail(`Verified ${delivery.format} account route is required`);
    text(c.account, "Account");
    date(c.checkedAt);
    text(c.observation, "Account observation");
    read(c.evidence);
    delivery.checkCapability(c);
    limit(n.caption, c.captionMax, "caption");
    if (n.firstComment !== null) limit(n.firstComment, c.commentMax, "comment");
    if (!["native", "description", "unavailable"].includes(c.altRoute))
      fail("Verified alternative text route is required");
    text(c.altInstruction, "Alternative text instruction");
    // A card always carries its description; a video has one only when the
    // network adaptation supplies it.
    if (c.altRoute !== "unavailable")
      for (const m of adaptedMedia) text(m.alt, "Alternative text");
    if (c.altRoute === "native")
      for (const m of adaptedMedia) limit(m.alt, c.altMax, "alternative text");
    if (
      c.altRoute === "description" &&
      !adaptedMedia.every((m) => n.caption.includes(m.alt))
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
    }
    for (const url of urls(`${n.caption}\n${n.firstComment ?? ""}`))
      if (
        !creditUrls.has(url) &&
        !(link.placement !== "none" && url === link.url)
      )
        fail("Copy includes an undocumented URL or declares no link route");
    const described = adaptedMedia.filter((m) => m.alt);
    blocks.push(
      `## ${n.network}\n\n### Légende\n\n${n.caption}\n\n### Premier commentaire\n\n${n.firstComment ?? "Aucun"}\n\n### Placement du lien\n\n${instruction}\n\n### Accessibility\n\n${delivery.accessibility(c)}${c.altInstruction}${described.length ? "\n\n" : ""}${described.map((m) => `**${m.file}**\n\n${m.alt}`).join("\n\n")}`
    );
    publicCopy.networks.push({
      caption: n.caption,
      comment: n.firstComment ?? "Aucun",
      alternativeText: described.map((m) => m.alt),
    });
  }
  const bibliography = dossier.sources
    .map((s) => `${s.citation} · ${s.locator}`)
    .join("\n\n");
  const imageRights = dossier.images
    .map((i) => `${i.credit} · ${i.sourcePage} · ${i.reuseBasis}`)
    .join("\n\n");
  publicCopy.credits = dossier.images.map((i) => ({ text: i.credit }));
  const post = `# Publication package\n\nReady for approval 3. Package generation does not publish or schedule.\n\n## Media order\n\n${delivery.mediaOrder}\n\n${blocks.join("\n\n")}\n\n${delivery.screenSection}## Sources and credits\n\n${delivery.credits}\n\n## Full references\n\n${bibliography}\n\n## Image reuse\n\n${imageRights || "No additional image record supplied; review completeness before approval."}\n`;
  return {
    schema: 1,
    configFile,
    networks: [...networks],
    dependencies,
    media,
    post,
    publicCopy,
    researchFile: config.research,
    payload: delivery.payload,
  };
}
// A video's screen text is checked from public-copy.json alone: its sequence
// file also holds coordinates, source records and file names.
function checkLanguage(root, config, copyFile) {
  const sources =
    config.kind === "video"
      ? []
      : [path(root, config.input), path(root, `${config.render}/report.json`)];
  return run(join(TOOL_ROOT, "node_modules/tsx/dist/cli.mjs"), [
    join(TOOL_ROOT, "scripts/ci/checkPlainLanguage.ts"),
    "--strict",
    ...sources,
    copyFile,
  ]);
}
export function createPackage(root, configFile, output, networks) {
  const target = path(root, output);
  if (existsSync(target)) fail("Package output already exists");
  const data = assemble(root, configFile, networks);
  const { post, publicCopy, payload, ...manifest } = data;
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
    for (const [name, bytes] of Object.entries(payload))
      writeFileSync(join(staging, name), bytes);
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
