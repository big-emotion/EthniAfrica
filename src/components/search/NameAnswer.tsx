import Link from "next/link";

import { ficheHrefFor } from "@/components/search/SearchResultCard";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { getStaticPageRoute } from "@/lib/routing";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { NamingProjection } from "@/lib/search/naming";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

/**
 * What a result page says about the name the reader typed.
 *
 * The grammar is `REQ-178` and `src/lib/search/resultGrammar.ts`: three
 * movements, the first and third unconditional, the second the only one that
 * varies. The reviewed rendering is `docs/design/mockups/search/`.
 *
 * Two rules govern everything below, and both are refusals:
 *
 * **No form is promoted.** Every appellation is drawn at the same weight, in
 * the order the corpus lists them. The searched one is marked as the search,
 * which tells the reader where they are without telling them which name is
 * right.
 *
 * **A qualifier is shown, never derived.** Three quarters of the corpus's
 * exonyms are bare forms, and the quarter that are not carry their qualifier
 * inside the string in 677 distinct free-text values. Splitting on the
 * parenthesis would publish those as if they were a vocabulary, so a form with
 * no qualifier renders as a form.
 */

interface NameAnswerProps {
  /** Every entity that answers to the name — several means disambiguation. */
  subjects: SearchResult[];
  query: string;
  language: Language;
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-afh-text text-afh-h3 font-semibold leading-tight">
      {children}
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-afh-text-soft mt-1 text-sm">{children}</p>;
}

