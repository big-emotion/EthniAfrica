/**
 * « Où en est ce sujet ? », and whether it has already gone out in this format.
 *
 *     node social/tools/etat-pipeline/bilan-sujets.mjs          les doublons et les formats jamais publiés
 *     node social/tools/etat-pipeline/bilan-sujets.mjs peul     un sujet : chaque post, l'atelier, les idées
 *
 * Reads the library, writes nothing. The state of a post is still changed in its
 * own post.md header; this only puts the posts of one subject side by side,
 * which no single header can do.
 */
import fs from "node:fs";
import path from "node:path";

import { productionsRoot, publicationsRoot } from "../paths.mjs";
import { etat } from "./etat.mjs";
import { aDesImages } from "./rendu-reseaux.mjs";
import { bilanSujet, decrirePost, regrouper } from "./sujets.mjs";

const LIBRAIRIE = publicationsRoot();
const ATELIER = productionsRoot();
const recherche = process.argv[2]?.trim();

if (LIBRAIRIE === null || !fs.existsSync(LIBRAIRIE)) {
  // Same refusal as build-etat: an unconfigured library reported as a library
  // with no doublon is the silent answer this tool exists to replace.
  console.error(
    "ETHNIAFRICA_SOCIAL_POSTS n'est pas renseignée ou introuvable — " +
      "impossible de dire ce qui est déjà publié."
  );
  process.exit(1);
}

function* postsMd(racine) {
  for (const e of fs.readdirSync(racine, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(racine, e.name);
    if (e.isDirectory()) yield* postsMd(p);
    else if (e.name === "post.md") yield p;
  }
}

const rendu = (dossier, sous) =>
  fs.existsSync(path.join(dossier, sous)) &&
  fs.readdirSync(path.join(dossier, sous)).some((n) => !n.startsWith("."));

const plier = (t) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const posts = [...postsMd(LIBRAIRIE)].map((fichier) => {
  const dossier = path.dirname(fichier);
  return decrirePost(fs.readFileSync(fichier, "utf8"), {
    images: aDesImages(dossier),
    video: rendu(dossier, "video"),
    chemin: path.relative(LIBRAIRIE, dossier),
  });
});

const libelle = (post) => {
  const e = post.etat ? etat(post.etat) : null;
  return e ? `${e.marqueur} ${e.libelle}` : "en-tête illisible";
};

// The format keys stay unaccented for matching `utm_content`; the operator reads French.
const NOM = { video: "vidéo", carrousel: "carrousel" };
const UN = { video: "une vidéo", carrousel: "un carrousel" };

function afficherSujet(cle, liste) {
  const bilan = bilanSujet(liste);
  const lignes = [`## ${cle}`, ""];
  for (const p of liste) {
    const reseaux = p.reseaux.length ? p.reseaux.join(", ") : "—";
    lignes.push(
      `- ${libelle(p)} · ${NOM[p.format] ?? "format illisible"} · « ${p.titre} » · ${p.date ?? "sans date"} · réseaux : ${reseaux} · \`${p.chemin}\``
    );
  }
  lignes.push("");
  lignes.push(
    `Déjà publié : ${bilan.formatsPublies.length ? bilan.formatsPublies.map((f) => NOM[f]).join(" et ") : "rien"}`
  );
  for (const d of bilan.doublons) {
    lignes.push(
      `⚠ Doublon : « ${d.titre} » (${NOM[d.format]}, ${libelle(d)}) — ${UN[d.format]} sur ce sujet est en ligne depuis le ${d.dejaPublie.date ?? "?"} (« ${d.dejaPublie.titre} »). Ne pas la publier sans décider d'un autre angle.`
    );
  }
  if (bilan.formatManquant) {
    lignes.push(`Jamais publié en ${NOM[bilan.formatManquant]}.`);
  }
  return lignes.join("\n");
}

const groupes = regrouper(posts);

if (recherche) {
  const cible = plier(recherche);
  const trouves = [...groupes].filter(
    ([cle, liste]) =>
      cle.includes(cible) ||
      liste.some((p) => plier(p.chemin ?? "").includes(cible))
  );
  if (!trouves.length)
    console.log(`Aucun post publié ou en attente pour « ${recherche} ».`);
  for (const [cle, liste] of trouves)
    console.log(afficherSujet(cle, liste) + "\n");

  // The workshop and the idea reports hold what has not reached a post.md yet.
  if (fs.existsSync(ATELIER)) {
    const atelier = fs
      .readdirSync(ATELIER)
      .filter(
        (n) =>
          !n.startsWith(".") && !n.startsWith("_") && plier(n).includes(cible)
      );
    const idees = fs.existsSync(path.join(ATELIER, "_idees"))
      ? fs
          .readdirSync(path.join(ATELIER, "_idees"))
          .filter((n) => plier(n).includes(cible))
      : [];
    const messages = atelier.filter((n) =>
      fs.existsSync(path.join(ATELIER, n, "message.md"))
    );
    console.log(
      `Atelier : ${atelier.length ? atelier.join(", ") : "aucun dossier"}`
    );
    console.log(
      `Rapports d'idée : ${idees.length ? idees.join(", ") : "aucun"}`
    );
    console.log(
      `Audit du message écrit : ${messages.length ? messages.join(", ") : "aucun"}`
    );
  }
} else {
  const aSignaler = [...groupes].filter(([, liste]) => {
    const b = bilanSujet(liste);
    return b.doublons.length || b.formatManquant;
  });
  aSignaler.sort(
    ([, a], [, b]) =>
      bilanSujet(b).doublons.length - bilanSujet(a).doublons.length
  );
  console.log(
    `${posts.length} posts, ${groupes.size} sujets, ${aSignaler.length} à signaler\n`
  );
  for (const [cle, liste] of aSignaler)
    console.log(afficherSujet(cle, liste) + "\n");
}
