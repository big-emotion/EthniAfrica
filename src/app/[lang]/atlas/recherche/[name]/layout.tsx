import { notFound, permanentRedirect } from "next/navigation";
import type { ReactNode } from "react";

import { resolveNameAddress } from "@/api/v2/services/nameAddresses";
import { getNameAnswerRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

interface LayoutParams {
  lang: string;
  name: string;
}

/**
 * Decides the address before the page reads anything (REQ-200, DEC-074),
 * from a layout as the place fiche does, so the 404 and the redirect are
 * settled ahead of the page's own wait (REQ-052).
 *
 * A form with no address answers 404. A variant of an addressed form — its
 * accents left out, its case changed — reaches the corpus spelling by one
 * permanent redirect, so the same answer never has two indexable pages. A
 * directory that cannot be read rejects and reaches the error boundary: a
 * 404 there would tell crawlers to drop addresses that still stand.
 */
// @req REQ-200
export default async function NameAddressLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<LayoutParams>;
}) {
  const { lang, name } = await params;
  const address = await resolveNameAddress(name);
  if (!address) {
    notFound();
  }
  if (!address.isAddress) {
    permanentRedirect(getNameAnswerRoute(lang as Language, address.spelling));
  }

  return children;
}
