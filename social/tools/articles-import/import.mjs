/**
 * Recovering published social posts as draft articles.
 *
 * One run reconciles the private library with the site ledger, picks the
 * release each published record filed, verifies it against every hash the
 * release declared and against the previous run's snapshot, exports WebP
 * derivatives, and writes one draft per editorial angle. Every candidate that
 * does not become a draft is still accounted for, with the reason and the next
 * action, in a private manifest and report.
 *
 * Writes happen only with `write: true`, and only in two places: the private
 * `outDir` and the public `articlesDir`. The library and the workshop are read,
 * never written. Nothing here writes prose: titles are the ledger's question or
 * the post's own title, excerpts are the published hook or caption, slide text
 * is the card as set.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  sha256,
  webpFromImage,
  webpFromVideoFrame,
  WEBP_SETTINGS,
} from "./derivatives.mjs";
import {
  assertPublicSafe,
  planDraftWrite,
  serializeDraft,
  textSha256,
} from "./draft.mjs";
import {
  campaignOccurrences,
  extractUrls,
  normalizeUrl,
  reconcile,
  tiktokCreatedOn,
} from "./inventory.mjs";
import { selectRelease } from "./release.mjs";
import {
  cardsToSlides,
  containsVerbatim,
  parseCreditsSources,
} from "./sources.mjs";

const NETWORKS = [
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "linkedin",
  "x",
];
// Static segments under /dossiers; mirrors RESERVED_SLUGS in src/lib/articles/corpus.ts.
const RESERVED_SLUGS = [
  "anecdotes",
  "proverbes",
  "galerie",
  "themes",
  "nommer",
  "migrations",
  "regards",
];

// A carousel posted two days after its reel is one release in two formats.
const COMPANION_DAYS = 3;

const NEXT = {
  "rights-restricted":
    "Obtain the rights holder's permission for the site, or show the carousel without these slides.",
  "edition-not-shown":
    "P5 decides whether this earlier edition belongs in the article or needs its own.",
  "no-media":
    "Recover the rendered files from the workshop or the platform, or record the loss.",
  "release-ambiguous":
    "Operator designates the release (ledger `selected`) or rules on the supersession.",
  "hash-mismatch":
    "Re-check which file went out; re-snapshot only once the change is understood.",
  "no-url":
    "Operator records the post URL(s) from the platform in the owning registry.",
  "copy-unresolved":
    "Recover the published caption from the platform or the operator.",
  "no-youtube":
    "Record the YouTube edition, or provide a cleared native derivative and a durable host.",
  "slide-text-missing":
    "Recover this release's cards.json, or transcribe each exported slide by eye; the carousel is shown only with its words.",
  "sources-empty":
    "P5: build the source list from the workshop's SOURCES.md; nothing was parsed automatically.",
  "mapping-probable":
    "Operator confirms the mapping between the library record and the site campaign.",
  "date-conflict":
    "Owner of the site ledger corrects the date, or confirms it.",
  "registry-status":
    "Owners of the two registries reconcile the status; this run does not edit either.",
  "audio-not-cleared":
    "Clear website reuse of the soundtrack, or keep the visual edition without it.",
  "wikipedia-source":
    "P5: cite the underlying work at its own tier instead of the encyclopedia page.",
  "credit-check":
    "Re-check this card's image against its credit before publication.",
  "image-reused": "Confirm the reuse is intended and credited on both cards.",
  "recovered-from-workshop":
    "Operator confirms these workshop renders are the files that went out.",
  "excerpt-placeholder": "P5 writes the excerpt.",
  "excerpt-from-caption":
    "P5 reviews the excerpt taken from the published caption.",
  "credits-missing":
    "P5: take the media credits from the workshop's SOURCES.md.",
  "no-filed-release":
    "Find the release in the library (it may sit on another shelf) or record why none exists.",
  "unattributed-occurrence":
    "Attach this occurrence to an edition, or record it as a separate edition.",
  collision:
    "Rename or merge the colliding candidates; the importer never picks one.",
  excluded: "None, unless the operator reverses the exclusion.",
  "after-cutoff": "Include in the next batch.",
  "not-published": "None until a publication is recorded.",
  "superseded-extra":
    "Contract change needed to record a supersession on a secondary format.",
};

function exception(code, detail) {
  return { code, detail, next: NEXT[code] ?? "Review." };
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const exists = (file) => {
  try {
    fs.statSync(file);
    return true;
  } catch {
    return false;
  }
};

function walk(dir, rel = "") {
  let names;
  try {
    names = fs.readdirSync(dir).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const abs = path.join(dir, name);
    const r = rel ? `${rel}/${name}` : name;
    const stat = fs.statSync(abs, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isDirectory()) out.push(...walk(abs, r));
    else out.push(r);
  }
  return out;
}

function loadCampaigns(siteLedgerDir) {
  const campaigns = [];
  for (const rel of walk(siteLedgerDir)) {
    if (!rel.endsWith(".json")) continue;
    campaigns.push({ ...readJson(path.join(siteLedgerDir, rel)), file: rel });
  }
  return campaigns;
}

function legacySlugs(dossierDir) {
  return walk(dossierDir)
    .filter((rel) => rel.endsWith(".json"))
    .map((rel) => readJson(path.join(dossierDir, rel)).slug)
    .filter(Boolean);
}

function workshopIndex(workshopRoot) {
  const index = [];
  for (const name of fs.existsSync(workshopRoot)
    ? fs.readdirSync(workshopRoot).sort()
    : []) {
    if (name.startsWith(".") || name.startsWith("_")) continue;
    const dir = path.join(workshopRoot, name);
    if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue;
    let postTarget = null;
    try {
      if (fs.lstatSync(path.join(dir, "post.md")).isSymbolicLink()) {
        postTarget = fs.realpathSync(path.join(dir, "post.md"));
      }
    } catch {
      /* no post.md link: the folder was never tied to a library post */
    }
    let campagne = null;
    let outDir = null;
    try {
      const cards = readJson(path.join(dir, "cards.json"));
      campagne = cards.campagne ?? null;
      outDir = typeof cards.outDir === "string" ? cards.outDir : null;
    } catch {
      /* no cards: not a carousel workshop */
    }
    index.push({ name, postTarget, campagne, outDir });
  }
  return index;
}

