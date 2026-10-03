/**
 * NameAttestationTimeline — the history of a name's forms (REQ-189, DEC-067).
 *
 * Every attestation of every form, in one list ordered by year: the reader
 * follows how the name was written over time, not form by form. A dated entry
 * is not made larger than an undated one — the order is chronology, never a
 * ranking of forms. An attestation the sources do not date keeps its place at
 * the end, marked undated, and never receives a guessed year.
 */

import type { NameAttestationView } from "@/api/v2/schemas/names";

/** What the timeline reads of a form: its language and its history. */
interface AttestedForm {
  languageOfOrigin: string | null;
  attestations?: NameAttestationView[];
}

export interface NameAttestationTimelineProps {
  names: AttestedForm[];
  heading: string;
  undatedLabel: string;
}

// @req REQ-189
export function NameAttestationTimeline({
  names,
  heading,
  undatedLabel,
}: NameAttestationTimelineProps) {
  const attestations = names
    .flatMap((name) =>
      (name.attestations ?? []).map((attestation) => ({
        ...attestation,
        lang: name.languageOfOrigin ?? undefined,
      }))
    )
    .sort((a, b) => {
      if (a.year === null) return b.year === null ? 0 : 1;
      if (b.year === null) return -1;
      return a.year - b.year;
    });

  // Absent, never empty (atlas charter §8): no attestation, no block.
  if (attestations.length === 0) return null;

  return (
    <div data-name-timeline className="mt-afh-md">
      <h3 className="font-afh-display text-afh-body font-bold text-afh-text">
        {heading}
      </h3>
      <ol className="mt-afh-sm flex flex-col gap-afh-sm font-afh text-afh-body text-afh-text">
        {attestations.map((attestation, index) => (
          <li
            key={`${attestation.formAsWritten}-${index}`}
            className="grid grid-cols-[4.5rem_1fr] gap-x-afh-sm"
          >
            <span className="font-afh-mono text-afh-caption tabular-nums text-afh-text-soft">
              {attestation.year ?? undatedLabel}
            </span>
            <span>
              <span
                className="font-afh-display font-bold"
                lang={attestation.lang}
              >
                {attestation.formAsWritten}
              </span>
              <span className="block text-afh-caption text-afh-text-soft">
                {[
                  attestation.periodLabel,
                  attestation.attestedBy,
                  `${attestation.source.title}, ${attestation.source.page}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
