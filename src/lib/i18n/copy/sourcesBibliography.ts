import type { Language } from "@/types/shared";

// @req REQ-141
export const sourcesBibliographyNote: Record<Language, string> = {
  en: "Wikipedia is read first, for what it cites. We prefer the primary source it points to, cited at its own address, and we note the language versions we crossed. ‘Awaiting review’ marks a source whose weight we have not yet assessed: it says nothing about whether the source is right.",
  fr: "Nous lisons Wikipédia d'abord, pour ce qu'elle cite. Nous préférons la source primaire à laquelle elle renvoie, citée par sa propre adresse, et nous notons les versions linguistiques croisées. « En attente d'examen » signale une source dont nous n'avons pas encore évalué le poids : cela ne dit rien de son exactitude.",
};

// @req REQ-141
export const englishCountryNames: Readonly<Record<string, string>> = {
  algeria: "Algeria",
  morocco: "Morocco",
  tunisia: "Tunisia",
  egypt: "Egypt",
  libya: "Libya",
  sudan: "Sudan",
  mauritania: "Mauritania",
  westernSahara: "Western Sahara",
  benin: "Benin",
  coteIvoire: "Ivory Coast",
  gambia: "The Gambia",
  guinea: "Guinea",
  guineaBissau: "Guinea-Bissau",
  nigeria: "Nigeria",
  senegal: "Senegal",
  cameroon: "Cameroon",
  centralAfricanRepublic: "Central African Republic",
  chad: "Chad",
  drc: "DR Congo",
  equatorialGuinea: "Equatorial Guinea",
  saoTome: "São Tomé and Príncipe",
  ethiopia: "Ethiopia",
  uganda: "Uganda",
  tanzania: "Tanzania",
  somalia: "Somalia",
  eritrea: "Eritrea",
  mauritius: "Mauritius",
  comoros: "Comoros",
  southSudan: "South Sudan",
  southAfrica: "South Africa",
  namibia: "Namibia",
  zambia: "Zambia",
};

// @req REQ-141
export const englishCountrySourceNotes: Readonly<
  Record<string, { name?: string; description?: string }>
> = {
  libya: { name: "No operational institute → UN and CIA data" },
  westernSahara: { name: "UN data and academic reports (Hassaniya)" },
  guineaBissau: {
    description: "(no operational website → UN and CIA data)",
  },
  equatorialGuinea: { name: "CIA and UN data" },
  somalia: { name: "UN and CIA data" },
  eritrea: { name: "UN and CIA data (no public statistics)" },
  southSudan: { name: "UN and CIA data" },
};
