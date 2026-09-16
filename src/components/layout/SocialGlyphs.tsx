/**
 * The social network marks, drawn here rather than imported.
 *
 * lucide-react shipped `Facebook`, `Linkedin` and `Instagram` until v1, which
 * dropped every brand icon — the package this repo is on exports none of
 * them. Pulling a second icon library for three glyphs would put two stroke
 * systems in the same footer, so the geometry lucide used is kept and drawn
 * with the same 24-unit box, 2-unit stroke and round joins as every other
 * icon on the page.
 *
 * They are marks, never labels: each one is `aria-hidden`, and the element
 * around it carries the network's name.
 */

interface SocialGlyphProps {
  className?: string;
}

const GLYPH_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

// @req REQ-046
export function FacebookGlyph({ className }: SocialGlyphProps) {
  return (
    <svg {...GLYPH_PROPS} className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// @req REQ-046
export function LinkedinGlyph({ className }: SocialGlyphProps) {
  return (
    <svg {...GLYPH_PROPS} className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

// @req REQ-046
export function InstagramGlyph({ className }: SocialGlyphProps) {
  return (
    <svg {...GLYPH_PROPS} className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// @req REQ-046
export function TiktokGlyph({ className }: SocialGlyphProps) {
  return (
    <svg {...GLYPH_PROPS} className={className}>
      <circle cx="9" cy="18" r="3" />
      <path d="M12 18V4a4 4 0 0 0 4 4" />
    </svg>
  );
}

// @req REQ-046
export function YoutubeGlyph({ className }: SocialGlyphProps) {
  return (
    <svg {...GLYPH_PROPS} className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

// The X wordmark is a filled counter-form, which this file's one stroke system
// has no way to draw. Two crossed strokes say the same thing in the same hand,
// inset to 5–19 so the diagonals do not read heavier than the square and
// circular marks beside them.
// @req REQ-046
export function XGlyph({ className }: SocialGlyphProps) {
  return (
    <svg {...GLYPH_PROPS} className={className}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

// @req REQ-160
export function WhatsAppGlyph({ className }: SocialGlyphProps) {
  return (
    <svg {...GLYPH_PROPS} className={className}>
      <path d="M20.2 11.5a8.3 8.3 0 0 1-12.1 7.3L3 20l1.4-4.9a8.3 8.3 0 1 1 15.8-3.6z" />
      <path d="M8.1 7.8c-.4.3-.8 1-.8 1.5 0 2.6 3.4 6 5.9 6 .7 0 1.4-.4 1.7-.9l.5-.9-2.2-1.1-.9 1c-1.1-.4-2.2-1.5-2.7-2.6l1-1-1.1-2.3z" />
    </svg>
  );
}
