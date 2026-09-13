import type { Metadata } from "next";
import Link from "next/link";

import { PageLayout } from "@/components/layout/PageLayout";
import { ProverbCard } from "@/components/proverbs/ProverbCard";
import type { DidYouKnowEntityKind } from "@/lib/home/didYouKnowFacts";
import { DID_YOU_KNOW_ENTITY_ACCENT } from "@/lib/home/didYouKnowPresentation";
import { proverbsCopy } from "@/lib/i18n/copy/proverbs";
import {
  PROVERBS,
  proverbEntities,
  proverbEntityKey,
  proverbsConcerning,
} from "@/lib/proverbs/proverbs";
import { localizeProverb } from "@/lib/proverbs/proverbs.en";
import { getLocalizedRoute } from "@/lib/routing";
import { surfaceHead } from "@/lib/seo/localeAlternates";
import type { Language } from "@/types/shared";

interface ProverbsPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ entite?: string }>;
}

const FILTER_KINDS: DidYouKnowEntityKind[] = ["country", "people", "family"];

// @req REQ-113
// @req REQ-141
export async function generateMetadata({
  params,
}: Pick<ProverbsPageProps, "params">): Promise<Metadata> {
  const { lang } = await params;
  const language = lang as Language;
  const copy = {
    title: proverbsCopy[language].pageTitle,
    description: proverbsCopy[language].pageSubtitle,
  };
  return {
    ...copy,
    ...surfaceHead(
      language,
      "proverbs",
      (locale) => getLocalizedRoute(locale, "proverbs"),
      copy
    ),
  };
}

/**
 * The proverb bank, read whole and filterable by the atlas entries it names.
 *
 * A list rather than the anecdotes' one-card reader: a proverb is read in a
 * few seconds, and the question a reader brings here is « what do the Yoruba
 * say? » — which a filter answers and a shuffled deck does not.
 *
 * The filter is a set of links, not a form: every state of the page has an
 * address, so a fiche can one day link to « the proverbs of this people »
 * and a shared URL lands on the list it promised. It stays folded under its
 * label even once a choice is in the address: unfolded, sixty entries push
 * the first proverb under the fold on a phone, so the choice is named above
 * the list with the way back beside it.
 *
 * Every chip, status and source is printed from the bank, whose tests hold
 * the rule the page depends on: no chip exists that a source does not support.
 */
// @req REQ-113
export default async function ProverbsPage({
  params,
  searchParams,
}: ProverbsPageProps) {
  const { lang } = await params;
  const language = lang as Language;
  const chosen = (await searchParams).entite ?? null;
  const copy = proverbsCopy[language];

  const bank = PROVERBS.map((proverb) => localizeProverb(proverb, language));
  const listed = proverbsConcerning(chosen, bank);
  const entities = proverbEntities(bank);
  const chosenEntity =
    entities.find((entity) => proverbEntityKey(entity) === chosen) ?? null;
  const route = getLocalizedRoute(language, "proverbs");

  return (
    <PageLayout
      language={language}
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
    >
      <div className="proverbs-page" data-testid="proverbs-page">
        <p className="proverbs-kicker">{copy.pageKicker}</p>

        {chosenEntity ? (
          <p className="proverbs-scope" data-testid="proverbs-scope">
            {copy.filterLabel} <strong>{chosenEntity.label}</strong>
            {" · "}
            <Link href={route}>{copy.filterAll}</Link>
          </p>
        ) : null}

        <details className="proverbs-filter">
          <summary>{copy.filterLabel}</summary>
          <p className="proverbs-filter-all">
            <Link href={route} aria-current={chosen ? undefined : "page"}>
              {copy.filterAll}
            </Link>
          </p>
          {FILTER_KINDS.map((kind) => {
            const group = entities.filter((entity) => entity.kind === kind);
            if (!group.length) return null;
            return (
              <div key={kind} className="proverbs-filter-group">
                <p className="proverbs-filter-kind">{copy.filterKinds[kind]}</p>
                <ul>
                  {group.map((entity) => {
                    const key = proverbEntityKey(entity);
                    return (
                      <li key={key}>
                        <Link
                          className={`proverbs-filter-link ${DID_YOU_KNOW_ENTITY_ACCENT[kind]}`}
                          href={`${route}?entite=${encodeURIComponent(key)}`}
                          aria-current={key === chosen ? "page" : undefined}
                        >
                          {entity.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </details>

        {listed.length ? (
          <div className="proverbs-list">
            {listed.map((proverb) => (
              <ProverbCard
                key={proverb.id}
                language={language}
                proverb={proverb}
              />
            ))}
          </div>
        ) : (
          <p className="proverbs-empty">{copy.empty}</p>
        )}
      </div>

      <style>{`
        .proverbs-page {
          max-width: 68ch;
          margin: 0 auto;
          padding-block: 24px 64px;
        }
        .proverbs-kicker {
          margin: 0 0 24px;
          text-align: center;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: var(--afh-text-eyebrow);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--afh-fg-muted);
        }
        .proverbs-scope {
          margin: 0 0 12px;
          text-align: left;
          font-size: var(--afh-text-body);
          color: var(--afh-text-soft);
        }
        .proverbs-scope strong {
          color: var(--afh-text);
        }
        .proverbs-scope a {
          color: var(--afh-text);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .proverbs-filter {
          margin: 0 0 24px;
          padding: 12px 16px;
          text-align: left;
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg, 14px);
          background: var(--afh-bg-warm);
        }
        .proverbs-filter summary {
          min-height: 32px;
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 600;
          color: var(--afh-text);
        }
        .proverbs-filter p {
          margin: 12px 0 8px;
        }
        .proverbs-filter-kind {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: var(--afh-text-eyebrow);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--afh-fg-muted);
        }
        .proverbs-filter ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .proverbs-filter-all a,
        .proverbs-filter-link {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 4px 12px;
          border: 1px solid var(--accent, var(--afh-border));
          border-radius: var(--afh-radius-full);
          background: var(--afh-color-card);
          color: var(--accent-ink, var(--afh-text));
          font-size: var(--afh-text-caption);
          font-weight: 600;
          text-decoration: none;
        }
        .proverbs-filter-all a[aria-current="page"],
        .proverbs-filter-link[aria-current="page"] {
          background: var(--accent-tint, var(--afh-bg-warm));
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .proverbs-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .proverbs-empty {
          text-align: center;
          color: var(--afh-fg-muted);
        }
        @media (min-width: 768px) {
          .proverbs-list {
            gap: 24px;
          }
        }
      `}</style>
    </PageLayout>
  );
}
