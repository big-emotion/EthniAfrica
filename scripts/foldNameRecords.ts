/**
 * Folds the `dataset/source/afrik/noms/` records into their people fiches'
 * `nameHistory` block (REQ-196, DEC-071, ETNI-2021).
 *
 * A one-off migration of editorial content, so its rule is to move, never to
 * write: every statement is carried over verbatim, every source keeps its
 * tier and gains a `source_kind`, and a record the block could not serve back
 * whole is refused rather than folded with a hole in it. The only sentences
 * composed here are the summary and the one-line statement of each written
 * trace, both built from the record's own words.
 *
 * Usage: npx tsx scripts/foldNameRecords.ts
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { parseNameRecordFile } from "@/lib/afrik/parsers/nameRecordParser";
import type {
  NameAttestation,
  NameRecordDossier,
  NameRecordEntry,
  NameRecordSource,
} from "@/types/names";
import type { SourceKind } from "@/types/sources";

type HistoryName = NameHistory["names"][number];
type HistoryAccount = HistoryName["accounts"][number];
type HistorySource = HistoryAccount["sources"][number];

const AFRIK_ROOT = join(__dirname, "..", "dataset", "source", "afrik");

/**
 * The kind of every host the twelve records cite, following the kinds the
 * corpus already gives the same hosts (Wikipedia and the press as
 * `community`, the UNESCO General History as `intergovernmental`). A host not
 * listed throws: an unclassified source is a question for an editor, not a
 * default.
 */
const SOURCE_KIND_BY_HOST: Record<string, SourceKind> = {
  "wikipedia.org": "community",
  "ethnologue.com": "linguistic_reference",
  "glottolog.org": "linguistic_reference",
  "omniglot.com": "linguistic_reference",
  "oed.com": "linguistic_reference",
  // Learner's Guide to Pular, the pronunciation's dictionary.
  "ibamba.net": "linguistic_reference",
  "unesdoc.unesco.org": "intergovernmental",
  "whc.unesco.org": "intergovernmental",
  // Barth's and Park's travel accounts, read in their original pagination.
  "gutenberg.org": "archive",
  "cambridge.org": "academic",
  "journals.openedition.org": "academic",
  "redalyc.org": "academic",
  "scholarlypublications.universiteitleiden.nl": "academic",
  // The journal Abbia, where Amadou Hampâté Bâ's article appeared.
  "vestiges-journal.info": "academic",
  // Online transcriptions of Tauxier's book and Yaya Wane's thesis.
  "webpulaaku.site": "academic",
  "sahistory.org.za": "repository",
  "ethnomed.org": "community",
  "mukuyu.wordpress.com": "community",
  "ndarinfo.com": "community",
};

// @req REQ-196
export function sourceKindOf(source: { url: string | null }): SourceKind {
  const host = new URL(source.url).hostname.replace(/^www\./, "");
  const match = Object.keys(SOURCE_KIND_BY_HOST).find(
    (known) => host === known || host.endsWith(`.${known}`)
  );
  if (!match) {
    throw new Error(`no source_kind is decided for ${host}`);
  }
  return SOURCE_KIND_BY_HOST[match];
}

function historySource(
  source: NameRecordSource & { page?: string }
): HistorySource {
  return {
    title: source.title,
    author: source.author,
    year: source.year,
    url: source.url,
    tier: source.tier,
    source_kind: sourceKindOf(source),
    ...(source.page !== undefined ? { page: source.page } : {}),
    ...(source.notes !== undefined ? { notes: source.notes } : {}),
  };
}

/**
 * Names whose own record says they are out of use: Galla was officially
 * abandoned in 1974, Ibo is « n'est plus employé que dans des documents
 * historiques », Union Ibo was a mission language of the first half of the
 * twentieth century. Every other name is still in use.
 */
const FORMER_NAMES = new Set([
  "PPL_IGBO/Ibo",
  "PPL_IGBO/Union Ibo",
  "PPL_OROMO/Galla",
]);

