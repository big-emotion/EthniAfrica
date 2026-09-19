"use client";

import { ConsentBanner } from "@/components/consent";
import { RouteTransitionLoader } from "@/components/system/RouteTransitionLoader";
import { Toaster } from "@/components/ui/toaster";

/** Client-only chrome that no route needs in order to paint its first frame. */
// @req REQ-112
export function DeferredClientChrome() {
  return (
    <>
      <Toaster />
      <RouteTransitionLoader />
      <ConsentBanner />
    </>
  );
}
