import Link from "next/link";

import { TranslationProvenanceMarker } from "@/components/fiche/TranslationProvenanceMarker";
import type { DidYouKnowEntity } from "@/lib/home/didYouKnowFacts";
import { DID_YOU_KNOW_ENTITY_ACCENT } from "@/lib/home/didYouKnowPresentation";
import { anecdotesCopy } from "@/lib/i18n/copy/anecdotes";
import { proverbsCopy } from "@/lib/i18n/copy/proverbs";
import type { LocalizedProverb } from "@/lib/proverbs/proverbs.en";
import { getCountryRoute, getFamilyRoute, getPeopleRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

export interface ProverbCardProps {
  language: Language;
  proverb: LocalizedProverb;
}

function entityHref(language: Language, entity: DidYouKnowEntity): string {
  if (entity.kind === "country") return getCountryRoute(language, entity.id);
  if (entity.kind === "family") return getFamilyRoute(language, entity.id);
  return getPeopleRoute(language, entity.id);
}

/**
 * One proverb, filed the way an anecdote is: a kicker, the claim, the exits
 * into the atlas, then the provenance in full.
 *
 * The original leads, the rendering follows. It is the autonym rule of brand
 * charter §3 applied to a sentence: the words the people say come first, in
 * their own `lang`, and ours gloss them. The rendering is still the heading,
 * because a heading is what a reader scanning the list has to understand.
 *
 * The origin status is printed as a sentence fragment rather than a badge.
 * « non établie » over a proverb the whole web calls African is the one piece
 * of information this dossier adds to the compilations it draws on, and a
 * badge would read as decoration beside the tier labels below.
 *
 * Ranged left at every width: a dossier page lists these one under another,
 * and a reader working down a column needs a starting edge (brand charter
 * §8.1). The block states it once so the phone's centred default does not
 * give the heading one edge and the prose another.
 */
// @req REQ-113
export function ProverbCard({ language, proverb }: ProverbCardProps) {
  const copy = proverbsCopy[language];
  const shared = anecdotesCopy[language];
  const { status, note } = proverb.origin;

  return (
    <article className="proverb-card" id={proverb.id} data-proverb="">
      <p className="proverb-kicker">{copy.kicker}</p>

      {proverb.original ? (
        <p className="proverb-original">
          <span className="proverb-original-text" lang={proverb.original.lang}>
            {proverb.original.text}
          </span>
          <span className="proverb-original-language">
            {copy.originalIn(proverb.original.language)}
          </span>
        </p>
      ) : null}

      <h2 className="proverb-text">{proverb.text}</h2>

      <TranslationProvenanceMarker
        translation={
          proverb.translationKind
            ? { kind: proverb.translationKind, stale: false }
            : null
        }
      />

      <p className="proverb-meaning">
        <span className="proverb-label">{copy.meaning}</span> {proverb.meaning}
      </p>

      <p className="proverb-origin">
        <span className="proverb-label">{copy.origin}</span>{" "}
        <span className={`proverb-status proverb-status--${status}`}>
          {copy.originStatus[status]}
        </span>
      </p>
      {note ? <p className="proverb-origin-note">{note}</p> : null}

      {proverb.entities.length ? (
        <ul className="proverb-chips">
          {proverb.entities.map((entity) => (
            <li key={`${entity.kind}-${entity.id}`}>
              <Link
                className={`proverb-chip ${DID_YOU_KNOW_ENTITY_ACCENT[entity.kind]}`}
                href={entityHref(language, entity)}
              >
                <span aria-hidden="true" className="proverb-dot" />
                <span className="proverb-chip-kind">
                  {shared.entityLabels[entity.kind]}
                </span>
                {entity.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="proverb-provenance">
        <p className="proverb-sources-label">{copy.sources}</p>
        <ul className="proverb-sources">
          {proverb.sources.map((source) => (
            <li key={`${source.title}-${source.url ?? ""}`}>
              {source.url ? (
                <a
                  href={source.url}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="proverb-source-link"
                >
                  {source.title}
                </a>
              ) : (
                <cite className="proverb-source-cite">{source.title}</cite>
              )}
              <span className="proverb-source-tier">
                {shared.tierLabels[source.tier]}
              </span>
              {source.notes ? (
                <span className="proverb-source-note">{source.notes}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </footer>

      <style>{`
        .proverb-card {
          text-align: left;
          padding: 24px 16px;
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg, 14px);
          background: var(--afh-surface);
        }
        .proverb-card p {
          margin: 0;
        }
        .proverb-kicker,
        .proverb-sources-label {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: var(--afh-text-eyebrow);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--afh-fg-muted);
        }
        .proverb-card .proverb-original {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .proverb-original-text {
          font-family: var(--afh-font-display);
          font-style: italic;
          font-size: var(--afh-text-lead);
          line-height: 1.4;
          color: var(--afh-text-soft);
        }
        .proverb-original-language {
          font-size: var(--afh-text-caption);
          color: var(--afh-fg-muted);
        }
        .proverb-text {
          margin: 12px 0 0;
          font-family: var(--afh-font-display);
          font-weight: 700;
          font-size: var(--afh-text-h3);
          line-height: 1.25;
          text-wrap: balance;
          color: var(--afh-text);
        }
        .proverb-text::before {
          content: open-quote;
        }
        .proverb-text::after {
          content: close-quote;
        }
        .proverb-text:lang(fr) {
          quotes: "«\\00a0" "\\00a0»";
        }
        .proverb-text:lang(en) {
          quotes: "\\201C" "\\201D";
        }
        .proverb-card .proverb-meaning,
        .proverb-card .proverb-origin {
          margin-top: 12px;
          font-size: var(--afh-text-body);
          line-height: 1.6;
          color: var(--afh-text-soft);
        }
        .proverb-label {
          font-weight: 600;
          color: var(--afh-text);
        }
        .proverb-label::after {
          content: " —";
        }
        .proverb-status--unestablished,
        .proverb-status--estimated {
          font-style: italic;
        }
        .proverb-card .proverb-origin-note {
          margin-top: 4px;
          font-size: var(--afh-text-caption);
          line-height: 1.5;
          color: var(--afh-fg-muted);
        }
        .proverb-chips {
          list-style: none;
          margin: 16px 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .proverb-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 32px;
          padding: 4px 12px 4px 8px;
          border: 1px solid var(--accent);
          border-radius: var(--afh-radius-full);
          background: var(--afh-color-card);
          color: var(--accent-ink);
          font-size: var(--afh-text-caption);
          font-weight: 600;
          text-decoration: none;
        }
        .proverb-chip:hover,
        .proverb-chip:focus-visible {
          background: var(--accent-tint);
        }
        .proverb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          flex: none;
        }
        .proverb-chip-kind {
          font-size: var(--afh-text-eyebrow);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .proverb-provenance {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--afh-border);
        }
        .proverb-sources {
          list-style: none;
          margin: 8px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .proverb-sources li {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 8px;
          font-size: var(--afh-text-caption);
        }
        .proverb-source-link {
          color: var(--afh-text-soft);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .proverb-source-cite {
          color: var(--afh-text-soft);
          font-style: italic;
        }
        .proverb-source-tier {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: var(--afh-text-eyebrow);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--afh-fg-muted);
        }
        .proverb-source-note {
          flex-basis: 100%;
          line-height: 1.5;
          color: var(--afh-fg-muted);
        }
        @media (min-width: 768px) {
          .proverb-card {
            padding: 32px;
          }
        }
      `}</style>
    </article>
  );
}
