// The seven series of docs/editorial/strategy/social-series.md (2026-10-13),
// as production metadata around the accepted design system. The band itself
// is drawn by EthniCards 1.3.0 (components/bundle.js); the tests check that
// the names and limits here match the engine's.
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
// instead of 900: a series card must fit that, the engine never shrinks text.
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

// The accepted sample cards are the one source of the seven models: the
// prototype's models/*.cards.json had the same text, without the images.
export async function loadModels() {
  const sample = JSON.parse(
    await readFile(
      new URL("../../handoff/cards.sample.json", import.meta.url),
      "utf8"
    )
  );
  return SERIES.map((series) => ({
    series,
    data: {
      version: sample.version,
      logo: sample.logo,
      cards: sample.cards.filter((c) => c.id.startsWith(`serie-${series.id}-`)),
    },
  }));
}
