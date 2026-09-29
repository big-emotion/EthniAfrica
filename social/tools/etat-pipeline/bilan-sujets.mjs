/**
 * « Où en est ce sujet ? » — what a subject has been published as, per angle and
 * per edition, read from the registry through the catalogue.
 *
 *     node social/tools/etat-pipeline/bilan-sujets.mjs          les sujets à signaler
 *     node social/tools/etat-pipeline/bilan-sujets.mjs peul     un sujet : ses angles, ses éditions, l'atelier, les idées
 *
 * Reads, writes nothing. The registry is the source; a post.md is a copy of it.
 * « À signaler » means a platform post filed twice, or an edition ready beside
 * one of the same format that is already out — information for a decision, never
 * a prohibition and never a demand for the other format.
 */
import fs from "node:fs";
import path from "node:path";

import { buildCatalogue } from "../catalogue/catalogue.mjs";
import { readNameLedger } from "../catalogue/name-ledger.mjs";
import { productionsRoot, registryFile } from "../paths.mjs";
import { renderBilan } from "./bilan.mjs";

const recherche = process.argv[2]?.trim();
const registre = registryFile();

if (registre === null || !fs.existsSync(registre)) {
  // Same refusal as build-etat: an unconfigured library reported as a library
  // with nothing to flag is the silent answer this tool exists to replace.
  console.error(
    "ETHNIAFRICA_SOCIAL_POSTS n'est pas renseignée ou son registre est introuvable — " +
      "impossible de dire ce qui est déjà publié."
  );
  process.exit(1);
}

const { posts } = JSON.parse(fs.readFileSync(registre, "utf8"));
const catalogue = buildCatalogue(posts, { ledger: readNameLedger() });
console.log(renderBilan(catalogue, { search: recherche }));

if (recherche) {
  const plier = (t) =>
    t
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const cible = plier(recherche);
  const ATELIER = productionsRoot();

  // The workshop and the idea reports hold what has not reached the registry yet.
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
}
