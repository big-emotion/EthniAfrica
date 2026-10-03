import type { Metadata } from "next";

import {
  FacetFilterBar,
  type FacetActiveFilter,
} from "@/components/hubs/facets/FacetFilterBar";
import { FacetPagination } from "@/components/hubs/facets/FacetPagination";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProverbCard } from "@/components/proverbs/ProverbCard";
import { PROVERB_IMAGES } from "@/lib/proverbs/proverbImages";
import type { DidYouKnowEntityKind } from "@/lib/home/didYouKnowFacts";
import { definedFilter } from "@/lib/hubs/facets";
import { proverbsCopy } from "@/lib/i18n/copy/proverbs";
import { formatNumber } from "@/lib/languageTag";
import {
  PROVERBS,
  PROVERB_ORIGIN_STATUSES,
  filterProverbs,
  parseProverbOrigin,
  proverbEntities,
  type ProverbFilters,
} from "@/lib/proverbs/proverbs";
import { localizeProverb } from "@/lib/proverbs/proverbs.en";
import { getLocalizedRoute } from "@/lib/routing";
import { surfaceHead } from "@/lib/seo/localeAlternates";
import type { Language } from "@/types/shared";

type ProverbSearchParams = Record<string, string | string[] | undefined>;

interface ProverbsPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<ProverbSearchParams>;
}

/**
 * Ten at a time. The whole bank on one page measured 39 721 px at 430 px — a
 * third longer than the longest page the site had — and a proverb card is a
 * full screen on a phone, so ten is about ten screens.
 */
const PROVERBS_PER_PAGE = 10;
const PAGE_SIZES = [PROVERBS_PER_PAGE] as const;

/** The address's words, in the reader's language like the facets' `pays`. */
const PARAM = {
  country: "pays",
  people: "peuple",
  family: "famille",
  origin: "origine",
  page: "page",
} as const;

type AddressKey = keyof typeof PARAM;

