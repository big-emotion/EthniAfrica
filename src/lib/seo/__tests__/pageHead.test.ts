import { describe, expect, it } from "vitest";

import { CANONICAL_DOMAIN, OG_DESCRIPTION, OG_TITLE } from "@/lib/brand";
import { SITE_OPEN_GRAPH_IMAGE, pageHead } from "@/lib/seo/pageHead";

const BASE = `https://${CANONICAL_DOMAIN}`;

describe("pageHead", () => {
  // @req REQ-141
  it("declares an absolute canonical on the canonical domain", () => {
    expect(pageHead("/fr/glossaire").alternates).toEqual({
      canonical: `${BASE}/fr/glossaire`,
    });
  });

  // A one-locale site has no hreflang cluster to declare: an `alternates`
  // carrying `languages` would advertise a version that does not exist.
  // @req REQ-141
  it("declares no hreflang cluster", () => {
    expect(pageHead("/fr").alternates).not.toHaveProperty("languages");
  });

  // Next merges metadata shallowly, so the page card must be whole.
  // @req REQ-141
  it("carries a whole French Open Graph card with no alternate locale", () => {
    expect(pageHead("/fr/about").openGraph).toEqual({
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      type: "website",
      images: [SITE_OPEN_GRAPH_IMAGE],
      url: `${BASE}/fr/about`,
      locale: "fr_FR",
    });
  });

  // @req REQ-141
  it("takes the page's own title and description when it has them", () => {
    const head = pageHead("/fr/glossaire", {
      title: "Glossaire",
      description: "Les mots du projet",
    });

    expect(head.openGraph).toMatchObject({
      title: "Glossaire",
      description: "Les mots du projet",
    });
  });
});
