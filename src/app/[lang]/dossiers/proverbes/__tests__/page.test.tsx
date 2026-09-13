import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { proverbsCopy } from "@/lib/i18n/copy/proverbs";
import {
  PROVERBS,
  filterProverbs,
  proverbEntities,
  type Proverb,
} from "@/lib/proverbs/proverbs";
import { PROVERBS_EN } from "@/lib/proverbs/proverbs.en";
import { getLocalizedRoute } from "@/lib/routing";

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import ProverbsPage from "@/app/[lang]/dossiers/proverbes/page";

const PER_PAGE = 10;
const ROUTE = getLocalizedRoute("fr", "proverbs");

/**
 * The page's cards, by id, read from the DOM rather than the accessibility
 * tree: `getByRole` over a page of cards timed out under the full suite while
 * asserting nothing a selector does not.
 */
async function renderPage(query: Record<string, string> = {}, lang = "fr") {
  render(
    await ProverbsPage({
      params: Promise.resolve({ lang }),
      searchParams: Promise.resolve(query),
    })
  );
  return [...document.querySelectorAll("article[data-proverb]")].map(
    (card) => card.id
  );
}

const ids = (entries: readonly Proverb[]) => entries.map((entry) => entry.id);

const firstOfKind = (kind: "country" | "people" | "family") =>
  proverbEntities().find((entity) => entity.kind === kind)!;

describe("The proverbs dossier — ten at a time (REQ-108)", () => {
  // Measured at 430 px: the whole bank on one page stood 39 721 px tall.
  // @req REQ-108
  it("opens on the first ten proverbs", async () => {
    expect(PROVERBS.length).toBeGreaterThan(PER_PAGE);
    expect(await renderPage()).toEqual(ids(PROVERBS.slice(0, PER_PAGE)));
  });

  // @req REQ-108
  it("shows the page its address names", async () => {
    expect(await renderPage({ page: "2" })).toEqual(
      ids(PROVERBS.slice(PER_PAGE, 2 * PER_PAGE))
    );
  });

  // A page number kept from a longer selection lands on readings, not on an
  // empty list that reads as an empty dossier.
  // @req REQ-108
  it("lands a page past the end on the last page", async () => {
    const lastPage = Math.ceil(PROVERBS.length / PER_PAGE);
    expect(await renderPage({ page: "99" })).toEqual(
      ids(PROVERBS.slice((lastPage - 1) * PER_PAGE))
    );
  });

  // Page two of a narrowing is the second page of the narrowed set, and its
  // links keep the narrowing.
  // @req REQ-108
  it("pages inside a narrowing and keeps it in every page link", async () => {
    const narrowed = filterProverbs(PROVERBS, { origin: "attested" });
    expect(narrowed.length).toBeGreaterThan(PER_PAGE);

    expect(await renderPage({ origine: "attested", page: "2" })).toEqual(
      ids(narrowed.slice(PER_PAGE, 2 * PER_PAGE))
    );
    const pageLinks = [
      ...document.querySelectorAll<HTMLAnchorElement>(
        '[data-testid="facet-pagination-top"] a[aria-label^="Page "]'
      ),
    ];
    expect(pageLinks.length).toBeGreaterThan(0);
    for (const link of pageLinks) {
      expect(link.getAttribute("href")).toContain("origine=attested");
    }
  });
});

