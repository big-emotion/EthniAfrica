/**
 * Host identifiers the public repository must never carry: server addresses,
 * the SSH port, the hosting provider, the datacenter locations.
 *
 * The terms themselves are not in the repository. CI reads them from the
 * `INFRA_DISCLOSURE_TERMS` Actions **secret** — masked in the log, unlike a
 * variable, which the runner echoes in a step's `env:` block for anyone to read
 * — and a local checkout from the same name in its environment or its gitignored
 * `.env.local`. Keeping the list outside is the point: a deny-list committed
 * here would publish every value it forbids.
 */

export interface Disclosure {
  line: number;
  term: string;
}

export function parseDisclosureTerms(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n]/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A term counts only as a whole token. A short provider name turns up by chance
// inside base64 blobs and lockfile hashes, and a port number inside longer
// numbers; reporting those would bury a real leak under noise.
function wholeTokenPattern(term: string): RegExp {
  return new RegExp(
    `(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`,
    "i"
  );
}

export function findDisclosures(text: string, terms: string[]): Disclosure[] {
  if (terms.length === 0) return [];
  const patterns = terms.map((term) => ({
    term,
    pattern: wholeTokenPattern(term),
  }));

  const disclosures: Disclosure[] = [];
  text.split("\n").forEach((content, index) => {
    for (const { term, pattern } of patterns) {
      if (pattern.test(content)) disclosures.push({ line: index + 1, term });
    }
  });
  return disclosures;
}

export interface IdentifierShape {
  line: number;
  shape: string;
}

/**
 * Files whose whole purpose is to describe the infrastructure, and which
 * therefore may carry no shape at all — not only the terms somebody thought to
 * list. Checked without the variable, so a fork or a Dependabot run enforces
 * this much too.
 */
export const SHAPE_GUARDED_PATHS = [
  ".claude/skills/ethniafrica-infra/SKILL.md",
];

const IDENTIFIER_SHAPES: Array<[string, RegExp]> = [
  ["an IPv4 address", /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ["an IPv6 address", /\b(?:[0-9a-f]{1,4}:){4,7}[0-9a-f]{1,4}\b/i],
  // Well-known ports (443, 5432, 8000…) are architecture; a five-digit port is
  // a host's own choice and a reconnaissance detail.
  ["a non-standard port number", /\b(?:[1-5]\d{4}|6[0-5]\d{3})\b/],
  ["a provider-assigned server name", /\bvps-[0-9a-f]{6,}\b/i],
  ["a link", /\bhttps?:\/\//i],
  ["an e-mail address", /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i],
];

export function findIdentifierShapes(text: string): IdentifierShape[] {
  const found: IdentifierShape[] = [];
  text.split("\n").forEach((content, index) => {
    for (const [shape, pattern] of IDENTIFIER_SHAPES) {
      if (pattern.test(content)) found.push({ line: index + 1, shape });
    }
  });
  return found;
}
