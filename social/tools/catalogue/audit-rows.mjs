/**
 * Turns the format audit's `publications.csv` into the live rows
 * `reconcileLive` compares against the registry. Only the columns the
 * comparison reads are kept, so a change elsewhere in the dataset cannot
 * silently alter a reconciliation.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell || row.length) rows.push([...row, cell]);
  const [header, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(header.map((name, i) => [name, values[i] ?? ""]))
  );
}

const COMBINED = /^instagram\+facebook/;

// Only the two formats the registry knows. A single photo or an image post of
// unverified shape stays null: matching it to a carousel would be a guess.
const formatOf = (audited) =>
  audited === "short_video"
    ? "video"
    : audited === "carousel" || audited === "photo_carousel"
      ? "carrousel"
      : null;

export function liveRowsFromCsv(text) {
  return parseCsv(text).map((row) => ({
    rowId: row.row_id,
    network: COMBINED.test(row.platform) ? "instagram" : row.platform,
    ...(COMBINED.test(row.platform) ? { scope: "meta-combined" } : {}),
    url: row.url || null,
    publishedAt: row.published_date || null,
    format: formatOf(row.actual_format),
    group: row.content_group_id || null,
    groupMethod: row.group_method || null,
  }));
}
