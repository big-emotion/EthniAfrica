import { getNameSuggestionRows } from "@/lib/supabase/queries/afrik/nameAddressEntries";
import {
  buildNameAddressDirectory,
  foldNameForm,
  nameSearchHref,
} from "@/lib/search/nameAddress";
import { getNameAddressSpellings } from "./nameAddresses";
import { nameAddressCopy } from "@/lib/i18n/copy/nameAddress";

export interface NameSuggestion {
  form: string;
  type: "people" | "country" | "family" | "language" | "patronyme" | "place";
  id: string;
  note: string | null;
  href: string;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Prefix suggestions over the six kinds of subject that answer a name. */
// @req REQ-200
export async function suggestNamesByPrefix(
  query: string,
  limit = 8
): Promise<NameSuggestion[]> {
  const [rows, addressSpellings] = await Promise.all([
    getNameSuggestionRows(),
    getNameAddressSpellings(),
  ]);
  const prefix = foldNameForm(query);
  const directory = buildNameAddressDirectory(addressSpellings);
  const suggestions: NameSuggestion[] = [];

  for (const row of rows) {
    const recordedNames = (row.nameHistory as { names?: unknown } | null)
      ?.names;
    const historyNames = Array.isArray(recordedNames)
      ? recordedNames.flatMap((entry) => {
          const nameText = (entry as { nameText?: unknown } | null)?.nameText;
          return typeof nameText === "string"
            ? [entry as { nameText: string; selfGiven?: boolean }]
            : [];
        })
      : [];
    const selfName = historyNames.find(({ selfGiven }) => selfGiven === true);
    for (const { nameText: form, selfGiven } of historyNames) {
      if (!foldNameForm(form).startsWith(prefix)) continue;
      const note = selfGiven
        ? foldNameForm(form) === foldNameForm(row.name)
          ? selfName && foldNameForm(selfName.nameText) !== foldNameForm(form)
            ? nameAddressCopy.fr.suggestion.selfName(selfName.nameText)
            : null
          : nameAddressCopy.fr.suggestion.selfGiven(row.name)
        : selfName
          ? nameAddressCopy.fr.suggestion.selfName(selfName.nameText)
          : nameAddressCopy.fr.suggestion.other(row.name);
      suggestions.push({
        form,
        type: row.type,
        id: row.id,
        note,
        href: nameSearchHref("fr", form, directory),
      });
    }
  }

  return suggestions
    .sort(
      (left, right) =>
        compareText(foldNameForm(left.form), foldNameForm(right.form)) ||
        compareText(left.form, right.form) ||
        compareText(left.id, right.id)
    )
    .slice(0, limit);
}
