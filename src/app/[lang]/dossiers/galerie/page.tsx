import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GeneratedImageBadge } from "@/components/discoveries/GeneratedImageBadge";
import { PageLayout } from "@/components/layout/PageLayout";
import { discoveryPath } from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import { galleryCollections } from "@/lib/discoveries/gallery";
import { isModulePublished } from "@/lib/hubs/moduleOffer";
import { galleryCopy } from "@/lib/i18n/copy/gallery";
import { getLocalizedRoute } from "@/lib/routing";
import { surfaceHead } from "@/lib/seo/localeAlternates";
import type { Language } from "@/types/shared";

import styles from "./gallery.module.css";

interface GalleryPageProps {
  params: Promise<{ lang: string }>;
}

// @req REQ-167
// @req REQ-141
export async function generateMetadata({
  params,
}: GalleryPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isModulePublished("galerie")) return {};
  const language = lang as Language;
  const copy = {
    title: galleryCopy[language].pageTitle,
    description: galleryCopy[language].pageSubtitle,
  };
  return {
    ...copy,
    ...surfaceHead(
      language,
      "gallery",
      (locale) => getLocalizedRoute(locale, "gallery"),
      copy
    ),
  };
}

/**
 * The generated images, shelved by collection.
 *
 * A browsing view of the Découvertes feed, not a second catalogue: every tile
 * comes from `galleryCollections`, which reads the feed's own eligibility
 * gate, and opens the publication's permalink rather than a page of its own.
 * The picture, its provenance and its sources are read there.
 *
 * Withheld while the module is `draft` — an open gallery listing nothing
 * would be a reading that promises what it does not hold.
 */
// @req REQ-167
export default async function GalleryPage({ params }: GalleryPageProps) {
  const { lang } = await params;
  if (!isModulePublished("galerie")) notFound();
  const language = lang as Language;
  const copy = galleryCopy[language];
  const groups = galleryCollections(getDiscoveryPublications());

  return (
    <PageLayout
      language={language}
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
    >
      {groups.length === 0 ? (
        <p className={styles.empty}>{copy.empty}</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.collection}
            className={styles.collection}
            data-collection={group.collection}
            aria-labelledby={`gallery-${group.collection}`}
          >
            <h2
              id={`gallery-${group.collection}`}
              className={styles.collectionTitle}
            >
              {copy.collections[group.collection]}
            </h2>
            <ul className={styles.grid}>
              {group.publications.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={discoveryPath(language, entry)}
                    className={styles.tile}
                    data-publication-id={entry.id}
                  >
                    <span className={styles.frame}>
                      <Image
                        className={styles.image}
                        src={entry.image.src}
                        alt={entry.image.alt?.[language] ?? ""}
                        fill
                        unoptimized
                        sizes="(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw"
                        style={{
                          objectPosition: entry.image.focus ?? "center",
                        }}
                      />
                      <span className={styles.badge}>
                        <GeneratedImageBadge
                          entry={entry}
                          language={language}
                        />
                      </span>
                    </span>
                    <span className={styles.title}>
                      {entry.title[language]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </PageLayout>
  );
}
