/**
 * Whether a post's images have been rendered, without naming a folder.
 *
 * `ethni_carrousel2.py` used to write every passing render flat into `images/`.
 * It now writes one folder per format, named after the networks
 * `GABARITS-SOCIAL.md` §1 bis gives that format (`TikTok-Instagram/`,
 * `Instagram-Facebook-YouTube-X/`) — and that table is revised, not fixed
 * vocabulary. So a render is detected by shape, a sibling folder holding image
 * files, never by matching a literal name a revision would stop matching.
 */
import fs from "node:fs";
import path from "node:path";

const DOSSIERS_NON_RESEAU = new Set([
  "_epreuves",
  "_rendus-remplaces",
  "video",
]);
const EXTENSIONS_IMAGE = /\.(png|jpe?g)$/i;

export const aDesImages = (dossier) =>
  fs.existsSync(dossier) &&
  fs
    .readdirSync(dossier, { withFileTypes: true })
    .some(
      (e) =>
        e.isDirectory() &&
        !e.name.startsWith(".") &&
        !DOSSIERS_NON_RESEAU.has(e.name) &&
        fs
          .readdirSync(path.join(dossier, e.name))
          .some((n) => EXTENSIONS_IMAGE.test(n))
    );
