"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  buildNameAddressDirectory,
  nameSearchHref,
  type NameAddressDirectory,
} from "@/lib/search/nameAddress";
import type { Language } from "@/types/shared";

const NameAddressContext = createContext<NameAddressDirectory | null>(null);

/**
 * Hands the search pages' links the forms that have an address (REQ-200),
 * read once on the server from the same cached list as the sitemap.
 *
 * A route that mounts none — a fiche, the search modal — links every form to
 * the search page's reading, as before.
 */
// @req REQ-200
export function NameAddressProvider({
  spellings,
  children,
}: {
  spellings: readonly string[];
  children: ReactNode;
}) {
  const directory = useMemo(
    () => buildNameAddressDirectory(spellings),
    [spellings]
  );
  return (
    <NameAddressContext.Provider value={directory}>
      {children}
    </NameAddressContext.Provider>
  );
}

/** Where a link naming a form leads, given the addresses in scope. */
// @req REQ-200
export function useNameSearchHref(language: Language) {
  const directory = useContext(NameAddressContext);
  return useCallback(
    (form: string) => nameSearchHref(language, form, directory),
    [language, directory]
  );
}
