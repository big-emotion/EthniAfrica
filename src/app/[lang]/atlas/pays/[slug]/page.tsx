import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import {
  isFicheKnownAbsent,
  loadCountryFiche,
} from "@/lib/fiche/ficheExistence";
import { parseVersionedSlug } from "@/lib/versioned-slug";
import { ficheHead } from "@/lib/seo/ficheHead";
import { getCountryRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";
import {
  getLatestEntityRevisionVersion,
  getRevisionSnapshot,
} from "@/api/v2/services/revisions";
import { PageLayout } from "@/components/layout/PageLayout";
import { FicheJsonLd } from "@/components/fiche/FicheJsonLd";
import { FicheOnward } from "@/components/fiche/FicheOnward";
import { buildOnwardLinks } from "@/lib/fiche/onwardLinks";
import { countryOnwardGroups } from "@/lib/fiche/onwardGroups";
import { getAfrikLanguageFamilyRoster } from "@/lib/supabase/queries/afrik/languageFamilies";
import { getCountryLanguagesFact } from "@/lib/supabase/queries/afrik/countryLanguages";
import { getCountryFamilyCount } from "@/lib/supabase/queries/afrik/countryFamilyCount";
import { ficheJsonLdFor } from "@/lib/seo/ficheJsonLd";
import { FicheSequence } from "@/components/fiche/FicheSequence";
import { FicheSnapshotView } from "@/components/fiche/FicheSnapshotView";
import { FicheHeroHead } from "@/components/fiche/FicheHeroHead";
import { FicheHeroBand } from "@/components/fiche/FicheHeroBand";
import { CountryFicheTitle } from "@/components/country/CountryFicheTitle";
import { CountryRecordView } from "@/components/country/CountryRecordView";
import { readProvenanceCensus } from "@/lib/fiche/provenanceCensus";
import {
  compactCountryAtlasLanguages,
  deriveCountrySynthesisFromDetail,
} from "@/lib/home/countrySynthesis";
import { buildCountryAtlasFacts } from "@/components/country/countryTargetFacts";
import {
  buildCountryOutlineOverlay,
  getAdmin0Name,
} from "@/lib/atlas/overlays";
import { buildCountryPickerTargets } from "@/lib/atlas/targets";
import { getContinentPeopleCounts } from "@/api/v2/services/continentPeopleCounts";
import { getCountryAtlasIndex } from "@/api/v2/services/countryService";
import { getCountryPatronymes } from "@/api/v2/services/patronymeFicheLinks";
import { mapCountryDetail } from "@/lib/afrikDetailMapper";
import { getActiveSourceFlags } from "@/lib/supabase/queries/afrik/flags";
import { countryCopy } from "@/lib/i18n/copy/country";
import { FicheAtlasGlobeIsland } from "@/components/atlas/FicheAtlasGlobeIsland";

// @req REQ-019
export const revalidate = 3600;

interface PageParams {
  lang: string;
  slug: string;
}

// @req REQ-091
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { lang, slug } = await params;

  // The existence check lives here, not in the page body, because `loading.tsx`
  // makes this segment a Suspense boundary: the shell — and a `200` — is
  // flushed before the body runs, so the page's own `notFound()` arrives too
  // late to change the status. `generateMetadata` runs before the flush.
  // `loadCountryFiche` is request-cached, so the page's own load below reuses
  // this one rather than querying twice.
  const parsed = parseVersionedSlug(decodeURIComponent(slug));
  // Only the `live` mode is settled here. `latest` redirects and `pinned` reads
  // a revision snapshot, and both already resolve before the body streams
  // anything of their own.
  if (
    parsed?.mode === "live" &&
    (await isFicheKnownAbsent(loadCountryFiche, parsed.slug))
  ) {
    notFound();
  }

  return ficheHead("country", lang as Language, slug);
}

interface PageSearchParams {
  fromPeopleName?: string;
  fromPeopleId?: string;
}

