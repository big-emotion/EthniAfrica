import { parseBlockKey } from "@/lib/comments/blockKey";
import { accountCopy } from "@/lib/i18n/copy/account";

type Copy = (typeof accountCopy)["fr"];

/**
 * The passage a contribution sits on, as a reader would name it:
 * « Peuple · Les autres noms ». A report filed before block comments has no
 * block key and is named by what it targets.
 */
// @req REQ-213
export function contributionPlace(
  blockKey: string | null,
  entityType: string | null,
  copy: Copy
): string {
  const address = blockKey ? parseBlockKey(blockKey) : null;
  if (!address) {
    const subject = copy.subject[entityType as keyof Copy["subject"]] ?? null;
    return subject ? `${subject} · ${copy.reportLabel}` : copy.reportLabel;
  }
  const subject =
    address.subject === "search-query"
      ? copy.searchedName(address.id)
      : copy.subject[address.subject];
  return `${subject} · ${copy.section[address.section]}`;
}
