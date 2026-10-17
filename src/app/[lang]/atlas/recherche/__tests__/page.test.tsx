import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/nameAddresses", () => ({
  getNameAddressSpellings: vi.fn(async () => ["Lingala"]),
}));
// The page's own reading is not under test here: a probe stands in for it
// and prints where its links would lead.
vi.mock("@/components/pages/RecherchePageContent", async () => {
  const { useNameSearchHref } =
    await import("@/components/search/NameAddressProvider");
  return {
    RecherchePageContent: function Probe() {
      const nameHref = useNameSearchHref("fr");
      return <p>{`${nameHref("lingala")} ${nameHref("Bangala")}`}</p>;
    },
  };
});

import RecherchePage from "@/app/[lang]/atlas/recherche/page";
import { getNameAddressSpellings } from "@/api/v2/services/nameAddresses";
import { getLocalizedRoute, getNameAnswerRoute } from "@/lib/routing";

describe("the search page's links", () => {
  // A typed query stays a reading here, but a name it links to that has an
  // address is linked at that address (REQ-200).
  // @req REQ-200
  it("hands its links the addresses of answered names", async () => {
    const html = renderToString(await RecherchePage());

    expect(html).toContain(getNameAnswerRoute("fr", "Lingala"));
    expect(html).toContain(`${getLocalizedRoute("fr", "search")}?q=Bangala`);
  });

  // An unreadable directory costs the addresses, never the search page.
  // @req REQ-200
  it("still renders, linking to readings, when the addresses cannot be read", async () => {
    vi.mocked(getNameAddressSpellings).mockRejectedValueOnce(new Error("down"));

    const html = renderToString(await RecherchePage());

    expect(html).toContain(`${getLocalizedRoute("fr", "search")}?q=lingala`);
  });
});
