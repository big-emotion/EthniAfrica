import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  PageLoadingScreen,
  type PageLoadingScreenProps,
} from "@/components/system/PageLoadingScreen";
import { ConsentProvider } from "@/hooks/use-consent";
import { getLocalizedRoute } from "@/lib/routing";

/**
 * PageLayout is rendered for real rather than mocked. The claims that matter
 * here are about what the shell puts on the page beside the fact — a title
 * plate, a trail — and a mocked shell renders neither, so it would report
 * both defects as absent while they shipped. Its footer reads the consent
 * context, which the app supplies from providers.tsx.
 */
const renderInShell = (ui: ReactElement) =>
  render(<ConsentProvider>{ui}</ConsentProvider>);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => getLocalizedRoute("fr", "countries"),
  useSearchParams: () => new URLSearchParams(),
}));

const loadingScreen = async (props: PageLoadingScreenProps) =>
  renderInShell(await PageLoadingScreen(props));

describe("PageLoadingScreen", () => {
  /**
   * The wait has to say what it is waiting for. A screen reader gets this
   * sentence and nothing else, so "Chargement" alone would leave its user
   * with less than the sighted reader reads off the surrounding page.
   */
  // @req REQ-104
  it("announces what the reader is waiting for", async () => {
    await loadingScreen({ label: "Chargement du quiz" });

    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "Chargement du quiz"
    );
  });

  /**
   * The shell is the arriving page's own layout, so React reconciles the two
   * trees and the header, search and footer are never unmounted mid-
   * navigation — otherwise the wait reads as a full page reload.
   */
  // @req REQ-098
  it("keeps the page shell up around the wait", async () => {
    await loadingScreen({ label: "Chargement" });

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(screen.getByTestId("page-loading-band")).toBeInTheDocument();
  });

  /**
   * The plate and the trail used to be painted here, and on `/fr/atlas`
   * they took the top of the fold from the one thing the wait exists to show.
   * Neither names a place the reader has arrived at, so neither is drawn.
   */
  // @req REQ-113
  it("shows the fact alone, under no plate and no trail", async () => {
    await loadingScreen({ label: "Chargement" });

    expect(screen.getByTestId("did-you-know-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("page-hero")).toBeNull();
    expect(
      screen.queryByRole("navigation", { name: "Fil d'ariane" })
    ).toBeNull();
  });

  /**
   * The same coastline the basemap and the fiche wait draw. A spinner here
   * would be the one wait state on the site that belongs to no map.
   */
  // @req REQ-104
  it("draws the atlas coastline rather than a borrowed spinner", async () => {
    const { container } = await loadingScreen({ label: "Chargement" });

    expect(container.querySelector("svg.afh-atl-figure")).not.toBeNull();
  });

  /**
   * `--accent` carries two incompatible meanings in this codebase: shadcn's
   * bare HSL triplet in index.css, a hex on the .afh-accent-* wrappers in
   * color.css. Outside a wrapper the triplet wins, `fill: var(--accent)`
   * resolves to nothing, and the continent renders black — a defect no
   * assertion about markup can see, which is why this one is about scope.
   */
  // @req REQ-104
  it("inks the coastline inside an accent scope, never on the bare page", async () => {
    const { container } = await loadingScreen({ label: "Chargement" });

    expect(
      container.querySelector("[class*='afh-accent-'] svg.afh-atl-figure")
    ).not.toBeNull();
  });

  // @req REQ-113
  it("spends the wait on a fact rather than on a bare indicator", async () => {
    await loadingScreen({ label: "Chargement" });

    expect(screen.getByText("Saviez-vous que")).toBeInTheDocument();
  });
});

describe("PageLoadingScreen — the wait is in French (REQ-140)", () => {
  // @req REQ-140
  it("dresses the shell in French", async () => {
    await loadingScreen({ label: "Chargement" });

    expect(screen.getByTestId("site-brand")).toHaveAttribute("href", "/fr");
  });

  // @req REQ-140
  // @req REQ-145
  it("selects the French loading label", async () => {
    await loadingScreen({
      label: {
        fr: "Chargement de la présentation",
      },
    });

    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "Chargement de la présentation"
    );
  });
});
