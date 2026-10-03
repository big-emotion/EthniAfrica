/**
 * « Où en est ce sujet ? » as a projection of the catalogue.
 *
 * It used to scrape each generated `post.md` and group by subject text, so it
 * answered from a copy of the registry and had to guess formats from folder
 * contents. It also announced a « doublon » whenever a format had already gone
 * out, and « jamais publié en carrousel » whenever it had not — both retired by
 * the contract: repeated coverage is legitimate, a companion format is never
 * owed, and the only duplicate is one platform post filed twice.
 *
 * Text in, text out, so the reading can be tested without a library.
 */
const NOM = { video: "vidéo", carrousel: "carrousel" };
const FORMAT_ORDER = Object.keys(NOM);

const fold = (text) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const formatName = (format) => NOM[format] ?? "format non renseigné";

const joinFr = (items) =>
  items.length > 1
    ? `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`
    : (items[0] ?? "");

function publishedDate(edition) {
  const dates = edition.occurrences
    .map((occurrence) => occurrence.publishedAt)
    .filter(Boolean)
    .sort();
  return dates[0] ?? null;
}

function editionLine(edition) {
  const networks = edition.distribution.published;
  const state = {
    none: "jamais publiée",
    partial: "publiée en partie",
    complete: "publiée",
  }[edition.distribution.state];
  return `- ${formatName(edition.format)} · « ${edition.title} » · ${state} · réseaux : ${networks.length ? networks.join(", ") : "—"}`;
}

function subjectBlock(subject, duplicates) {
  const editions = subject.angles.flatMap((angle) => angle.editions);
  const published = editions.filter(
    (edition) => edition.distribution.published.length
  );
  const formats = FORMAT_ORDER.filter((format) =>
    published.some((edition) => edition.format === format)
  );

  const lines = [`## ${subject.label}`, ""];
  for (const angle of subject.angles) {
    lines.push(`Angle : ${angle.question ?? angle.id ?? "non résolu"}`);
    lines.push(...angle.editions.map(editionLine));
  }
  lines.push("");
  lines.push(
    `Déjà publié : ${formats.length ? joinFr(formats.map(formatName)) : "rien"}`
  );

  for (const edition of editions) {
    if (edition.distribution.published.length) continue;
    const sameFormat = published.find(
      (other) => other.format === edition.format
    );
    if (sameFormat) {
      lines.push(
        `« ${edition.title} » (${formatName(edition.format)}) : même format déjà publié le ${publishedDate(sameFormat) ?? "?"} — reprise à décider : nouvel angle, republication, ou rien.`
      );
    }
  }

  const ids = new Set(editions.map((edition) => edition.id));
  for (const duplicate of duplicates.filter((d) =>
    d.editions.some((id) => ids.has(id))
  )) {
    lines.push(
      `Doublon d'enregistrement : ${duplicate.key.replace("|", " ")} est inscrit sous ${duplicate.editions.join(" et ")}.`
    );
  }
  return lines.join("\n");
}

const isFlagged = (subject, duplicates) => {
  const editions = subject.angles.flatMap((angle) => angle.editions);
  const ids = new Set(editions.map((edition) => edition.id));
  const published = editions.filter(
    (edition) => edition.distribution.published.length
  );
  return (
    duplicates.some((d) => d.editions.some((id) => ids.has(id))) ||
    editions.some(
      (edition) =>
        !edition.distribution.published.length &&
        published.some((other) => other.format === edition.format)
    )
  );
};

export function renderBilan(catalogue, { search } = {}) {
  const { subjects, duplicates, editions } = catalogue;
  const wanted = search ? fold(search) : null;
  const shown = wanted
    ? subjects.filter(
        (subject) =>
          fold(subject.label).includes(wanted) ||
          subject.angles.some((angle) =>
            angle.editions.some((edition) => fold(edition.id).includes(wanted))
          )
      )
    : subjects.filter((subject) => isFlagged(subject, duplicates));

  const head = `${editions.length} éditions, ${subjects.length} sujet${subjects.length > 1 ? "s" : ""}, ${shown.length} affiché${shown.length > 1 ? "s" : ""}`;
  if (wanted && !shown.length) return `Aucune édition pour « ${search} ».`;
  return [
    head,
    "",
    ...shown.map((subject) => subjectBlock(subject, duplicates) + "\n"),
  ].join("\n");
}
