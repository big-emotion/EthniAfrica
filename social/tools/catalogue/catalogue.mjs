/**
 * Reads the private registry as the contract's subject → angle → edition →
 * occurrence, without changing what the registry stores.
 *
 * The registry keeps one entry per format and one free-text string per network
 * (`channels`). Rewriting 128 entries into a new shape would be a mass edit of a
 * file with no history, so this module derives the contract's view instead and
 * writes nothing. A field is stored on an entry only when it cannot be derived:
 * an angle or family the operator declared, a planned date, a second occurrence
 * on one network. Everything else is computed here, every time, from the entry.
 *
 * Doctrine: docs/design/gabarits-social/EDITORIAL-CONTRACT.md
 */
import {
  FAMILIES,
  distribution,
  findDuplicateOccurrences,
} from "../contract/contract.mjs";

const FORMATS = ["video", "carrousel"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const fold = (text) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/**
 * One platform post has one identity however many paths reach it. TikTok serves
 * the same numeric id under `/video/` and `/photo/`, which is exactly how a
 * carousel came to be filed as a video: two URLs, one post.
 */
const IDENTITY = {
  tiktok: [/\/(?:video|photo)\/(\d+)/],
  instagram: [/instagram\.com\/(?:[\w.]+\/)?(?:reels?|p|tv)\/([\w-]+)/],
  youtube: [/\/shorts\/([\w-]+)/, /[?&]v=([\w-]+)/, /youtu\.be\/([\w-]+)/],
  facebook: [
    /\/(?:reels?|videos)\/(\d+)/,
    /[?&]fbid=(\d+)/,
    /story_fbid=([\w]+)/,
    /\/share\/[vrp]\/([\w]+)/,
  ],
  linkedin: [/activity[-:](\d+)/, /ugcPost[-:](\d+)/, /urn:li:\w+:(\d+)/],
  x: [/\/status\/(\d+)/],
};

export function platformPostId(network, url) {
  if (!url) return null;
  for (const pattern of IDENTITY[network] ?? []) {
    const found = url.match(pattern);
    if (found) return found[1];
  }
  return null;
}

/**
 * The registry's channel strings come in four hand-written shapes: a bare URL,
 * « publié le D, URL non enregistrée », « publié le D, URL », and a thread note.
 * Unknown stays null; a date the string does not carry is inherited from the
 * entry only when the entry says it is a publication date, and is labelled so.
 */
function occurrenceFromChannel(network, raw, entry) {
  const url = raw.match(/https?:\/\/\S+/)?.[0].replace(/[,.)]+$/, "") ?? null;
  const written = raw.match(/publié le (\d{4}-\d{2}-\d{2})/)?.[1];
  const inherited =
    entry.dateKind === "publication" && DATE.test(entry.date ?? "")
      ? entry.date
      : null;
  return {
    network,
    status: "published",
    url,
    publishedAt: written ?? inherited,
    ...(written
      ? { dateSource: "channel" }
      : inherited
        ? { dateSource: "entry" }
        : {}),
    platformPostId: platformPostId(network, url),
    raw,
  };
}

function occurrenceFromDeclared(declared) {
  const url = declared.url ?? null;
  return {
    ...declared,
    url,
    publishedAt: declared.publishedAt ?? null,
    platformPostId:
      declared.platformPostId ?? platformPostId(declared.network, url),
  };
}

function occurrencesOf(entry) {
  const declared = (entry.occurrences ?? []).map(occurrenceFromDeclared);
  const covered = new Set(declared.map((occurrence) => occurrence.network));
  const fromChannels = Object.entries(entry.channels ?? {})
    .filter(([network]) => !covered.has(network))
    .map(([network, raw]) => occurrenceFromChannel(network, raw, entry));
  return [...fromChannels, ...declared];
}

function formatOf(entry) {
  const declared = entry.format ?? entry.links?.content;
  if (FORMATS.includes(declared)) return declared;
  if (entry.videos?.length) return "video";
  return entry.profile ? "carrousel" : null;
}

/**
 * Family resolves from evidence or not at all. A campaign the name ledger holds
 * is the contract's stated case; the Mémoires sonores profile is the contract's
 * stated guided-listening series. Anything else stays unresolved and is listed,
 * because a guessed family routes an edition to the wrong checks.
 */
function classify(entry, ledgerRecord) {
  if (entry.family !== undefined) {
    if (!FAMILIES.includes(entry.family)) {
      throw new Error(`unknown narrative family "${entry.family}"`);
    }
    return { family: entry.family, series: entry.series };
  }
  if (ledgerRecord) {
    return {
      family: "name-investigation",
      series: entry.series ?? "name-origin",
    };
  }
  if (entry.profile === "memoires-sonores") {
    return { family: "guided-listening", series: "memoires-sonores" };
  }
  return { family: null, series: entry.series };
}

function subjectOf(entry) {
  const label =
    entry.subject.split("·").slice(1).join("·").trim() || entry.subject.trim();
  return { key: fold(label), label };
}

