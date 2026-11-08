import type { Metadata } from "next";
import Link from "next/link";

import { CopyAddress } from "@/components/assistant/CopyAddress";
import { PageLayout } from "@/components/layout/PageLayout";
import { getMcpAddress } from "@/lib/assistant/mcpAddress";
import { assistantInstallCopy } from "@/lib/i18n/copy/assistantInstall";
import { getStaticPageRoute } from "@/lib/routing";
import { pageHead } from "@/lib/seo/pageHead";
import type { Language } from "@/types/shared";

interface AssistantPageProps {
  params: Promise<{ lang: string }>;
}

const SECTION = "flex flex-col gap-3.5";
const SECTION_TITLE = "m-0 font-display text-2xl font-bold leading-tight";
const CARD =
  "flex flex-col gap-2.5 rounded-[14px] border border-afh-border bg-afh-surface p-[18px]";

// @req REQ-141
export async function generateMetadata({
  params,
}: AssistantPageProps): Promise<Metadata> {
  const { lang } = await params;
  const title = assistantInstallCopy.fr.title;
  return {
    title,
    ...pageHead(getStaticPageRoute(lang as Language, "assistant"), { title }),
  };
}

// @req REQ-045
export default async function AssistantPage({ params }: AssistantPageProps) {
  const { lang } = await params;
  const language = lang as Language;
  const t = assistantInstallCopy.fr;

  return (
    <PageLayout language={language} hideHeader>
      <div className="flex flex-col gap-10 pb-16 pt-8 text-left text-afh-text xl:gap-14 xl:pb-24 xl:pt-14">
        <header className="flex max-w-[40rem] flex-col gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-afh-text-soft">
            {t.eyebrow}
          </span>
          <h1 className="m-0 font-display text-[clamp(32px,7vw,52px)] font-black leading-[1.05] [text-wrap:balance]">
            {t.title}
          </h1>
          <p className="m-0 text-lg leading-[1.55]">{t.lead}</p>
        </header>

        <section className={SECTION} aria-labelledby="assistant-install">
          <h2 id="assistant-install" className={SECTION_TITLE}>
            {t.install.title}
          </h2>
          <div className="md:max-w-[40rem]">
            <CopyAddress address={getMcpAddress()} labels={t.install} />
          </div>
          <p className="m-0 text-sm text-afh-text-soft">{t.install.soon}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[t.clients.claude, t.clients.chatgpt].map((client) => (
              <div key={client.title} className={CARD}>
                <h3 className="m-0 font-display text-xl">{client.title}</h3>
                <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5">
                  {client.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="m-0 text-sm text-afh-text-soft">{client.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={SECTION} aria-labelledby="assistant-try">
          <h2 id="assistant-try" className={SECTION_TITLE}>
            {t.tries.title}
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {t.tries.questions.map((question) => (
              <li
                key={question}
                className="inline-flex min-h-11 items-center rounded-full border border-afh-border bg-afh-surface px-3.5 font-bold"
              >
                {question}
              </li>
            ))}
          </ul>
        </section>

        <section className={SECTION} aria-labelledby="assistant-obtained">
          <h2 id="assistant-obtained" className={SECTION_TITLE}>
            {t.obtained.title}
          </h2>
          <ul className="m-0 flex max-w-[40rem] list-disc flex-col gap-2 pl-5">
            {t.obtained.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={SECTION} aria-labelledby="assistant-privacy">
          <h2 id="assistant-privacy" className={SECTION_TITLE}>
            {t.privacy.title}
          </h2>
          <div className="flex max-w-[40rem] flex-col gap-2 rounded-[14px] bg-afh-bg-warm p-[18px]">
            <p className="m-0">{t.privacy.statement}</p>
            <Link
              href={getStaticPageRoute(language, "dataPolicy")}
              className="underline underline-offset-4"
            >
              {t.privacy.link}
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
