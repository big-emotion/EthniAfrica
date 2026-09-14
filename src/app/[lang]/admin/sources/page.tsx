import type { Metadata } from "next";

import { listSourceTierRulingDrafts } from "@/api/v2/services/sourceTierRulings";
import { SourceReviewQueue } from "@/components/admin/SourceReviewQueue";
import { FacetFilterBar } from "@/components/hubs/facets/FacetFilterBar";
import { FacetPagination } from "@/components/hubs/facets/FacetPagination";
import { PageLayout } from "@/components/layout/PageLayout";
import { adminCopy } from "@/lib/i18n/copy/admin";
import { getStaticPageRoute } from "@/lib/routing";
import {
  SOURCE_REVIEW_KINDS,
  citationKey,
  filterSourceReviewQueue,
  readSourceReviewQueue,
  type SourceReviewFilters,
  type SourceReviewKind,
} from "@/lib/sources/sourceReviewQueue";
import { getModeratorSession } from "@/lib/supabase/moderator";
import type { Language } from "@/types/shared";

/**
 * The queue of citations awaiting a tier ruling.
 *
 * What it deliberately does **not** do is change a fiche. A decision here is
 * a draft: a tier edited only in the database would be overwritten by the next
 * corpus sync, so the draft is pulled into the git ruling ledger and applied to
 * the JSON (docs/editorial/source-review/README.md). The card therefore says
 * "decided, awaiting publication" rather than showing the new tier as current.
 *
 * The session check is redundant with the middleware and kept anyway, for the
 * reason the report queue gives: an authorization that lives only in a matcher
 * is one configuration edit away from being gone.
 */

// @req REQ-042
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: adminCopy[lang as Language].sourceReview.metadataTitle,
    robots: { index: false, follow: false },
  };
}

// Drafts are written from this very page; a cached render would hide them.
// @req REQ-042
export const dynamic = "force-dynamic";

const PAGE_SIZES = [25, 50, 100] as const;

type SearchParams = Record<string, string | string[] | undefined>;

function one(params: SearchParams, key: string): string | null {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || null;
}

// @req REQ-042
export default async function SourceReviewPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await getModeratorSession();

  const { lang } = await routeParams;
  const language = lang as Language;
  const copy = adminCopy[language].sourceReview;
  const route = `${getStaticPageRoute(language, "admin")}/sources`;

  const drafts = await listSourceTierRulingDrafts();
  const decidedKeys = new Set(
    drafts.map((draft) => citationKey(draft.source_title, draft.source_url))
  );

  const params = await searchParams;
  const rawKind = one(params, "type");
  const kind = SOURCE_REVIEW_KINDS.includes(rawKind as SourceReviewKind)
    ? (rawKind as SourceReviewKind)
    : undefined;
  const rawUrl = one(params, "url");
  const rawState = one(params, "etat");
  const fiche = one(params, "fiche");
  const filters: SourceReviewFilters = {
    kind,
    hasUrl: rawUrl === "avec" ? true : rawUrl === "sans" ? false : undefined,
    fiche: fiche ?? undefined,
    state:
      rawState === "a-examiner"
        ? "to-review"
        : rawState === "decidee"
          ? "decided"
          : undefined,
  };

  const items = filterSourceReviewQueue(
    readSourceReviewQueue(),
    filters,
    decidedKeys
  );

  const requestedSize = Number(one(params, "taille"));
  const pageSize = PAGE_SIZES.includes(
    requestedSize as (typeof PAGE_SIZES)[number]
  )
    ? requestedSize
    : PAGE_SIZES[0];
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(
    pageCount,
    Math.max(1, Number(one(params, "page")) || 1)
  );
  const cards = items
    .slice((page - 1) * pageSize, page * pageSize)
    .map((item) => ({ ...item, decided: decidedKeys.has(item.key) }));

  function buildHref(nextPage: number, nextSize: number): string {
    const query = new URLSearchParams();
    if (kind) query.set("type", kind);
    if (rawUrl === "avec" || rawUrl === "sans") query.set("url", rawUrl);
    if (filters.state) query.set("etat", rawState);
    if (fiche) query.set("fiche", fiche);
    if (nextSize !== PAGE_SIZES[0]) query.set("taille", String(nextSize));
    if (nextPage > 1) query.set("page", String(nextPage));
    const suffix = query.toString();
    return suffix ? `${route}?${suffix}` : route;
  }

  return (
    <PageLayout language={language} title={copy.title}>
      <div className="mx-auto w-full max-w-4xl space-y-afh-xl">
        <p className="max-w-3xl text-afh-small text-afh-text-soft">
          {copy.guidance}
        </p>

        <FacetFilterBar
          action={route}
          searchField={{
            name: "fiche",
            label: copy.searchLabel,
            placeholder: copy.searchPlaceholder,
            value: fiche,
          }}
          primaryField={{
            name: "type",
            label: copy.kindFilter,
            anyLabel: copy.allKinds,
            options: SOURCE_REVIEW_KINDS.map((value) => ({
              value,
              label: copy.kinds[value],
            })),
            value: kind ?? null,
          }}
          advancedFields={[
            {
              name: "url",
              label: copy.urlFilter,
              anyLabel: copy.anyUrl,
              options: [
                { value: "avec", label: copy.withUrl },
                { value: "sans", label: copy.withoutUrl },
              ],
              value: filters.hasUrl === undefined ? null : rawUrl,
            },
            {
              name: "etat",
              label: copy.stateFilter,
              anyLabel: copy.anyState,
              options: [
                { value: "a-examiner", label: copy.toReview },
                { value: "decidee", label: copy.decided },
              ],
              value: filters.state ? rawState : null,
            },
          ]}
          preservedParams={{
            taille: pageSize === PAGE_SIZES[0] ? null : String(pageSize),
          }}
        />

        {items.length === 0 ? (
          <p className="text-afh-small text-afh-text-soft">{copy.empty}</p>
        ) : (
          <>
            <FacetPagination
              buildHref={buildHref}
              language={language}
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              pageSizes={PAGE_SIZES}
              position="top"
              total={items.length}
              unitLabel={copy.unit}
            />

            <SourceReviewQueue items={cards} language={language} />

            <FacetPagination
              buildHref={buildHref}
              language={language}
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              pageSizes={PAGE_SIZES}
              position="bottom"
              total={items.length}
              unitLabel={copy.unit}
            />
          </>
        )}
      </div>
    </PageLayout>
  );
}
