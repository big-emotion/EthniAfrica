"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

/**
 * The night map is held back until the reader asks for it: right under the
 * hero it read as an empty page, and the parchment is what people came for.
 *
 * The toggle sits in the shell's hero plate and the band in the sequence, two
 * subtrees a server component apart, so a context provider has no common
 * client ancestor to live in. A module-level flag read through
 * useSyncExternalStore is the smallest thing both can share. It is per page
 * load, never per request: the server snapshot is always `closed`.
 */
// @req REQ-112
export const FICHE_MAP_BAND_ID = "fiche-map-band";

let open = false;
const listeners = new Set<() => void>();

// @req REQ-112
export function setFicheMapOpen(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

// @req REQ-112
export function useFicheMapOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  );
}

// @req REQ-112
export function FicheMapBand({ children }: { children: ReactNode }) {
  const isOpen = useFicheMapOpen();
  const bandRef = useRef<HTMLDivElement>(null);

  // Client navigation between fiches reuses the module: leaving must not
  // carry an open map onto the next page.
  useEffect(() => () => setFicheMapOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    bandRef.current?.scrollIntoView?.({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [isOpen]);

  return (
    <div
      ref={bandRef}
      id={FICHE_MAP_BAND_ID}
      data-fiche-map-band=""
      hidden={!isOpen}
    >
      {isOpen ? children : null}
    </div>
  );
}
