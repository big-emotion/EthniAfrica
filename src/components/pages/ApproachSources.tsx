"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface ApproachSourceLink {
  title: string;
  hrefs: string[];
  hrefLabels?: string[];
  italicSegments?: string[];
  type: string;
}

function formatSourceLabel(label: string, italicSegments: string[] = []) {
  const segments = italicSegments
    .map((segment) => ({ segment, index: label.indexOf(segment) }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index);
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const { segment, index } of segments) {
    if (index < cursor) continue;
    if (index > cursor) parts.push(label.slice(cursor, index));
    parts.push(<em key={`${index}-${segment}`}>{segment}</em>);
    cursor = index + segment.length;
  }

  if (cursor < label.length) parts.push(label.slice(cursor));
  return parts;
}

interface ApproachSourcesProps {
  title: string;
  listLabel: string;
  preview: string;
  moreLabel: string;
  lessLabel: string;
  sources: ApproachSourceLink[];
}

// @req REQ-132
export default function ApproachSources({
  title,
  listLabel,
  preview,
  moreLabel,
  lessLabel,
  sources,
}: ApproachSourcesProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const syncDisclosure = () => setOpen(media.matches);

    syncDisclosure();
    media.addEventListener("change", syncDisclosure);
    return () => media.removeEventListener("change", syncDisclosure);
  }, []);

  return (
    <section
      className="ea-approach-sources space-y-afh-lg"
      aria-labelledby="approach-sources-heading"
    >
      <h2
        id="approach-sources-heading"
        className="font-afh-display text-afh-h2 font-bold"
      >
        {title}
      </h2>
      <details
        className="afh-tile"
        data-body-restates-preview="true"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="afh-tile-summary">
          <span className="afh-tile-label">{listLabel}</span>
          <span className="afh-tile-preview">{preview}</span>
          <span aria-hidden="true" className="afh-tile-control">
            <span data-when="closed">{moreLabel}</span>
            <span data-when="open">{lessLabel}</span>
          </span>
        </summary>
        <div className="afh-tile-body">
          <ul aria-label={title} className="afh-fiche-source-list">
            {sources.map((source) => (
              <li
                key={source.title}
                className="ea-approach-source text-afh-small leading-relaxed text-afh-text-soft"
              >
                {source.hrefs.map((href, index) => (
                  <span key={href}>
                    {index > 0 ? "; " : null}
                    <a href={href} target="_blank" rel="noreferrer">
                      {formatSourceLabel(
                        source.hrefLabels?.[index] ?? source.title,
                        source.italicSegments
                      )}
                    </a>
                  </span>
                ))}
                <span> · {source.type}</span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