/** The workshop folder a record came from, and the evidence that says so. */
function findWorkshop(post, folderAbs, workshopRoot, index, curated) {
  const named = curated?.find((w) => w.record === post.id);
  if (named)
    return { dir: named.workshopDir, evidence: `curated: ${named.evidence}` };
  if (
    post.workshopSubject &&
    exists(path.join(workshopRoot, post.workshopSubject))
  ) {
    return { dir: post.workshopSubject, evidence: "record workshopSubject" };
  }
  let target = null;
  try {
    target = fs.realpathSync(path.join(folderAbs, "post.md"));
  } catch {
    /* folder without post.md */
  }
  const linked = target ? index.filter((e) => e.postTarget === target) : [];
  if (linked.length === 1) {
    return {
      dir: linked[0].name,
      evidence: "workshop post.md links to the published folder",
    };
  }
  // The render's own destination names the post folder it was made for.
  const aimed = index.filter((e) =>
    e.outDir?.replace(/\/images\/?$/, "").endsWith(`/${post.dir}`)
  );
  if (aimed.length === 1) {
    return {
      dir: aimed[0].name,
      evidence: "workshop cards.json outDir names the post's folder",
    };
  }
  for (const key of [post.id, post.links?.campaign]) {
    const byCampaign = key ? index.filter((e) => e.campagne === key) : [];
    if (byCampaign.length === 1) {
      return {
        dir: byCampaign[0].name,
        evidence: `workshop cards.json campagne "${key}"`,
      };
    }
  }
  return null;
}

const formatOf = (value) =>
  value === "carrousel" || value === "carousel" ? "carousel" : value;

function channelDate(text) {
  return typeof text === "string"
    ? (text.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null)
    : null;
}

