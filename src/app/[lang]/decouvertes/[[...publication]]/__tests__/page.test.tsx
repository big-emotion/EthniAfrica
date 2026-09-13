import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import DiscoveriesPage, {
  generateMetadata,
} from "@/app/[lang]/decouvertes/[[...publication]]/page";
import { eligiblePublications } from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";

const params = (publication?: string[], lang = "fr") =>
  Promise.resolve({ lang, publication });

describe("Découvertes server entry", () => {
  // @req REQ-158
  it("redirects the destination entry to a real publication permalink", async () => {
    await expect(DiscoveriesPage({ params: params() })).rejects.toThrow(
      "NEXT_REDIRECT:/fr/decouvertes/"
    );
  });
  // @req REQ-158
  it("renders the exact addressed publication on a cold request", async () => {
    render(
      await DiscoveriesPage({
        params: params(["guere-krahn-we"]),
      })
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Guéré"
    );
  });

  // @req REQ-158
  it("offers a real next permalink when JavaScript is unavailable", async () => {
    const html = renderToString(
      await DiscoveriesPage({ params: params(["guere-krahn-we"]) })
    );
    const noscript = html.slice(html.indexOf("<noscript>"));
    expect(html).toContain("<noscript>");
    // The deck is drawn per request, so the next permalink is any other
    // publication — never the one being read.
    expect(noscript).toMatch(
      /href="\/fr\/decouvertes\/(?!guere-krahn-we")[a-z0-9-]+"/
    );
  });

  // @req REQ-158
  it("rejects unknown and nested publication paths", async () => {
    await expect(
      DiscoveriesPage({ params: params(["unknown"]) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      DiscoveriesPage({ params: params(["guere-krahn-we", "extra"]) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  // @req REQ-158
  it("derives distinct crawler metadata from the same addressed publications", async () => {
    const first = await generateMetadata({
      params: params(["burkina-faso-trois-langues"]),
    });
    const second = await generateMetadata({
      params: params(["guere-krahn-we"]),
    });
    expect(first.title).not.toBe(second.title);
    expect(first.alternates?.canonical).toContain(
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    expect(second.alternates?.canonical).toContain(
      "/fr/decouvertes/guere-krahn-we"
    );
    expect(first.openGraph?.images).not.toEqual(second.openGraph?.images);
    expect(first.twitter?.images).not.toEqual(second.twitter?.images);
  });

  // A proverb carries no photo, so its share card falls back to the site's
  // own image rather than to an address that serves nothing.
  // @req REQ-158
  it("leaves a proverb's share image to the site default", async () => {
    const proverb = eligiblePublications(getDiscoveryPublications()).find(
      (entry) => entry.kind === "proverb"
    )!;
    const metadata = await generateMetadata({
      params: params([proverb.slug.fr]),
    });

    expect(metadata.title).toBe(proverb.title.fr);
    // The locale head already carries the site's share image; the proverb
    // adds none of its own on top of it.
    expect(metadata.openGraph?.images).toEqual(["/opengraph-image"]);
    expect(metadata.twitter?.images).toBeUndefined();
  });
});
