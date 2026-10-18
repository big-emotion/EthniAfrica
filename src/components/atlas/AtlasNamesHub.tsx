import Link from "next/link";
import { UniversalSearchField } from "@/components/search/UniversalSearchField";
import { NameAddressProvider } from "@/components/search/NameAddressProvider";
import { ActionLink } from "@/components/ui/ActionLink";
import { getLocalizedRoute, type PageType } from "@/lib/routing";
import {
  buildNameAddressDirectory,
  nameSearchHref,
} from "@/lib/search/nameAddress";
import type { AtlasHubCounts } from "@/api/v2/services/atlasHub";
import type { AtlasWeeklyName } from "@/lib/search/atlasWeeklyNames";
import type { Language } from "@/types/shared";
import { atlasNamesHubCopy } from "@/lib/i18n/copy/atlasNamesHub";

interface CountryEntry {
  id: string;
  nameFr: string;
}

const browseLinks: Array<{
  key: keyof AtlasHubCounts;
  href: PageType;
}> = [
  { key: "peoples", href: "peoples" },
  { key: "patronymes", href: "patronymes" },
  { key: "countries", href: "countries" },
  { key: "languages", href: "languages" },
  { key: "families", href: "families" },
];

// @req REQ-114
export function AtlasNamesHub({
  language,
  countries,
  counts,
  weeklyNames,
  addressSpellings,
}: {
  language: Language;
  countries: CountryEntry[];
  counts: AtlasHubCounts;
  weeklyNames: AtlasWeeklyName[];
  addressSpellings: string[];
}) {
  const addresses = buildNameAddressDirectory(addressSpellings);
  const copy = atlasNamesHubCopy[language];
  const sortedCountries = [...countries].sort((a, b) =>
    a.nameFr.localeCompare(b.nameFr, "fr", { sensitivity: "base" })
  );
  return (
    <NameAddressProvider spellings={addressSpellings}>
      <div className="ea-atlas afh-accent-ocre">
        <header className="ea-atlas-head">
          <h1 className="ed-h1">{copy.title}</h1>
          <p className="ea-atlas-lead">{copy.description}</p>
        </header>
        <div className="ea-atlas-search">
          <UniversalSearchField language={language} surface="home" />
        </div>
        <section
          className="ea-atlas-block"
          aria-labelledby="atlas-countries-title"
        >
          <h2 id="atlas-countries-title" className="ea-next-title">
            {copy.countryTitle}
          </h2>
          <ul className="ea-atlas-countries" aria-label={copy.countriesLabel}>
            {sortedCountries.map((country) => (
              <li key={country.id}>
                <Link
                  className="home-hero-seed"
                  href={nameSearchHref(language, country.nameFr, addresses)}
                >
                  {country.nameFr}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {weeklyNames.length > 0 && (
          <section
            className="ea-atlas-block"
            aria-labelledby="atlas-week-title"
          >
            <h2 id="atlas-week-title" className="ea-next-title">
              {copy.weeklyTitle}
            </h2>
            <ul className="ea-atlas-cards">
              {weeklyNames.map((item) => (
                <li key={`${item.kind}-${item.name}`}>
                  <Link className="ea-next-card" href={item.href}>
                    <span className="ea-atlas-card-title">
                      {item.kind} · {item.name}
                    </span>
                    <span>{item.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section
          className="ea-atlas-block"
          aria-labelledby="atlas-browse-title"
        >
          <h2 id="atlas-browse-title" className="ea-next-title">
            {copy.browseTitle}
          </h2>
          <ul className="ea-atlas-browse">
            {browseLinks.map(({ key, href }) => (
              <li key={key}>
                <ActionLink
                  className="ea-atlas-line"
                  href={getLocalizedRoute(language, href)}
                >
                  <span className="ea-atlas-line-name">{copy.browse[key]}</span>
                  <span className="ea-atlas-line-count">{counts[key]}</span>
                </ActionLink>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </NameAddressProvider>
  );
}