function frenchList(items: string[]): string {
  return items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function summaryOf(dossier: NameRecordDossier): string {
  const own = dossier.names.find((name) => name.nameType === "endonym");
  const others = dossier.names
    .filter((name) => name !== own)
    .map((name) => name.nameText);
  const debated = dossier.names
    .filter((name) => name.originDebated)
    .map((name) => name.nameText);

  return [
    `Le nom ${own.nameText} est celui que ce peuple se donne.`,
    others.length === 1
      ? `On le connaît aussi sous le nom ${others[0]}.`
      : others.length > 1
        ? `On le connaît aussi sous les noms ${frenchList(others)}.`
        : null,
    debated.length === 1
      ? `L'origine du nom ${debated[0]} est débattue.`
      : debated.length > 1
        ? `L'origine des noms ${frenchList(debated)} est débattue.`
        : null,
    others.length > 0
      ? "Leur histoire est présentée plus bas."
      : "Son histoire est présentée plus bas.",
  ]
    .filter(Boolean)
    .join(" ");
}

function traceAccount(
  name: NameRecordEntry,
  trace: NameAttestation
): HistoryAccount {
  return {
    period: {
      from: trace.year,
      to: trace.year,
      label: trace.periodLabel ?? String(trace.year),
    },
    statement: `Le nom ${name.nameText} est écrit « ${trace.formAsWritten} » par ${trace.attestedBy}.`,
    formAsWritten: trace.formAsWritten,
    actors: [{ name: trace.attestedBy, role: "écrit cette forme" }],
    sources: [historySource(trace.source)],
  };
}

function foldName(dossierId: string, name: NameRecordEntry): HistoryName {
  const label = `${dossierId}/${name.nameText}`;
  const refuse = (what: string) => {
    throw new Error(`${label}: cannot fold ${what} without losing it`);
  };
  const sources = name.sources.map(historySource);
  const period = () => {
    if (!name.periodLabel) refuse("a statement with no period label");
    return { from: null, to: null, label: name.periodLabel };
  };

  const described: HistoryAccount[] = [];
  if (name.meaning) {
    described.push({
      period: period(),
      statement: name.meaning,
      aspect: "meaning",
      ...(name.originDebated ? { hypothesisGroup: "origine du nom" } : {}),
      sources,
    });
  } else if (name.originDebated) {
    refuse("a debated origin with no meaning to carry it");
  }
  if (name.whyProblematic) {
    if (!name.impositionPeriod) refuse("an imposition with no period");
    described.push({
      period: { from: null, to: null, label: name.impositionPeriod },
      statement: name.whyProblematic,
      aspect: "imposition",
      ...(name.imposedBy
        ? { actors: [{ name: name.imposedBy, role: "impose ce nom" }] }
        : {}),
      sources,
    });
  } else if (name.imposedBy || name.impositionPeriod) {
    refuse("an imposition with no statement of what it imposed");
  }
  if (name.contemporaryUsage) {
    described.push({
      period: period(),
      statement: name.contemporaryUsage,
      aspect: "usage",
      sources,
    });
  }
  if (described.length === 0) refuse("sources with no statement to cite them");

  const traces = (name.attestations ?? []).map((trace) =>
    traceAccount(name, trace)
  );

  return {
    nameText: name.nameText,
    nameStatus: FORMER_NAMES.has(label) ? "former" : "current",
    selfGiven: name.nameType === "endonym",
    languageOfOrigin: name.languageOfOrigin,
    namedBy: name.namedBy ?? null,
    ...(name.shortLine !== undefined ? { shortLine: name.shortLine } : {}),
    ...(name.usedIn !== undefined ? { usedIn: name.usedIn } : {}),
    ...(name.pronunciation
      ? {
          pronunciation: {
            respelling: name.pronunciation.respelling,
            audio: name.pronunciation.audio,
            source: historySource(name.pronunciation.source),
          },
        }
      : {}),
    ...(name.periodLabel ? { periodLabel: name.periodLabel } : {}),
    ...(name.nameType === "historical_spelling"
      ? { variantSpelling: true as const }
      : {}),
    accounts: [...described, ...traces],
  };
}

// @req REQ-196
export function foldNameRecordDossier(dossier: NameRecordDossier): NameHistory {
  const sorted = [...dossier.names].sort((a, b) => a.sortRank - b.sortRank);
  sorted.forEach((name, index) => {
    if (name.sortRank !== index) {
      throw new Error(
        `${dossier.id}/${name.nameText}: cannot fold sortRank ${name.sortRank}; the block keeps order by position`
      );
    }
  });
  return {
    summary: summaryOf(dossier),
    names: sorted.map((name) => foldName(dossier.id, name)),
  };
}

/**
 * Appends the block as the fiche's last key, as text: the rest of the file is
 * left byte for byte as it was, in its own indentation.
 */
// @req REQ-196
export function withNameHistory(ficheText: string, block: NameHistory): string {
  if ("nameHistory" in JSON.parse(ficheText)) {
    throw new Error("the fiche already carries a nameHistory block");
  }
  const indent = /\n([ \t]+)"/.exec(ficheText)?.[1] ?? "  ";
  const body = JSON.stringify(block, null, indent).replace(
    /\n/g,
    `\n${indent}`
  );
  const close = ficheText.lastIndexOf("}");
  const head = ficheText.slice(0, close).replace(/\s*$/, "");
  return `${head},\n${indent}"nameHistory": ${body}\n${ficheText.slice(close)}`;
}

function ficheFileOf(peopleId: string): string {
  const peoplesRoot = join(AFRIK_ROOT, "peuples");
  for (const family of readdirSync(peoplesRoot)) {
    const candidate = join(peoplesRoot, family, `${peopleId}.json`);
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error(`${peopleId}: no people fiche to fold into`);
}

function main(): void {
  const nomsRoot = join(AFRIK_ROOT, "noms");
  for (const file of readdirSync(nomsRoot).filter((f) => f.endsWith(".json"))) {
    const parsed = parseNameRecordFile(
      JSON.parse(readFileSync(join(nomsRoot, file), "utf-8"))
    );
    if (!parsed.success) {
      throw new Error(`${file}: ${JSON.stringify(parsed.errors)}`);
    }
    if (parsed.data.entityType !== "people") {
      throw new Error(`${file}: only people records are folded`);
    }
    const fiche = ficheFileOf(parsed.data.id);
    writeFileSync(
      fiche,
      withNameHistory(
        readFileSync(fiche, "utf-8"),
        foldNameRecordDossier(parsed.data)
      )
    );
    console.log(`folded ${file} into ${fiche}`);
  }
}

if (require.main === module) {
  main();
}