/** First caption paragraph fit to stand as an excerpt, or null. */
function captionExcerpt(markdown, title) {
  for (const raw of markdown.split("\n")) {
    // Only the quoted blocks are the text that was posted.
    if (!raw.startsWith(">")) continue;
    const line = raw.replace(/^>\s?/, "").trim();
    if (line.length < 40) continue;
    if (
      /^(#|_|\*\*|`|Titre|Lien|Commentaire|Story|Un seul post|Crédits?)/.test(
        line
      )
    )
      continue;
    if (/https?:|#\w|\*\*|à compléter|:$/.test(line)) continue;
    if (line === title) continue;
    return line;
  }
  return null;
}

function renduFindings(markdown) {
  const out = [];
  for (const line of markdown.split("\n")) {
    const flag = line.match(/^- carte (\d+)\s*:/);
    if (flag)
      out.push(
        exception(
          "credit-check",
          `card ${Number(flag[1])}: the render report flags the credit and the image description as sharing no word`
        )
      );
  }
  const byImage = new Map();
  for (const line of markdown.split("\n")) {
    const row = line.match(
      /^\|\s*(\d{2})\s*\|\s*([^|\s]+\.(?:jpe?g|png|webp))\s*\|/i
    );
    if (!row) continue;
    const cards = byImage.get(row[2]) ?? [];
    cards.push(Number(row[1]));
    byImage.set(row[2], cards);
  }
  for (const [, cards] of byImage) {
    if (cards.length > 1) {
      out.push(
        exception(
          "image-reused",
          `cards ${cards.join(" and ")} use the same image file`
        )
      );
    }
  }
  return out;
}

/**
 * Everything one published record contributes: its selected files with their
 * hashes, its occurrences, its words, its sources, and what blocks it.
 */
function buildEdition(post, ctx) {
  const blocking = [];
  const notes = [];
  const recover = (ctx.curation.recover ?? []).find(
    (r) => r.record === post.id
  );
  // The shelf the status derives, else wherever the library actually holds it.
  let folderRel = ctx.shelves.postRelPath(post);
  if (
    (!folderRel || !exists(path.join(ctx.postsRoot, folderRel))) &&
    ctx.shelves.findPostRelPath
  ) {
    folderRel =
      ctx.shelves.findPostRelPath(
        ctx.postsRoot,
        post.dir,
        fs.existsSync,
        path.join,
        fs.readdirSync
      ) ?? folderRel;
  }
  const folderAbs = folderRel ? path.join(ctx.postsRoot, folderRel) : null;

  let files = [];
  const realPath = new Map();
  if (recover) {
    const dir = path.join(ctx.workshopRoot, recover.workshopDir);
    for (const rel of walk(dir)) {
      const virtual =
        /_1080x1350\.png$/.test(rel) && !rel.includes("/")
          ? `TikTok-Instagram/${rel}`
          : `_other/${rel}`;
      files.push(virtual);
      realPath.set(virtual, {
        abs: path.join(dir, rel),
        key: `workshop:${recover.workshopDir}/${rel}`,
      });
    }
    notes.push(exception("recovered-from-workshop", `${recover.evidence}`));
  } else if (folderAbs && exists(folderAbs)) {
    for (const rel of walk(folderAbs)) {
      files.push(rel);
      realPath.set(rel, {
        abs: path.join(folderAbs, rel),
        key: `posts:${folderRel}/${rel}`,
      });
    }
  } else {
    blocking.push(
      exception("no-media", "published folder not found on its shelf")
    );
  }

  const release = selectRelease(files, post);
  for (const problem of release.problems) {
    blocking.push(
      /no media/.test(problem)
        ? exception("no-media", problem)
        : exception("release-ambiguous", problem)
    );
  }

  const selected = [release.video, release.poster, ...release.slides].filter(
    Boolean
  );
  const hashed = new Map();
  for (const rel of selected) {
    const { abs, key } = realPath.get(rel);
    const bytes = fs.readFileSync(abs);
    const digest = sha256(bytes);
    hashed.set(rel, { rel, key, abs, sha256: digest, bytes: bytes.length });
    const before = ctx.previousSnapshot[key];
    if (before && before !== digest && !ctx.resnapshot) {
      blocking.push(
        exception(
          "hash-mismatch",
          `${key.split("/").pop()} changed since the snapshot of the previous run`
        )
      );
    }
  }

  // Hashes the release itself declared.
  const renderedVideo = release.video
    ? post.renderedFrom?.[path.basename(release.video)]
    : null;
  const releaseDir = renderedVideo
    ? path.dirname(path.join(ctx.workshopRoot, renderedVideo))
    : null;
  if (renderedVideo && release.video) {
    const workshopCopy = path.join(ctx.workshopRoot, renderedVideo);
    const delivery = path.join(releaseDir, "delivery.json");
    if (exists(delivery)) {
      const declared = readJson(delivery).video?.sha256;
      if (declared && declared !== hashed.get(release.video).sha256) {
        blocking.push(
          exception(
            "hash-mismatch",
            "filed video does not match the hash declared in the release's delivery.json"
          )
        );
      }
    } else if (
      exists(workshopCopy) &&
      sha256(fs.readFileSync(workshopCopy)) !== hashed.get(release.video).sha256
    ) {
      notes.push(
        exception(
          "hash-mismatch",
          "workshop render differs from the filed video; the filed copy is kept"
        )
      );
    }
    const kit = path.join(releaseDir, "publication", "publication-kit.json");
    if (
      exists(kit) &&
      release.poster &&
      path.basename(release.poster) === "thumbnail.png"
    ) {
      const declared = readJson(kit).files?.["thumbnail.png"];
      if (declared && declared !== hashed.get(release.poster).sha256) {
        blocking.push(
          exception(
            "hash-mismatch",
            "filed thumbnail does not match publication-kit.json"
          )
        );
      }
    }
  }

  const workshop = findWorkshop(
    post,
    folderAbs ?? "",
    ctx.workshopRoot,
    ctx.workshopIndex,
    ctx.curation.workshop
  );
  const formats = [];
  let slides = null;
  let cardSources = [];
  let cardCredits = "";
  if (release.slides.length) {
    const cardsFile = workshop
      ? path.join(ctx.workshopRoot, workshop.dir, "cards.json")
      : null;
    const cards = cardsFile && exists(cardsFile) ? readJson(cardsFile) : null;
    const parsed = cards ? cardsToSlides(cards) : null;
    if (!parsed) {
      notes.push(
        exception("slide-text-missing", "no cards.json found for this carousel")
      );
    } else if (parsed.slides.length !== release.slides.length) {
      notes.push(
        exception(
          "slide-text-missing",
          `${parsed.slides.length} cards for ${release.slides.length} rendered slides`
        )
      );
    } else if (parsed.slides.some((s) => !s.text)) {
      notes.push(exception("slide-text-missing", "a card has no words"));
    } else {
      slides = parsed.slides;
      cardSources = parsed.sources;
      cardCredits = parsed.credits;
      if (parsed.restricted.length) {
        notes.push(
          exception(
            "rights-restricted",
            `card(s) ${parsed.restricted.join(", ")} show an image whose licence reserves all rights; website reuse is not cleared`
          )
        );
      }
      hashed.set("cards.json", {
        key: `workshop:${workshop.dir}/cards.json`,
        sha256: sha256(fs.readFileSync(cardsFile)),
      });
    }
    formats.push("carousel");
  }
  if (release.video) formats.push("video");

  let creditSources = { sources: [], set_aside: [], credits: "" };
  if (releaseDir && exists(path.join(releaseDir, "CREDITS.md"))) {
    creditSources = parseCreditsSources(
      fs.readFileSync(path.join(releaseDir, "CREDITS.md"), "utf8")
    );
  }

  const curatedSources = [];
  for (const entry of (ctx.curation.sources ?? []).filter(
    (s) => s.record === post.id
  )) {
    const file = path.join(ctx.workshopRoot, entry.file);
    const text = exists(file) ? fs.readFileSync(file, "utf8") : "";
    for (const item of entry.items) {
      if (!containsVerbatim(text, item.match ?? item.title)) {
        blocking.push(
          exception(
            "sources-empty",
            `curated source "${item.title}" not found verbatim in its workshop file`
          )
        );
      } else {
        curatedSources.push({
          title: item.title,
          tier: item.tier,
          ...(item.url ? { url: item.url } : {}),
        });
      }
    }
  }

  if (folderAbs && exists(path.join(folderAbs, "RENDU.md"))) {
    notes.push(
      ...renduFindings(
        fs.readFileSync(path.join(folderAbs, "RENDU.md"), "utf8")
      )
    );
  }

  const occurrences = [];
  for (const [network, value] of Object.entries(post.channels ?? {})) {
    const urls = extractUrls(value);
    for (const url of urls) {
      occurrences.push({
        network,
        url,
        key: normalizeUrl(url),
        day: tiktokCreatedOn(url) ?? channelDate(value) ?? post.date,
        from: "library",
      });
    }
  }

  // Caption files mix the published text with the operator's working notes,
  // so only a release kit's caption, verified against the hash the kit
  // declared, may lend an excerpt.
  let copyText = null;
  if (releaseDir) {
    const kitFile = path.join(
      releaseDir,
      "publication",
      "publication-kit.json"
    );
    const copyFile = path.join(
      releaseDir,
      "publication",
      "publication-copy.md"
    );
    if (exists(kitFile) && exists(copyFile)) {
      const declared = readJson(kitFile).files?.["publication-copy.md"];
      const text = fs.readFileSync(copyFile, "utf8");
      if (declared && declared === sha256(Buffer.from(text))) copyText = text;
    }
  }
  if (post.copy && !exists(path.join(ctx.workshopRoot, post.copy))) {
    notes.push(
      exception(
        "copy-unresolved",
        `declared caption pointer does not resolve: ${path.basename(post.copy)}`
      )
    );
  }

  return {
    recordId: post.id,
    post,
    date: post.date,
    folderRel,
    formats,
    release,
    hashed,
    workshop,
    slides,
    sources: [...curatedSources, ...creditSources.sources, ...cardSources],
    setAside: creditSources.set_aside,
    credits: { video: creditSources.credits, carousel: cardCredits },
    occurrences,
    copyText,
    blocking,
    notes,
  };
}

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortObject(value[k])])
    );
  }
  return value;
}

