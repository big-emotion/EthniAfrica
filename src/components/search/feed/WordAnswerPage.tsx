import { NamesBlock } from "@/components/search/answer/NamesBlock";
import { NextQuestion } from "@/components/search/answer/NextQuestion";
import { OriginBlock } from "@/components/search/answer/OriginBlock";
import { SourcesLine } from "@/components/search/answer/SourcesLine";
import { WhatBlock } from "@/components/search/answer/WhatBlock";
import {
  ANSWER_BLOCK,
  ANSWER_HEADING,
} from "@/components/search/answer/answerStyle";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { articlesCopy } from "@/lib/i18n/copy/articles";
import { wordAnswerCopy } from "@/lib/i18n/copy/wordAnswer";
import { cn } from "@/lib/utils";
import type { WordAnswer } from "@/lib/search/answer";
import type { Language } from "@/types/shared";

export interface WordAnswerPageProps {
  answer: WordAnswer;
  language?: Language;
}

/**
 * The page of a word that has no fiche: what the production registry says of
 * it, drawn with the answer page's own blocks (what it is, where it comes
 * from, its forms and route, what follows, sources), then the closing the
 * reader is owed whatever was found.
 *
 * A published word is answered by its record instead of a confession; that
 * decision lives here and in `SearchFeed`, the blocks are shared. Each block
 * is drawn only when the answer carries its key. The origin shows every
 * account: a word with several readings never reaches the reader as one.
 */
// @req REQ-184
// @req REQ-178
export function WordAnswerPage({
  answer,
  language = "fr",
}: WordAnswerPageProps) {
  const copy = wordAnswerCopy[language];
  const hasForms = answer.names.length > 0 || Boolean(answer.path?.length);

  return (
    <div data-word-answer="" className="contents">
      <div className="grid gap-afh-lg">
        <WhatBlock answer={answer} language={language} />
        <p className="max-w-[var(--afh-measure-prose)] text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
          {copy.noFicheNote}
        </p>
      </div>
      {answer.origin && answer.origin.accounts.length > 0 ? (
        <OriginBlock
          origin={answer.origin}
          kind="word"
          title={answer.title}
          language={language}
        />
      ) : null}
      {hasForms ? <NamesBlock answer={answer} language={language} /> : null}
      {answer.next ? (
        <NextQuestion next={answer.next} kind="word" language={language} />
      ) : null}
      {answer.publications?.length ? (
        <section
          className={cn(ANSWER_BLOCK, "flex flex-col gap-afh-lg")}
          data-word-part="publications"
        >
          <h2 className={ANSWER_HEADING}>{copy.publicationsTitle}</h2>
          <div className="flex flex-col gap-afh-md rounded-afh-xl bg-afh-bg-warm p-afh-2xl">
            <span className="text-afh-eyebrow font-bold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[0.08em] text-[color:var(--accent-ink)]">
              {copy.publicationMeta(
                answer.publications[0].format,
                answer.publications[0].publishedAt
              )}
            </span>
            <strong className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] text-afh-text">
              {formatProductionNameQuestion(answer.title, language)}
            </strong>
            <div className="flex flex-wrap gap-afh-md">
              {answer.publications.map((publication) => (
                <a
                  key={publication.url}
                  href={publication.url}
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-afh-lg border border-[color:var(--accent)] bg-afh-surface px-afh-2xl py-afh-md text-afh-small font-bold text-afh-text no-underline focus-visible:outline-none focus-visible:shadow-[var(--afh-ring-focus)]"
                >
                  {copy.publicationLink(
                    (
                      articlesCopy[language].article.networks as Record<
                        string,
                        string
                      >
                    )[publication.network] ?? publication.network
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <SourcesLine
        count={answer.sources.count}
        accounts={answer.origin?.accounts}
        kind="word"
        title={answer.title}
        language={language}
      />
    </div>
  );
}
