import type { CorpusCounts } from "@/lib/home/corpusCounts";

/** Keys retained by the bilingual corpus-count dictionary. */
export type CountedClassKey = Extract<
  keyof CorpusCounts,
  "peoples" | "languages" | "patronymes"
>;
