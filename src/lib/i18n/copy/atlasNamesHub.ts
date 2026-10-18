import type { Language } from "@/types/shared";

// @req REQ-114
export const atlasNamesHubCopy: Record<
  Language,
  {
    title: string;
    description: string;
    countryTitle: string;
    countriesLabel: string;
    weeklyTitle: string;
    browseTitle: string;
    browse: {
      peoples: string;
      patronymes: string;
      countries: string;
      languages: string;
      families: string;
    };
  }
> = {
  fr: {
    title: "Les noms d’Afrique",
    description:
      "Peuples, langues, pays : nous expliquons d'où viennent leurs noms, avec leurs sources.",
    countryTitle: "Entrer par un pays",
    countriesLabel: "Les pays, de A à Z",
    weeklyTitle: "Cherchés cette semaine",
    browseTitle: "Parcourir",
    browse: {
      peoples: "Les peuples",
      patronymes: "Les noms de famille",
      countries: "Les pays",
      languages: "Les langues",
      families: "Les familles de langues",
    },
  },
};
