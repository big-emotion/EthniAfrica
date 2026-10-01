/**
 * Which formats each network receives. This is not a second policy — it is the
 * same table as `docs/design/gabarits-social/GABARITS-SOCIAL.md` §1 bis,
 * revised 2026-09-21 by the operator (both formats on every network; X alone
 * has no carrousel, a platform constraint), re-encoded so
 * `checkProductionLedger.ts` and the production skills can check against it in
 * code. A copy of a list is how it drifts:
 * whoever revises §1 bis must revise this constant in the same change, and
 * whoever revises this constant without touching §1 bis has broken the rule
 * that the table lives in one place.
 *
 * The data is `socialFormatMatrix.json`, read as-is by the Node production
 * tools (`social/tools/production/destinations.mjs`), which run on plain Node
 * and cannot import TypeScript. It also carries the platform limits that were
 * verified against an official page, each with its URL and the day it was read.
 */
import matrix from "./socialFormatMatrix.json";

export type Network =
  "tiktok" | "instagram" | "facebook" | "youtube" | "linkedin" | "x";

/**
 * `texte` covers LinkedIn's "texte avec lien depuis le profil personnel" and
 * X's text-with-link — §1 bis gives both networks a text format alongside or
 * instead of a rendered image. Without it, a LinkedIn or X post has nowhere
 * to go in `publications[]` and the ledger under-reports what actually went
 * out.
 */
export type ProductionFormat = "video" | "carrousel" | "texte";

export const NETWORK_FORMAT_MATRIX: Readonly<
  Record<Network, readonly ProductionFormat[]>
> = matrix.formats as Record<Network, ProductionFormat[]>;

export function networkAcceptsFormat(
  network: Network,
  format: ProductionFormat
): boolean {
  return NETWORK_FORMAT_MATRIX[network]?.includes(format) ?? false;
}
