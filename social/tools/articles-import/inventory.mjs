/**
 * The union of the two registries that each describe part of what went out.
 *
 * The private library's `publications.json` knows which files were filed as
 * published; the site ledger under `docs/productions/` knows which subject a
 * post belongs to and, often, its URL. They were never keyed alike — only a
 * minority of published records share an id with a campaign — so the union is
 * built from evidence both sides actually carry: the same identifier, or the
 * same post URL. A similar title is not evidence; it is how a September 5
 * video and a September 16 carousel get merged into one edition. Anything
 * else is a curated link that must say, in words, why it holds.
 */

const URL_PATTERN = /https?:\/\/[^\s<>)"'»]+/g;

/** Every URL written in a free-text field, in order. */
export function extractUrls(text) {
  if (typeof text !== "string") return [];
  return (text.match(URL_PATTERN) ?? []).map((u) => u.replace(/[.,;]+$/, ""));
}

/**
 * A key for the post a URL points at, so that `watch?v=` and `/shorts/`, or a
 * reel and a `/p/` link, compare equal when they are the same post.
 */
export function normalizeUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "youtu.be") return `youtube:${parts[0]}`;
  if (host === "youtube.com") {
    const id =
      url.searchParams.get("v") ??
      (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null);
    return id ? `youtube:${id}` : `youtube.com/${parts.join("/")}`;
  }
  if (host === "tiktok.com") {
    const at = parts.findIndex((p) => p === "video" || p === "photo");
    if (at >= 0 && parts[at + 1]) return `tiktok:${parts[at + 1]}`;
  }
  if (host === "instagram.com" && ["p", "reel", "reels"].includes(parts[0])) {
    return `instagram:${parts[1]}`;
  }
  if (host === "facebook.com") {
    if (parts[0] === "reel" && parts[1]) return `facebook:reel:${parts[1]}`;
    const fbid = url.searchParams.get("fbid");
    if (fbid) return `facebook:photo:${fbid}`;
  }
  return `${host}/${parts.join("/")}`;
}

