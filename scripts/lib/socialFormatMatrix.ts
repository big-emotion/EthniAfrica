/**
 * Which formats each network receives, as the operator revised it on
 * 2026-09-21 (both formats on every network; X alone has no carrousel, a
 * platform constraint). This constant is the table's only home, so
 * `checkProductionLedger.ts` checks against it in code rather than against a
 * prose copy that could drift.
 *
 * The data is `socialFormatMatrix.json`, kept as JSON so plain Node can read
 * it without a TypeScript loader. It also carries the platform limits that were
 * verified against an official page, each with its URL and the day it was read.
 */
import matrix from "./socialFormatMatrix.json";

export type Network =
  "tiktok" | "instagram" | "facebook" | "youtube" | "linkedin" | "x";

/**
 * `texte` covers LinkedIn's "texte avec lien depuis le profil personnel" and
 * X's text-with-link — the matrix gives both networks a text format alongside or
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
