import { readSearchedThisWeek } from "@/lib/search/searchedThisWeekData";
import {
  buildNameAddressDirectory,
  nameSearchHref,
} from "@/lib/search/nameAddress";

export interface AtlasWeeklyName {
  kind: string;
  name: string;
  summary: string;
  href: string;
}

const kinds: Record<string, string> = {
  people: "Peuple",
  language: "Langue",
  country: "Pays",
  languageFamily: "Famille de langues",
  patronyme: "Nom de famille",
  place: "Lieu",
};

// @req REQ-200
export async function getAtlasWeeklyNames(
  addressSpellings: Iterable<string> = []
): Promise<AtlasWeeklyName[]> {
  const addresses = buildNameAddressDirectory(addressSpellings);
  const weekly = await readSearchedThisWeek();
  return weekly.flatMap((item) => {
    const kind = item.subject ? kinds[item.subject.type] : undefined;
    if (!kind || !item.summary) return [];
    return [
      {
        kind,
        name: item.form,
        summary: item.summary,
        href: nameSearchHref("fr", item.form, addresses),
      },
    ];
  });
}
