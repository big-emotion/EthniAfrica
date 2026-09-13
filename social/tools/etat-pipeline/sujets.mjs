/**
 * What a subject has already been published as, read from its post.md files.
 *
 * `build-etat.mjs` answers « in which state is each post ». It cannot answer the
 * question that decides whether a post should go out at all: has this subject
 * already been published in this format? On 2026-09-13 it told the operator to
 * publish two validated videos — Nzebi and the zombie — whose subjects already
 * had a video on five networks.
 *
 * Pure functions of text and two booleans, like `etat.mjs`, so the reading can
 * be tested without the library.
 */
import { lireChamp, lireDate, lireEtat, lireTitre } from "./etat.mjs";

export const FORMATS = ["carrousel", "video"];

/** « Peuple · Peul » and « Peuples · Peul » name the same subject. */
function plier(texte) {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * The format, from the strongest evidence to the weakest.
 *
 * A montage path is a video whatever else the folder holds — the early videos
 * also carry thumbnails in `images/`. Then the tagged links, whose
 * `utm_content` the link-builder writes per format. Rendered files come last,
 * and nothing at all is `null`: a format guessed is a doublon missed.
 */
function lireFormat(texte, { images, video }) {
  const montages = lireChamp(texte, "Montages");
  if (montages && /video\//.test(montages)) return "video";

  const balise = texte.match(/utm_content=(carrousel|video)\b/);
  if (balise) return balise[1];

  if (images) return "carrousel";
  if (video) return "video";
  return null;
}

/** The networks listed as published in the Diffusion section. */
function lireReseaux(texte) {
  return [...texte.matchAll(/^- \*\*(\w+)\*\* — publié le/gm)].map((m) => m[1]);
}

export function decrirePost(
  texte,
  { images = false, video = false, chemin = null } = {}
) {
  const sujet = lireChamp(texte, "Sujet");
  return {
    titre: lireTitre(texte),
    cle: sujet ? plier(sujet.split("·").at(-1)) : null,
    etat: lireEtat(texte),
    format: lireFormat(texte, { images, video }),
    reseaux: lireReseaux(texte),
    date: lireDate(texte),
    chemin,
  };
}

/** Posts by subject. A post with no `Sujet` row stays alone under its path. */
export function regrouper(posts) {
  const groupes = new Map();
  for (const post of posts) {
    const cle = post.cle ?? `(sans sujet) ${post.chemin ?? post.titre}`;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(post);
  }
  return groupes;
}

/**
 * One subject's record: the formats already out, the posts that would repeat
 * one of them, and the format never published when exactly one is.
 *
 * A doublon is flagged, not refused. A second video on the same people with a
 * different angle can be right; publishing it without knowing the first exists
 * cannot.
 */
export function bilanSujet(posts) {
  const publies = posts.filter((p) => p.etat === "publie" && p.format);
  const formatsPublies = [...new Set(publies.map((p) => p.format))].sort();

  const doublons = posts
    .filter((p) => p.etat !== "publie" && p.format)
    .flatMap((p) => {
      const dejaPublie = publies.find((q) => q.format === p.format);
      return dejaPublie ? [{ ...p, dejaPublie }] : [];
    });

  const formatManquant =
    formatsPublies.length === 1
      ? FORMATS.find((f) => f !== formatsPublies[0])
      : null;

  return { formatsPublies, doublons, formatManquant };
}
