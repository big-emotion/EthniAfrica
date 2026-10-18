import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const APP_LANG_ROOT = resolve(__dirname, "../app/[lang]");

/**
 * The `page.tsx` serving a route directory under `src/app/[lang]`, or null.
 *
 * A route group — a `(name)` directory — adds no URL segment, so the page of
 * `atlas/recherche` may sit at `atlas/recherche/(reading)/page.tsx`. The hub
 * and the search page live in groups so that their wait wraps them alone
 * (REQ-052, REQ-200); a suite resolving a URL to its file reads through that.
 */
// @req REQ-091
export function routePageFile(routeDirectory: string): string | null {
  const directory = resolve(APP_LANG_ROOT, routeDirectory);
  const direct = resolve(directory, "page.tsx");
  if (existsSync(direct)) return direct;
  if (!existsSync(directory)) return null;
  const grouped = readdirSync(directory)
    .filter((entry) => /^\(.+\)$/.test(entry))
    .map((group) => resolve(directory, group, "page.tsx"))
    .filter((file) => existsSync(file));
  return grouped[0] ?? null;
}
