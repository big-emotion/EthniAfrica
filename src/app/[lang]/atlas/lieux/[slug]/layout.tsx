import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { loadPlaceFiche } from "@/lib/fiche/ficheExistence";

interface LayoutParams {
  lang: string;
  slug: string;
}

/**
 * Resolves the slug ahead of the sibling `loading.tsx`'s Suspense boundary
 * (REQ-052), as the patronyme fiche does: a layout wraps that boundary rather
 * than sitting inside it, so an unknown place 404s on the initial response
 * instead of streaming a shell first. `loadPlaceFiche` is request-cached, so
 * the page's own read costs no second query.
 */
// @req REQ-196
export default async function PlaceSlugLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<LayoutParams>;
}) {
  const { slug } = await params;
  const place = await loadPlaceFiche(decodeURIComponent(slug));
  if (!place) {
    notFound();
  }

  return children;
}
