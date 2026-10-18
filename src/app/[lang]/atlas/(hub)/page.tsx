import type { Metadata } from "next";
import { getCountryIndex } from "@/api/v2/services/countryService";
import { getAtlasHubCounts } from "@/api/v2/services/atlasHub";
import { AtlasNamesHub } from "@/components/atlas/AtlasNamesHub";
import { getNameAddressSpellings } from "@/api/v2/services/nameAddresses";
import { PageLayout } from "@/components/layout/PageLayout";
import { getAxisHubRoute } from "@/lib/hubs/axisRoutes";
import { pageHead } from "@/lib/seo/pageHead";
import { getAtlasWeeklyNames } from "@/lib/search/atlasWeeklyNames";
import { atlasNamesHubCopy } from "@/lib/i18n/copy/atlasNamesHub";
import type { Language } from "@/types/shared";

export interface AxisHubParams {
  params: Promise<{ lang: string }>;
}

// @req REQ-114 @req REQ-140
export async function generateMetadata({
  params,
}: AxisHubParams): Promise<Metadata> {
  const { lang } = await params;
  const { title, description } = atlasNamesHubCopy[lang as Language];
  return {
    title,
    description,
    ...pageHead(getAxisHubRoute("fr", "atlas"), { title, description }),
  };
}

// @req REQ-114
export default async function AtlasHubRoute({ params }: AxisHubParams) {
  const { lang } = await params;
  const language = lang as Language;
  const [countries, counts, spellings] = await Promise.all([
    getCountryIndex().catch(() => []),
    getAtlasHubCounts(),
    getNameAddressSpellings().catch(() => []),
  ]);
  const weeklyNames = await getAtlasWeeklyNames(spellings);
  return (
    <PageLayout language={language} flushTop flushBottom>
      <AtlasNamesHub
        language={language}
        countries={countries}
        counts={counts}
        weeklyNames={weeklyNames}
        addressSpellings={spellings}
      />
    </PageLayout>
  );
}
