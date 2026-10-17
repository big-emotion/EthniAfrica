import type { Metadata } from "next";

import {
  getNameAddressSpellings,
  resolveNameAddress,
} from "@/api/v2/services/nameAddresses";
import { RecherchePageContent } from "@/components/pages/RecherchePageContent";
import { NameAddressProvider } from "@/components/search/NameAddressProvider";
import { PRODUCT_NAME } from "@/lib/brand";
import { nameAddressCopy } from "@/lib/i18n/copy/nameAddress";
import { getNameAnswerRoute } from "@/lib/routing";
import { readAddressedName } from "@/lib/search/serverSearchReading";
import { pageHead } from "@/lib/seo/pageHead";
import type { Language } from "@/types/shared";

interface PageParams {
  lang: string;
  name: string;
}

/**
 * The address's own head: a title and a description naming the name as the
 * corpus spells it, and the address itself as the canonical — where the
 * `?q=` reading of the same name points at the bare search page.
 */
// @req REQ-200
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { lang, name } = await params;
  const address = await resolveNameAddress(name);
  // The layout answers 404 for a form with no address; a 404 declares nothing.
  if (!address) return {};

  const copy = nameAddressCopy[lang as Language];
  const title = `${copy.title(address.spelling)} | ${PRODUCT_NAME}`;
  const description = copy.description(address.spelling);
  return {
    title,
    description,
    ...pageHead(getNameAnswerRoute(lang as Language, address.spelling), {
      title,
      description,
    }),
  };
}

/**
 * The result page for one answered name, read on the server so its HTML
 * carries the answer (REQ-200). It is the approved result page exactly: the
 * same reading the browser builds from `?q=`, handed to the same component,
 * with no breadcrumb trail, like the search page.
 *
 * The layout has already settled the 404 and the redirect, so the form here
 * always has an address.
 */
// @req REQ-200
export default async function NameAddressPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { lang, name } = await params;
  const address = await resolveNameAddress(name);
  if (!address) return null;

  const [reading, spellings] = await Promise.all([
    readAddressedName(address.spelling, lang as Language),
    getNameAddressSpellings(),
  ]);
  return (
    <NameAddressProvider spellings={spellings}>
      <RecherchePageContent reading={reading} />
    </NameAddressProvider>
  );
}
