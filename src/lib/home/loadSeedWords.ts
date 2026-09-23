import { getSeedNameCandidates } from "@/lib/supabase/queries/afrik/seedNames";
import {
  drawSeedWords,
  FALLBACK_SEED_WORDS,
  type SeedWords,
} from "./seedWords";
import type { Language } from "@/types/shared";

// A fresh server draw is serialized into the first render, so hydration does
// not replace the examples. Each failed table keeps its own fallback pool.
// @req REQ-002
export async function loadSeedWords(language: Language): Promise<SeedWords> {
  const candidates = await getSeedNameCandidates(language);
  return Object.fromEntries(
    Object.entries(FALLBACK_SEED_WORDS[language]).map(([kind, fallback]) => [
      kind,
      drawSeedWords(candidates[kind], fallback),
    ])
  ) as SeedWords;
}