export async function runImport(options) {
  const {
    postsRoot,
    workshopRoot,
    siteLedgerDir,
    dossierDir,
    articlesDir,
    outDir,
    curation = {},
    write = false,
    cutoff = null,
    only = null,
    resnapshot = false,
  } = options;
  const indexDir = path.join(path.dirname(postsRoot), "00-Index");
  const ledger = readJson(path.join(indexDir, "publications.json"));
  const shelves = await import(
    pathToFileURL(path.join(indexDir, "library-paths.mjs")).href
  );
  const manifestFile = path.join(outDir, "manifest.json");
  const previous = exists(manifestFile) ? readJson(manifestFile) : {};

  const byId = new Map(ledger.posts.map((p) => [p.id, p]));
  const linked = new Set((curation.links ?? []).map((l) => l.record));
  for (const id of linked)
    if (!byId.has(id))
      throw new Error(`curated link names unknown record "${id}"`);
  const records = ledger.posts.filter(
    (p) => p.status === "publie" || linked.has(p.id)
  );
  const campaigns = loadCampaigns(siteLedgerDir);
  const campaignById = new Map(campaigns.map((c) => [c.campaign, c]));
  const { groups } = reconcile({
    records,
    campaigns,
    links: curation.links ?? [],
  });

  const ctx = {
    curation,
    shelves,
    postsRoot,
    workshopRoot,
    workshopIndex: workshopIndex(workshopRoot),
    previousSnapshot: previous.snapshot ?? {},
    resnapshot,
  };
  const reserved = new Set([...RESERVED_SLUGS, ...legacySlugs(dossierDir)]);
  const existingSlugs = new Map();
  for (const rel of walk(articlesDir).filter(
    (r) => r.endsWith(".json") && !r.includes("/")
  )) {
    try {
      const slug = readJson(path.join(articlesDir, rel)).fr?.slug;
      if (slug) existingSlugs.set(slug, rel);
    } catch {
      /* an unreadable article is the corpus loader's to report */
    }
  }
  const excludedRecords = new Map(
    (curation.excluded ?? [])
      .filter((e) => e.record)
      .map((e) => [e.record, e.reason])
  );
  const excludedCampaigns = new Map(
    (curation.excluded ?? [])
      .filter((e) => e.campaign)
      .map((e) => [e.campaign, e.reason])
  );
  const probable = new Set(
    (curation.links ?? [])
      .filter((l) => l.confidence === "probable")
      .map((l) => l.record)
  );

  const candidates = [];
  for (const group of groups) {
    const exceptions = [];
    const groupRecords = group.records.map((id) => byId.get(id));
    const sharedLink = [
      ...new Set(groupRecords.map((r) => r.links?.campaign).filter(Boolean)),
    ];
    const articleId =
      group.campaigns[0] ??
      (sharedLink.length === 1 ? sharedLink[0] : group.records[0]);
    const campaign =
      group.campaigns.length === 1
        ? campaignById.get(group.campaigns[0])
        : null;
    const entry = {
      articleId,
      campaigns: group.campaigns.map((id) => ({
        id,
        file: campaignById.get(id).file,
      })),
      evidence: group.evidence,
      records: [],
      exceptions,
      unattributed: [],
    };
    candidates.push(entry);

    if (group.campaigns.length > 1) {
      exceptions.push(
        exception(
          "collision",
          `several site campaigns joined into one group: ${group.campaigns.join(", ")}`
        )
      );
    }
    for (const r of groupRecords) {
      if (probable.has(r.id))
        exceptions.push(
          exception(
            "mapping-probable",
            `record ${r.id} ↔ ${group.campaigns.join(", ")}`
          )
        );
      if (r.status !== "publie") {
        exceptions.push(
          exception(
            "registry-status",
            `library record ${r.id} is "${r.status}" while the site ledger records a live post`
          )
        );
      }
    }
    const campaignExcluded = group.campaigns
      .map((c) => excludedCampaigns.get(c))
      .find(Boolean);

    const editions = [];
    for (const post of groupRecords) {
      const role = {
        id: post.id,
        status: post.status,
        date: post.date || null,
      };
      entry.records.push(role);
      if (excludedRecords.has(post.id) || campaignExcluded) {
        role.role = "excluded";
        role.reason = excludedRecords.get(post.id) ?? campaignExcluded;
        continue;
      }
      if (cutoff && post.date && post.date > cutoff) {
        role.role = "excluded";
        role.reason = `dated ${post.date}, after the ${cutoff} cut-off`;
        exceptions.push(
          exception("after-cutoff", `${post.id} dated ${post.date}`)
        );
        continue;
      }
      const edition = buildEdition(post, ctx);
      role.folder = edition.folderRel;
      role.formats = edition.formats;
      role.workshop = edition.workshop;
      role.files = [...edition.hashed.values()].map(
        ({ key, sha256: s, bytes }) => ({ key, sha256: s, bytes })
      );
      role.sourcesSetAside = edition.setAside;
      role.blocking = edition.blocking.map((b) => b.detail);
      exceptions.push(
        ...edition.blocking.map((b) => ({
          ...b,
          detail: `${post.id}: ${b.detail}`,
        }))
      );
      exceptions.push(
        ...edition.notes.map((b) => ({
          ...b,
          detail: `${post.id}: ${b.detail}`,
        }))
      );
      if (!edition.blocking.length) editions.push(edition);
    }

    // Attribute each ledger occurrence to the edition it belongs to.
    for (const occ of campaign ? campaignOccurrences(campaign) : []) {
      if (!occ.url) continue;
      const tiktokDay = tiktokCreatedOn(occ.url);
      let owner = editions.find((e) =>
        e.occurrences.some((o) => o.key === occ.key)
      );
      let how = "same URL";
      if (!owner) {
        const sameFormat = editions.filter((e) =>
          e.formats.includes(formatOf(occ.format))
        );
        const fits = sameFormat.filter(
          (e) => occ.publishedAt === e.date || tiktokDay === e.date
        );
        if (fits.length === 1) {
          owner = fits[0];
          how = "same format and day";
        } else if (sameFormat.length === 1 && !sameFormat[0].date) {
          // A record never marked published carries no date; the curated link
          // already ties it to this campaign, and it is the only one in its format.
          owner = sameFormat[0];
          how = "only edition in this format, undated record";
        }
      }
      const day = tiktokDay ?? occ.publishedAt ?? null;
      if (tiktokDay && occ.publishedAt && tiktokDay !== occ.publishedAt) {
        exceptions.push(
          exception(
            "date-conflict",
            `${occ.network} ${occ.key}: ledger says ${occ.publishedAt}, the TikTok id says ${tiktokDay}`
          )
        );
      }
      if (!owner) {
        entry.unattributed.push({
          network: occ.network,
          format: occ.format,
          key: occ.key,
          day,
        });
        exceptions.push(
          exception(
            "unattributed-occurrence",
            `${occ.network} ${occ.format} ${occ.key} (${day ?? "undated"}) matches no filed edition`
          )
        );
        continue;
      }
      if (!owner.occurrences.some((o) => o.key === occ.key)) {
        owner.occurrences.push({
          network: occ.network,
          url: occ.url,
          key: occ.key,
          day,
          from: `ledger (${how})`,
        });
      }
    }

    for (const e of editions.filter((x) => !x.date)) {
      const days = e.occurrences
        .map((o) => o.day)
        .filter(Boolean)
        .sort();
      e.date = days[0] ?? null;
      exceptions.push(
        exception(
          "registry-status",
          `${e.recordId} has no publication date in the library; ${e.date ? `dated ${e.date} from its first recorded occurrence` : "no occurrence dates it either"}`
        )
      );
    }

    // One selected edition per format; a second one needs a written ruling.
    const selected = {};
    for (const format of ["carousel", "video"]) {
      const withFormat = editions.filter((e) => e.formats.includes(format));
      const rulings = (curation.supersedes ?? []).filter((s) =>
        withFormat.some((e) => e.recordId === s.record)
      );
      const superseded = new Set(rulings.map((s) => s.supersedes));
      const remaining = withFormat.filter((e) => !superseded.has(e.recordId));
      if (remaining.length > 1) {
        exceptions.push(
          exception(
            "release-ambiguous",
            `ambiguous selected release: ${format} editions ${remaining.map((e) => e.recordId).join(", ")}`
          )
        );
        selected.blocked = true;
      } else if (remaining.length === 1) selected[format] = remaining[0];
    }
    const candidatesChosen = selected.blocked
      ? []
      : uniqueBy(
          [selected.carousel, selected.video].filter(Boolean),
          (e) => e.recordId
        );
    // The newest release leads. Another format joins it only as a companion
    // released within a few days; an older release in another format is a
    // different edition, and showing it would pass it off as part of this one.
    const lead = [...candidatesChosen].sort(
      (a, b) =>
        (b.date ?? "").localeCompare(a.date ?? "") ||
        (a.formats.includes("video") ? -1 : 1)
    )[0];
    const chosen = candidatesChosen.filter(
      (e) =>
        e === lead ||
        Math.abs(Date.parse(e.date) - Date.parse(lead.date)) <=
          COMPANION_DAYS * 86400000
    );
    const notShown = new Set();
    for (const e of candidatesChosen.filter((x) => !chosen.includes(x))) {
      notShown.add(e.recordId);
      exceptions.push(
        exception(
          "edition-not-shown",
          `${e.recordId} (${e.formats.join("+")}, ${e.date}) is an earlier edition than ${lead.recordId} (${lead.date}); recorded, not shown`
        )
      );
    }
    for (const role of entry.records) {
      const e = chosen.find((c) => c.recordId === role.id);
      if (!role.role)
        role.role = e
          ? "selected"
          : notShown.has(role.id)
            ? "other-edition"
            : editions.some((x) => x.recordId === role.id)
              ? "superseded"
              : "blocked";
    }

    if (!groupRecords.length) {
      const live = campaign
        ? campaignOccurrences(campaign).filter((o) => o.url)
        : [];
      entry.disposition = live.length ? "needs-recovery" : "not-published";
      if (campaignExcluded) entry.disposition = "excluded";
      exceptions.push(
        live.length
          ? exception(
              "no-filed-release",
              `the site ledger records ${live.length} live occurrence(s); no published library record matches`
            )
          : exception(
              "not-published",
              "no occurrence with a URL in either registry"
            )
      );
      continue;
    }
    if (entry.records.every((r) => r.role === "excluded")) {
      entry.disposition = "excluded";
      entry.reason = entry.records
        .map((r) => `${r.id}: ${r.reason}`)
        .join("; ");
      exceptions.push(exception("excluded", entry.reason));
      continue;
    }
    if (!chosen.length || group.campaigns.length > 1) {
      entry.disposition = "needs-recovery";
      continue;
    }

    // Identity checks against the bank and the reserved segments.
    if (reserved.has(articleId)) {
      exceptions.push(
        exception("collision", `slug "${articleId}" is reserved`)
      );
      entry.disposition = "needs-recovery";
      continue;
    }
    const holder = existingSlugs.get(articleId);
    if (holder && holder !== `${articleId}.json`) {
      exceptions.push(
        exception(
          "collision",
          `slug "${articleId}" is already used by ${holder}`
        )
      );
      entry.disposition = "needs-recovery";
      continue;
    }

    // Supersession and its correction note, verified in the workshop.
    const primary = [...chosen].sort(
      (a, b) =>
        (b.date ?? "").localeCompare(a.date ?? "") ||
        (a.formats.includes("video") ? -1 : 1)
    )[0];
    const ruling = (curation.supersedes ?? []).find(
      (s) => s.record === primary.recordId
    );
    let correctionNote = null;
    if (ruling) {
      const file = path.join(workshopRoot, ruling.correctionNote?.file ?? "");
      const text =
        exists(file) && fs.statSync(file).isFile()
          ? fs.readFileSync(file, "utf8")
          : "";
      if (!containsVerbatim(text, ruling.correctionNote?.quote)) {
        exceptions.push(
          exception(
            "release-ambiguous",
            `correction note for ${ruling.record} not found verbatim in the workshop`
          )
        );
        entry.disposition = "needs-recovery";
        continue;
      }
      correctionNote = ruling.correctionNote.quote;
    }
    for (const e of chosen) {
      if (
        e !== primary &&
        (curation.supersedes ?? []).some((s) => s.record === e.recordId)
      ) {
        exceptions.push(
          exception(
            "superseded-extra",
            `${e.recordId} supersedes an edition, but only the primary edition can say so`
          )
        );
      }
    }
    entry.selected = Object.fromEntries(
      chosen.map((e) => [e.formats.join("+"), e.recordId])
    );
    entry.primary = primary.recordId;
    entry.supersedes = ruling?.supersedes ?? null;
    entry.disposition = "article-draft";

    // Derivatives: computed in every mode, written only with `write`.
    const process = !only || only.has(articleId);
    entry.processed = process;
    const derivatives = [];
    const formats = [];
    if (process) {
      for (const e of [...chosen].sort((a, b) =>
        a === primary ? -1 : b === primary ? 1 : 0
      )) {
        const base = `${articleId}/${e.recordId}`;
        // Slides are exported even without their text, so the recovered
        // files are hashed and kept; they are shown only with their words.
        if (e.formats.includes("carousel")) {
          const slides = [];
          for (const [i, rel] of e.release.slides.entries()) {
            const src = e.hashed.get(rel);
            const out = await webpFromImage(src.abs);
            const nn = String(i + 1).padStart(2, "0");
            const target = `${base}/slide-${nn}-${src.sha256.slice(0, 12)}.webp`;
            derivatives.push({
              target,
              from: src.key,
              fromSha256: src.sha256,
              order: i + 1,
              ...out,
            });
            if (e.slides) {
              slides.push({
                src: target,
                width: out.width,
                height: out.height,
                alt: e.slides[i].alt,
                text: e.slides[i].text,
              });
            }
          }
          if (e.slides)
            formats.push({
              kind: "carousel",
              slides,
              ...(e.credits.carousel ? { credits: e.credits.carousel } : {}),
            });
          if (e.slides && !e.credits.carousel)
            exceptions.push(
              exception(
                "credits-missing",
                `${e.recordId}: no media credits recovered for the carousel`
              )
            );
        }
        if (e.formats.includes("video")) {
          const video = e.hashed.get(e.release.video);
          const poster = e.release.poster
            ? e.hashed.get(e.release.poster)
            : null;
          const out = poster
            ? await webpFromImage(poster.abs)
            : await webpFromVideoFrame(video.abs);
          const from = poster ?? video;
          const target = `${base}/poster-${from.sha256.slice(0, 12)}.webp`;
          derivatives.push({
            target,
            from: from.key,
            fromSha256: from.sha256,
            order: 0,
            posterFrom: poster ? "release image" : "video frame at 1 s",
            ...out,
          });
          const youtube = e.occurrences.find((o) =>
            o.key?.startsWith("youtube:")
          );
          if (!youtube)
            exceptions.push(
              exception(
                "no-youtube",
                `${e.recordId}: no YouTube edition recorded; no native derivative exported`
              )
            );
          exceptions.push(
            exception(
              "audio-not-cleared",
              `${e.recordId}: soundtrack not exported; no clearance for website reuse recorded`
            )
          );
          if (!e.credits.video)
            exceptions.push(
              exception(
                "credits-missing",
                `${e.recordId}: no media credits recovered for the video`
              )
            );
          formats.push({
            kind: "video",
            ...(youtube
              ? { youtubeId: youtube.key.slice("youtube:".length) }
              : {}),
            poster: { src: target, width: out.width, height: out.height },
            ...(e.credits.video ? { credits: e.credits.video } : {}),
          });
        }
      }
    }
    entry.derivatives = derivatives.map(({ data, ...rest }) => rest);

    const originals = [];
    for (const e of chosen) {
      if (!e.occurrences.length)
        exceptions.push(
          exception("no-url", `${e.recordId}: no post URL in either registry`)
        );
      for (const o of e.occurrences) {
        if (!NETWORKS.includes(o.network)) continue;
        originals.push({
          network: o.network,
          url: o.url,
          ...(o.day ? { publishedAt: o.day } : {}),
        });
      }
    }
    const sources = uniqueBy(
      chosen.flatMap((e) => e.sources),
      (s) => s.title
    ).map((s, i) => ({
      id: `s${i + 1}`,
      title: s.title,
      ...(s.url ? { url: s.url } : {}),
      tier: s.tier,
    }));
    if (!sources.length)
      exceptions.push(
        exception("sources-empty", "no factual source recovered automatically")
      );
    for (const s of sources) {
      if (/wikipedia\.org/.test(s.url ?? "") || /wikip[ée]dia/i.test(s.title))
        exceptions.push(exception("wikipedia-source", s.title));
    }

    const title = campaign?.question?.fr ?? primary.post.title;
    let excerpt = primary.post.title !== title ? primary.post.title : null;
    if (!excerpt && primary.copyText) {
      excerpt = captionExcerpt(primary.copyText, title);
      if (excerpt)
        exceptions.push(exception("excerpt-from-caption", primary.recordId));
    }
    if (!excerpt) {
      excerpt = title;
      exceptions.push(
        exception("excerpt-placeholder", "excerpt repeats the title")
      );
    }

    const draft = {
      id: articleId,
      status: "draft",
      author: { name: "EthniAfrica" },
      angle: primary.post.pillar || campaign?.typologie || primary.post.subject,
      fr: { slug: articleId, title, excerpt, sections: [] },
      sources,
      media: {
        edition: {
          id: primary.recordId,
          ...(ruling ? { supersedes: ruling.supersedes, correctionNote } : {}),
        },
        formats,
        originals: uniqueBy(originals, (o) => o.url).sort(
          (a, b) =>
            a.network.localeCompare(b.network) || a.url.localeCompare(b.url)
        ),
      },
      relatedArticleIds: [],
    };
    entry.draftRecord = draft;
    entry.derivativeBuffers = derivatives;
  }

  // Two groups claiming one article id: neither is written.
  const counts = new Map();
  for (const c of candidates)
    counts.set(c.articleId, (counts.get(c.articleId) ?? 0) + 1);
  for (const c of candidates) {
    if (counts.get(c.articleId) > 1 && c.disposition === "article-draft") {
      c.exceptions.push(
        exception(
          "collision",
          `article id "${c.articleId}" claimed by ${counts.get(c.articleId)} candidates`
        )
      );
      c.disposition = "needs-recovery";
    }
  }

  const forbidden = [
    workshopRoot,
    postsRoot,
    path.dirname(postsRoot),
    os.homedir(),
    path.basename(postsRoot),
  ];
  for (const post of records) {
    for (const text of [
      post.notes,
      post.views,
      ...Object.values(post.renderedFrom ?? {}),
    ]) {
      if (typeof text === "string" && text.trim().length >= 20)
        forbidden.push(text.trim());
    }
  }

  const snapshot = {};
  const draftShas = {};
  const derivativesDir = path.join(outDir, "derivatives");
  for (const c of candidates) {
    for (const r of c.records)
      for (const f of r.files ?? []) snapshot[f.key] = f.sha256;
    if (c.disposition !== "article-draft" || !c.processed) {
      if (previous.drafts?.[c.articleId])
        draftShas[c.articleId] = previous.drafts[c.articleId];
      continue;
    }
    const text = serializeDraft(c.draftRecord);
    assertPublicSafe(text, forbidden);
    const file = path.join(articlesDir, `${c.articleId}.json`);
    const existing = exists(file) ? fs.readFileSync(file, "utf8") : null;
    const plan = planDraftWrite(
      existing,
      text,
      previous.drafts?.[c.articleId] ?? null
    );
    c.draft = {
      file: `${c.articleId}.json`,
      action: plan.action,
      ...(plan.reason ? { reason: plan.reason } : {}),
    };
    if (plan.action === "refuse") {
      c.exceptions.push(
        exception("collision", `draft not written: ${plan.reason}`)
      );
      draftShas[c.articleId] = previous.drafts?.[c.articleId] ?? null;
    } else draftShas[c.articleId] = textSha256(text);

    if (!write) continue;
    for (const d of c.derivativeBuffers) {
      const target = path.join(derivativesDir, d.target);
      if (exists(target)) {
        if (sha256(fs.readFileSync(target)) === d.sha256) continue;
        throw new Error(
          `derivative ${d.target} exists with different bytes; refusing to overwrite`
        );
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, d.data);
    }
    if (plan.action === "create" || plan.action === "update") {
      fs.mkdirSync(articlesDir, { recursive: true });
      fs.writeFileSync(file, text);
    }
  }

  const manifest = sortObject({
    tool: "social/tools/articles-import",
    cutoff,
    webp: WEBP_SETTINGS,
    snapshot: { ...(previous.snapshot ?? {}), ...snapshot },
    drafts: draftShas,
    // The draft's state, not this run's action, so an unchanged re-run leaves
    // the manifest byte-identical.
    candidates: candidates.map(
      ({ draftRecord, derivativeBuffers, draft, ...rest }) => ({
        ...rest,
        ...(draft
          ? {
              draft: {
                file: draft.file,
                state:
                  draft.action === "refuse"
                    ? `refused: ${draft.reason}`
                    : "importer-owned",
              },
            }
          : {}),
      })
    ),
  });
  const result = { candidates, manifest };
  if (write) {
    fs.mkdirSync(outDir, { recursive: true });
    const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
    if (
      !exists(manifestFile) ||
      fs.readFileSync(manifestFile, "utf8") !== manifestText
    ) {
      fs.writeFileSync(manifestFile, manifestText);
    }
    const report = renderReport(manifest);
    const reportFile = path.join(outDir, "report.md");
    if (!exists(reportFile) || fs.readFileSync(reportFile, "utf8") !== report) {
      fs.writeFileSync(reportFile, report);
    }
  }
  return result;
}

