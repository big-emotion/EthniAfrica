// The seven series of docs/editorial/strategy/social-series.md (2026-10-13)
// and the rules the 1.3.0 proposal adds on top of EthniAfrica Cartes 1.2.0.
import { readFile } from "node:fs/promises";

// Names are printed exactly as the frame publishes them; `campaign` is the
// `<series>` half of the `<series>-<episode>` campaign code.
export const SERIES = [
  {
    id: "pays",
    number: 1,
    campaign: "pays",
    name: "D'où vient le nom de mon pays ?",
  },
  {
    id: "nom-recu",
    number: 2,
    campaign: "nom-recu",
    name: "Le nom qu'on leur a donné",
  },
  {
    id: "nom-famille",
    number: 3,
    campaign: "nom-famille",
    name: "Mon nom, mon histoire",
  },
  {
    id: "mots",
    number: 4,
    campaign: "mots",
    name: "Les mots qu'on nous a collés",
  },
  {
    id: "frontieres",
    number: 5,
    campaign: "frontieres",
    name: "Un peuple, plusieurs pays",
  },
  {
    id: "afrique-tout",
    number: 6,
    campaign: "afrique-tout",
    name: "L'Afrique n'est pas un tout",
  },
  {
    id: "villes",
    number: 7,
    campaign: "villes",
    name: "Ce que les villes racontent",
  },
];

// The band takes 72 px off the top of the card. Keeping the operator's
// 450 px image window (ruling of 9 October 2026) leaves 828 px for the panel
// instead of 900: a model card must fit that, the engine never shrinks text.
export const BAND_HEIGHT = 72;
export const IMAGE_WINDOW_MIN = 450;
export const PANEL_MAX_WITH_BAND = 1350 - BAND_HEIGHT - IMAGE_WINDOW_MIN;

export function seriesById(id) {
  const series = SERIES.find((s) => s.id === id);
  if (!series) throw new Error(`Unknown series: ${id}`);
  return series;
}

export function bandText(id, episode) {
  const series = seriesById(id);
  if (!Number.isInteger(episode) || episode < 1)
    throw new Error("The episode number must be a positive integer");
  return `${series.name} · n° ${episode}`;
}

export function closingLine(searchName) {
  return `Cherchez ${searchName} sur EthniAfrica, lien en profil.`;
}

const modelUrl = (series) =>
  new URL(
    `./models/${String(series.number).padStart(2, "0")}-${series.id}.cards.json`,
    import.meta.url
  );

export async function loadModels() {
  return Promise.all(
    SERIES.map(async (series) => ({
      series,
      url: modelUrl(series),
      data: JSON.parse(await readFile(modelUrl(series), "utf8")),
    }))
  );
}
