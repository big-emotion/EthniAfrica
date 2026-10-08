import { NOMMER_CHAPTERS } from "@/lib/dossiers/nommer/chapters";
import type { DossierChapter } from "@/lib/dossiers/nommer/types";
import type { Language } from "@/types/shared";

// The chapters are written in French, the one locale published, so the
// chapter is its own localization. Kept as a seam until the callers stop
// passing a language.
// @req REQ-145
export function localizeNommerChapter(
  chapter: DossierChapter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language: Language
): DossierChapter {
  return chapter;
}

// @req REQ-145
export const getLocalizedNommerChapters = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language: Language
): DossierChapter[] => NOMMER_CHAPTERS;
