import type { FlagFormTarget } from "@/components/flags/FlagForm";
import { OwedBlock } from "@/components/search/feed/OwedBlock";
import { SearchFeedEvidenceAction } from "@/components/search/feed/SearchFeedEvidenceAction";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { wordAnswerCopy } from "@/lib/i18n/copy/wordAnswer";
import type { WordAnswer } from "@/lib/search/answer";
import type { Language } from "@/types/shared";

export interface WordAnswerPageProps {
  answer: WordAnswer;
  language?: Language;
  contributionTarget: FlagFormTarget;
}

const SECTION_HEADING =
  "font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] text-afh-text";

/**
 * The page of a word that has no fiche: what the production registry says of
 * it, in the answer's own order — what it is, where it comes from, the route it
 * took, what follows — then the closing the reader is owed whatever was found.
 *
 * Deliberately plain. The six-block components of the answer page replace this
 * body when they land; what stays is the decision that a published word is
 * answered by its record instead of by a confession.
 *
 * Every block is drawn only when the answer carries its key. The origin shows
 * every account: a word with several readings never reaches the reader as one.
 */
// @req REQ-184
// @req REQ-178
export function WordAnswerPage({
  answer,
  language = "fr",
  contributionTarget,
}: WordAnswerPageProps) {
  const copy = wordAnswerCopy[language];
  const owed = nameAnswerCopy[language];
  const accounts = answer.origin?.accounts ?? [];
  const forms = answer.names.filter(
    (name) => name.form.toLowerCase() !== answer.title.toLowerCase()
  );

  return (
    <div data-word-answer="" className="min-w-0 text-afh-text">
      <section className="min-w-0 pt-afh-2xl min-[1200px]:pt-afh-5xl">
        <p className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[var(--afh-eyebrow-tracking)] text-[color:var(--accent-ink)]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-afh-xs font-afh-display text-afh-hero font-black leading-[var(--afh-leading-hero)] text-afh-text min-[1200px]:mt-afh-md">
          {answer.title}
        </h1>
        {answer.what.lead ? (
          <p className="mt-afh-lg max-w-[65ch] text-afh-body leading-[var(--afh-leading-body)]">
            {answer.what.lead}
          </p>
        ) : null}
        <p className="mt-afh-md max-w-[65ch] text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
          {copy.noFicheNote}
        </p>
      </section>

      {accounts.length > 0 ? (
        <section className="mt-afh-5xl min-w-0" data-word-part="origin">
          <h2 className={SECTION_HEADING}>{copy.originTitle}</h2>
          <ul className="mt-afh-lg grid gap-afh-lg">
            {accounts.map((account, index) => (
              <li
                key={index}
                className="min-w-0 rounded-afh-lg border border-afh-border p-afh-2xl"
              >
                {account.attribution ? (
                  <p className="text-afh-caption font-semibold leading-[var(--afh-leading-caption)] text-afh-text-soft">
                    {copy.attribution[account.attribution]}
                  </p>
                ) : null}
                <p className="mt-afh-xs max-w-[65ch] text-afh-body leading-[var(--afh-leading-body)]">
                  {account.text}
                </p>
                {account.evidence.map((evidence, evidenceIndex) => (
                  <SearchFeedEvidenceAction
                    key={evidenceIndex}
                    evidence={evidence}
                    anchorId={`word-answer-${index}-${evidenceIndex}`}
                    language={language}
                  />
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {answer.path?.length ? (
        <section className="mt-afh-5xl min-w-0" data-word-part="path">
          <h2 className={SECTION_HEADING}>{copy.pathTitle}</h2>
          <p className="mt-afh-xs text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
            {copy.pathLead}
          </p>
          <ol className="mt-afh-lg grid gap-afh-md">
            {answer.path.map((step, index) => (
              <li
                key={index}
                className="flex min-w-0 flex-wrap items-baseline gap-x-afh-md"
              >
                <span className="font-afh-display text-afh-h3 font-bold">
                  {step.form}
                </span>
                <span className="text-afh-caption text-afh-text-soft">
                  {step.language}
                  {step.period ? ` · ${step.period}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {forms.length > 0 ? (
        <section className="mt-afh-5xl min-w-0" data-word-part="names">
          <h2 className={SECTION_HEADING}>{copy.namesTitle}</h2>
          <ul className="mt-afh-lg flex flex-wrap gap-afh-md">
            {[answer.title, ...forms.map((name) => name.form)].map((form) => (
              <li
                key={form}
                className="rounded-afh-lg border border-afh-border px-afh-lg py-afh-sm"
              >
                {form}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {answer.next && "question" in answer.next ? (
        <p
          data-word-part="next"
          className="mt-afh-5xl max-w-[65ch] font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)]"
        >
          {answer.next.question}
        </p>
      ) : null}

      <section className="mt-afh-5xl min-w-0" data-word-part="sources">
        <p className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
          {copy.sourcesLine(answer.sources.count)}
        </p>
        {answer.publications?.length ? (
          <div className="mt-afh-lg">
            <h2 className={SECTION_HEADING}>{copy.publicationsTitle}</h2>
            <ul className="mt-afh-md grid gap-afh-sm">
              {answer.publications.map((publication) => (
                <li key={publication.url}>
                  <a
                    href={publication.url}
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center underline underline-offset-4"
                  >
                    {copy.publicationLink(publication.network)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="mt-afh-5xl">
        <OwedBlock
          language={language}
          conviction={{ title: owed.conviction, body: owed.convictionBody }}
          invitation={{
            title: owed.invitation,
            body: owed.invitationBody,
            action: owed.invitationAction,
          }}
          contributionTarget={contributionTarget}
        />
      </div>
    </div>
  );
}
