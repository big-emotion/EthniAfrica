import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { WeeklySearchName } from "@/lib/i18n/copy/searchEntry";

/** Read the optional output of scripts/buildSearchedThisWeek.ts. */
// @req REQ-200
export async function readSearchedThisWeek(): Promise<WeeklySearchName[]> {
  try {
    const raw = await readFile(
      join(process.cwd(), "src/data/searchedThisWeek.json"),
      "utf8"
    );
    const document: unknown = JSON.parse(raw);
    if (
      typeof document !== "object" ||
      document === null ||
      !("names" in document) ||
      !Array.isArray(document.names)
    ) {
      return [];
    }

    return document.names.flatMap((item): WeeklySearchName[] => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("form" in item) ||
        typeof item.form !== "string" ||
        !item.form.trim() ||
        !("href" in item) ||
        typeof item.href !== "string" ||
        !item.href.startsWith("/")
      ) {
        return [];
      }
      return [{ form: item.form, href: item.href }];
    });
  } catch {
    return [];
  }
}