describe("The proverbs dossier — filters (REQ-113)", () => {
  // @req REQ-113
  it("narrows by country", async () => {
    const country = firstOfKind("country");
    expect(await renderPage({ pays: country.id })).toEqual(
      ids(filterProverbs(PROVERBS, { country: country.id }).slice(0, PER_PAGE))
    );
  });

  // The filters cross: a people and an origin together keep only what both
  // describe.
  // @req REQ-113
  it("crosses a people with an origin", async () => {
    // Taken from an attested proverb, so the crossing holds something whatever
    // order the bank grows in.
    const people = PROVERBS.find(
      (entry) => entry.origin.status === "attested"
    )!.entities.find((entity) => entity.kind === "people")!;
    const crossed = filterProverbs(PROVERBS, {
      people: people.id,
      origin: "attested",
    });
    expect(crossed.length).toBeGreaterThan(0);
    expect(
      await renderPage({ peuple: people.id, origine: "attested" })
    ).toEqual(ids(crossed.slice(0, PER_PAGE)));
  });

  // The one narrowing only this dossier can offer: the sayings the web calls
  // African while no source names a people.
  // @req REQ-113
  it("shows only the unestablished origins when asked", async () => {
    const shown = await renderPage({ origine: "unestablished" });
    expect(shown.length).toBeGreaterThan(0);
    for (const id of shown) {
      expect(PROVERBS.find((entry) => entry.id === id)?.origin.status).toBe(
        "unestablished"
      );
    }
  });

  // @req REQ-113
  it("ignores an origin the atlas does not define", async () => {
    expect(await renderPage({ origine: "bogus" })).toEqual(
      ids(PROVERBS.slice(0, PER_PAGE))
    );
  });

  // Each applied narrowing is named while the fold is shut, and lifting one
  // keeps the others.
  // @req REQ-113
  it("names each applied filter with a link that lifts it alone", async () => {
    const country = firstOfKind("country");
    await renderPage({ pays: country.id, origine: "attested", page: "2" });

    const chips = [
      ...document.querySelectorAll<HTMLAnchorElement>(
        '[data-testid="facet-active-filters"] a'
      ),
    ];
    const hrefs = chips.map((chip) => chip.getAttribute("href"));
    expect(hrefs).toContain(`${ROUTE}?pays=${country.id}`);
    expect(hrefs).toContain(`${ROUTE}?origine=attested`);
  });

  // A choice that narrows to nothing is a dead end offered on purpose.
  // @req REQ-113
  it("offers as choices only the entries the bank names", async () => {
    await renderPage();

    const offered = (name: string) =>
      [
        ...document.querySelectorAll<HTMLOptionElement>(
          `select[name="${name}"] option`
        ),
      ]
        .map((option) => option.value)
        .filter(Boolean)
        .sort();
    const named = (kind: "country" | "people" | "family") =>
      proverbEntities()
        .filter((entity) => entity.kind === kind)
        .map((entity) => entity.id)
        .sort();

    expect(offered("pays")).toEqual(named("country"));
    expect(offered("peuple")).toEqual(named("people"));
    expect(offered("famille")).toEqual(named("family"));
    expect(offered("origine")).toEqual(
      ["attested", "estimated", "unestablished"].sort()
    );
  });

  // @req REQ-113
  it("says so when no proverb matches", async () => {
    // An unestablished origin carries no chip, so no people crosses it.
    const people = firstOfKind("people");
    expect(
      await renderPage({ peuple: people.id, origine: "unestablished" })
    ).toEqual([]);
    expect(screen.getByText(proverbsCopy.fr.empty)).toBeInTheDocument();
  });

  // Found in review: `?peuple=PPL_NOBODY` printed a chip reading the raw
  // identifier while the select said « Tous les peuples ». A value the bank
  // does not name narrows nothing and is never shown to the reader.
  // @req REQ-113
  it("ignores a country, people or family the bank does not name", async () => {
    for (const query of [
      { peuple: "PPL_NOBODY" },
      { pays: "gha" },
      { famille: "FLG_NOBODY" },
    ]) {
      cleanup();
      expect(await renderPage(query), JSON.stringify(query)).toEqual(
        ids(PROVERBS.slice(0, PER_PAGE))
      );
      expect(
        document.querySelector('[data-testid="facet-active-filters"]'),
        JSON.stringify(query)
      ).toBeNull();
    }
  });

  // @req REQ-145
  it("prints the English bank on /en", async () => {
    await renderPage({}, "en");

    const first = PROVERBS[0];
    expect(
      document.querySelector(`article[id="${first.id}"] h2`)
    ).toHaveTextContent(PROVERBS_EN[first.id].text);
  });
});