/** A silence the atlas declares rather than leaves blank. */
function Silence({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-afh-border rounded-afh-lg border border-dashed p-afh-lg">
      <p className="text-afh-text-soft text-sm font-bold">{title}</p>
      <p className="text-afh-text-soft mt-1 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

/**
 * The whole point, rendered as a list of equals: one row per form, the searched
 * one marked, the self-given one marked, and a qualifier only where the corpus
 * carries one.
 */
function Appellations({
  naming,
  query,
  copy,
}: {
  naming: NamingProjection;
  query: string;
  copy: (typeof nameAnswerCopy)[Language];
}) {
  const normalised = query.trim().toLocaleLowerCase();

  return (
    <section className="mt-afh-3xl">
      <Heading>{copy.appellations}</Heading>
      <Lead>{copy.appellationsLead}</Lead>
      <ul className="mt-afh-lg flex flex-col gap-2">
        {naming.selfGiven ? (
          <li className="border-afh-border bg-afh-surface flex items-baseline justify-between gap-3 rounded-afh-lg border p-afh-md">
            <span className="font-display text-afh-text text-lg font-semibold">
              {naming.selfGiven}
            </span>
            <span className="text-afh-text-soft text-xs">
              {copy.selfGivenMark}
            </span>
          </li>
        ) : null}
        {naming.forms.map((form) => {
          const isSearched = form.form.toLocaleLowerCase() === normalised;
          return (
            <li
              key={form.form}
              className={cn(
                "bg-afh-surface flex items-baseline justify-between gap-3 rounded-afh-lg border p-afh-md",
                isSearched ? "border-afh-accent-ink" : "border-afh-border"
              )}
            >
              <span className="font-display text-afh-text text-lg font-semibold">
                {form.form}
              </span>
              {isSearched ? (
                <span className="text-afh-accent-ink text-xs font-bold">
                  {copy.yourSearch}
                </span>
              ) : form.qualifier ? (
                <span className="text-afh-text-soft text-xs">
                  {form.qualifier}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A prose block the curator wrote, shown when the corpus carries it. */
function Prose({ title, body }: { title: string; body: string }) {
  return (
    <section className="border-afh-border bg-afh-surface mt-afh-2xl rounded-afh-lg border p-afh-lg">
      <Heading>{title}</Heading>
      <p className="text-afh-text mt-2 text-sm leading-relaxed">{body}</p>
    </section>
  );
}

// @req REQ-178
export function NameAnswer({ subjects, query, language }: NameAnswerProps) {
  const copy = nameAnswerCopy[language];

  // Movement I, in its hardest state: the atlas holds no such name. The answer
  // is the confession itself, and the invitation is all that follows it.
  if (subjects.length === 0) {
    return (
      <section data-testid="name-answer-unknown" className="mt-afh-2xl">
        <h2 className="font-display text-afh-text text-afh-h1 font-bold leading-tight">
          {copy.unknownName}
        </h2>
        <p className="text-afh-text mt-3 text-base leading-relaxed">
          {copy.unknownNameBody}
        </p>
        <Invitation
          copy={copy}
          href={`${getStaticPageRoute(language, "contribute")}?q=${encodeURIComponent(query)}`}
        />
      </section>
    );
  }

  // Movement II's first block: several entities answer to the name, so the
  // page shows all of them rather than choosing one.
  if (subjects.length > 1) {
    return (
      <section data-testid="name-answer-disambiguation" className="mt-afh-2xl">
        <Heading>{copy.disambiguation}</Heading>
        <ul className="mt-afh-lg flex flex-col gap-3">
          {subjects.map((subject) => (
            <li key={`${subject.type}-${subject.id}`}>
              {/* The question is only honest if the reader can answer it: once
                  every entity is a subject the result list below is empty, so
                  this link is the only way to one of them. */}
              {/* Held in the paragraph the name always sat in: a bare link
                  inherits the mobile centring rule and would sit centred
                  above a left-aligned autonym — two alignments in one entry. */}
              <p className="font-display text-afh-text text-lg font-semibold">
                <Link
                  href={ficheHrefFor(subject, language)}
                  className={cn(
                    "underline decoration-afh-border underline-offset-4 hover:decoration-afh-accent-ink",
                    CHARTER_FOCUS_RING
                  )}
                >
                  {getLocalizedSearchResultName(subject, language)}
                </Link>
              </p>
              {subject.naming?.selfGiven ? (
                <p className="text-afh-text-soft mt-1 text-sm">
                  {subject.naming.selfGiven}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <Owed copy={copy} language={language} />
      </section>
    );
  }

  const subject = subjects[0];
  const naming = subject.naming;

  return (
    <section data-testid="name-answer" className="mt-afh-2xl">
      <p className="text-afh-accent-ink text-xs font-bold uppercase tracking-[0.16em]">
        {copy.eyebrow}
      </p>
      <h2 className="font-display text-afh-text mt-2 text-afh-hero font-bold leading-none">
        {getLocalizedSearchResultName(subject, language)}
      </h2>

      {/* Movement II — each block drawn only if the corpus fills it. */}
      {naming && naming.forms.length > 0 ? (
        <Appellations naming={naming} query={query} copy={copy} />
      ) : null}
      {naming?.origin ? (
        <Prose title={copy.origins} body={naming.origin} />
      ) : null}
      {naming?.problem ? (
        <Prose title={copy.problem} body={naming.problem} />
      ) : null}
      {naming?.usageToday ? (
        <Prose title={copy.usageToday} body={naming.usageToday} />
      ) : null}
      {naming && naming.eras.length > 0 ? (
        <section className="border-afh-border bg-afh-surface mt-afh-2xl rounded-afh-lg border p-afh-lg">
          <Heading>{copy.throughTime}</Heading>
          <dl className="mt-2 flex flex-col gap-2">
            {naming.eras.map((era) => (
              <div key={era.era}>
                <dd className="text-afh-text text-sm leading-relaxed">
                  {era.text}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <Owed
        copy={copy}
        language={language}
        datedEras={naming ? naming.eras.length > 0 : false}
      />
    </section>
  );
}

/**
 * Movement III, and the reason it is a component of its own: the atlas owes
 * these three whatever the corpus holds, so every branch above ends here.
 */
function Owed({
  copy,
  language,
  datedEras = false,
}: {
  copy: (typeof nameAnswerCopy)[Language];
  language: Language;
  datedEras?: boolean;
}) {
  return (
    <>
      <section className="mt-afh-3xl">
        <Heading>{copy.silences}</Heading>
        <Lead>{copy.silencesLead}</Lead>
        <div className="mt-afh-lg flex flex-col gap-3">
          {datedEras ? null : (
            <Silence
              title={copy.noDatedAttestation}
              body={copy.noDatedAttestationBody}
            />
          )}
        </div>
      </section>

      <section className="bg-afh-bg-warm mt-afh-2xl rounded-afh-lg p-afh-lg">
        <p className="text-afh-text text-sm font-bold">{copy.conviction}</p>
        <p className="text-afh-text mt-2 text-sm leading-relaxed">
          {copy.convictionBody}
        </p>
      </section>

      <Invitation copy={copy} href={getStaticPageRoute(language, "contact")} />
    </>
  );
}

function Invitation({
  copy,
  href,
}: {
  copy: (typeof nameAnswerCopy)[Language];
  href: string;
}) {
  return (
    <section className="border-afh-accent-ink bg-afh-surface mt-afh-2xl rounded-afh-lg border p-afh-lg">
      <p className="text-afh-text text-sm font-bold">{copy.invitation}</p>
      <p className="text-afh-text mt-2 text-sm leading-relaxed">
        {copy.invitationBody}
      </p>
      <Link
        href={href}
        className={cn(
          "bg-afh-accent-tint border-afh-accent-ink text-afh-text mt-3 inline-flex min-h-[44px] items-center rounded-afh-md border px-4 text-sm font-bold",
          CHARTER_FOCUS_RING
        )}
      >
        {copy.invitationAction}
      </Link>
    </section>
  );
}