/** The page a reader asked for, or the first — never NaN, never zero. */
function requestedPage(raw: string | string[] | undefined): number {
  const parsed = Number.parseInt(definedFilter(raw) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

// @req REQ-113
// @req REQ-141
export async function generateMetadata({
  params,
}: Pick<ProverbsPageProps, "params">): Promise<Metadata> {
  const { lang } = await params;
  const language = lang as Language;
  const copy = {
    title: proverbsCopy[language].pageTitle,
    description: proverbsCopy[language].pageSubtitle,
  };
  return {
    ...copy,
    ...surfaceHead(
      language,
      "proverbs",
      (locale) => getLocalizedRoute(locale, "proverbs"),
      copy
    ),
  };
}

/**
 * The proverb bank, ten at a time, narrowed by the facets' own filter bar.
 *
 * The bar is the atlas facets' `FacetFilterBar` rather than a control of its
 * own: a plain GET form with native selects, so every state of this page has
 * an address, works before hydration and can be followed by a crawler. The
 * country leads because a reader most often arrives knowing where; the people,
 * the language family and the origin fold behind it, and each applied one is
 * named as a chip that lifts it alone.
 *
 * The origin is the one narrowing this dossier owes that no compilation
 * offers: « non établie » lists the sayings the web calls African while no
 * source names a people.
 *
 * The filters cross, and the options are the entries the bank actually names,
 * unnarrowed by the other choices — so a crossing can come back empty, and the
 * page says so rather than offering fewer choices than it holds.
 *
 * The pages are counted on the filtered selection, and a page past its end is
 * clamped to the last one: a page number kept from the whole bank must not
 * read as an empty dossier once a filter shortens the list.
 */
// @req REQ-113
// @req REQ-108
export default async function ProverbsPage({
  params,
  searchParams,
}: ProverbsPageProps) {
  const { lang } = await params;
  const language = lang as Language;
  const query = (await searchParams) ?? {};
  const copy = proverbsCopy[language];

  const bank = PROVERBS.map((proverb) => localizeProverb(proverb, language));
  const entities = proverbEntities(bank, language);

  /**
   * The entry an address names, only if the bank names it too. An allowlist,
   * like the origin: an unknown value (a retired proverb's link, a lowercase
   * `gha`) otherwise narrowed to nothing and printed its raw identifier on a
   * chip while the select beside it said no filter was on.
   */
  const entityNamed = (kind: DidYouKnowEntityKind) => {
    const id = definedFilter(query[PARAM[kind]]);
    return (
      entities.find((entity) => entity.kind === kind && entity.id === id) ??
      null
    );
  };
  const chosenEntity = {
    country: entityNamed("country"),
    people: entityNamed("people"),
    family: entityNamed("family"),
  };
  const chosen: Required<ProverbFilters> = {
    country: chosenEntity.country?.id ?? null,
    people: chosenEntity.people?.id ?? null,
    family: chosenEntity.family?.id ?? null,
    origin: parseProverbOrigin(definedFilter(query[PARAM.origin])),
  };

  const selection = filterProverbs(bank, chosen);
  const pageCount = Math.max(
    1,
    Math.ceil(selection.length / PROVERBS_PER_PAGE)
  );
  const page = Math.min(requestedPage(query[PARAM.page]), pageCount);
  const shown = selection.slice(
    (page - 1) * PROVERBS_PER_PAGE,
    page * PROVERBS_PER_PAGE
  );

  const route = getLocalizedRoute(language, "proverbs");
  /**
   * Every address the page emits, from the narrowings in force. The page is
   * dropped unless named: lifting a filter or choosing another opens on page
   * one, because page four of the whole bank is past the end of a narrowing.
   */
  const addressWith = (
    overrides: Partial<Record<AddressKey, string | null>>
  ): string => {
    const values: Record<AddressKey, string | null> = {
      ...chosen,
      page: null,
      ...overrides,
    };
    const address = new URLSearchParams();
    for (const key of Object.keys(PARAM) as AddressKey[]) {
      const value = values[key];
      if (value) address.set(PARAM[key], value);
    }
    const search = address.toString();
    return search ? `${route}?${search}` : route;
  };

  const optionsOf = (kind: DidYouKnowEntityKind) =>
    entities
      .filter((entity) => entity.kind === kind)
      .map((entity) => ({ value: entity.id, label: entity.label }));

  const activeFilters: FacetActiveFilter[] = [
    ...(["country", "people", "family"] as const).flatMap((kind) => {
      const entity = chosenEntity[kind];
      return entity
        ? [
            {
              label: entity.label,
              removeHref: addressWith({ [kind]: null }),
            },
          ]
        : [];
    }),
    ...(chosen.origin
      ? [
          {
            label: copy.originOptions[chosen.origin],
            removeHref: addressWith({ origin: null }),
          },
        ]
      : []),
  ];

  const pagination = (position: "top" | "bottom") => (
    <FacetPagination
      language={language}
      position={position}
      page={page}
      pageCount={pageCount}
      total={selection.length}
      pageSize={PROVERBS_PER_PAGE}
      pageSizes={PAGE_SIZES}
      buildHref={(target) =>
        addressWith({ page: target > 1 ? String(target) : null })
      }
      unitLabel={copy.unitPlural}
    />
  );

  return (
    <PageLayout
      language={language}
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
    >
      {/* The dossiers axis's accent, set once at the page (brand charter
          §5.2): the filter button and its chips read it. The chips inside
          each card keep their entity's own accent, being objects of another
          kind. */}
      <div
        className="proverbs-page afh-accent-teal"
        data-testid="proverbs-page"
      >
        <p className="proverbs-kicker">{copy.pageKicker}</p>
        <p className="proverbs-count" data-testid="proverbs-count">
          {copy.count(
            selection.length,
            formatNumber(language, selection.length)
          )}
        </p>

        <FacetFilterBar
          action={route}
          primaryField={{
            name: PARAM.country,
            label: copy.country,
            anyLabel: copy.allCountries,
            options: optionsOf("country"),
            value: chosen.country,
          }}
          advancedFields={[
            {
              name: PARAM.people,
              label: copy.people,
              anyLabel: copy.allPeoples,
              options: optionsOf("people"),
              value: chosen.people,
            },
            {
              name: PARAM.family,
              label: copy.family,
              anyLabel: copy.allFamilies,
              options: optionsOf("family"),
              value: chosen.family,
            },
            {
              name: PARAM.origin,
              label: copy.origin,
              anyLabel: copy.allOrigins,
              options: PROVERB_ORIGIN_STATUSES.map((status) => ({
                value: status,
                label: copy.originOptions[status],
              })),
              value: chosen.origin,
            },
          ]}
          activeFilters={activeFilters}
        />

        {shown.length ? (
          <>
            {pagination("top")}
            <div className="proverbs-list">
              {shown.map((proverb) => (
                <ProverbCard
                  key={proverb.id}
                  language={language}
                  proverb={proverb}
                  picture={PROVERB_IMAGES[proverb.id]}
                />
              ))}
            </div>
            {pagination("bottom")}
          </>
        ) : (
          <p className="proverbs-empty">{copy.empty}</p>
        )}
      </div>

      <style>{`
        .proverbs-page {
          max-width: 68ch;
          margin: 0 auto;
          padding-block: var(--afh-space-5xl) var(--afh-space-9xl);
        }
        .proverbs-kicker {
          margin: 0 0 var(--afh-space-lg);
          text-align: center;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: var(--afh-text-eyebrow);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--afh-fg-muted);
        }
        .proverbs-count {
          margin: 0 0 var(--afh-space-2xl);
          text-align: left;
          font-size: var(--afh-text-body);
          color: var(--afh-text-soft);
        }
        .proverbs-list {
          margin-top: var(--afh-space-2xl);
          display: flex;
          flex-direction: column;
          gap: var(--afh-space-2xl);
        }
        .proverbs-empty {
          margin-top: var(--afh-space-5xl);
          text-align: center;
          color: var(--afh-fg-muted);
        }
        @media (min-width: 768px) {
          .proverbs-list {
            gap: var(--afh-space-5xl);
          }
        }
      `}</style>
    </PageLayout>
  );
}
