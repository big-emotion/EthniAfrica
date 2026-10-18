import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readNaming } from "../src/lib/search/naming";
import { nameSearchHref } from "../src/lib/search/nameAddress";
import {
  filterSearchedThisWeek,
  placeSubjectsFromFiche,
  type SearchMetric,
  type SearchSubject,
} from "./lib/searchedThisWeek";

const site = process.env.PLAUSIBLE_SITE_ID ?? "ethniafrica.com";
const apiHost =
  process.env.PLAUSIBLE_API_HOST ?? "https://stats.ethniafrica.com";
const apiKey = process.env.PLAUSIBLE_API_KEY;
const today = new Date();
const generatedAt = today.toISOString();
const from = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
const to = generatedAt.slice(0, 10);

async function main() {
  if (!apiKey)
    throw new Error(
      "PLAUSIBLE_API_KEY is required to build searchedThisWeek.json"
    );
  const params = new URLSearchParams({
    site_id: site,
    period: "custom",
    date: `${from},${to}`,
    property: "event:props:query",
    metrics: "visitors",
    filters: "event:name==search:submit;event:props:surface==serp",
  });
  const response = await fetch(`${apiHost}/api/v1/stats/breakdown?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok)
    throw new Error(
      `Plausible returned ${response.status}: ${await response.text()}`
    );
  const rows = (await response.json()) as Array<{
    query?: string;
    visitors?: number;
  }>;
  const metrics: SearchMetric[] = rows.flatMap((row) =>
    typeof row.query === "string" && typeof row.visitors === "number"
      ? [{ name: row.query, visitors: row.visitors }]
      : []
  );
  const subjects = loadSubjects();
  const names = filterSearchedThisWeek(metrics, subjects);
  writeFileSync(
    join(process.cwd(), "src/data/searchedThisWeek.json"),
    `${JSON.stringify({ generatedAt, names }, null, 2)}\n`
  );
}

function loadSubjects(): SearchSubject[] {
  const root = join(process.cwd(), "dataset/source/afrik");
  const collections = [
    ["peuples", "people"],
    ["pays", "country"],
    ["famille_linguistique", "languageFamily"],
    ["langues", "language"],
    ["patronymes", "patronyme"],
    ["lieux", "place"],
  ] as const;
  const subjects: SearchSubject[] = [];
  for (const [folder, type] of collections) {
    for (const file of findJsonFiles(join(root, folder))) {
      const entity = JSON.parse(readFileSync(file, "utf8")) as Record<
        string,
        unknown
      >;
      if (type === "place") {
        subjects.push(...placeSubjectsFromFiche(entity));
        continue;
      }
      const content = (entity.content ?? {}) as Record<string, unknown>;
      const forms = [
        entity.nameMain,
        ...readNaming(type, content, entity).forms.map((item) => item.form),
        readNaming(type, content, entity).selfGiven,
        ...(
          (
            entity.nameHistory as
              { names?: Array<{ nameText?: unknown }> } | undefined
          )?.names ?? []
        ).map((name) => name.nameText),
      ].filter(
        (value): value is string => typeof value === "string" && !!value.trim()
      );
      const history = entity.nameHistory as { summary?: unknown } | undefined;
      const summary =
        typeof history?.summary === "string"
          ? history.summary
          : typeof content.summary === "string"
            ? content.summary
            : "";
      if (!summary.trim()) continue;
      const id = typeof entity.id === "string" ? entity.id : "";
      if (!id) continue;
      for (const form of new Set(forms)) {
        subjects.push({
          form,
          subject: { type, id },
          summary,
          href: nameSearchHref("fr", form),
        });
      }
    }
  }
  return subjects;
}

function findJsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? findJsonFiles(path)
      : entry.name.endsWith(".json")
        ? [path]
        : [];
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
