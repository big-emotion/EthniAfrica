import { useId } from "react";

import {
  downloadChoices,
  type DiscoveryPublication,
  type DownloadFormat,
} from "@/lib/discoveries/catalog";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import type { Language } from "@/types/shared";

import styles from "./DiscoveryDownloads.module.css";

interface DiscoveryDownloadsProps {
  language: Language;
  publication: DiscoveryPublication | undefined;
}

// @req REQ-166
export function DiscoveryDownloads({
  language,
  publication,
}: DiscoveryDownloadsProps) {
  const headingId = useId();
  const choices = publication ? downloadChoices(publication) : [];
  if (!choices.length) return null;

  const words = discoveriesCopy[language].downloads;
  const formatNames: Record<DownloadFormat, string> = {
    "9:16": words.story,
    "4:5": words.post,
    "1:1": words.avatar,
  };

  return (
    <section aria-labelledby={headingId} className={styles.downloads}>
      <h3 id={headingId}>{words.title}</h3>
      <ul className={styles.choices}>
        {choices.map((choice) => (
          <li key={choice.format}>
            <a href={choice.src} download className={styles.choice}>
              <strong>{formatNames[choice.format]}</strong>{" "}
              <span>
                {choice.width} × {choice.height}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