/** The ISO day id a TikTok post was created, read from its id. */
export function tiktokCreatedOn(raw) {
  const key = normalizeUrl(raw);
  if (!key?.startsWith("tiktok:") || !/^\d+$/.test(key.slice(7))) return null;
  // A TikTok id holds its creation time in seconds in its high 32 bits.
  const seconds = Number(BigInt(key.slice(7)) >> 32n);
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

/** What a published private record says went out: network, URL, date. */
export function recordOccurrences(record) {
  const out = [];
  for (const [network, value] of Object.entries(record.channels ?? {})) {
    const urls = extractUrls(value);
    if (urls.length === 0) out.push({ network, url: null, key: null });
    for (const url of urls) out.push({ network, url, key: normalizeUrl(url) });
  }
  return out;
}

export function campaignOccurrences(campaign) {
  return (campaign.publications ?? []).map((p) => ({
    network: p.network,
    format: p.format,
    url: p.url ?? null,
    key: p.url ? normalizeUrl(p.url) : null,
    publishedAt: p.publishedAt ?? null,
  }));
}

/**
 * Group records and campaigns that are provably about the same thing.
 *
 * `links` are curated ties for the cases no identifier connects; each carries
 * the evidence a reviewer can re-check. Returns one group per connected set,
 * each with the evidence that joined it, in an order independent of input.
 */
export function reconcile({ records, campaigns, links = [] }) {
  const parent = new Map();
  const evidence = new Map();
  const node = (kind, id) => `${kind}:${id}`;
  const find = (x) => {
    while (parent.get(x) !== x) x = parent.get(x);
    return x;
  };
  const union = (a, b, why) => {
    const ra = find(a);
    const rb = find(b);
    const [keep, drop] = ra < rb ? [ra, rb] : [rb, ra];
    if (ra !== rb) parent.set(drop, keep);
    const list = evidence.get(`${a}|${b}`) ?? [];
    list.push(why);
    evidence.set(`${a}|${b}`, list);
  };

  const recordIds = new Set(records.map((r) => r.id));
  const campaignIds = new Set(campaigns.map((c) => c.campaign));
  for (const id of recordIds)
    parent.set(node("record", id), node("record", id));
  for (const id of campaignIds)
    parent.set(node("campaign", id), node("campaign", id));

  const byKey = new Map();
  for (const c of campaigns) {
    for (const occ of campaignOccurrences(c)) {
      if (!occ.key) continue;
      if (!byKey.has(occ.key)) byKey.set(occ.key, new Set());
      byKey.get(occ.key).add(c.campaign);
    }
  }

  for (const r of records) {
    const rn = node("record", r.id);
    if (campaignIds.has(r.id)) {
      union(rn, node("campaign", r.id), `same id "${r.id}"`);
    }
    const linked = r.links?.campaign;
    if (linked && linked !== r.id && campaignIds.has(linked)) {
      union(rn, node("campaign", linked), `record links.campaign "${linked}"`);
    }
    for (const occ of recordOccurrences(r)) {
      for (const c of byKey.get(occ.key) ?? []) {
        union(rn, node("campaign", c), `shared URL ${occ.key}`);
      }
    }
  }
  // Two records filed under one links.campaign are editions of one angle even
  // when the ledger has no campaign of that name.
  const byLinked = new Map();
  for (const r of records) {
    const linked = r.links?.campaign;
    if (!linked || campaignIds.has(linked)) continue;
    if (byLinked.has(linked)) {
      union(
        node("record", byLinked.get(linked)),
        node("record", r.id),
        `shared links.campaign "${linked}"`
      );
    } else byLinked.set(linked, r.id);
  }

  const bySubject = new Map();
  for (const r of [...records].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!r.workshopSubject) continue;
    if (bySubject.has(r.workshopSubject)) {
      union(
        node("record", bySubject.get(r.workshopSubject)),
        node("record", r.id),
        `same workshop subject "${r.workshopSubject}"`
      );
    } else bySubject.set(r.workshopSubject, r.id);
  }

  for (const link of links) {
    if (!link.evidence?.trim()) {
      throw new Error(
        `curated link ${link.record} → ${link.campaign ?? link.withRecord} has no evidence`
      );
    }
    if (!recordIds.has(link.record)) {
      throw new Error(`curated link names unknown record "${link.record}"`);
    }
    const target = link.campaign
      ? node("campaign", link.campaign)
      : node("record", link.withRecord);
    if (!parent.has(target)) {
      throw new Error(
        `curated link names unknown ${link.campaign ? "campaign" : "record"} "${link.campaign ?? link.withRecord}"`
      );
    }
    union(node("record", link.record), target, `curated: ${link.evidence}`);
  }

  const groups = new Map();
  for (const key of parent.keys()) {
    const root = find(key);
    if (!groups.has(root)) {
      groups.set(root, { records: [], campaigns: [], evidence: [] });
    }
    const [kind, id] = [
      key.slice(0, key.indexOf(":")),
      key.slice(key.indexOf(":") + 1),
    ];
    groups.get(root)[kind === "record" ? "records" : "campaigns"].push(id);
  }
  for (const [pair, whys] of evidence) {
    const root = find(pair.split("|")[0]);
    for (const why of whys) {
      groups.get(root).evidence.push(`${pair.replace("|", " ↔ ")}: ${why}`);
    }
  }
  const result = [...groups.values()].map((g) => ({
    records: g.records.sort(),
    campaigns: g.campaigns.sort(),
    evidence: [...new Set(g.evidence)].sort(),
  }));
  result.sort((a, b) =>
    (a.campaigns[0] ?? a.records[0]).localeCompare(
      b.campaigns[0] ?? b.records[0]
    )
  );
  return { groups: result };
}
