import { createServerClient } from "../../server";
import { logger } from "@/lib/api/logger";
import { walkRanges } from "@/lib/supabase/queries/walkRanges";
import type { SeedWords } from "@/lib/home/seedWords";
import type { Language } from "@/types/shared";

// @req REQ-002
export async function getSeedNameCandidates(
  language: Language
): Promise<SeedWords> {
  const empty: SeedWords = {
    patronyme: [],
    language: [],
    people: [],
    country: [],
  };
  try {
    const client = createServerClient();
    const tables = [
      ["patronyme", "afrik_patronymes", "name_main"],
      [
        "language",
        "afrik_languages",
        language === "en" ? "content->>nameEn" : "name",
      ],
      ["people", "afrik_peoples", "content->appellations->>selfAppellation"],
      ["country", "afrik_countries", language === "en" ? "name_en" : "name_fr"],
    ] as const;
    const entries = await Promise.all(
      tables.map(async ([kind, table, column]) => {
        try {
          const walk = await walkRanges<{ name?: string }>(
            async (from, to) => {
              const { data, error } = await client
                .from(table)
                .select(`name:${column}`)
                .order("id")
                .range(from, to);
              if (error) throw error;
              return (data ?? []) as unknown as { name?: string }[];
            },
            { pageSize: 500, maxPages: 40 }
          );
          if (walk.truncated)
            logger.error(`Search examples: truncated ${table}`);
          return [
            kind,
            walk.rows.flatMap((row) =>
              typeof row.name === "string" ? [row.name] : []
            ),
          ] as const;
        } catch (error) {
          logger.error(`Search examples: could not read ${table}`, error);
          return [kind, []] as const;
        }
      })
    );
    return Object.fromEntries(entries) as SeedWords;
  } catch (error) {
    logger.error("Search examples: no data client available", error);
    return empty;
  }
}
