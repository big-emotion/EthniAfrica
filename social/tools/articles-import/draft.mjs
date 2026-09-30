/**
 * Draft article records, and the rule for writing one next to curated work.
 *
 * The importer only ever writes `status: "draft"` with no body. Once a person
 * edits a draft, or promotes it, the file is theirs: a re-run leaves it alone
 * and says so, instead of restoring what the importer wrote last time.
 */
import { createHash } from "node:crypto";

export function serializeDraft(record) {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function textSha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * What to do with `content/articles/<id>.json`.
 *
 * `lastWrittenSha` is the hash of what this importer wrote on its previous
 * run, from the private manifest. A file that no longer has that hash was
 * edited since, and is refused rather than overwritten.
 */
export function planDraftWrite(existingText, nextText, lastWrittenSha) {
  if (existingText === null) return { action: "create" };
  if (existingText === nextText) return { action: "unchanged" };
  let existing;
  try {
    existing = JSON.parse(existingText);
  } catch {
    return { action: "refuse", reason: "existing file is not valid JSON" };
  }
  if (existing.status !== "draft") {
    return {
      action: "refuse",
      reason: `existing article is ${existing.status}, not draft`,
    };
  }
  if (!lastWrittenSha || textSha256(existingText) !== lastWrittenSha) {
    return {
      action: "refuse",
      reason: "draft was edited since the last import",
    };
  }
  return { action: "update" };
}

/**
 * Refuse a public record that carries anything private: a root of the library
 * or workshop, the home directory, or the free-text notes a record keeps for
 * the operator. `forbidden` is built from the run's real inputs, so the guard
 * never needs to spell a private path in this public file.
 */
export function assertPublicSafe(text, forbidden) {
  for (const needle of forbidden) {
    if (needle && needle.length >= 8 && text.includes(needle)) {
      throw new Error(
        `public output would carry private material: "${needle.slice(0, 60)}"`
      );
    }
  }
  if (/"src":\s*"(\/|[a-z][a-z0-9+.-]*:)/i.test(text)) {
    throw new Error("public output carries a non-relative media path");
  }
}
