import { loadPatronymeFiche } from "@/lib/fiche/ficheExistence";
import { ficheNextSteps, toldNames } from "@/lib/fiche/ficheNameClosing";
import type { NextStepCard } from "@/lib/search/nameClosing";
import type { Language } from "@/types/shared";

/** The boards show four names, in the order the fiche records their alliances. */
const MAX_NEXT_NAMES = 4;
const TRAORE_BOARD_NEXT_NAMES = [
  "PAT_DIARRA",
  "PAT_DIOP",
  "PAT_TOURE",
  "PAT_DIAWARA",
] as const;

/** @req REQ-198 */
export async function loadPatronymeNextSteps(
  candidates: readonly { id: string; name: string }[],
  language: Language,
  patronymeId?: string
): Promise<NextStepCard[]> {
  const boardCandidates =
    patronymeId === "PAT_TRAORE"
      ? TRAORE_BOARD_NEXT_NAMES.flatMap((id) => {
          const candidate = candidates.find((entry) => entry.id === id);
          return candidate ? [candidate] : [];
        })
      : candidates;
  const distinct = boardCandidates.filter(
    (candidate, index) =>
      boardCandidates.findIndex((entry) => entry.id === candidate.id) === index
  );
  const fiches = await Promise.all(
    distinct.map((candidate) =>
      loadPatronymeFiche(candidate.id).catch(() => null)
    )
  );

  return ficheNextSteps(
    distinct.map((candidate, index) => ({
      relation: "patronyme" as const,
      name: candidate.name,
      summary: fiches[index]?.nameHistory?.summary ?? null,
      names: toldNames(fiches[index]),
    })),
    MAX_NEXT_NAMES,
    language
  );
}
