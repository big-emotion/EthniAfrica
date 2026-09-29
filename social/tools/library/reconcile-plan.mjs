/**
 * Decides what a set of verified corrections would change in the registry,
 * and refuses the rest by name. Pure: it reads entries and returns changes.
 *
 * One operation exists — `record-published` — because it is the one gap the
 * audit proved: an entry still `pret` whose posts are live. It moves nothing
 * else. It never overwrites a URL or a date the registry already holds, and it
 * asks for two independent kinds of source, because a single system agreeing
 * with itself is not verification.
 */
import { NETWORKS } from "../contract/contract.mjs";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_SHAPE = /^https?:\/\/\S+$/;
const UNRECORDED_URL = /^publié le (\d{4}-\d{2}-\d{2}), URL non enregistrée$/;

const channelText = (date, url) => (date ? `publié le ${date}, ${url}` : url);

function refusalFor(entry, correction) {
  if (correction.op !== "record-published") {
    return `unknown operation "${correction.op}"`;
  }
  if (!entry) return `no entry "${correction.post}" in the registry`;
  const kinds = new Set(
    (correction.sources ?? []).map((source) => source.kind)
  );
  if (kinds.size < 2) {
    return "a correction needs two independent kinds of source";
  }
  if (correction.date !== undefined && !DATE.test(correction.date)) {
    return `date "${correction.date}" is not YYYY-MM-DD`;
  }
  for (const [network, url] of Object.entries(correction.channels ?? {})) {
    if (!NETWORKS.includes(network)) return `unknown network "${network}"`;
    if (!URL_SHAPE.test(url)) return `${network} url "${url}" is not a URL`;
  }
  if (entry.status !== "publie" && !correction.date) {
    return "a date is required to file an entry as published";
  }
  return null;
}

export function planCorrections(entries, corrections) {
  const working = new Map(
    entries.map((entry) => [entry.id, structuredClone(entry)])
  );
  const original = new Map(entries.map((entry) => [entry.id, entry]));
  const changes = [];
  const refusals = [];

  for (const correction of corrections) {
    const entry = working.get(correction.post);
    const problem = refusalFor(entry, correction);
    if (problem) {
      refusals.push({ post: correction.post, reason: problem });
      continue;
    }

    const channels = { ...entry.channels };
    let conflict = null;
    for (const [network, url] of Object.entries(correction.channels ?? {})) {
      const wanted = channelText(correction.date, url);
      const held = channels[network];
      const enrichesUnknownUrl =
        held?.match(UNRECORDED_URL)?.[1] === correction.date;
      if (held === undefined || enrichesUnknownUrl) channels[network] = wanted;
      else if (held !== wanted && !held.includes(url)) {
        conflict = `${network} already records a different value: ${held}`;
      }
    }
    if (conflict) {
      refusals.push({ post: correction.post, reason: conflict });
      continue;
    }

    const after = {};
    if (entry.status !== "publie") {
      after.status = "publie";
      after.date = correction.date;
      after.dateKind = "publication";
    } else if (!entry.date && correction.date) {
      after.date = correction.date;
      after.dateKind = "publication";
    }
    if (JSON.stringify(channels) !== JSON.stringify(entry.channels)) {
      after.channels = channels;
    }
    if (Object.keys(after).length === 0) continue;

    Object.assign(entry, after);
    const existing = changes.find((change) => change.post === correction.post);
    if (existing) {
      Object.assign(existing.after, after);
      existing.sources.push(...correction.sources);
    } else {
      changes.push({
        post: correction.post,
        before: {
          status: original.get(correction.post).status,
          date: original.get(correction.post).date,
          dateKind: original.get(correction.post).dateKind,
          channels: original.get(correction.post).channels,
        },
        after,
        sources: [...correction.sources],
      });
    }
  }
  return { changes, refusals };
}
