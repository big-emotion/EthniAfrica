/**
 * File a subject into the library for the first time — the step no other tool
 * performs.
 *
 * `migrate-library.mjs`'s reconcile mode only moves a post already listed in
 * `publications.json` between Valide/Brouillon/Publie; it never creates the
 * first entry for a subject that has only ever lived in the workshop. This is
 * that first filing, and it never touches `publications.json` — it is a pure
 * reader of the same `post.md` header `etat-pipeline`'s own tools already
 * trust, and a writer of one new file.
 *
 * Deliberately minimal, and decided to be the only shape a published post
 * leaves in the library from now on (operator, 2026-09-14) — `zokou-gbeuly`
 * exposed both the missing tool and two conventions already living side by
 * side: a full copy carrying its own `video/`/`images/`/`SUJET.md`
 * (`Publie/2026-09-12/Familles-Krou/krou-klao/`), and a lighter post.md-only
 * pointer (`Valide/Peuples-Nzema/appolo-nzema-carrousel/`). The full working
 * files — `cards.json`, `SOURCES.md`, `message.md`, `assets/`, `rendus/` —
 * stay in the workshop, which remains the one archive of record; the library
 * only needs enough to answer "is this subject already out, and in what
 * format", which is exactly what `bilan-sujets.mjs` and `build-etat.mjs`
 * already read off a post.md header — nothing here invents a second schema.
 *
 *   node social/tools/etat-pipeline/publier.mjs <Sujet> --categorie <Categorie> [--slug <slug>] [--nom "Categorie · Nom"]
 *   node social/tools/etat-pipeline/publier.mjs <Sujet> --categorie <Categorie> --write
 *
 * Simulation by default, like `migrate-library.mjs`: says what it would
 * write, touches nothing until `--write`.
 */
import fs from "node:fs";
import path from "node:path";

import { productionsRoot, publicationsRoot } from "../paths.mjs";
import { lireEtat, lireDate, lireChamp, lireTitre } from "./etat.mjs";

function lireArgs(argv) {
  const parsed = { write: false };
  const reste = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--write") parsed.write = true;
    else if (a === "--categorie") parsed.categorie = argv[++i];
    else if (a === "--slug") parsed.slug = argv[++i];
    else if (a === "--nom") parsed.nom = argv[++i];
    else reste.push(a);
  }
  parsed.sujet = reste[0];
  return parsed;
}

const {
  sujet,
  categorie,
  slug: slugArg,
  nom: nomArg,
  write,
} = lireArgs(process.argv.slice(2));

if (!sujet || !categorie) {
  console.error(
    'usage: node publier.mjs <Sujet> --categorie <Categorie> [--slug <slug>] [--nom "Categorie · Nom"] [--write]'
  );
  process.exit(2);
}

const ATELIER = productionsRoot();
const dossierProjet = path.join(ATELIER, sujet);
const cheminPost = path.join(dossierProjet, "post.md");

if (!fs.existsSync(cheminPost)) {
  console.error(`introuvable : ${cheminPost}`);
  process.exit(1);
}

const texte = fs.readFileSync(cheminPost, "utf8");
const cle = lireEtat(texte);

// A subject not yet ✅ has nothing to file: the library only ever holds what
// has actually gone out, never a promise that it will.
if (cle !== "publie") {
  console.error(
    `${sujet} n'est pas ✅ Publié (état lu : ${cle ?? "illisible"}) — rien à classer.`
  );
  process.exit(1);
}

const date = lireDate(texte);
if (!date) {
  console.error(
    `${sujet} est marqué publié mais son en-tête ne porte aucune date` +
      ` (« **✅ Publié** · publication : AAAA-MM-JJ ») — rien à classer.`
  );
  process.exit(1);
}

const LIBRAIRIE = publicationsRoot();
if (LIBRAIRIE === null) {
  console.error(
    "ETHNIAFRICA_SOCIAL_POSTS n'est pas renseignée — rien où classer."
  );
  process.exit(1);
}

const slug =
  slugArg ??
  sujet
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const dest = path.join(LIBRAIRIE, "Publie", date, categorie, slug);

if (fs.existsSync(dest)) {
  console.error(`déjà classé : ${path.relative(LIBRAIRIE, dest)}`);
  process.exit(1);
}

const dossierVideo = path.join(dossierProjet, "video");
const fichiersVideo = fs.existsSync(dossierVideo)
  ? fs.readdirSync(dossierVideo).filter((n) => !n.startsWith("."))
  : [];
const montages = fichiersVideo.length
  ? `${fichiersVideo.length} montage${fichiersVideo.length > 1 ? "s" : ""}`
  : "—";

const titre = lireTitre(texte) ?? sujet;
const pilier = lireChamp(texte, "Pilier") ?? "—";
const nomSujet = nomArg ?? `${categorie} · ${sujet}`;

const stub =
  [
    `# ${titre}`,
    "",
    `**✅ Publié** · publication : ${date}`,
    "",
    "| | |",
    "| --- | --- |",
    `| Sujet | ${nomSujet} |`,
    `| Pilier | ${pilier} |`,
    `| Montages | ${montages} |`,
  ].join("\n") + "\n";

const relDest = path.relative(LIBRAIRIE, path.join(dest, "post.md"));
if (!write) {
  console.log(`classerait → ${relDest}`);
  console.log("");
  console.log(stub);
  console.log(`(simulation — rien n'a été écrit ; relance avec --write)`);
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
fs.writeFileSync(path.join(dest, "post.md"), stub);

console.log(`classé → ${relDest}`);
console.log(
  `le projet complet reste dans l'atelier : ${path.relative(ATELIER, dossierProjet)}/`
);
