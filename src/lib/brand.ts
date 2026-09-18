/**
 * Brand Constants - Single Source of Truth for Product Branding
 *
 * This module defines all product branding strings used throughout the application.
 * It serves as the single source of truth for branding, making rebranding straightforward.
 *
 * ## Rebrand-Switch Procedure
 *
 * To switch brands, set the following environment variables in your deployment
 * configuration (e.g., `.env.local`, `.env.production`, or your hosting platform):
 *
 * | Environment Variable              | Export             | Default Value                                                         |
 * |-----------------------------------|--------------------|-----------------------------------------------------------------------|
 * | NEXT_PUBLIC_PRODUCT_NAME          | PRODUCT_NAME       | "EthniAfrica"                                                           |
 * | NEXT_PUBLIC_CANONICAL_DOMAIN      | CANONICAL_DOMAIN   | "ethniafrica.com"                                                     |
 * | NEXT_PUBLIC_ATTRIBUTION_STRING    | ATTRIBUTION_STRING | "Fait avec émotion pour l'Afrique"                                    |
 * | NEXT_PUBLIC_OG_TITLE              | OG_TITLE           | see the constant — the qualifier is the site's one question           |
 * | NEXT_PUBLIC_OG_DESCRIPTION        | OG_DESCRIPTION     | see the constant — that question, then the six corpus classes         |
 *
 * The last two rows named a value rather than pointing at one, and both had
 * gone stale: the table still read "Atlas des Peuples d'Afrique" and an
 * enumeration of three classes long after the constants below said otherwise.
 * A default copied into a doc table is a second source of truth in the file
 * whose whole point is being the only one.
 *
 * There is no site-locale variable. `NEXT_PUBLIC_SITE_LOCALE` used to name a
 * single locale for the whole site — the model the bilingual site ends
 * (ARCH-021) — and was read by nothing but its own test. The locales the site
 * publishes, and the default, come from `getPublishedLocales()` and
 * `getDefaultLocale()` in `src/lib/locale.ts`; the Open Graph form of each is
 * `OG_LOCALE_BY_LANGUAGE` in `src/lib/seo/localeAlternates.ts`.
 *
 * All environment variables use the `NEXT_PUBLIC_` prefix to ensure they are
 * available in both server and client contexts in Next.js.
 *
 * > **Important — build-time inlining**: Next.js statically replaces
 * > `NEXT_PUBLIC_*` references at **compile time**. This means that after
 * > changing any of these environment variables, **a fresh build is required**
 * > for the new values to take effect. Hot-swapping the env var on a running
 * > server without rebuilding will have no effect.
 */

/** The main product name displayed throughout the application */
// @req REQ-019
export const PRODUCT_NAME =
  process.env.NEXT_PUBLIC_PRODUCT_NAME || "EthniAfrica";

/**
 * What the product is, in one line, beside the name in the masthead.
 *
 * The same qualifier {@link OG_TITLE} carries after the em dash, kept as its
 * own constant because the masthead sets the two halves differently — the name
 * in the display face, the qualifier in the warm gradient — and splitting
 * `OG_TITLE` on a dash at render time would break the day the title is
 * rewritten without one.
 *
 * The one constant here with no `NEXT_PUBLIC_*` override, and deliberately so
 * for now: `checkEnvExample.ts` gates the code and `.env.example` against each
 * other in both directions, so a new variable is only half a change until the
 * example file declares it too. Give it an override the day the example file
 * is edited in the same commit — not before, or the gate goes red for everyone.
 */
// @req REQ-019
export const PRODUCT_TAGLINE = "D’où viennent les noms des peuples d’Afrique";

/**
 * The handle the product answers to on social networks.
 *
 * One spelling across every network the atlas holds — Instagram, TikTok, X —
 * and the same one the render engine already burns into every card's third
 * credit line (`ethniafrica.com · @ethniafrica`). It lives here for the reason
 * §1 of the brand charter gives about the name: an identity string spelled in
 * two places is an identity spelled two ways. `twitter:site` carried
 * `@big_emotion` — the publisher's account, not the product's — for as long as
 * the product had no account of its own, so every page shared on X credited
 * the studio.
 *
 * No `NEXT_PUBLIC_*` override, on the same terms as {@link PRODUCT_TAGLINE}:
 * `checkEnvExample.ts` gates the code and `.env.example` against each other in
 * both directions, so a new variable is only half a change until the example
 * file declares it too.
 */
// @req REQ-019
export const SOCIAL_HANDLE = "@ethniafrica";

/** The canonical domain for the application (without protocol) */
// @req REQ-019
export const CANONICAL_DOMAIN =
  process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "ethniafrica.com";

/**
 * Where a reader writes to the publisher.
 *
 * Composed from {@link CANONICAL_DOMAIN} rather than written out, for the same
 * reason §1 of the brand charter gives about the name: an address printed in a
 * page and a different one used by the mailer is a contact channel that reads
 * as open and is not. Rebranding the domain moves the mailbox with it.
 */
// @req REQ-019
export const CONTACT_EMAIL = `contact@${CANONICAL_DOMAIN}`;

/** Attribution string shown in footers and credits */
// @req REQ-019
export const ATTRIBUTION_STRING =
  process.env.NEXT_PUBLIC_ATTRIBUTION_STRING ||
  "Fait avec émotion pour l'Afrique";

/**
 * The site's own title: the home tab and the social card.
 *
 * The only place the brand is qualified. There it stands alone, with no
 * masthead beside it to say what EthniAfrica is — whereas an inner page
 * suffixes {@link PRODUCT_NAME} to a title that already carries its own
 * qualifier, and would otherwise stack two of them in one tab.
 */
// @req REQ-019
export const OG_TITLE =
  process.env.NEXT_PUBLIC_OG_TITLE ||
  "EthniAfrica — D’où viennent les noms des peuples d’Afrique";

/**
 * Open Graph description for social media previews.
 *
 * It names all six corpus classes, and `siteDescription.test.ts` holds it to
 * the registry so a seventh cannot ship without this sentence saying so. The
 * three sentences that describe the product to someone who has not arrived
 * yet named four for as long as the atlas kept growing.
 *
 * **The enumeration comes second, and that order is the point.** This sentence
 * used to open on it — a table of contents, handed to a reader scrolling a feed
 * who has no reason yet to want a table of contents. It now opens on the
 * question the site answers and keeps the six classes behind it, so the gate
 * above still holds while the promise leads.
 */
// @req REQ-019
export const OG_DESCRIPTION =
  process.env.NEXT_PUBLIC_OG_DESCRIPTION ||
  "D’où viennent les noms des peuples d’Afrique ? Peuples, langues, familles linguistiques, pays, appellations et noms, chacun avec l’origine de son nom et ses sources.";
