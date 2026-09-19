import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlatesBlock } from "@/components/search/feed/PlatesBlock";

// @req REQ-180
describe("PlatesBlock", () => {
  it("preserves the editorial order in a reachable shelf", () => {
    render(
      <PlatesBlock
        items={[
          {
            type: "proverb",
            id: "proverb-1",
            contentLanguage: "fr",
            text: "Le nom voyage.",
            meaning: "Les mots changent avec les chemins.",
            original: {
              text: "Tɔgɔ be taama.",
              lang: "bm",
              language: "bambara",
            },
            origin: {
              status: "attested",
              note: "Attesté dans le recueil.",
            },
            sources: [{ title: "Recueil", url: null, tier: "referenced" }],
            match: {
              relation: "linked-country",
              entityType: "country",
              entityId: "MLI",
            },
          },
          {
            type: "anecdote",
            id: "anecdote-1",
            contentLanguage: "fr",
            headline: "Une graphie devenue commune",
            body: ["Une archive documente cette graphie."],
            tier: "referenced",
            sources: [
              {
                title: "Archive",
                url: "https://example.org/archive",
                tier: "referenced",
              },
            ],
            match: {
              relation: "exact",
              entityType: "people",
              entityId: "PPL_MANDE",
            },
            illustration: {
              src: "/images/a.jpg",
              alt: "Document historique",
              credit: "Archive nationale",
            },
          },
        ]}
      />
    );

    const list = screen.getByRole("list", {
      name: "Récits et proverbes",
    });
    expect(list).toHaveClass("overflow-x-auto");
    const items = Array.from(list.children);
    expect(items[0]).toHaveTextContent("Le nom voyage");
    expect(items[1]).toHaveTextContent("Une graphie devenue commune");
    expect(items[0]).toHaveClass("w-[250px]", "min-[1200px]:w-[232px]");
    expect(screen.getByText("Même pays")).toHaveAttribute(
      "data-companion-relation",
      "linked-country"
    );
    expect(screen.getByText("Attesté dans le recueil.")).toBeInTheDocument();
    expect(screen.getByText("Recueil").tagName).toBe("CITE");
    expect(
      screen.getByText("Une archive documente cette graphie.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Archive nationale/)).toBeInTheDocument();
  });
});
