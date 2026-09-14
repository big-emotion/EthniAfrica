import {
  generatedImagesCopy,
  type GeneratedImageEntityId,
  type GeneratedImageSlug,
} from "@/lib/i18n/copy/generatedImages";
import type { Language } from "@/types/shared";

import type { DiscoveryPublication, DownloadFormat } from "./catalog";
import verifiedSources from "./generatedImageSources.json";
import { DISCOVERY_SLUGS } from "./slugs";

export interface GeneratedImageMaster {
  slug: string;
  collection: NonNullable<DiscoveryPublication["collection"]>;
  /**
   * Relative to the approved-masters directory, which lives outside git and
   * is resolved by the derivation script, never written here.
   */
  master: string;
  /** An outpainted vertical master; without one a scene ships no 9:16. */
  master9x16?: string;
}

interface GeneratedImageRecord extends GeneratedImageMaster {
  slug: GeneratedImageSlug;
  jobId: string;
  entities: ReadonlyArray<{
    kind: "people" | "country";
    id: GeneratedImageEntityId;
  }>;
  /** Set where the caption names what no linked fiche states (DEC-053). */
  captionExceedsCorpus?: true;
}

/**
 * What an editor verified by hand, per image. Nothing is inferred from the
 * fiche or from the generation job: the subject's `source` is a source the
 * linked fiche cites, at `official` or `referenced`. A record absent from the
 * table has no `source`, so `eligiblePublications` refuses it — the gate is
 * the catalog's, not a flag here.
 *
 * JSON rather than TypeScript: a source title is a proper title, identical in
 * both locales, so it belongs in neither copy dictionary — and several carry
 * accents the copy-literal gate would flag in a `.ts` file.
 */
interface GeneratedImageVerification {
  source: NonNullable<DiscoveryPublication["source"]>;
  /** Required for a record that declares `captionExceedsCorpus`. */
  captionSource?: NonNullable<DiscoveryPublication["captionSource"]>;
  /** Cited in the detail sheet after the subject source. */
  detailSources: NonNullable<DiscoveryPublication["detail"]>["sources"];
}

const VERIFIED_SOURCES = verifiedSources as Partial<
  Record<GeneratedImageSlug, GeneratedImageVerification>
>;

/**
 * Images whose derived files are committed under `public/`. A download is
 * declared only once its file ships, because the download suite walks every
 * declared file; an image not listed here has no picture and stays out of the
 * feed even once its source is verified.
 */
const SHIPPED_DOWNLOADS: ReadonlySet<GeneratedImageSlug> =
  new Set<GeneratedImageSlug>();

const GENERATION = {
  tool: "Higgsfield",
  model: "nano_banana_2",
  generatedOn: "2026-09-13",
  sourceKind: "ai_generated",
} as const;

const CC_BY_SA_4_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

const RECORDS: readonly GeneratedImageRecord[] = [
  {
    slug: "basotho",
    collection: "autonymes",
    master: "autonymes/basotho_191bbcaf.png",
    jobId: "191bbcaf-3793-4b5a-9b53-b7ccfdee0037",
    entities: [{ kind: "people", id: "PPL_SOTHO" }],
  },
  {
    slug: "amazigh",
    collection: "autonymes",
    master: "autonymes/amazigh_b7825c4c.png",
    jobId: "b7825c4c-e4e3-4b30-8ffc-3f7fbcf23d05",
    entities: [{ kind: "people", id: "PPL_AMAZIGH_MACRO" }],
  },
  {
    slug: "ewe",
    collection: "autonymes",
    master: "autonymes/ewe_b51b3abb.png",
    jobId: "b51b3abb-070c-4d78-b7bd-b35e6df0be38",
    entities: [{ kind: "people", id: "PPL_EWE" }],
  },
  {
    slug: "swahili",
    collection: "autonymes",
    master: "autonymes/swahili_7e1a6b61.png",
    jobId: "7e1a6b61-7d6d-4a43-9f24-793ae734cca5",
    entities: [{ kind: "people", id: "PPL_SWAHILI" }],
  },
  {
    slug: "kongo",
    collection: "traversees",
    master: "traversees/kongo-pool-malebo_e202acdc.png",
    master9x16: "traversees/kongo-pool-malebo_e202acdc_9x16.png",
    jobId: "e202acdc-5dde-4e91-b612-1180ab3e1ebf",
    entities: [{ kind: "people", id: "PPL_KONGO" }],
    captionExceedsCorpus: true,
  },
  {
    slug: "somali",
    collection: "traversees",
    master: "traversees/somali_6fc21bda.png",
    master9x16: "traversees/somali_6fc21bda_9x16.png",
    jobId: "6fc21bda-f5cd-4a17-ab31-5a51c169289a",
    entities: [{ kind: "people", id: "PPL_SOMALI" }],
  },
  {
    slug: "hausa",
    collection: "traversees",
    master: "traversees/hausa_c6ceaab5.png",
    master9x16: "traversees/hausa_c6ceaab5_9x16.png",
    jobId: "c6ceaab5-9ac0-4317-b62e-d3a19070921d",
    entities: [{ kind: "people", id: "PPL_HAUSA" }],
  },
  {
    slug: "swazi",
    collection: "traversees",
    master: "traversees/swazi_c20893da.png",
    master9x16: "traversees/swazi_c20893da_9x16.png",
    jobId: "c20893da-9abb-4a14-be79-a62d1bb03d21",
    entities: [{ kind: "people", id: "PPL_SWAZI" }],
  },
  {
    slug: "njinga",
    collection: "figures-et-moments",
    master: "figures-et-moments/njinga-mbande_39d2285e.png",
    master9x16: "figures-et-moments/njinga-mbande_39d2285e_9x16.png",
    jobId: "39d2285e-7b27-4530-b0c7-78e5455dfc1e",
    entities: [{ kind: "country", id: "AGO" }],
    captionExceedsCorpus: true,
  },
  {
    slug: "mansa-musa",
    collection: "figures-et-moments",
    master: "figures-et-moments/mansa-musa-1324_ea62249c.png",
    master9x16: "figures-et-moments/mansa-musa-1324_ea62249c_9x16.png",
    jobId: "ea62249c-d35a-4a2d-8c0f-952004ade48f",
    entities: [
      { kind: "people", id: "PPL_MALINKE" },
      { kind: "country", id: "MLI" },
    ],
  },
  {
    slug: "grand-zimbabwe",
    collection: "figures-et-moments",
    master: "figures-et-moments/grand-zimbabwe_110479d5.png",
    master9x16: "figures-et-moments/grand-zimbabwe_110479d5_9x16.png",
    jobId: "110479d5-f931-4d51-a55b-d0d959028891",
    entities: [{ kind: "country", id: "ZWE" }],
  },
  {
    slug: "marrakech",
    collection: "figures-et-moments",
    master: "figures-et-moments/marrakech-almoravides_8f124cd8.png",
    master9x16: "figures-et-moments/marrakech-almoravides_8f124cd8_9x16.png",
    jobId: "8f124cd8-4b92-4643-bd2f-fe27733b01ac",
    entities: [{ kind: "country", id: "MAR" }],
  },
];

