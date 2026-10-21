// Cartes 1.13.0, one subject over many episodes (series.md « 11 »; handoff.md
// « Renderer integration of 1.13.0 », step 11): the subject key, fixed for
// every episode on one country or people, and the recap card, which opens
// episode 2 and later on the previous episode's last map.
import { existsSync, readFileSync } from "node:fs";
import { DUR } from "./series-motion.mjs";

const fail = (message) => {
  throw new Error(message);
};

export const RECAP = {
  kicker: "Dans l’épisode précédent",
  // The previous episode's map is a memory, not today: 30 % of its colour.
  desat: 0.7,
  // Its marks pop again, the first once the card has come in, 18 frames
  // (0.6 s) apart.
  first: DUR.change,
  apart: 18,
};

export function loadSubject(subject) {
  const { id, episode } = subject ?? {};
  if (typeof id !== "string" || !/^[\w-]+$/u.test(id))
    fail("subject nomme son id (BFA, PPL_…)");
  if (!Number.isInteger(episode) || episode < 1)
    fail("subject donne le numéro de l'épisode (episode)");
  const file = new URL(`../series/subjects/${id}.json`, import.meta.url);
  if (!existsSync(file))
    fail(`Sujet inconnu : social/series/subjects/${id}.json manque`);
  const key = JSON.parse(readFileSync(file, "utf8"));
  const { lon, lat, r } = key.view ?? {};
  if (
    key.id !== id ||
    !["a", "b", "c", "d"].includes(key.ink) ||
    ![lon, lat, r].every(Number.isFinite) ||
    typeof key.formula !== "string" ||
    !key.formula.includes("{n}")
  )
    fail(
      `Sujet ${id} : la clé donne id, ink (a à d), view { lon, lat, r } et formula avec {n}`
    );
  return {
    id,
    episode,
    ink: key.ink,
    view: { lon, lat, radius: r },
    kicker: key.formula.replace("{n}", String(episode)),
  };
}

const norm = (s) => s.normalize("NFC").replace(/[’']/gu, "'").toLowerCase();

// The recap card from the previous episode's last map card: its view after
// its moves, and only the marks the recap names (« area:<id> », « text:… »),
// each to pop on its own frame once the card has started. A text is one of
// the card's words, a name of its rename, or one of its areas' names.
export function recapCard(source, recap) {
  if (source.type !== "map" || !source.map?.view)
    fail(
      `Le rappel montre une carte animée de l'épisode précédent (${recap.map})`
    );
  const map = source.map;
  const view = map.moves?.length ? map.moves.at(-1) : map.view;
  const areas = [];
  const words = [];
  for (const mark of recap.marks ?? []) {
    const [kind, ...rest] = mark.split(":");
    const value = rest.join(":");
    if (kind === "area") {
      const a = map.areas.find(
        (x) => (x.id ?? x.file.replace(/\.geojson$/u, "")) === value
      );
      if (!a) fail(`Le rappel nomme une aire absente de sa carte : ${value}`);
      areas.push({
        file: a.file,
        id: value,
        name: a.name,
        ...(a.ink !== undefined && { ink: a.ink }),
        ...(a.people !== undefined && { people: a.people }),
        label: "none",
        recapMark: areas.length + words.length,
      });
      continue;
    }
    if (kind !== "text")
      fail(`Le rappel nomme ses marques area: ou text: (« ${mark} »)`);
    const word = (map.words ?? []).find((w) => norm(w.text) === norm(value));
    const renamed =
      map.rename &&
      [map.rename.from, map.rename.to].some((t) => norm(t) === norm(value));
    const area = map.areas.find((a) => norm(a.name) === norm(value));
    const at = word?.at ?? (renamed ? map.rename.at : area?.nameAt);
    if (!at) fail(`Le rappel nomme un texte absent de sa carte : ${value}`);
    words.push({
      text: value,
      kind: word?.kind === "date" ? "date" : "country",
      at,
      recapMark: areas.length + words.length,
    });
  }
  // Two texts named at one place stand apart: the second under the first.
  const seen = new Map();
  for (const w of words) {
    const key = w.at.join(",");
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    if (n) w.offset = 90 * n;
  }
  return {
    id: "rappel",
    type: "map",
    // Not the carousel's closing recap: the video's recap card.
    isRecap: true,
    ...(source.theme && { theme: source.theme }),
    series: structuredClone(source.series),
    ...(source.demo && { demo: source.demo }),
    kicker: RECAP.kicker,
    videoKicker: RECAP.kicker,
    title: recap.title,
    map: {
      sequence: `${map.sequence}·rappel`,
      view: { lon: view.lon, lat: view.lat, radius: view.radius },
      areas,
      words,
      ...(map.borders && { borders: map.borders }),
    },
  };
}
