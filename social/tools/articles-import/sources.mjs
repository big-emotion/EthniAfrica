/**
 * Carrying the workshop's own words and references into a draft.
 *
 * Nothing here writes a sentence. Slide text is the card as it was set, alt
 * text is the card's recorded description of its image, and a source is a
 * reference the workshop already cites. What changes is only the sorting: an
 * image's credit is a media credit, not evidence for a claim, and the project
 * citing itself is not a source for its own article.
 */

const TIERS = new Set(["official", "referenced", "unverified"]);

const clean = (value) => (typeof value === "string" ? value.trim() : "");

/** Slides, factual sources and media credits from a workshop `cards.json`. */
export function cardsToSlides(cardsJson) {
  const cards = [...(cardsJson?.cartes ?? [])].sort((a, b) => a.rang - b.rang);
  const slides = [];
  const credits = [];
  const titles = [];
  for (const card of cards) {
    // The order the gabarit draws them in: title, its gloss, the punchline,
    // the pairs under the title, the body, the reference line.
    const pairs = (Array.isArray(card.paires) ? card.paires : [])
      .map((p) =>
        [clean(p?.terme), clean(p?.glose)].filter(Boolean).join(" — ")
      )
      .filter(Boolean)
      .join("\n");
    const words = [
      card.titre,
      card.precision,
      card.punchline,
      pairs,
      card.corps,
      card.source,
    ]
      .map(clean)
      .filter(Boolean);
    const text = words.join("\n\n");
    slides.push({
      rang: card.rang,
      text,
      alt: clean(card.image?.identite) || clean(card.titre),
    });
    const credit = [card.image?.credit, card.image?.depot, card.image?.licence]
      .map(clean)
      .filter(Boolean)
      .join(" · ");
    if (credit && !credits.includes(credit)) credits.push(credit);
    for (const ref of clean(card.source).split(" · ").map(clean)) {
      if (ref && !titles.includes(ref)) titles.push(ref);
    }
  }
  const sources = titles
    .filter((title) => !/^EthniAfrica\b/i.test(title))
    // A reference names an author, a work or a date; a sentence with neither a
    // comma nor a figure is the account's closing line printed in that slot.
    .filter((title) => /[,\d]/.test(title))
    // A card's reference line carries no tier: nobody has ruled on it yet.
    .map((title) => ({ title, tier: "needs_review" }));
  // A licence a social post relied on is not a licence for the site.
  const restricted = cards
    .filter((c) => /©|tous droits|all rights/i.test(clean(c.image?.licence)))
    .map((c) => c.rang);
  return { slides, sources, credits: credits.join(" ; "), restricted };
}

function section(markdown, heading) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    out.push(line);
  }
  return out;
}

/**
 * A release's `CREDITS.md` lists its assets, then its sources as
 * `- text — url (tier)`. A source whose URL is an asset's page is the asset's
 * credit; one the project wrote about itself is a self-citation. Both are
 * set aside with their reason rather than dropped in silence.
 */
export function parseCreditsSources(markdown) {
  const assetLines = section(markdown, "Assets").filter((l) =>
    l.startsWith("- ")
  );
  const assetUrls = new Set(
    assetLines.map((l) => l.match(/(https?:\/\/\S+)\s*$/)?.[1]).filter(Boolean)
  );
  // "- key: Author / Depot — Licence — url" → "Author / Depot — Licence".
  const credits = assetLines
    .map((l) =>
      l.replace(/^- [^:]+:\s*/, "").replace(/\s*—\s*https?:\/\/\S+\s*$/, "")
    )
    .join(" ; ");
  const sources = [];
  const set_aside = [];
  for (const line of section(markdown, "Sources")) {
    const m = line.match(/^- (.+?) — (https?:\/\/\S+) \((\w+)\)\s*$/);
    if (!m) continue;
    const [, title, url, tier] = m;
    let host = "";
    try {
      host = new URL(url).hostname;
    } catch {
      /* an unparsable URL is still a reference, just without a host */
    }
    if (assetUrls.has(url))
      set_aside.push({ title, url, reason: "media credit" });
    else if (/ethniafrica\.com$/.test(host) || /^EthniAfrica\b/.test(title)) {
      set_aside.push({ title, url, reason: "self-citation" });
    } else {
      sources.push({
        title,
        url,
        tier: TIERS.has(tier) ? tier : "needs_review",
      });
    }
  }
  return { sources, set_aside, credits };
}

/** Whether `quote` appears in `text`, whitespace-insensitively. */
export function containsVerbatim(text, quote) {
  const squash = (s) => s.replace(/\s+/g, " ").trim();
  return Boolean(quote?.trim()) && squash(text).includes(squash(quote));
}
