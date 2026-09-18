/**
 * Dynamic comparison OG image route — `next/og` `ImageResponse` (FR63, AR30).
 *
 * Same URL-reconstructs-the-comparison contract as page.tsx, but fetches
 * through `comparisonService.getComparisonEntities` instead of
 * `assembleComparison` because this route also needs the batched Module #0
 * confidence read (`assembleComparison` does not fetch confidence).
 */
import { ImageResponse } from "next/og";
import { getComparisonEntities } from "@/api/v2/services/comparisonService";
import { transformComparisonData } from "@/lib/comparisonDataTransformer";
import { buildComparisonOgCard } from "@/lib/comparisonOgCard";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import {
  SHARE_CARD_SIZE,
  SHARE_CARD_THEME,
  shareCardFonts,
} from "@/lib/seo/shareCard";
import { OG_IMAGE_CACHE_CONTROL } from "@/api/v2/services/corpusCache";
import type { CompareEntityType } from "@/types/compare";
import { isTranslationLocale } from "@/lib/i18n/translationLocale";

// @req REQ-097
export const runtime = "nodejs";

interface RouteParams {
  lang: string;
  entityType: string;
}

const ENTITY_TYPE_SLUGS = ["peuples", "pays", "familles"] as const;
type ComparerEntityTypeSlug = (typeof ENTITY_TYPE_SLUGS)[number];

const SLUG_TO_INTERNAL_TYPE: Record<ComparerEntityTypeSlug, CompareEntityType> =
  {
    peuples: "peuple",
    pays: "pays",
    familles: "famille",
  };

function isComparerEntityTypeSlug(
  value: string
): value is ComparerEntityTypeSlug {
  return (ENTITY_TYPE_SLUGS as readonly string[]).includes(value);
}

function hasValidSegmentShape(
  entityType: string,
  ids: string[]
): entityType is ComparerEntityTypeSlug {
  if (!isComparerEntityTypeSlug(entityType)) return false;
  if (ids.length < 2 || ids.length > 3) return false;
  return new Set(ids).size === ids.length;
}

// @req REQ-097
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<RouteParams>;
  }
) {
  const { entityType, lang } = await params;
  const language = isTranslationLocale(lang) ? lang : "fr";
  const ids = new URL(request.url).searchParams.getAll("id");

  if (!hasValidSegmentShape(entityType, ids)) {
    return new Response(null, { status: 404 });
  }

  const internalType = SLUG_TO_INTERNAL_TYPE[entityType];
  const { entities, missingIds } = await getComparisonEntities(
    internalType,
    ids
  );

  if (missingIds.length > 0) {
    return new Response(null, { status: 404 });
  }

  const pageData = transformComparisonData(entities.map((item) => item.entity));
  const confidenceById = new Map(
    entities.map((item) => [item.id, item.confidence])
  );

  const card = buildComparisonOgCard(
    {
      ...pageData,
      columns: pageData.columns.map((column) => {
        const confidence = confidenceById.get(column.id);
        return {
          ...column,
          confidence: confidence
            ? { score: confidence.score, sourceCount: confidence.sourceCount }
            : null,
        };
      }),
    },
    language
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: SHARE_CARD_THEME.ground,
        color: SHARE_CARD_THEME.ink,
        padding: "56px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Nunito Sans",
          fontSize: 24,
          color: SHARE_CARD_THEME.inkSoft,
        }}
      >
        {card.entityTypeLabel} · {card.comparisonLabel}
      </div>
      <div style={{ display: "flex", gap: 32, alignItems: "stretch" }}>
        {card.entities.map((entity) => (
          <div
            key={entity.id}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 12,
              padding: "24px",
              borderRadius: 16,
              background: "#ffffff",
              border: `1px solid ${SHARE_CARD_THEME.line}`,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 1.15,
              }}
            >
              {entity.autonym}
            </div>
            {entity.exonym ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Nunito Sans",
                  fontSize: 22,
                  color: SHARE_CARD_THEME.inkSoft,
                }}
              >
                {entity.exonym}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontFamily: "Nunito Sans",
                fontSize: 18,
                color: SHARE_CARD_THEME.inkSoft,
              }}
            >
              {entity.confidenceLabel}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "Nunito Sans",
          fontSize: 20,
          color: SHARE_CARD_THEME.accent,
        }}
      >
        <div style={{ display: "flex" }}>{CANONICAL_DOMAIN}</div>
        <div style={{ display: "flex" }}>{card.attribution}</div>
      </div>
    </div>,
    {
      ...SHARE_CARD_SIZE,
      fonts: shareCardFonts(),
      headers: {
        "Cache-Control": OG_IMAGE_CACHE_CONTROL,
      },
    }
  );
}
