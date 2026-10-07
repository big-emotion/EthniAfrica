import { getCountryCommonName } from "@/lib/countryNames";
import type {
  AnswerAccount,
  AnswerWhere,
  AnswerWhereRow,
} from "@/lib/search/answer";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { Language } from "@/types/shared";

export interface PresentedWhere {
  /** The rows the page could name, with the figures the fiche declared. */
  where: AnswerWhere;
  /** Display name by country id, or by people id for a country's shares. */
  labels: Record<string, string>;
  /** Listed peoples with no share, named beside the unsplit part. */
  unsplitPeopleNames?: string[];
}

/** Three names read as a list; more would read as the whole population. */
const UNSPLIT_NAMES_MAX = 3;

/**
 * Resolves the identifiers of the « where » block into names, from what the
 * page already holds: the reader's locale for countries, the fiche's own list
 * of peoples for a country's shares. The blocks take names, not ids.
 *
 * A row that cannot be named is dropped rather than printed as an identifier
 * or renamed to a guess; the figures that remain are the fiche's, untouched.
 * Peoples are never hard-coded: « the rest is split among Teke, Mbochi… » is
 * built from the fiche's own list of peoples without a share, and absent when
 * the fiche lists none.
 */
// @req REQ-178
export function presentAnswerWhere(
  where: AnswerWhere | undefined,
  listedPeoples: ReadonlyArray<{ id: string; name: string }>,
  language: Language
): PresentedWhere | undefined {
  if (!where) return undefined;

  const peopleNames = new Map(listedPeoples.map(({ id, name }) => [id, name]));
  const labels: Record<string, string> = {};
  const rows = where.rows.filter((row: AnswerWhereRow) => {
    const id = "peopleId" in row ? row.peopleId : row.countryId;
    const name =
      "peopleId" in row
        ? peopleNames.get(id)
        : getCountryCommonName(language, id, "") || undefined;
    if (!name) return false;
    labels[id] = name;
    return true;
  });
  if (rows.length === 0) return undefined;

  const shared = new Set(
    where.rows.flatMap((row) => ("peopleId" in row ? [row.peopleId] : []))
  );
  const unsplitPeopleNames =
    where.unit === "percent" && where.unsplitPercent
      ? listedPeoples
          .filter(({ id }) => !shared.has(id))
          .map(({ name }) => name)
          .slice(0, UNSPLIT_NAMES_MAX)
      : [];

  return {
    where: rows.length === where.rows.length ? where : { ...where, rows },
    labels,
    ...(unsplitPeopleNames.length > 0 ? { unsplitPeopleNames } : {}),
  };
}

/**
 * What the sources line of a reviewed answer needs: one account (a reviewed
 * answer is one text), and the number of distinct sources behind it. The
 * sentence-by-sentence evidence stays in the sheet the line opens.
 */
// @req REQ-178
export function reviewedAnswerSources(answer: NameAnswer): {
  count: number;
  accounts: AnswerAccount[];
} {
  const ids = new Set(
    answer.sources.flatMap((entry) => entry.sources.map(({ id }) => id))
  );
  return {
    count: ids.size,
    accounts: [{ text: answer.paragraphs[0] ?? "", evidence: answer.sources }],
  };
}
