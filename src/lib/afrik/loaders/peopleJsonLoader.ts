/**
 * People JSON Loader — reads pre-converted .json files from dataset/source/afrik/peuples/
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import type { People, ParsedFile } from "@/types/afrik";
import { logger } from "@/lib/api/logger";
import { ficheNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";

const PEOPLES_PATH = join(process.cwd(), "dataset/source/afrik/peuples");
const peopleCache = new Map<string, People>();

// @req REQ-033
export async function loadPeople(
  peopleId: string
): Promise<ParsedFile<People>> {
  if (peopleCache.has(peopleId)) {
    return { success: true, data: peopleCache.get(peopleId)! };
  }
  try {
    const dirs = readdirSync(PEOPLES_PATH).filter((d) =>
      statSync(join(PEOPLES_PATH, d)).isDirectory()
    );
    for (const dir of dirs) {
      const filePath = join(PEOPLES_PATH, dir, `${peopleId}.json`);
      let data: People;
      try {
        data = JSON.parse(readFileSync(filePath, "utf-8"));
        if (!data.id)
          throw new Error(`Missing required field "id" in ${peopleId}.json`);
      } catch {
        continue;
      }
      // Outside the per-directory catch: a block that breaks the shared
      // schema is a refusal to report, not a fiche to look for elsewhere.
      const nameHistory = ficheNameHistory(data, peopleId);
      if (nameHistory) data.nameHistory = nameHistory;
      peopleCache.set(peopleId, data);
      return { success: true, data };
    }
    return {
      success: false,
      errors: [
        { type: "parse_failure", message: `People ${peopleId} not found` },
      ],
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          type: "parse_failure",
          message:
            error instanceof Error
              ? error.message
              : `Failed to load people ${peopleId}`,
        },
      ],
    };
  }
}

// @req REQ-033
export async function loadAllPeoples(): Promise<People[]> {
  try {
    const dirs = readdirSync(PEOPLES_PATH).filter((d) =>
      statSync(join(PEOPLES_PATH, d)).isDirectory()
    );
    const peoples: People[] = [];
    for (const dir of dirs) {
      const dirPath = join(PEOPLES_PATH, dir);
      const files = readdirSync(dirPath).filter(
        (f) => f.endsWith(".json") && f.startsWith("PPL_")
      );
      for (const file of files) {
        const peopleId = file.replace(".json", "");
        const result = await loadPeople(peopleId);
        if (result.success && result.data) peoples.push(result.data);
        else
          logger.error(`Failed to load ${peopleId}`, undefined, {
            errors: result.errors,
          });
      }
    }
    return peoples;
  } catch (error) {
    logger.error("Failed to load peoples", error);
    return [];
  }
}
