/**
 * Word loader — reads dataset/source/afrik/mots/*.json and writes each fiche
 * to afrik_words (migration 104, REQ-196).
 *
 * A word's related subjects may be of any class, so they stay in `content`
 * rather than in a join table: no single foreign key could hold them, and
 * validateAfrikData already refuses one that does not resolve.
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

import { supabaseErrorMessage } from "@/lib/afrik/loaders/provenanceWriter";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { parseWordFile } from "@/lib/afrik/parsers/wordParser";
import type { createAdminClient } from "@/lib/supabase/admin";

const AFRIK_ROOT = join(process.cwd(), "dataset/source/afrik");

type AdminClient = ReturnType<typeof createAdminClient>;

export interface WordFiche {
  id: string;
  nameMain: string;
  wordLanguage: string;
  definition: string;
  /** What the reader is served beyond the typed columns. */
  content: {
    relatedSubjects: { id: string; relation: string }[];
    gaps: string[];
    sources: unknown[];
  };
  nameHistory: NameHistory;
}

export interface WordBatch {
  words: WordFiche[];
  /** One line per fiche that could not be read, naming its file. */
  errors: string[];
}

export interface WordLoadReport {
  total: number;
  inserted: number;
  errors: string[];
}

// @req REQ-196
export function loadAllWordFiches(datasetRoot: string = AFRIK_ROOT): WordBatch {
  const dir = join(datasetRoot, "mots");
  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .sort();
  } catch {
    return { words: [], errors: [] };
  }

  const batch: WordBatch = { words: [], errors: [] };
  for (const file of files) {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, file), "utf-8"));
    } catch (error) {
      batch.errors.push(`${file}: ${(error as Error).message}`);
      continue;
    }

    const parsed = parseWordFile(raw);
    if (!parsed.success || !parsed.data) {
      batch.errors.push(`${file}: ${parsed.errors.join("; ")}`);
      continue;
    }

    const fiche = parsed.data;
    batch.words.push({
      id: fiche.id,
      nameMain: fiche.nameMain,
      wordLanguage: fiche.wordLanguage,
      definition: fiche.definition,
      content: {
        relatedSubjects:
          fiche.relatedSubjects as WordFiche["content"]["relatedSubjects"],
        gaps: fiche.gaps,
        sources: fiche.sources,
      },
      nameHistory: fiche.nameHistory as NameHistory,
    });
  }
  return batch;
}

// @req REQ-196
export async function loadWords(
  supabase: AdminClient,
  words: WordFiche[],
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<WordLoadReport> {
  const report: WordLoadReport = { total: 0, inserted: 0, errors: [] };

  for (const word of words) {
    report.total += 1;
    if (dryRun) continue;

    const { error } = await supabase.from("afrik_words").upsert(
      {
        id: word.id,
        name_main: word.nameMain,
        word_language: word.wordLanguage,
        definition: word.definition,
        content: word.content,
        name_history: word.nameHistory,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) {
      report.errors.push(
        `${word.id}: afrik_words — ${supabaseErrorMessage(error)}`
      );
      continue;
    }
    report.inserted += 1;
  }

  return report;
}