async function CountryLiveContent({
  countryDetail,
  language,
  navigationContext,
}: {
  countryDetail: ReturnType<typeof mapCountryDetail>;
  language: Language;
  navigationContext: PageSearchParams;
}) {
  const [
    sourceFlags,
    countryAtlasIndex,
    peopleCounts,
    patronymes,
    familyRoster,
    countryLanguages,
    familyCount,
    provenance,
  ] = await Promise.all([
    getActiveSourceFlags("country", countryDetail.id),
    getCountryAtlasIndex(),
    getContinentPeopleCounts().catch(() => ({}) as Record<string, number>),
    getCountryPatronymes(countryDetail.id).catch(() => null),
    getAfrikLanguageFamilyRoster().catch(() => []),
    getCountryLanguagesFact(
      countryDetail.id,
      countryDetail.culture?.mainLanguages
    ).catch(() => null),
    getCountryFamilyCount(countryDetail.id).catch(() => null),
    readProvenanceCensus("country", countryDetail.id),
  ]);

  const familyNamesById = new Map<string, string>(
    familyRoster.map((family) => [family.id, family.nameFr] as const)
  );
  const pickerTargets = buildCountryPickerTargets(
    countryAtlasIndex.map((entry) => entry.id)
  );
  const countryBriefs = Object.fromEntries(
    countryAtlasIndex.map(({ id, population, referenceYear, languages }) => [
      id,
      { population, referenceYear, languages },
    ])
  );
  const currentSynthesis = deriveCountrySynthesisFromDetail(countryDetail);
  countryBriefs[countryDetail.id] = {
    population: countryDetail.demographics?.totalPopulation,
    referenceYear: countryDetail.demographics?.referenceYear,
    languages: compactCountryAtlasLanguages(currentSynthesis.languages),
  };

  const copy = countryCopy[language];
  const atlasCountryName =
    getAdmin0Name(countryDetail.id, language) ??
    countryDetail.nameCommonFr ??
    countryDetail.nameFr;

  return (
    <>
      <FicheJsonLd
        graph={await ficheJsonLdFor("country", language, countryDetail.id)}
      />
      <FicheSequence
        language={language}
        entityType="country"
        entityId={countryDetail.id}
        entityName={countryDetail.nameCommonFr || countryDetail.nameFr}
        globe={
          <FicheHeroBand>
            <FicheAtlasGlobeIsland
              language={language}
              overlay={buildCountryOutlineOverlay(countryDetail.id)}
              targetPicker="list"
              pickerTargets={pickerTargets}
              areaNoun={copy.atlas.areaNoun}
              wholeAreaLabel={copy.atlas.returnTo(atlasCountryName)}
              facts={buildCountryAtlasFacts({
                language,
                country: countryDetail,
                targets: pickerTargets,
                peopleCounts,
                countryBriefs,
              })}
              missingMessage={copy.atlas.missingOutline(atlasCountryName)}
            />
          </FicheHeroBand>
        }
        record={
          <CountryRecordView
            country={countryDetail}
            language={language}
            hasSourceFlag={sourceFlags.length > 0}
            fromPeopleName={navigationContext.fromPeopleName}
            fromPeopleId={navigationContext.fromPeopleId}
            patronymes={patronymes}
            countryLanguages={countryLanguages}
            provenance={provenance}
            summaryFigures={{
              population:
                countryDetail.demographics?.totalPopulation &&
                countryDetail.demographics.referenceYear
                  ? {
                      value: countryDetail.demographics.totalPopulation,
                      referenceYear: countryDetail.demographics.referenceYear,
                    }
                  : null,
              peoples: countryDetail.demographics?.peoples?.length,
              languages: countryLanguages?.value.length || null,
              families: familyCount,
              names: patronymes
                ? patronymes.attested.length + patronymes.borneByPeoples.length
                : null,
            }}
            familyNamesById={familyNamesById}
            onward={
              <FicheOnward
                from="country"
                language={language}
                links={buildOnwardLinks(
                  countryOnwardGroups({
                    demographicPeoples:
                      countryDetail.demographics?.peoples ?? [],
                    majorPeoples: countryDetail.majorPeoples ?? [],
                    familyNamesById,
                    language,
                  }),
                  language
                )}
              />
            }
          />
        }
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// @req REQ-019
export default async function PaysSlugPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: Promise<PageSearchParams>;
}) {
  const { lang, slug } = await params;

  const parsed = parseVersionedSlug(decodeURIComponent(slug));
  if (!parsed) {
    notFound();
  }

  if (parsed.mode === "latest") {
    const latestVersion = await getLatestEntityRevisionVersion(
      "country",
      parsed.slug
    );
    if (!latestVersion) {
      notFound();
    }
    redirect(
      getCountryRoute(lang as Language, `${parsed.slug}@v${latestVersion}`)
    );
  }

  if (parsed.mode === "pinned") {
    const snapshot = await getRevisionSnapshot(
      "country",
      parsed.slug,
      parsed.version
    );
    if (!snapshot) {
      notFound();
    }

    return (
      <PageLayout language={lang as Language} sectionName="Pays">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <FicheSnapshotView
            kind="country"
            entityId={parsed.slug}
            version={parsed.version}
            publishedAt={snapshot.published_at}
            confidence={snapshot.confidence}
            snapshotData={snapshot.data}
            doctrine={snapshot.doctrine}
            lang={lang}
          />
        </div>
      </PageLayout>
    );
  }

  const country = await loadCountryFiche(parsed.slug, lang as Language);
  if (!country) {
    notFound();
  }

  const navigationContext = (await searchParams) ?? {};
  const countryDetail = mapCountryDetail(country);

  return (
    <PageLayout
      language={lang as Language}
      sectionName="Pays"
      flushTop
      trailLabel={countryDetail.nameFr}
      heroHead={
        <FicheHeroHead entityType="country" translation={country.translation}>
          <CountryFicheTitle
            country={countryDetail}
            language={lang as Language}
            fromPeopleId={navigationContext.fromPeopleId}
            fromPeopleName={navigationContext.fromPeopleName}
          />
        </FicheHeroHead>
      }
    >
      <Suspense fallback={<div aria-busy="true" className="min-h-[60vh]" />}>
        <CountryLiveContent
          countryDetail={countryDetail}
          language={lang as Language}
          navigationContext={navigationContext}
        />
      </Suspense>
    </PageLayout>
  );
}
