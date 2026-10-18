import { unstable_cache } from "next/cache";
import { getSitemapEntityIds } from "@/lib/supabase/queries/afrik/sitemapEntries";
import { listPatronymes } from "./patronymes";
import { CORPUS_AGGREGATE_REVALIDATE_SECONDS } from "./corpusCache";

export interface AtlasHubCounts {
  peoples: number;
  patronymes: number;
  countries: number;
  languages: number;
  families: number;
}

// @req REQ-114
export const getAtlasHubCounts = unstable_cache(
  async (): Promise<AtlasHubCounts> => {
    const [ids, patronymes] = await Promise.all([
      getSitemapEntityIds(),
      listPatronymes({ page: 1, perPage: 1 }),
    ]);
    return {
      peoples: ids.peoples.length,
      patronymes: patronymes.total,
      countries: ids.countries.length,
      languages: ids.languages.length,
      families: ids.families.length,
    };
  },
  ["atlas-hub-counts"],
  { revalidate: CORPUS_AGGREGATE_REVALIDATE_SECONDS }
);
