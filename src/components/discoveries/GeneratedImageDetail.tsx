import type { DiscoveryPublication } from "@/lib/discoveries/catalog";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import type { Language } from "@/types/shared";

import styles from "./GeneratedImageDetail.module.css";

const CC_BY_SA_4_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

interface GeneratedImageDetailProps {
  entry: DiscoveryPublication;
  language: Language;
  className?: string;
}

// `generatedOn` is a calendar day. Formatting it in UTC keeps a reader west of
// Greenwich from seeing the day before; an unparseable value is shown as
// recorded rather than throwing inside the sheet.
function formatGenerationDate(language: Language, isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

// The atlas entities and the subject's source are not repeated here: the
// detail sheet already lists them for every publication kind.
// @req REQ-165
export function GeneratedImageDetail({
  entry,
  language,
  className,
}: GeneratedImageDetailProps) {
  const { generation } = entry;
  if (entry.kind !== "image" || !generation) return null;
  const words = discoveriesCopy[language].generated;
  // A licence is published, not named (brand charter §9): the reader gets its
  // URI, the publication's own when it records one.
  const licenceUrl =
    entry.image?.licenceUrl ??
    (entry.image?.licence === "cc-by-sa" ? CC_BY_SA_4_URL : undefined);
  return (
    <section aria-label={words.label} className={className}>
      <h3>{words.label}</h3>
      <p>{words.interpretation}</p>
      <dl className={styles.provenance}>
        <dt>{words.tool}</dt>
        <dd>{generation.tool}</dd>
        <dt>{words.model}</dt>
        <dd>{generation.model}</dd>
        <dt>{words.date}</dt>
        <dd>
          <time dateTime={generation.generatedOn}>
            {formatGenerationDate(language, generation.generatedOn)}
          </time>
        </dd>
      </dl>
      <p>
        {words.licence}
        {licenceUrl ? (
          <>
            {" "}
            <a href={licenceUrl} target="_blank" rel="noreferrer">
              {words.licenceLink}
            </a>
          </>
        ) : null}
      </p>
      {entry.captionExceedsCorpus && entry.captionSource ? (
        <p>
          {words.captionSource}{" "}
          <a href={entry.captionSource.url} target="_blank" rel="noreferrer">
            {entry.captionSource.title}
          </a>
        </p>
      ) : null}
    </section>
  );
}
