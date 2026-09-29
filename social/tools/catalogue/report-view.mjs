/**
 * Renders the catalogue, and optionally a live reconciliation, as one Markdown
 * report. Generated, never edited: the numbers come from the catalogue, so the
 * report cannot drift from the registry it describes.
 *
 * The list of ready editions is a list of editions, not a tally of "unpublished
 * subjects". A subject with a published video and a ready carousel is not owed
 * anything, and counting it as unpublished was the misleading figure this view
 * replaces.
 */
import { partialEditions, readyEditions } from "./catalogue.mjs";

const line = (edition) =>
  `- \`${edition.id}\` · ${edition.subject.label} · ${edition.format ?? "format ?"}${edition.plannedDate ? ` · prévue ${edition.plannedDate}` : ""}`;

const section = (title, items, render) =>
  [
    `## ${title} (${items.length})`,
    "",
    ...(items.length ? items.map(render) : ["Aucune."]),
    "",
  ].join("\n");

export function renderReport(catalogue, { reconciliation, proposals } = {}) {
  const ready = readyEditions(catalogue);
  const partial = partialEditions(catalogue);
  const angles = catalogue.subjects.reduce((n, s) => n + s.angles.length, 0);

  const out = [
    "# Catalogue des éditions",
    "",
    "Fichier généré à partir du registre. Ne pas l'éditer à la main.",
    "",
    `${catalogue.editions.length} éditions, ${catalogue.subjects.length} sujets, ${angles} angles.`,
    "Une édition publiée ne ferme ni son angle ni son sujet ; un format absent n'est pas un manque.",
    "",
    section("Prêtes, jamais publiées", ready, line),
    section(
      "Publiées en partie",
      partial,
      (edition) =>
        `${line(edition)} · publiée : ${edition.distribution.published.join(", ")} · reste : ${edition.distribution.pending.join(", ")}`
    ),
    section(
      "Publiées au registre, aucune occurrence enregistrée (réseau et URL à retrouver)",
      catalogue.publishedWithoutOccurrence,
      (edition) => `${line(edition)}`
    ),
    section(
      "Doublons d'enregistrement (un même post de plateforme inscrit deux fois)",
      catalogue.duplicates,
      (duplicate) =>
        `- ${duplicate.key.replace("|", " ")} : ${duplicate.editions.join(", ")}`
    ),
    section(
      "Identité à résoudre",
      catalogue.unresolved,
      (item) => `- \`${item.id}\` : ${item.missing.join(", ")}`
    ),
  ];

  if (reconciliation) {
    out.push(
      "# Lecture en ligne rapprochée du registre",
      "",
      `${reconciliation.matched.length} lignes appariées par identité de plateforme. ${reconciliation.unjudged} inscriptions du registre sans URL ne peuvent pas être jugées.`,
      "",
      section(
        "Prêtes au registre, en ligne selon deux sources",
        proposals?.corrections ?? [],
        (c) =>
          `- \`${c.post}\` · ${c.date} · ${Object.keys(c.channels).join(", ")} · sources : ${c.sources.map((s) => `${s.kind}:${s.ref}`).join(" ; ")}`
      ),
      section(
        "Pistes non confirmées (à vérifier en ligne)",
        [...(proposals?.leads ?? []), ...reconciliation.inferredOnly],
        (row) =>
          `- ${row.rowId} · ${row.network} · groupe ${row.group ?? "?"} (${row.groupMethod ?? "?"})`
      ),
      section(
        "En ligne, absentes du registre",
        reconciliation.liveNotInRegistry,
        (row) =>
          `- ${row.rowId} · ${row.network} · ${row.url ?? "sans permalien"}`
      ),
      section(
        "Au registre, absentes de la lecture (réseaux entièrement lus)",
        reconciliation.registryNotLive,
        (o) =>
          `- \`${o.edition}\` · ${o.network} · ${o.url ?? o.platformPostId}`
      )
    );
  }
  return out.join("\n");
}
