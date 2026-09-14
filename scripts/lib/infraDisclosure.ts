/**
 * Host identifiers the public repository must never carry: server addresses,
 * the SSH port, the hosting provider, the datacenter locations.
 *
 * The terms themselves are not in the repository. CI reads them from the
 * `INFRA_DISCLOSURE_TERMS` Actions variable, a local checkout from the same name
 * in its environment or its gitignored `.env.local`. Keeping the list outside is
 * the point: a deny-list committed here would publish every value it forbids.
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
