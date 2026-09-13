import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageLayout } from "@/components/layout/PageLayout";
import { DiscoveryReader } from "@/components/discoveries/DiscoveryReader";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import {
  discoveryPath,
  eligiblePublications,
  orderedDeck,
  resolvePublication,
} from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import { isLocale } from "@/lib/locale";
import { localeHead } from "@/lib/seo/localeAlternates";

interface DiscoveriesPageProps {
  params: Promise<{ lang: string; publication?: string[] }>;
}

function requestedEntry(lang: string, parts?: string[]) {
  if (!isLocale(lang) || (parts && parts.length !== 1)) notFound();
  const entries = eligiblePublications(getDiscoveryPublications());
  const selected = parts
    ? resolvePublication(entries, lang, parts[0])
    : (entries[0] ?? null);
  if (!selected) notFound();
  return { language: lang, entries, selected };
}

// @req REQ-158
export async function generateMetadata({
  params,
}: DiscoveriesPageProps): Promise<Metadata> {
  const { lang, publication } = await params;
  const { language, selected } = requestedEntry(lang, publication);
  const title = selected.title[language];
  const description = selected.description[language];
  const head = localeHead(
    language,
    (locale) => discoveryPath(locale, selected),
    ["fr"],
    { title, description }
  );
  return {
    title,
    description,
    ...head,
    openGraph: {
      ...head.openGraph,
      images: [
        {
          url: `https://${CANONICAL_DOMAIN}${selected.image.src}`,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://${CANONICAL_DOMAIN}${selected.image.src}`],
    },
  };
}

// @req REQ-158
export default async function DiscoveriesPage({
  params,
}: DiscoveriesPageProps) {
  const { lang, publication } = await params;
  const { language, entries, selected } = requestedEntry(lang, publication);
  if (!publication) redirect(discoveryPath(language, selected));
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const deck = orderedDeck(entries, selected.id);
  const publications = deck.flatMap((id) => {
    const entry = byId.get(id);
    return entry ? [entry] : [];
  });
  const label = discoveriesCopy[language].title;

  return (
    <PageLayout
      language={language}
      sectionName={label}
      hideHeader
      hideTrail
      flushTop
    >
      <DiscoveryReader
        language={language}
        publications={publications}
        initialId={selected.id}
      />
    </PageLayout>
  );
}
