/**
 * Turns "ready in the registry, live on the platforms" into correction
 * proposals for `reconcile-registry.mjs` — and only where two systems that do
 * not copy each other name the same platform post: the live read and the name
 * ledger's own URL. A row only one of them knows is a lead, never a correction.
 * Rows that disagree on the date are leads too: which system's date is the
 * publication date is exactly what the audit could not settle.
 */
import { platformPostId } from "./catalogue.mjs";

const identity = (network, url) => platformPostId(network, url) ?? url;

export function proposeCorrections(readyButLive, ledger) {
  const corrections = [];
  const leads = [];

  for (const entry of readyButLive) {
    const record = ledger.get(entry.campaign ?? entry.edition);
    const known = new Set(
      (record?.publications ?? [])
        .filter((publication) => publication.url)
        .map(
          (publication) =>
            `${publication.network}|${identity(publication.network, publication.url)}`
        )
    );
    // A live carousel is not evidence that a video edition went out, and a
    // draft that is live is a different fault than a ready edition not filed.
    const confirmed =
      entry.readiness === "pret"
        ? entry.rows.filter(
            (row) =>
              row.url &&
              row.format === entry.format &&
              known.has(`${row.network}|${identity(row.network, row.url)}`)
          )
        : [];
    const dates = new Set(confirmed.map((row) => row.publishedAt));
    const unconfirmed = entry.rows.filter((row) => !confirmed.includes(row));

    if (!confirmed.length || dates.size !== 1 || !record) {
      leads.push(...entry.rows);
      continue;
    }
    leads.push(...unconfirmed);
    corrections.push({
      op: "record-published",
      post: entry.edition,
      date: [...dates][0],
      channels: Object.fromEntries(
        confirmed.map((row) => [row.network, row.url])
      ),
      sources: [
        { kind: "site-ledger", ref: `docs/productions/${record.file}` },
        {
          kind: "live-audit",
          ref: confirmed.map((row) => row.rowId).join(","),
        },
      ],
    });
  }
  return { corrections, leads };
}
