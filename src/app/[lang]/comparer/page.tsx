import type { Metadata } from "next";

import { PageLayout } from "@/components/layout/PageLayout";
import { getLocalizedRoute } from "@/lib/routing";
import { surfaceHead } from "@/lib/seo/localeAlternates";
import type { Language } from "@/types/shared";
import ComparerPickerPageClient from "@/app/[lang]/comparer/ComparerPickerPageClient";
import { compareCopy } from "@/lib/i18n/copy/compare";

/**
 * The route owns the static shell and its head. Only the picker remains a
 * client component because its search and selection state are interactive.
 */

interface ComparerPickerPageProps {
  params: Promise<{ lang: string }>;
}

// @req REQ-141
export async function generateMetadata({
  params,
}: ComparerPickerPageProps): Promise<Metadata> {
  const { lang } = await params;
  const language = lang as Language;
  const title = compareCopy[language].title;
  return {
    title,
    ...surfaceHead(
      language,
      "compare",
      (locale) => getLocalizedRoute(locale, "compare"),
      { title }
    ),
  };
}

// @req REQ-091
export default async function ComparerPickerPage({
  params,
}: ComparerPickerPageProps) {
  const { lang } = await params;
  const language = lang as Language;
  const copy = compareCopy[language];

  return (
    <PageLayout language={language} sectionName={copy.title} hideHeader>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-afh-h1 font-display font-semibold text-afh-text">
          {copy.title}
        </h1>
        {/* The two-entry minimum is otherwise discoverable only by finding
            the compare button disabled, which reads as a broken control. */}
        <p className="mt-2 max-w-[58ch] text-afh-fg-muted">
          {copy.pickerIntroduction}
        </p>
        <ComparerPickerPageClient language={language} />
      </div>
    </PageLayout>
  );
}
