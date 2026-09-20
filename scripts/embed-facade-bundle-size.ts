import {
  evaluateIslandBudget,
  measureEntryGzipBytes,
  runBundleBudgetGate,
  type BundleBudgetResult,
} from "./lib/bundleBudget";

/**
 * REQ-181 — the third-party player facade (src/components/media/EmbedFacade.tsx)
 * is the one client component the Découvertes reader mounts for every
 * production, so it is measured on its own rather than left to grow inside the
 * reader.
 *
 * Eight kilobytes is what it has to pay for: reading and writing the consent
 * choice, one piece of state, the URL builder, focus management and its copy.
 * What it must not pay for is a player abstraction, a provider registry with
 * runtime dispatch or an intersection observer. If it does not fit, it has
 * grown something it should not have, which is what a budget is for.
 *
 * Measured the way the quiz island is: a targeted esbuild bundle of the entry,
 * vendor packages external, first-party modules bundled in.
 */
export const EMBED_FACADE_BUNDLE_BUDGET_BYTES = 8 * 1024; // 8 KB gzipped

const ENTRY_SOURCE = `export { EmbedFacade } from "@/components/media/EmbedFacade";\n`;

export function evaluateEmbedFacadeBudget(
  gzippedBytes: number
): BundleBudgetResult {
  return evaluateIslandBudget(
    gzippedBytes,
    EMBED_FACADE_BUNDLE_BUDGET_BYTES,
    "Embed facade"
  );
}

export function measureEmbedFacadeGzipBytes(): Promise<number> {
  return measureEntryGzipBytes(ENTRY_SOURCE, {
    entryLabel: "EmbedFacade",
    splitting: true,
  });
}

if (require.main === module) {
  runBundleBudgetGate(
    [
      {
        name: "Embed facade",
        budgetBytes: EMBED_FACADE_BUNDLE_BUDGET_BYTES,
        measureGzipBytes: measureEmbedFacadeGzipBytes,
      },
    ],
    "Fatal error measuring embed facade bundle size:"
  );
}