/** What the derivation script reads: which master becomes which files. */
// @req REQ-164
export const GENERATED_IMAGE_MANIFEST: readonly GeneratedImageMaster[] =
  RECORDS.map(({ slug, collection, master, master9x16 }) => ({
    slug,
    collection,
    master,
    ...(master9x16 ? { master9x16 } : {}),
  }));

const ALL_FORMATS: readonly DownloadFormat[] = ["9:16", "4:5", "1:1"];

/**
 * An autonym is a square portrait extended onto its own paper, so it yields
 * every format; a scene has no vertical composition to extend, so its 9:16
 * exists only when an outpainted master does (REQ-166 permits the absence).
 */
// @req REQ-166
export function derivableFormats(
  entry: Pick<GeneratedImageMaster, "collection" | "master9x16">
): DownloadFormat[] {
  return ALL_FORMATS.filter(
    (format) =>
      format !== "9:16" ||
      entry.collection === "autonymes" ||
      Boolean(entry.master9x16)
  );
}

// @req REQ-166
export function generatedDownloadPath(
  slug: string,
  format: DownloadFormat
): string {
  return `/images/discoveries/generated/${slug}/${format.replace(":", "x")}.jpg`;
}

function inBothLocales<
  Field extends "title" | "description" | "alt" | "caption" | "credit",
>(slug: GeneratedImageSlug, field: Field): Record<Language, string> {
  return {
    fr: generatedImagesCopy.fr.images[slug][field],
    en: generatedImagesCopy.en.images[slug][field],
  };
}

// @req REQ-164
export function generatedImagePublications(): DiscoveryPublication[] {
  const slugs = DISCOVERY_SLUGS as Record<string, Record<Language, string>>;
  return RECORDS.map((record) => {
    const verified = VERIFIED_SOURCES[record.slug];
    const shipped = SHIPPED_DOWNLOADS.has(record.slug);
    const description = inBothLocales(record.slug, "description");
    return {
      id: `image:${record.slug}`,
      kind: "image",
      status: "published",
      collection: record.collection,
      slug: slugs[`image:${record.slug}`],
      title: inBothLocales(record.slug, "title"),
      description,
      caption: inBothLocales(record.slug, "caption"),
      captionExceedsCorpus: record.captionExceedsCorpus,
      captionSource: verified?.captionSource,
      source: verified?.source,
      generation: { ...GENERATION, jobId: record.jobId },
      detail: {
        body: { fr: [description.fr], en: [description.en] },
        entities: record.entities.map(({ kind, id }) => ({
          kind,
          id,
          label: {
            fr: generatedImagesCopy.fr.entities[id],
            en: generatedImagesCopy.en.entities[id],
          },
        })),
        sources: verified
          ? [
              { title: verified.source.title, url: verified.source.url },
              ...verified.detailSources,
              ...(verified.captionSource ? [verified.captionSource] : []),
            ]
          : [],
      },
      image: shipped
        ? {
            src: generatedDownloadPath(record.slug, "4:5"),
            credit: generatedImagesCopy.fr.images[record.slug].credit,
            shortCredit: inBothLocales(record.slug, "credit"),
            alt: inBothLocales(record.slug, "alt"),
            licence: "cc-by-sa",
            licenceUrl: CC_BY_SA_4_URL,
          }
        : undefined,
      downloads: shipped
        ? Object.fromEntries(
            derivableFormats(record).map((format) => [
              format,
              generatedDownloadPath(record.slug, format),
            ])
          )
        : undefined,
    } satisfies DiscoveryPublication;
  });
}
