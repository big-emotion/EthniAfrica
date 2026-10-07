import {
  ANSWER_ACCENT_CLASS,
  ANSWER_BLOCK,
  ANSWER_HEADING,
} from "@/components/search/answer/answerStyle";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type {
  AnswerKind,
  AnswerWhere,
  AnswerWhereRow,
  SearchAnswer,
} from "@/lib/search/answer";
import {
  formatMillions,
  formatMillionsInWords,
  formatPercent,
} from "@/lib/search/answerFormat";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface WhereBarsProps {
  where: AnswerWhere;
  kind: AnswerKind;
  /** Display name by country id (or people id for a country's shares). */
  labels?: Record<string, string>;
  facts?: SearchAnswer["what"]["facts"];
  /** Names the country when two answers share the page. */
  heading?: string;
  /** Peoples the fiche lists without a share, named beside the unsplit part. */
  unsplitPeopleNames?: string[];
  language?: Language;
}

/** Five rows read at a glance; the remainder is counted, not drawn. */

/** What fits the 6.5 rem label column on one line at the page's type size. */
const LABEL_COLUMN_CHARS = 14;
const MAX_ROWS = 5;

const rowId = (row: AnswerWhereRow): string =>
  "peopleId" in row ? row.peopleId : row.countryId;

/**
 * The geography block. Population and speaker figures are shown in millions
 * and only ever as declared estimates; a patronyme has no figures at all, so it
 * shows the countries as pills and says the figures are missing rather than
 * drawing bars of nothing.
 * @req REQ-178
 */
export function WhereBars({
  where,
  kind,
  labels = {},
  facts = {},
  heading,
  unsplitPeopleNames,
  language = "fr",
}: WhereBarsProps) {
  const copy = searchAnswerCopy[language];
  if (where.rows.length === 0) return null;

  const label = (row: AnswerWhereRow) => labels[rowId(row)] ?? rowId(row);
  const title = copy.where.title[kind === "country" ? "country" : "default"];
  const accent = ANSWER_ACCENT_CLASS[kind];

  return (
    <section
      className={cn(ANSWER_BLOCK, "flex flex-col gap-afh-lg")}
      data-answer-block="where"
      data-feed-block="answer-where"
      data-feed-zone="primary"
    >
      <h2 className={ANSWER_HEADING}>{title}</h2>
      {where.unit === "presence" ? (
        <Presence
          where={where}
          label={label}
          accent={accent}
          language={language}
        />
      ) : (
        <Bars
          where={where}
          label={label}
          facts={facts}
          heading={heading}
          unsplitPeopleNames={unsplitPeopleNames}
          accent={accent}
          language={language}
        />
      )}
    </section>
  );
}

function Presence({
  where,
  label,
  accent,
  language,
}: {
  where: AnswerWhere;
  label: (row: AnswerWhereRow) => string;
  accent: string;
  language: Language;
}) {
  const copy = searchAnswerCopy[language].where;
  return (
    <>
      <p className="m-0 text-afh-body leading-[var(--afh-leading-small)] text-afh-text">
        <InlineMarkup text={copy.presenceHeadline(where.rows.length)} />
      </p>
      <ul className={cn(accent, "m-0 flex list-none flex-wrap gap-afh-md p-0")}>
        {where.rows.map((row) => (
          <li
            key={rowId(row)}
            className="rounded-afh-full bg-[color:var(--accent-tint)] px-afh-2xl py-afh-md text-afh-small text-afh-text"
          >
            {label(row)}
          </li>
        ))}
      </ul>
      <p className="m-0 text-afh-caption leading-[var(--afh-leading-small)] text-afh-fg-muted">
        {copy.presenceMissingFigures}
      </p>
    </>
  );
}

