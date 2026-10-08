import type { Metadata } from "next";
import { PageLayout } from "@/components/layout/PageLayout";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeContribute } from "@/components/home/HomeContribute";
import { HomeProject } from "@/components/home/HomeProject";
import { loadSeedWords } from "@/lib/home/loadSeedWords";
import { OG_TITLE, OG_DESCRIPTION } from "@/lib/brand";
import { pageHead } from "@/lib/seo/pageHead";
import type { Language } from "@/types/shared";

// Each visit draws new search examples, never a build-time selection.
// @req REQ-115
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

// @req REQ-044 FR95
// @req REQ-140
// @req REQ-141
export async function generateMetadata({
  params,
}: Pick<HomePageProps, "params">): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    ...pageHead(`/${lang}`),
  };
}

// @req REQ-113
// @req REQ-115
export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  const language = lang as Language;
  const seedWords = await loadSeedWords(language);
  return (
    <PageLayout language={language} hideHeader flushTop flushBottom>
      <HomeHero language={language} seedWords={seedWords} />
      <HomeProject language={language} />
      <HomeContribute language={language} />
    </PageLayout>
  );
}
