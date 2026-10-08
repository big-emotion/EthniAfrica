import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NommerChapterPage } from "@/components/dossiers/nommer/NommerChapterPage";
import { isModulePublished } from "@/lib/hubs/moduleOffer";
import { getNommerChapter } from "@/lib/dossiers/nommer/chapters";
import { localizeNommerChapter } from "@/lib/dossiers/nommer/localizeChapter";
import { getNommerChapterRoute } from "@/lib/routing";
import { pageHead } from "@/lib/seo/pageHead";
import type { Language } from "@/types/shared";

const CHAPTER = getNommerChapter("la-chose");

interface PageProps {
  params: Promise<{ lang: string }>;
}

// @req REQ-113
// @req REQ-141
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isModulePublished("nommer")) return {};
  const chapter = localizeNommerChapter(CHAPTER, lang as Language);
  const copy = { title: chapter.title, description: chapter.standfirst.text };
  return {
    ...copy,
    ...pageHead(getNommerChapterRoute("fr", "la-chose"), copy),
  };
}

// @req REQ-113
export default async function NommerLaChosePage({ params }: PageProps) {
  const { lang } = await params;
  if (!isModulePublished("nommer")) notFound();
  return <NommerChapterPage chapter={CHAPTER} language={lang as Language} />;
}