/** A reader's view of the manifest: every candidate, its state, what to do next. */
export function renderReport(manifest) {
  const rows = manifest.candidates;
  const byDisposition = {};
  for (const c of rows)
    byDisposition[c.disposition] = (byDisposition[c.disposition] ?? 0) + 1;
  const bytes = rows
    .flatMap((c) => c.derivatives ?? [])
    .reduce((n, d) => n + d.bytes, 0);
  const lines = [
    "# Articles recovery — reconciliation report",
    "",
    `Cut-off: ${manifest.cutoff ?? "none"}. Candidates: ${rows.length}. ` +
      Object.entries(byDisposition)
        .sort()
        .map(([k, v]) => `${k} ${v}`)
        .join(", ") +
      ".",
    `Web derivatives in this manifest: ${rows.flatMap((c) => c.derivatives ?? []).length} files, ${bytes} bytes.`,
    "",
    "Every draft carries the byline placeholder `EthniAfrica` and no body; both are P5 work.",
    "",
  ];
  for (const c of rows) {
    lines.push(`## ${c.articleId} — ${c.disposition}`);
    lines.push("");
    lines.push(
      `- Site campaigns: ${c.campaigns.map((x) => x.id).join(", ") || "none"}`
    );
    lines.push(
      `- Library records: ${c.records.map((r) => `${r.id} (${r.status}, ${r.date ?? "undated"}, ${r.role}${r.reason ? `: ${r.reason}` : ""})`).join("; ") || "none"}`
    );
    if (c.primary)
      lines.push(
        `- Selected edition: ${c.primary}${c.supersedes ? `, superseding ${c.supersedes}` : ""}`
      );
    if (c.draft)
      lines.push(
        `- Draft: content/articles/${c.draft.file} (${c.draft.state})`
      );
    if (c.evidence.length)
      lines.push(`- Mapping evidence: ${c.evidence.join(" | ")}`);
    const derived = c.derivatives ?? [];
    if (derived.length) {
      lines.push(
        `- Derivatives: ${derived.length} WebP, ${derived.reduce((n, d) => n + d.bytes, 0)} bytes`
      );
    }
    for (const e of c.exceptions)
      lines.push(`- [${e.code}] ${e.detail} — next: ${e.next}`);
    lines.push("");
  }
  return lines.join("\n");
}
