/**
 * The source review queue: every citation the corpus still marks
 * `needs_review`, one entry per citation identity.
 *
 * Built from the fiches in git, not from `sources`: a ruling names the exact
 * title and url a fiche carries, and the database holds one row per title
 * (the upsert conflict target), so two fiches citing one title at two urls
 * would read as one citation there. The page's server trace ships the three
 * fiche kinds read here (next.config.ts), because the production image copies
 * only the traced files.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

// @req REQ-092
export const SOURCE_REVIEW_KINDS = [
  "peuples",
  "pays",
  "famille_linguistique",
] as const;

export type SourceReviewKind = (typeof SOURCE_REVIEW_KINDS)[number];

export interface SourceReviewCitation {
  /** Relative to dataset/source/afrik, with forward slashes. */
  path: string;
  ficheId: string;
  kind: SourceReviewKind;
}

export interface SourceReviewItem {
  key: string;
  title: string;
  url: string | null;
  fiches: SourceReviewCitation[];
}

export interface SourceReviewFilters {
  kind?: SourceReviewKind;
  hasUrl?: boolean;
  fiche?: string;
  state?: "to-review" | "decided";
}

type KindDirectories = Record<SourceReviewKind, string>;

// @req REQ-092
export function citationKey(title: string, url: string | null): string {
  return JSON.stringify([title, url || null]);
}

function jsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith(".json") ? [full] : [];
  });
}

function sourcesArrays(value: unknown, found: unknown[][] = []): unknown[][] {
  if (Array.isArray(value)) {
    for (const item of value) sourcesArrays(item, found);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "sources" && Array.isArray(child)) found.push(child);
      sourcesArrays(child, found);
    }
  }
  return found;
}

function collectQueue(directories: KindDirectories): SourceReviewItem[] {
  const byKey = new Map<string, SourceReviewItem>();

  for (const kind of SOURCE_REVIEW_KINDS) {
    const directory = directories[kind];
    for (const file of jsonFiles(directory)) {
      let fiche: unknown;
      try {
        fiche = JSON.parse(readFileSync(file, "utf8"));
      } catch {
        continue;
      }
      const path = `${kind}/${relative(directory, file).split(sep).join("/")}`;

      for (const sources of sourcesArrays(fiche)) {
        for (const source of sources as {
          title?: unknown;
          url?: unknown;
          tier?: unknown;
        }[]) {
          if (source?.tier !== "needs_review") continue;
          if (typeof source.title !== "string") continue;
          const url =
            typeof source.url === "string" && source.url ? source.url : null;
          const key = citationKey(source.title, url);

          const item = byKey.get(key) ?? {
            key,
            title: source.title,
            url,
            fiches: [],
          };
          if (!item.fiches.some((cited) => cited.path === path)) {
            item.fiches.push({ path, ficheId: basename(file, ".json"), kind });
          }
          byKey.set(key, item);
        }
      }
    }
  }

  const items = [...byKey.values()];
  for (const item of items) {
    item.fiches.sort((a, b) => a.path.localeCompare(b.path));
  }
  // Most-cited first: one ruling on those clears the most citations.
  return items.sort(
    (a, b) =>
      b.fiches.length - a.fiches.length ||
      a.title.localeCompare(b.title) ||
      (a.url ?? "").localeCompare(b.url ?? "")
  );
}

// @req REQ-092
export function buildSourceReviewQueue(
  datasetRoot: string
): SourceReviewItem[] {
  return collectQueue({
    peuples: join(datasetRoot, "peuples"),
    pays: join(datasetRoot, "pays"),
    famille_linguistique: join(datasetRoot, "famille_linguistique"),
  });
}

// @req REQ-092
export function filterSourceReviewQueue(
  items: readonly SourceReviewItem[],
  filters: SourceReviewFilters,
  decidedKeys: ReadonlySet<string>
): SourceReviewItem[] {
  const fiche = filters.fiche?.trim().toLowerCase();

  return items.filter(
    (item) =>
      (!filters.kind ||
        item.fiches.some((cited) => cited.kind === filters.kind)) &&
      (filters.hasUrl === undefined ||
        (item.url !== null) === filters.hasUrl) &&
      (!fiche ||
        item.fiches.some((cited) =>
          cited.path.toLowerCase().includes(fiche)
        )) &&
      (!filters.state ||
        decidedKeys.has(item.key) === (filters.state === "decided"))
  );
}

let queue: SourceReviewItem[] | null = null;

/**
 * The corpus is immutable inside a deployed image, so it is read once per
 * server process; a local run picks up applied rulings on restart.
 *
 * Each directory is spelled out as a literal on purpose. The server file
 * tracer follows a literal `process.cwd()` join, and a join on the corpus root
 * shipped the whole corpus — archive, patronymes, dossiers — into this page's
 * trace, a thousand files no other route carries.
 */
// @req REQ-092
export function readSourceReviewQueue(): SourceReviewItem[] {
  queue ??= collectQueue({
    peuples: join(process.cwd(), "dataset/source/afrik/peuples"),
    pays: join(process.cwd(), "dataset/source/afrik/pays"),
    famille_linguistique: join(
      process.cwd(),
      "dataset/source/afrik/famille_linguistique"
    ),
  });
  return queue;
}
