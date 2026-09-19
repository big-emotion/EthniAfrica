"use client";

import dynamic from "next/dynamic";
import { useState, type CSSProperties } from "react";

import { AfricaBasemap } from "@/components/system/AfricaBasemap";
import type { AtlasGlobeProps } from "@/components/atlas/AtlasGlobe";
import { Button } from "@/components/ui/button";
import { atlasCopy } from "@/lib/i18n/copy/atlas";

/**
 * The fiche keeps a map in its server response, then upgrades it to the
 * interactive globe only when the reader asks for it.
 *
 * Loading AtlasGlobe directly from a server route still scheduled its large
 * client chunk before first paint. On the mobile Lighthouse runner that made
 * otherwise server-rendered fiche copy wait behind roughly seven seconds of
 * globe evaluation. A static map still leads the fiche, while the explicit
 * action makes the expensive upgrade opt-in and keeps the first reading frame
 * stable on low-end devices as well as GPU-less audit runners.
 */
const AtlasGlobe = dynamic(
  () => import("@/components/atlas/AtlasGlobe").then((mod) => mod.AtlasGlobe),
  { ssr: false }
);

const ISLAND_STYLE: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "var(--afh-globe-stage-height)",
  overflow: "hidden",
  backgroundColor: "var(--afh-night-ground)",
};

const PLACEHOLDER_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  opacity: 0.18,
};

// @req REQ-112
export function FicheAtlasGlobeIsland(props: AtlasGlobeProps) {
  const [mounted, setMounted] = useState(false);
  const language = props.language ?? "fr";
  const copy = atlasCopy[language];

  return (
    <div
      data-testid="fiche-atlas-globe-island"
      data-globe-mounted={mounted ? "true" : "false"}
      style={ISLAND_STYLE}
    >
      {mounted ? (
        <AtlasGlobe {...props} />
      ) : (
        <>
          <AfricaBasemap
            data-testid="fiche-atlas-globe-placeholder"
            aria-hidden="true"
            style={PLACEHOLDER_STYLE}
          />
          {props.legend ?? (
            <p
              data-atlas-legend=""
              className="pointer-events-none absolute inset-x-0 top-0 p-3 text-afh-caption"
              style={{ color: "var(--afh-globe-stage-ink)" }}
            >
              {copy.legendStart}
            </p>
          )}
          <Button
            type="button"
            variant="accent"
            className="absolute bottom-4 left-1/2 z-[7] -translate-x-1/2"
            onClick={() => setMounted(true)}
          >
            {copy.activateInteractiveMap}
          </Button>
        </>
      )}
    </div>
  );
}
