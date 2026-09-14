import type { DiscoveryPublication } from "@/lib/discoveries/catalog";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import type { Language } from "@/types/shared";

import styles from "./GeneratedImageBadge.module.css";

interface GeneratedImageBadgeProps {
  entry: DiscoveryPublication;
  language: Language;
}

// @req REQ-165
export function GeneratedImageBadge({
  entry,
  language,
}: GeneratedImageBadgeProps) {
  if (entry.kind !== "image") return null;
  return (
    <span className={styles.badge}>
      {discoveriesCopy[language].generated.label}
    </span>
  );
}
