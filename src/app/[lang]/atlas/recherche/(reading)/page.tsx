import type { Metadata } from "next";
import { Suspense } from "react";
import { getNameAddressSpellings } from "@/api/v2/services/nameAddresses";
import { RecherchePageContent } from "@/components/pages/RecherchePageContent";
import { NameAddressProvider } from "@/components/search/NameAddressProvider";
import { DidYouKnowLoader } from "@/components/system/DidYouKnowLoader";
import { pickDidYouKnowFact } from "@/lib/home/didYouKnowFacts";
import { getLocalizedRoute } from "@/lib/routing";
import { pageHead } from "@/lib/seo/pageHead";
import { getTranslation } from "@/lib/translations";
import { readSearchedThisWeek } from "@/lib/search/searchedThisWeekData";
import type { Language } from "@/types/shared";

// Search pages are dynamic — filters change per request.
// @req REQ-002
export const dynamic = "force-dynamic";

// The canonical is the bare search page: a typed query is a reading of it,
// so a crawler is never offered one address per spelling typed. A form the
// corpus answers has its own address, `atlas/recherche/[name]`, rendered on
// the server and listed in the sitemap; this reading of it keeps pointing
// here (DEC-074).
// @req REQ-141
// @req REQ-200
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const title = getTranslation(lang as Language).trail.pages.search;
  return {
    title,
    ...pageHead(getLocalizedRoute("fr", "search"), { title }),
  };
}

// @req REQ-002
// @req REQ-104
// @req REQ-200
export default async function RecherchePage() {
  // The links of the reading go to a name's address when it has one. A list
  // that cannot be read costs the addresses, never the page.
  const spellings = await getNameAddressSpellings().catch(() => []);
  const weeklyNames = await readSearchedThisWeek();
  return (
    <NameAddressProvider spellings={spellings}>
      {/*
       * This boundary wraps the whole page, so its fallback is what a reader
       * actually waits on here — not an in-page placeholder. Showing a
       * skeleton would hand this one route a second, different wait right
       * after the route's own interstitial has just been taken down.
       *
       * The accent scope is load-bearing: outside a .afh-accent-* wrapper,
       * --accent resolves to shadcn's bare HSL triplet and the inked
       * continent renders black.
       */}
      <Suspense
        fallback={
          <div className="afh-accent-ocre">
            <DidYouKnowLoader
              fact={pickDidYouKnowFact()}
              label="Chargement de la recherche"
            />
          </div>
        }
      >
        <RecherchePageContent weeklyNames={weeklyNames} />
      </Suspense>
    </NameAddressProvider>
  );
}
