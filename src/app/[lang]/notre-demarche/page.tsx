import type { Metadata } from "next";

import { PageLayout } from "@/components/layout/PageLayout";
import ApproachPageContent from "@/components/pages/ApproachPageContent";
import { getLocalizedRoute } from "@/lib/routing";
import { pageHead } from "@/lib/seo/pageHead";
import { getTranslation } from "@/lib/translations";
import type { Language } from "@/types/shared";

interface ApproachPageProps {
  params: Promise<{ lang: string }>;
}

// @req REQ-141
export async function generateMetadata({
  params,
}: ApproachPageProps): Promise<Metadata> {
  const { lang } = await params;
  const title = getTranslation(lang as Language).approach.title;
  return {
    title,
    ...pageHead(getLocalizedRoute("fr", "approach"), { title }),
  };
}

// @req REQ-132
export default async function ApproachPage({ params }: ApproachPageProps) {
  const { lang } = await params;

  return (
    <PageLayout language={lang as Language} hideHeader>
      <ApproachPageContent language={lang as Language} />
    </PageLayout>
  );
}
