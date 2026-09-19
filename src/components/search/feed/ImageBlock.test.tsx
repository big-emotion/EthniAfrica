import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImageBlock } from "@/components/search/feed/ImageBlock";
import type { FeedGeneratedImageItem } from "@/components/search/feed/ImageBlock";

const imageItem: FeedGeneratedImageItem = {
  id: "image-1",
  href: "/fr/decouvertes/images/mande",
  slug: "mande",
  title: "Le voyage du nom Mande",
  description: "Une interprétation documentée.",
  caption: "Une interprétation du voyage du nom",
  image: {
    src: "/images/mande.jpg",
    alt: "Interprétation graphique du nom Mande",
    credit: "EthniAfrica",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  generation: {
    tool: "Test tool",
    model: "Test model",
    generatedOn: "2026-09-19",
    sourceKind: "ai_generated",
  },
  source: {
    title: "Source documentée",
    url: null,
    tier: "referenced",
  },
  match: {
    relation: "recent",
    entityType: "people",
    entityId: "PPL_MANDE",
  },
};

// @req REQ-180
describe("ImageBlock", () => {
  it("declares generated imagery and publishes its provenance", () => {
    render(<ImageBlock item={imageItem} />);

    expect(
      screen.getByText("Image générée — une interprétation")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CC BY-SA" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/"
    );
    expect(screen.getByText(/Test tool · Test model/)).toBeInTheDocument();
    expect(screen.getByText("Source documentée")).toBeInTheDocument();
    expect(screen.getByText("Récent dans l’atlas")).toHaveAttribute(
      "data-companion-relation",
      "recent"
    );
  });

  // @req REQ-180
  it("localizes the public-domain licence label", () => {
    const publicDomainItem: FeedGeneratedImageItem = {
      ...imageItem,
      image: {
        ...imageItem.image,
        licence: "public-domain",
        licenceUrl: null,
      },
    };
    const { rerender } = render(
      <ImageBlock item={publicDomainItem} language="fr" />
    );

    expect(screen.getByText("Domaine public")).toBeInTheDocument();

    rerender(<ImageBlock item={publicDomainItem} language="en" />);

    expect(screen.getByText("Public domain")).toBeInTheDocument();
  });
});
