import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  listAccountContributions,
  type AccountContribution,
} from "@/api/v2/services/account";
import { PageLayout } from "@/components/layout/PageLayout";
import { getReaderSession } from "@/lib/account/readerAuth";
import { parseBlockKey } from "@/lib/comments/blockKey";
import { accountCopy } from "@/lib/i18n/copy/account";
import { formatDate } from "@/lib/languageTag";
import { getStaticPageRoute } from "@/lib/routing";
import { noIndexMetadata } from "@/lib/seo/noIndexMetadata";
import type { Language } from "@/types/shared";

import { AccountDeletion } from "./AccountDeletion";
import {
  ACCOUNT_BUTTON,
  ACCOUNT_CORRECTION,
  ACCOUNT_PILL,
  ACCOUNT_TEXT_BUTTON,
} from "./accountClasses";
import { resendReaderLink, signOutReader } from "./actions";

type Copy = (typeof accountCopy)["fr"];

// @req REQ-213
export async function generateMetadata({
  params,
}: {
  params?: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = (await params) ?? { lang: "fr" };
  return noIndexMetadata(accountCopy[lang as Language].metadataTitle);
}

/** The block a contribution sits on, as the reader would name it. */
function whereLabel(item: AccountContribution, copy: Copy): string {
  const address = item.block_key ? parseBlockKey(item.block_key) : null;
  if (!address) {
    const subject =
      copy.subject[item.entity_type as keyof Copy["subject"]] ?? null;
    return subject ? `${subject} · ${copy.reportLabel}` : copy.reportLabel;
  }
  const subject =
    address.subject === "search-query"
      ? copy.searchedName(address.id)
      : copy.subject[address.subject];
  return `${subject} · ${copy.section[address.section]}`;
}

function stateLabel(item: AccountContribution, copy: Copy): string {
  if (item.publication !== "published") return copy.state[item.publication];
  switch (item.status) {
    case "accepted":
    case "rejected":
    case "duplicate":
    case "withdrawn":
      return copy.state[item.status];
    default:
      return copy.state.published;
  }
}

function ContributionItem({
  item,
  copy,
  language,
  reportsRoute,
}: {
  item: AccountContribution;
  copy: Copy;
  language: Language;
  reportsRoute: string;
}) {
  const date = (iso: string) => formatDate(language, new Date(iso));

  return (
    <article className="afh-tile flex flex-col gap-afh-sm">
      <p className="font-[family-name:var(--afh-font-mono)] text-afh-eyebrow font-semibold uppercase tracking-[0.06em] text-[color:var(--accent-ink)]">
        {whereLabel(item, copy)}
      </p>
      {item.body && <p className="line-clamp-2 leading-relaxed">{item.body}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`${ACCOUNT_PILL} ${item.publication === "pending" ? "border-dashed text-afh-text-soft" : ""}`}
        >
          {stateLabel(item, copy)}
        </span>
        {item.corrected_at && (
          <span className={ACCOUNT_CORRECTION}>
            {copy.integrated(date(item.corrected_at))}
          </span>
        )}
      </div>

      {item.publication === "pending" && (
        <>
          <p className="text-afh-caption leading-normal text-afh-text-soft">
            {copy.pendingHelp}
          </p>
          <form action={resendReaderLink}>
            <button type="submit" className={ACCOUNT_BUTTON}>
              {copy.resendLink}
            </button>
          </form>
        </>
      )}

      {item.publication === "hidden" && (
        <p className="text-afh-caption leading-normal text-afh-text-soft">
          {copy.hiddenHelp}
        </p>
      )}

      {item.moderator_notes && (
        <p className="border-l-2 border-[color:var(--accent)] pl-3 text-afh-small leading-normal">
          {item.moderator_notes}{" "}
          <span className="text-afh-caption text-afh-text-soft">
            {item.resolved_at
              ? copy.moderationSignature(date(item.resolved_at))
              : copy.moderationName}
          </span>
        </p>
      )}

      {item.publication === "published" && (
        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <span className="text-afh-small text-afh-text-soft">
            {copy.replies(item.replies.total, item.replies.fromModeration)}
          </span>
          <Link
            href={`${reportsRoute}/${item.public_slug}`}
            className={ACCOUNT_TEXT_BUTTON}
          >
            {copy.viewDiscussion}
          </Link>
        </div>
      )}
    </article>
  );
}

interface AccountPageProps {
  params?: Promise<{ lang: string }>;
  searchParams?: Promise<{ lien?: string }>;
}

/**
 * The reader account (REQ-213), laid out on the approved board
 * `docs/design/mockups/site/account-430`.
 *
 * « Voir la discussion » opens the comment's page in the public register,
 * which shows it with its status and the moderation's decision; the block it
 * sits on shows it once the comments reach the reading pages.
 */
// @req REQ-213
export default async function AccountPage({
  params,
  searchParams,
}: AccountPageProps) {
  const { lang } = (await params) ?? { lang: "fr" };
  const language = lang as Language;
  const copy = accountCopy[language];
  const query = (await searchParams) ?? {};

  const reader = await getReaderSession();
  if (!reader) redirect(`${getStaticPageRoute(language, "account")}/connexion`);

  const contributions = await listAccountContributions(reader);
  const reportsRoute = getStaticPageRoute(language, "reports");

  return (
    <PageLayout language={language} title={copy.title}>
      <div className="afh-accent-ocre mx-auto flex w-full max-w-[720px] flex-col gap-afh-lg pb-afh-2xl pt-afh-lg">
        <p className="leading-relaxed text-afh-text-soft">
          {copy.lead(reader.email)}
        </p>

        {query.lien === "envoye" && (
          <p
            role="status"
            className="rounded-afh-lg border border-afh-border bg-afh-bg-warm p-3 text-afh-small"
          >
            {copy.linkSent}
          </p>
        )}

        <h2 className="font-afh-display text-afh-h3 font-black leading-tight">
          {copy.contributionsTitle}
        </h2>

        {contributions.length === 0 ? (
          <p className="text-afh-text-soft">{copy.empty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {contributions.map((item) => (
              <ContributionItem
                key={item.id}
                item={item}
                copy={copy}
                language={language}
                reportsRoute={reportsRoute}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5 border-t border-afh-border pt-afh-base">
          <form action={signOutReader}>
            <button type="submit" className={ACCOUNT_BUTTON}>
              {copy.signOut}
            </button>
          </form>
          <p className="text-afh-small leading-normal text-afh-text-soft">
            {copy.deletion.explanation}
          </p>
          <AccountDeletion language={language} />
        </div>
      </div>
    </PageLayout>
  );
}
