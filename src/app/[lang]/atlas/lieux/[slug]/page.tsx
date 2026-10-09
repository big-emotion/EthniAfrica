import type { Metadata } from "next";

import { FicheJsonLd } from "@/components/fiche/FicheJsonLd";
import { PageLayout } from "@/components/layout/PageLayout";
import { PlaceRecordView } from "@/components/place/PlaceRecordView";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import { loadPlaceFiche } from "@/lib/fiche/ficheExistence";
import { placeSubtitle } from "@/lib/i18n/copy/place";
import { getPlaceRoute } from "@/lib/routing";
import { ficheHead } from "@/lib/seo/ficheHead";
import { buildFicheJsonLd } from "@/lib/seo/ficheJsonLd";
import type { Language } from "@/types/shared";

// A literal on purpose: Next reads segment config statically. Held to
// `CORPUS_AGGREGATE_REVALIDATE_SECONDS` by
// `src/app/__tests__/cacheFreshnessContract.test.ts`.
// @req REQ-196
export const revalidate = 3600;

interface PageParams {
  lang: string;
  slug: string;
}

// An unknown place never reaches here: the sibling `layout.tsx` answers it
// with a 404 before the loading boundary streams.
// @req REQ-196
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  return ficheHead("place", lang as Language, slug);
}

// @req REQ-196
export default async function PlacePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { lang, slug } = await params;
  const language = lang as Language;

  const place = await loadPlaceFiche(decodeURIComponent(slug));
  if (!place) return null;

  return (
    <PageLayout
      language={language}
      title={place.nameMain}
      subtitle={placeSubtitle(language, place.placeType, place.country.name)}
      trailLabel={place.nameMain}
    >
      <FicheJsonLd
        graph={buildFicheJsonLd(
          "place",
          language,
          { name: place.nameMain, summary: place.summary },
          `https://${CANONICAL_DOMAIN}${getPlaceRoute(language, place.id)}`
        )}
      />
      <PlaceRecordView place={place} language={language} />
    </PageLayout>
  );
}
