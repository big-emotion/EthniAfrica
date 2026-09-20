/**
 * Which third-party players the site may frame, and how each is addressed.
 *
 * The enabling line is a source constant, never an environment variable: a
 * per-deployment Content-Security-Policy is one nobody can reason about, and a
 * flag set on one host and forgotten on another is how a policy drifts. A
 * change to it is a reviewed diff, and the middleware tests pin the result.
 */
export type EmbedProvider = "youtube" | "tiktok" | "instagram" | "facebook";

export interface EmbedRef {
  provider: EmbedProvider;
  id: string;
}

/**
 * `frame-src` hosts per provider, declared for all four and granted for one.
 * YouTube needs both: `frame-src` governs the frame's navigations, and the
 * player's own chrome (logo, channel link, end screen) navigates to youtube.com.
 */
const EMBED_PROVIDER_FRAME_HOSTS: Record<EmbedProvider, readonly string[]> = {
  youtube: ["https://www.youtube-nocookie.com", "https://www.youtube.com"],
  tiktok: ["https://www.tiktok.com"],
  instagram: ["https://www.instagram.com"],
  facebook: ["https://www.facebook.com"],
};

/** The only line that opens the policy. Empty closes it. */
// @req REQ-181
export const ENABLED_EMBED_PROVIDERS: readonly EmbedProvider[] = ["youtube"];

// @req REQ-181
export function embedFrameSrcHosts(
  enabled: readonly EmbedProvider[] = ENABLED_EMBED_PROVIDERS
): string[] {
  return enabled.flatMap((provider) => EMBED_PROVIDER_FRAME_HOSTS[provider]);
}

interface Player {
  /** Anything a stored identifier could carry that is not an identifier. */
  idShape: RegExp;
  url: (id: string) => string;
}

/**
 * Only YouTube has a player. TikTok, Instagram and Facebook keep linking out:
 * their embeds need a script in this page, which is the cost the decision
 * refuses (DEC-059).
 *
 * `autoplay=1` answers the click the reader has just made; it is not autoplay.
 */
const PLAYERS: Partial<Record<EmbedProvider, Player>> = {
  youtube: {
    idShape: /^[A-Za-z0-9_-]{11}$/,
    url: (id) =>
      `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
  },
};

/**
 * The iframe `src` for a stored reference, or null when there must be none.
 *
 * No URL is ever stored: a stored string that becomes an iframe `src` is the one
 * place in this code where an unvalidated value reaches the DOM as an address,
 * and the compiler does not check it here. The identifier is shape-checked and
 * the URL is built from a constant.
 */
// @req REQ-181
export function embedPlayerUrl(
  embed: EmbedRef,
  enabled: readonly EmbedProvider[] = ENABLED_EMBED_PROVIDERS
): string | null {
  const player = PLAYERS[embed.provider];
  if (!player || !enabled.includes(embed.provider)) return null;
  return player.idShape.test(embed.id) ? player.url(embed.id) : null;
}
