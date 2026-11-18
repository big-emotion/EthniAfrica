import type { Metadata } from "next";
import Link from "next/link";

import { findPendingComment } from "@/api/v2/services/comments";
import { PageLayout } from "@/components/layout/PageLayout";
import { accountCopy } from "@/lib/i18n/copy/account";
import { getStaticPageRoute } from "@/lib/routing";
import { noIndexMetadata } from "@/lib/seo/noIndexMetadata";
import type { Language } from "@/types/shared";

import { contributionPlace } from "../contributionPlace";
import { confirmReaderLink } from "./actions";

// @req REQ-213
export async function generateMetadata({
  params,
}: {
  params?: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = (await params) ?? { lang: "fr" };
  return noIndexMetadata(
    accountCopy[lang as Language].confirmation.metadataTitle
  );
}

interface ConfirmPageProps {
  params?: Promise<{ lang: string }>;
  searchParams?: Promise<{
    token_hash?: string;
    type?: string;
    commentaire?: string;
  }>;
}

/**
 * Where the reader's mail leads (REQ-213, DEC-085).
 *
 * Loading this page changes nothing. It holds the token in a form and waits
 * for the reader to press the one button; the server action redeems the
 * token, publishes the one comment the link names, and opens the account.
 * The comment is shown first, so the reader sees exactly what they publish.
 * A link that names no comment, or one already published, only opens the
 * account.
 */
// @req REQ-213
export default async function ConfirmReaderLinkPage({
  params,
  searchParams,
}: ConfirmPageProps) {
  const { lang } = (await params) ?? { lang: "fr" };
  const language = lang as Language;
  const query = (await searchParams) ?? {};
  const account = accountCopy[language];
  const copy = account.confirmation;
  const signInRoute = `${getStaticPageRoute(language, "account")}/connexion`;

  if (!query.token_hash || !query.type) {
    return (
      <PageLayout language={language} title={copy.title}>
        <div className="mx-auto w-full max-w-2xl space-y-afh-xl py-afh-2xl">
          <p className="text-afh-body text-afh-text">{copy.incomplete}</p>
          <Link
            href={signInRoute}
            className="inline-flex min-h-11 items-center font-semibold text-[color:var(--accent-ink)] underline underline-offset-4"
          >
            {copy.askAgain}
          </Link>
        </div>
      </PageLayout>
    );
  }

  const comment = query.commentaire
    ? await findPendingComment(query.commentaire)
    : null;
  const title = comment ? copy.title : copy.signInTitle;

  return (
    <PageLayout language={language} title={title}>
      <div className="afh-accent-ocre mx-auto w-full max-w-2xl space-y-afh-lg py-afh-2xl">
        <p className="text-afh-body text-afh-text">
          {comment ? copy.lead : copy.signInLead}
        </p>
        {comment && (
          <figure className="afh-tile flex flex-col gap-afh-sm">
            <figcaption className="font-[family-name:var(--afh-font-mono)] text-afh-eyebrow font-semibold uppercase tracking-[0.06em] text-[color:var(--accent-ink)]">
              {contributionPlace(comment.block_key, null, account)}
            </figcaption>
            <blockquote className="leading-relaxed">{comment.body}</blockquote>
          </figure>
        )}
        {comment && (
          <p className="text-afh-small text-afh-text-soft">{copy.why}</p>
        )}
        <form action={confirmReaderLink}>
          <input type="hidden" name="token_hash" value={query.token_hash} />
          <input type="hidden" name="type" value={query.type} />
          {comment && (
            <input
              type="hidden"
              name="commentaire"
              value={comment.public_slug}
            />
          )}
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-afh-lg border border-[color:var(--accent)] bg-[color:var(--accent)] px-afh-lg font-bold text-[color:var(--accent-foreground)] focus-visible:shadow-afh-focus focus-visible:outline-none md:w-auto"
          >
            {comment ? copy.submit : copy.signInSubmit}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
