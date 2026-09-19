import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("root client payload", () => {
  // @req REQ-112
  test("keeps route-specific data tooling out of the global provider", () => {
    const providers = read("src/app/providers.tsx");

    expect(providers).not.toContain("@tanstack/react-query");
    expect(providers).not.toContain("QueryClientProvider");
  });

  // @req REQ-112
  test("defers non-critical client chrome until after first paint", () => {
    const providers = read("src/app/providers.tsx");

    expect(providers).not.toMatch(
      /import\s+\{\s*Toaster\s*\}\s+from\s+["']@\/components\/ui\/toaster["']/
    );
    expect(providers).not.toContain("@/components/ui/sonner");
    expect(providers).not.toMatch(
      /import\s+\{\s*RouteTransitionLoader\s*\}\s+from/
    );
    expect(providers).toContain(
      'import("@/components/system/DeferredClientChrome")'
    );
    expect(providers).not.toContain("requestAnimationFrame");
    expect(providers).toContain("pointerdown");
    expect(providers).toContain("keydown");
    expect(providers).toContain("touchstart");
    expect(providers).toContain("scroll");
    expect(providers).toContain("15_000");
  });

  // @req REQ-112
  test("does not hydrate or connect to an unused Typeform integration", () => {
    const layout = read("src/app/layout.tsx");
    const packageJson = read("package.json");

    expect(layout).not.toContain("TypeformPreload");
    expect(packageJson).not.toContain('"sonner"');
  });

  // @req REQ-112
  test("loads global dialog code only when a dialog is opened", () => {
    const pageLayout = read("src/components/layout/PageLayout.tsx");

    expect(pageLayout).not.toMatch(
      /import\s+\{\s*SearchModalV2\s*\}\s+from\s+["']@\/components\/search\/SearchModalV2["']/
    );
    expect(pageLayout).not.toMatch(
      /import\s+\{\s*KeyboardShortcutsModal\s*\}\s+from\s+["']@\/components\/layout\/KeyboardShortcutsModal["']/
    );
    expect(pageLayout).toContain('import("@/components/search/SearchModalV2")');
    expect(pageLayout).toContain(
      'import("@/components/layout/KeyboardShortcutsModal")'
    );
    expect(pageLayout).toContain("isSearchOpen ? (");
    expect(pageLayout).toContain("isShortcutsOpen ? (");
  });
});
