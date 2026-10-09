"use client";

import { usePathname } from "next/navigation";
import { Language } from "@/types/shared";
import { getLanguageFromRoute } from "@/lib/routing";
import { FALLBACK_LOCALE } from "@/lib/locale";

/**
 * The locale of the page a client component is rendered on.
 *
 * For the components that format a figure or a date deep inside a fiche —
 * the source review chip, the source sheet — where threading the locale through
 * every caller would move dozens of files for one argument. Outside the App
 * Router (a story, a test that mocked no route) `usePathname` answers null,
 * and French is the answer there too: it is the only locale published.
 */
// @req REQ-140
export const useRouteLanguage = (): Language =>
  getLanguageFromRoute(usePathname() ?? "") ?? FALLBACK_LOCALE;

// @req REQ-091
export const useLanguage = (): { language: Language } => ({
  language: useRouteLanguage(),
});
