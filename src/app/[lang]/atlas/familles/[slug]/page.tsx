import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import {
  isFicheKnownAbsent,
  loadLanguageFamilyFiche,
} from "@/lib/fiche/ficheExistence";
import { parseVersionedSlug } from "@/lib/versioned-slug";
import { ficheHead } from "@/lib/seo/ficheHead";
import { getFamilyRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";
import {
  getLatestEntityRevisionVersion,
  getRevisionSnapshot,
} from "@/api/v2/services/revisions";
import { PageLayout } from "@/components/layout/PageLayout";
import { FicheJsonLd } from "@/components/fiche/FicheJsonLd";
import { FicheOnward } from "@/components/fiche/FicheOnward";
import { buildOnwardLinks } from "@/lib/fiche/onwardLinks";
import { familyOnwardGroups } from "@/lib/fiche/onwardGroups";
import { rankMemberPeoplesByReach } from "@/lib/familyFootprintRanking";
import { getAfrikLanguagesByFamily } from "@/lib/supabase/queries/afrik/languages";
import { ficheJsonLdFor } from "@/lib/seo/ficheJsonLd";
import { FicheSequence } from "@/components/fiche/FicheSequence";
import { FicheSnapshotView } from "@/components/fiche/FicheSnapshotView";
import { FicheHeroHead } from "@/components/fiche/FicheHeroHead";
import { FicheHeroBand } from "@/components/fiche/FicheHeroBand";
import { FamilyFicheTitle } from "@/components/family/FamilyFicheTitle";
import { FamilyFootprintLegend } from "@/components/family/FamilyFootprintLegend";
import { buildFamilyTargetFacts } from "@/components/family/familyTargetFacts";
import { LanguageFamilyDetailViewV2 } from "@/components/family/LanguageFamilyDetailViewV2";
import { readProvenanceCensus } from "@/lib/fiche/provenanceCensus";
import {
  buildFamilyFootprintOverlay,
  getAdmin0Name,
} from "@/lib/atlas/overlays";
import { mapLanguageFamilyDetail } from "@/lib/afrikDetailMapper";
import {
  getPeoplesByIds,
  getPeoplesByLanguageFamily,
} from "@/api/v2/services/peopleService";
import {
  declaredAssociatedPeopleIds,
  resolveFootprintProvenance,
} from "@/lib/familyFootprintSource";
import { familyCopy } from "@/lib/i18n/copy/family";
import { FicheAtlasGlobeIsland } from "@/components/atlas/FicheAtlasGlobeIsland";

// A literal on purpose: Next reads segment config statically. Held to
// `CORPUS_AGGREGATE_REVALIDATE_SECONDS` (`PUBLIC_FLAGS_REVALIDATE_SECONDS` for
// the 60 s pages) by `src/app/__tests__/cacheFreshnessContract.test.ts`.
// @req REQ-019
export const revalidate = 3600;

interface PageParams {
  lang: string;
  slug: string;
}

async function FamilyLiveContent({
  family,
  familyDetail,
  language,
}: {
  family: NonNullable<Awaited<ReturnType<typeof loadLanguageFamilyFiche>>>;
  familyDetail: ReturnType<typeof mapLanguageFamilyDetail>;
  language: Language;
}) {
  const [familyMemberPeoples, familyLanguages, provenance] = await Promise.all([
    getPeoplesByLanguageFamily(family.id),
    getAfrikLanguagesByFamily(family.id).catch(() => []),
    readProvenanceCensus("language-family", family.id),
  ]);
  const footprintProvenance = resolveFootprintProvenance(
    familyMemberPeoples.length
  );
  const memberPeoples =
    footprintProvenance === "member-peoples"
      ? familyMemberPeoples
      : await getPeoplesByIds(declaredAssociatedPeopleIds(family));
  const familyOverlay = buildFamilyFootprintOverlay(
    memberPeoples.map((person) => person.currentCountries),
    memberPeoples.length
  );
  const peopleNamesByCountry: Record<string, string[]> = {};
  for (const person of memberPeoples) {
    for (const countryId of new Set(person.currentCountries)) {
      (peopleNamesByCountry[countryId] ??= []).push(person.nameMain);
    }
  }
  const familyTargetFacts = buildFamilyTargetFacts({
    language,
    familyNameFr: familyDetail.nameFr,
    memberPeopleCount: memberPeoples.length,
    peopleNamesByCountry,
    countryNamesFr: Object.fromEntries(
      (familyOverlay?.countries ?? []).map((country) => [
        country.countryId,
        getAdmin0Name(country.countryId, "fr") ?? country.countryId,
      ])
    ),
  });
  const copy = familyCopy[language];
  const atlasFamilyName =
    language === "en"
      ? familyDetail.nameEn || familyDetail.nameFr
      : familyDetail.nameFr;

  return (
    <>
      <FicheJsonLd
        graph={await ficheJsonLdFor("language-family", language, family.id)}
      />
      <FicheSequence
        language={language}
        entityType="language-family"
        entityId={family.id}
        entityName={familyDetail.nameFr}
        globe={
          <FicheHeroBand>
            <FicheAtlasGlobeIsland
              language={language}
              overlay={familyOverlay}
              targetPicker="list"
              facts={familyTargetFacts}
              legend={
                <FamilyFootprintLegend
                  provenance={footprintProvenance}
                  language={language}
                />
              }
              missingMessage={copy.atlas.missingFootprint(atlasFamilyName)}
            />
          </FicheHeroBand>
        }
        record={
          <LanguageFamilyDetailViewV2
            language={language}
            family={family}
            footprintCountries={familyOverlay?.countries ?? []}
            memberPeoples={memberPeoples}
            memberPeopleCount={memberPeoples.length}
            footprintProvenance={footprintProvenance}
            provenance={provenance}
            onward={
              <FicheOnward
                from="language-family"
                language={language}
                links={buildOnwardLinks(
                  familyOnwardGroups({
                    languages: familyLanguages,
                    peoples: rankMemberPeoplesByReach(memberPeoples),
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
  // late to change the status. `generateMetadata` runs before the flush, and
  // `loadLanguageFamilyFiche` is request-cached so the page reuses this load.
  const parsedForExistence = parseVersionedSlug(decodeURIComponent(slug));
  if (
    parsedForExistence?.mode === "live" &&
    (await isFicheKnownAbsent(
      (id) => loadLanguageFamilyFiche(id, lang as Language),
      parsedForExistence.slug
    ))
  ) {
    notFound();
  }
  return ficheHead("family", lang as Language, slug);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// @req REQ-019
export default async function FamillesSlugPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { lang, slug } = await params;

  const parsed = parseVersionedSlug(decodeURIComponent(slug));
  if (!parsed) {
    notFound();
  }

  if (parsed.mode === "latest") {
    const latestVersion = await getLatestEntityRevisionVersion(
      "language_family",
      parsed.slug
    );
    if (!latestVersion) {
      notFound();
    }
    redirect(
      getFamilyRoute(lang as Language, `${parsed.slug}@v${latestVersion}`)
    );
  }

  if (parsed.mode === "pinned") {
    const snapshot = await getRevisionSnapshot(
      "language_family",
      parsed.slug,
      parsed.version
    );
    if (!snapshot) {
      notFound();
    }

    return (
      <PageLayout
        language={lang as Language}
        sectionName="Familles linguistiques"
      >
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <FicheSnapshotView
            kind="languageFamily"
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

  const family = await loadLanguageFamilyFiche(parsed.slug, lang as Language);
  if (!family) {
    notFound();
  }
  const familyDetail = mapLanguageFamilyDetail(family);

  return (
    <PageLayout
      language={lang as Language}
      sectionName="Familles linguistiques"
      flushTop
      trailLabel={family.nameFr}
      heroHead={
        <FicheHeroHead
          entityType="language-family"
          translation={family.translation}
        >
          <FamilyFicheTitle family={family} language={lang as Language} />
        </FicheHeroHead>
      }
    >
      <Suspense fallback={<div aria-busy="true" className="min-h-[60vh]" />}>
        <FamilyLiveContent
          family={family}
          familyDetail={familyDetail}
          language={lang as Language}
        />
      </Suspense>
    </PageLayout>
  );
}
