"use client";

import {
  FICHE_MAP_BAND_ID,
  setFicheMapOpen,
  useFicheMapOpen,
} from "@/components/fiche/FicheMapBand";
import { ficheCopy } from "@/lib/i18n/copy/fiche";
import type { Language } from "@/types/shared";

// @req REQ-112
export function FicheMapToggle({ language }: { language: Language }) {
  const isOpen = useFicheMapOpen();
  const copy = ficheCopy[language];

  return (
    <button
      type="button"
      className="afh-parchment-map-toggle"
      data-testid="fiche-map-toggle"
      aria-expanded={isOpen}
      aria-controls={FICHE_MAP_BAND_ID}
      onClick={() => setFicheMapOpen(!isOpen)}
    >
      {isOpen ? copy.hideMap : copy.showMap}
    </button>
  );
}