export function editionFromPost(entry, { ledger } = {}) {
  const campaign = entry.links?.campaign ?? entry.id;
  const ledgerRecord = ledger?.get(campaign);
  const { family, series } = classify(entry, ledgerRecord);
  const angle =
    entry.angle ??
    (ledgerRecord
      ? { id: campaign, question: ledgerRecord.question?.fr ?? null }
      : null);
  const format = formatOf(entry);
  const occurrences = occurrencesOf(entry);
  const intendedNetworks = entry.intendedChannels ?? [];

  const edition = {
    id: entry.id,
    title: entry.title,
    subject: subjectOf(entry),
    angle,
    family,
    series,
    format,
    readiness: entry.status === "publie" ? "pret" : entry.status,
    // The registry's own `publie` status, kept apart from readiness: an entry
    // filed published with no occurrence recorded is a gap to research, not an
    // edition waiting to go out.
    filedPublished: entry.status === "publie",
    intendedNetworks,
    occurrences,
    relations: entry.relations ?? [],
    unresolved: [
      ...(family ? [] : ["family"]),
      ...(angle ? [] : ["angle"]),
      ...(format ? [] : ["format"]),
    ],
  };
  if (entry.plannedDate !== undefined) edition.plannedDate = entry.plannedDate;
  edition.distribution = distribution(edition);
  return edition;
}

export function buildCatalogue(entries, { ledger } = {}) {
  const editions = entries.map((entry) => editionFromPost(entry, { ledger }));

  const subjects = new Map();
  for (const edition of editions) {
    const { key, label } = edition.subject;
    if (!subjects.has(key)) subjects.set(key, { key, label, angles: [] });
    const { angles } = subjects.get(key);
    const angleId = edition.angle?.id ?? null;
    let angle = angles.find((candidate) => candidate.id === angleId);
    if (!angle) {
      angle = {
        id: angleId,
        question: edition.angle?.question ?? null,
        editions: [],
      };
      angles.push(angle);
    }
    angle.editions.push(edition);
  }

  return {
    editions,
    subjects: [...subjects.values()],
    duplicates: findDuplicateOccurrences(editions),
    publishedWithoutOccurrence: editions.filter(
      (edition) => edition.filedPublished && edition.occurrences.length === 0
    ),
    unresolved: editions
      .filter((edition) => edition.unresolved.length)
      .map(({ id, unresolved }) => ({ id, missing: unresolved })),
  };
}

export const readyEditions = (catalogue) =>
  catalogue.editions.filter(
    (edition) =>
      edition.readiness === "pret" &&
      !edition.filedPublished &&
      edition.distribution.state === "none"
  );

export const partialEditions = (catalogue) =>
  catalogue.editions.filter(
    (edition) => edition.distribution.state === "partial"
  );

const liveOccurrences = (edition) =>
  edition.occurrences.filter(
    (occurrence) => occurrence.status === "published" && !occurrence.fixture
  );

const identityOf = (network, url, platformId) =>
  platformId ?? platformPostId(network, url) ?? url ?? null;

/**
 * Sets a platform read beside the registry and reports the differences without
 * deciding any of them. A row is a match only on platform identity; a row placed
 * in a group by caption text is a lead. A network the read did not cover is never
 * judged, and a Meta row that combines Instagram and Facebook stands for both
 * accounts of the edition it matches, never for one of them alone.
 */
export function reconcileLive(catalogue, liveRows, { coverage }) {
  const byIdentity = new Map();
  for (const edition of catalogue.editions) {
    for (const occurrence of liveOccurrences(edition)) {
      const id = identityOf(
        occurrence.network,
        occurrence.url,
        occurrence.platformPostId
      );
      if (id)
        byIdentity.set(`${occurrence.network}|${id}`, { edition, occurrence });
    }
  }
  const editionById = new Map(
    catalogue.editions.map((edition) => [edition.id, edition])
  );
  const editionOfGroup = (group) =>
    editionById.get(group) ??
    catalogue.editions.find((edition) => edition.angle?.id === group);

  const report = {
    matched: [],
    liveNotInRegistry: [],
    readyButLive: [],
    inferredOnly: [],
    registryNotLive: [],
    unjudged: 0,
  };
  const seen = new Set();
  const combined = new Set();
  const readyRows = new Map();

  for (const row of liveRows) {
    const id = identityOf(row.network, row.url, null);
    const hit = id ? byIdentity.get(`${row.network}|${id}`) : undefined;
    if (hit) {
      seen.add(`${row.network}|${id}`);
      if (row.scope === "meta-combined") combined.add(hit.edition.id);
      report.matched.push({ rowId: row.rowId, edition: hit.edition.id });
      continue;
    }
    const grouped = row.group ? editionOfGroup(row.group) : undefined;
    if (grouped && grouped.distribution.state === "none") {
      if (row.groupMethod === "ledger-url") {
        readyRows.set(grouped.id, [...(readyRows.get(grouped.id) ?? []), row]);
      } else {
        report.inferredOnly.push(row);
      }
      continue;
    }
    report.liveNotInRegistry.push(row);
  }

  for (const [edition, rows] of readyRows) {
    const { format, readiness } = editionById.get(edition);
    report.readyButLive.push({ edition, format, readiness, rows });
  }

  for (const edition of catalogue.editions) {
    for (const occurrence of liveOccurrences(edition)) {
      if (!coverage.includes(occurrence.network)) continue;
      const id = identityOf(
        occurrence.network,
        occurrence.url,
        occurrence.platformPostId
      );
      if (!id) {
        report.unjudged += 1;
        continue;
      }
      if (seen.has(`${occurrence.network}|${id}`)) continue;
      if (occurrence.network === "facebook" && combined.has(edition.id))
        continue;
      report.registryNotLive.push({
        edition: edition.id,
        network: occurrence.network,
        url: occurrence.url,
        platformPostId: occurrence.platformPostId,
      });
    }
  }
  return report;
}
