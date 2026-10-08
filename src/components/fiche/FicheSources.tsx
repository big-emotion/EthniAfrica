import { FicheTile } from "@/components/fiche/FicheTile";
import { SourceKindBadge } from "@/components/sources/SourceKindBadge";
import { SourceVerifyBadge } from "@/components/ui/source-verify-badge";
import {
  readerFacingNote,
  type FicheSourceEntry,
} from "@/lib/afrik/ficheSourceLabel";
import { ficheCopy } from "@/lib/i18n/copy/fiche";
import { FALLBACK_LOCALE } from "@/lib/locale";
import type { Language } from "@/types/shared";

interface FicheSourcesProps {
  sources: FicheSourceEntry[];
  /** Story 0.20 (FR31): show a "source à vérifier" badge when truthy. */
  hasSourceFlag?: boolean;
  language?: Language;
}

/** How many titles the folded list shows before it counts the rest. */
const PREVIEW_TITLES = 3;

/**
 * The bibliography every record ends on, folded into a tile when long.
 *
 * It prints the work — title, link, its kind when one is recorded, note — and
 * never the source's tier
 * (doctrine §1.1): the standing is editorial bookkeeping that stays in the
 * data, and printing it beside each title asked the reader to rank the
 * sources a people's history rests on by a scale the atlas built for itself.
 */
// @req REQ-092
export function FicheSources({
  sources,
  hasSourceFlag,
  language = FALLBACK_LOCALE,
}: FicheSourcesProps) {
  if (!sources || sources.length === 0) return null;

  /**
   * Numbered only when a note callout has something to point at. Country and
   * family declare sources and cite none of them from their prose, so their
   * bibliography stays an unordered list — numbering one that nothing links to
   * would promise an anchor that does not exist.
   */
  const numbered = sources.some((source) => Boolean(source.number));
  const ListTag = numbered ? "ol" : "ul";

  const unlisted = sources.length - PREVIEW_TITLES;
  const preview = [
    ...sources.slice(0, PREVIEW_TITLES).map((source) => source.label),
    `+${unlisted}`,
  ].join(" · ");

  const list = (
    <ListTag className="afh-fiche-source-list">
      {sources.map((source, index) => {
        const note = readerFacingNote(source.notes);
        return (
          <li
            key={source.sourceId ?? `${source.label}-${index}`}
            id={source.number ? `source-${source.number}` : undefined}
            className="flex items-baseline gap-2 flex-wrap"
          >
            {/* The number a note callout printed, not the list's own
                counter: a callout says [4] and must land on the entry that
                says 4. */}
            {source.number && (
              <span className="shrink-0 tabular-nums text-afh-eyebrow">
                {source.number}.
              </span>
            )}
            {source.url ? (
              <a
                href={source.url}
                rel="noreferrer noopener"
                target="_blank"
                // A citation is a row in the source list, not a word inside
                // a sentence, so it owes the 44px target rather than the
                // height of the line it happens to occupy.
                className="inline-flex min-h-11 items-center underline underline-offset-2"
              >
                {source.label}
              </a>
            ) : (
              <span>{source.label}</span>
            )}
            {source.kind && (
              <SourceKindBadge kind={source.kind} language={language} />
            )}
            {/* What the editor wrote about the source, less whatever the
                pipeline wrote there about itself. */}
            {note && (
              <span data-source-note="" className="afh-fiche-source-note">
                {note}
              </span>
            )}
          </li>
        );
      })}
    </ListTag>
  );

  return (
    <div className="afh-fiche-sources">
      {hasSourceFlag && (
        <p className="m-0">
          <SourceVerifyBadge language={language} />
        </p>
      )}
      {unlisted > 0 ? (
        <FicheTile
          title={ficheCopy[language].sourcesList}
          closedFact={preview}
          language={language}
        >
          {list}
        </FicheTile>
      ) : (
        list
      )}
    </div>
  );
}
