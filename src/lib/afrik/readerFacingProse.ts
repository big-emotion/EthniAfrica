const AFRIK_IDENTIFIER = /\b(?:FLG_[A-Z0-9_]+\/)?(?:PPL|FLG)_[A-Z0-9_]+\b/g;

function readableLabel(identifier: string): string {
  const entityId = identifier.split("/").at(-1) ?? identifier;
  return entityId
    .replace(/^(?:PPL|FLG)_/, "")
    .split("_")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toLocaleUpperCase("fr") +
        part.slice(1).toLocaleLowerCase("fr")
    )
    .join(" ");
}

/**
 * Keeps a stale loaded record from leaking AFRIK storage identifiers to a
 * reader. Source validation remains the primary guard; this display boundary
 * covers the interval between a corpus correction and its next database load.
 */
// @req REQ-091
export function readerFacingProse(value?: string | null): string | undefined {
  return value?.replace(AFRIK_IDENTIFIER, readableLabel);
}
