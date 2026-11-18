import type { Metadata } from "next";

import { FormFieldError } from "@/components/forms/FormFieldError";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountCopy } from "@/lib/i18n/copy/account";
import { noIndexMetadata } from "@/lib/seo/noIndexMetadata";
import type { Language } from "@/types/shared";

import { requestReaderSignInLink } from "./actions";

// @req REQ-213
export async function generateMetadata({
  params,
}: {
  params?: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = (await params) ?? { lang: "fr" };
  return noIndexMetadata(accountCopy[lang as Language].signIn.metadataTitle);
}

interface SignInPageProps {
  params?: Promise<{ lang: string }>;
  searchParams?: Promise<{ etat?: string; error?: string }>;
}

/**
 * Sign back in to a reader account (REQ-213).
 *
 * The state arrives in the query because the form posts to a server action
 * that redirects here; only known states are shown, in the page's own words.
 */
// @req REQ-213
export default async function ReaderSignInPage({
  params,
  searchParams,
}: SignInPageProps) {
  const { lang } = (await params) ?? { lang: "fr" };
  const language = lang as Language;
  const query = (await searchParams) ?? {};
  const copy = accountCopy[language].signIn;

  if (query.etat === "envoye") {
    return (
      <PageLayout language={language} title={copy.title}>
        <div className="mx-auto w-full max-w-md py-afh-2xl">
          <p role="status" className="text-afh-body text-afh-text">
            {copy.neutralAnswer}
          </p>
        </div>
      </PageLayout>
    );
  }

  // The callback's `error` carries a sentence of its own; a link that failed
  // there is told the same thing as one that failed on the confirmation page.
  const notice =
    {
      "lien-expire": copy.expiredLink,
      supprime: copy.deleted,
      deconnecte: copy.signedOut,
    }[query.etat] ?? (query.error ? copy.expiredLink : null);
  const invalid = query.etat === "adresse-invalide";

  return (
    <PageLayout language={language} title={copy.title}>
      <div className="mx-auto w-full max-w-md space-y-afh-xl py-afh-2xl">
        {notice && (
          <p className="rounded-afh-lg border border-afh-border bg-afh-bg-warm p-afh-md text-afh-small text-afh-text">
            {notice}
          </p>
        )}
        <p className="text-afh-small text-afh-text-soft">{copy.introduction}</p>

        <form action={requestReaderSignInLink} className="space-y-afh-lg">
          <div className="space-y-afh-sm">
            <Label htmlFor="email">{copy.emailLabel}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={invalid ? "true" : undefined}
            />
          </div>
          {invalid && <FormFieldError>{copy.invalidEmail}</FormFieldError>}
          <Button type="submit" className="w-full md:w-auto">
            {copy.submit}
          </Button>
        </form>

        <p className="text-afh-caption text-afh-text-soft">
          {copy.noAccountYet}
        </p>
      </div>
    </PageLayout>
  );
}