function Bars({
  where,
  label,
  facts,
  heading,
  unsplitPeopleNames,
  accent,
  language,
}: {
  where: AnswerWhere;
  label: (row: AnswerWhereRow) => string;
  facts: SearchAnswer["what"]["facts"];
  heading?: string;
  unsplitPeopleNames?: string[];
  accent: string;
  language: Language;
}) {
  const copy = searchAnswerCopy[language].where;
  const rows = [...where.rows]
    .filter((row) => row.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const shown = rows.slice(0, MAX_ROWS);
  const largest = shown[0]?.value ?? 0;

  const isPercent = where.unit === "percent";
  const formatValue = (value: number) =>
    isPercent
      ? formatPercent(value, language)
      : formatMillions(value, language);

  // The headline restates the fiche's own totals; a sum of the rows is only the
  // fallback, never a sum of peoples' populations (the two are not additive).
  const totalPersons =
    facts.population ?? rows.reduce((sum, row) => sum + (row.value ?? 0), 0);
  const countryCount = facts.countryCount ?? rows.length;
  const moreCountries = isPercent ? 0 : countryCount - shown.length;
  const headline =
    where.unit === "speakers"
      ? copy.speakersHeadline(
          formatMillionsInWords(totalPersons, language),
          countryCount
        )
      : where.unit === "population"
        ? copy.populationHeadline(
            formatMillionsInWords(totalPersons, language),
            countryCount
          )
        : undefined;

  return (
    <>
      {heading ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-afh-lg">
          <h3 className="m-0 text-afh-small font-bold text-afh-text">
            {heading}
          </h3>
          {where.documentedPeopleCount ? (
            <span className="text-afh-small text-[color:var(--accent-ink)]">
              {copy.peoplePresented(where.documentedPeopleCount)}
            </span>
          ) : null}
        </div>
      ) : null}
      {headline ? (
        <p className="m-0 text-afh-body leading-[var(--afh-leading-small)] text-afh-text">
          <InlineMarkup text={headline} />
        </p>
      ) : null}
      <ul
        className={cn(accent, "m-0 flex list-none flex-col gap-afh-base p-0")}
      >
        {shown.map((row) => {
          // A long name would squeeze the label column and wrap on three
          // lines; it takes its own line above the bar instead.
          const stacked = label(row).length > LABEL_COLUMN_CHARS;
          return (
            <li
              key={rowId(row)}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.75rem] items-center gap-x-afh-base gap-y-afh-xs text-afh-small"
            >
              <span
                className={cn(
                  "min-w-0 [overflow-wrap:anywhere]",
                  stacked && "col-span-3"
                )}
                data-label-stacked={stacked ? "" : undefined}
              >
                {label(row)}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "block h-[10px] overflow-hidden rounded-afh-full bg-[color:var(--accent-tint)]",
                  stacked && "col-span-2"
                )}
              >
                <span
                  className="block h-full rounded-afh-full bg-[color:var(--accent)]"
                  style={{
                    width: `${Math.max(2, ((row.value ?? 0) / largest) * 100)}%`,
                  }}
                />
              </span>
              <span className="whitespace-nowrap text-right tabular-nums">
                {formatValue(row.value ?? 0)}
              </span>
            </li>
          );
        })}
      </ul>
      {moreCountries > 0 ? (
        <p className="m-0 text-afh-small font-bold text-[color:var(--accent-ink)]">
          {copy.moreCountries(moreCountries)}
        </p>
      ) : null}
      {isPercent && where.unsplitPercent ? (
        <p className="m-0 text-afh-caption leading-[var(--afh-leading-small)] text-afh-fg-muted">
          {copy.unsplit(
            formatPercent(where.unsplitPercent, language),
            unsplitPeopleNames?.join(", ")
          )}
        </p>
      ) : null}
      {where.estimate && where.unit !== "percent" ? (
        <p className="m-0 text-afh-caption leading-[var(--afh-leading-small)] text-afh-fg-muted">
          {where.unit === "speakers"
            ? copy.estimateSpeakers
            : copy.estimatePopulation}
        </p>
      ) : null}
    </>
  );
}
