import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ApproachSources from "@/components/pages/ApproachSources";

function setViewport(width: number) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: width >= 768,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("ApproachSources responsive disclosure (ETNI-2133)", () => {
  // @req REQ-132
  it("emphasizes publication titles inside source links", () => {
    render(
      <ApproachSources
        title="Sources"
        listLabel="La liste"
        preview="Première source · +7"
        moreLabel="+ en savoir plus"
        lessLabel="− replier"
        sources={[
          {
            title: "Nations unies, World Population Prospects 2024",
            hrefs: ["https://example.com"],
            italicSegments: ["World Population Prospects 2024"],
            type: "Statistiques officielles",
          },
        ]}
      />
    );

    expect(screen.getByText("World Population Prospects 2024").tagName).toBe(
      "EM"
    );
  });

  // @req REQ-132
  it.each([320, 430])("starts folded at %ipx", async (width) => {
    setViewport(width);
    render(
      <ApproachSources
        title="Sources"
        listLabel="La liste"
        preview="Première source · +7"
        moreLabel="+ en savoir plus"
        lessLabel="− replier"
        sources={[]}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText("La liste").closest("details")
      ).not.toHaveAttribute("open")
    );
  });

  // @req REQ-132
  it.each([768, 1440])("starts open at %ipx", async (width) => {
    setViewport(width);
    render(
      <ApproachSources
        title="Sources"
        listLabel="La liste"
        preview="Première source · +7"
        moreLabel="+ en savoir plus"
        lessLabel="− replier"
        sources={[]}
      />
    );

    await waitFor(() =>
      expect(screen.getByText("La liste").closest("details")).toHaveAttribute(
        "open"
      )
    );
  });
});
