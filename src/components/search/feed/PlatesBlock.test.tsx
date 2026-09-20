import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PlatesBlock,
  type FeedPlateItem,
} from "@/components/search/feed/PlatesBlock";

const anecdote: FeedPlateItem = {
  type: "anecdote",
  id: "fact-frontiere",
  contentLanguage: "fr",
  headline: "Le même peuple change de nom à chaque frontière",
  body: ["Premier paragraphe.", "Second paragraphe."],
  tier: "referenced",
  sources: [{ title: "Recueil", url: null, tier: "referenced" }],
  match: { relation: "exact", entityType: "people", entityId: "PPL_FULA" },
  illustration: { src: "/images/a.jpg", alt: "Gare", credit: "ASC Leiden" },
};

const proverb: FeedPlateItem = {
  type: "proverb",
  id: "proverb-langue",
  contentLanguage: "fr",
  text: "Le nom voyage.",
  meaning: "Les mots changent avec les chemins.",
  original: null,
  origin: { status: "attested", note: "Attesté dans le recueil." },
  sources: [{ title: "Recueil", url: null, tier: "referenced" }],
  match: { relation: "linked-country", entityType: "country", entityId: "SEN" },
};

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
    expect(list).toHaveClass(
      "overflow-x-auto",
      "snap-x",
      "snap-mandatory",
      "scroll-px-afh-lg"
    );
    const items = Array.from(list.children);
    expect(items[0]).toHaveTextContent("Le nom voyage");
    expect(items[1]).toHaveTextContent("Une graphie devenue commune");
    expect(items[0]).toHaveClass(
      "w-[250px]",
      "snap-start",
      "min-[1200px]:w-[calc((100%-var(--afh-space-2xl))/2)]"
    );
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

  // @req REQ-178
  it("uses the reviewed board card density without relation or source-list rows", () => {
    render(
      <PlatesBlock
        reviewed
        items={[
          {
            type: "anecdote",
            id: "anecdote-reviewed",
            contentLanguage: "fr",
            headline: "Une graphie documentée",
            body: ["Hidden long body."],
            tier: "referenced",
            sources: [
              { title: "Hidden source", url: null, tier: "referenced" },
            ],
            match: {
              relation: "linked-country",
              entityType: "country",
              entityId: "MLI",
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

    expect(screen.queryByText("Même pays")).toBeNull();
    expect(screen.queryByText("Hidden long body.")).toBeNull();
    expect(screen.queryByText("Hidden source")).toBeNull();
    expect(screen.getByText("Référencée")).toBeInTheDocument();
    expect(screen.getByText(/Archive nationale/)).toBeInTheDocument();
  });

  // @req REQ-178
  it("does not repeat a proverb's meaning when it restates the quoted text", () => {
    render(
      <PlatesBlock
        reviewed
        items={[
          {
            type: "proverb",
            id: "proverb-reviewed",
            contentLanguage: "fr",
            text: "La langue est l’ennemie de son propriétaire.",
            meaning: "La langue est l’ennemie de son propriétaire.",
            original: {
              text: "ɗemngal ko ganyo jooma mum",
              lang: "ff",
              language: "peul",
            },
            origin: {
              status: "attested",
              note: "Proverbe peul du Fouladou (Sénégal), publié en 1987 avec son texte original.",
            },
            sources: [{ title: "Recueil", url: null, tier: "referenced" }],
            match: {
              relation: "linked-country",
              entityType: "country",
              entityId: "SEN",
            },
          },
        ]}
      />
    );

    expect(
      screen.getByText("« La langue est l’ennemie de son propriétaire. »")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("La langue est l’ennemie de son propriétaire.", {
        exact: true,
      })
    ).not.toBeInTheDocument();
  });

  // On a desktop the tile is a preview, not the piece: the title, a few lines
  // and the way to the rest. A phone keeps the whole text, as before.
  // @req REQ-180
  it("clamps an anecdote to five lines on desktop and leaves the phone as it was", () => {
    render(<PlatesBlock items={[anecdote]} />);

    const first = screen.getByText("Premier paragraphe.");
    expect(first).toHaveClass("min-[1200px]:line-clamp-5");
    expect(first).not.toHaveClass("hidden");
    expect(screen.getByText("Second paragraphe.")).toHaveClass(
      "min-[1200px]:hidden"
    );
    expect(screen.getByText("Second paragraphe.")).not.toHaveClass(
      "line-clamp-5"
    );
  });

  // @req REQ-180
  it("raises the desktop image by a third without touching its phone ratio", () => {
    render(<PlatesBlock items={[anecdote]} />);

    const frame = screen.getByRole("img", { name: "Gare" }).parentElement;
    expect(frame).toHaveClass(
      "aspect-[8/5]",
      "min-[1200px]:aspect-auto",
      "min-[1200px]:h-[193px]"
    );
  });

  // @req REQ-180
  it("sends an anecdote's Voir plus to that anecdote in the dossier", () => {
    render(<PlatesBlock items={[anecdote]} />);

    const link = screen.getByRole("link", { name: "Voir plus" });
    expect(link).toHaveAttribute(
      "href",
      "/fr/dossiers/anecdotes?a=fact-frontiere"
    );
    expect(link).toHaveClass("hidden", "min-[1200px]:inline-flex");
  });

  // The proverb bank is paginated by ten, so the fragment alone lands on the
  // list's first page whatever the proverb; the entity filter keeps it there.
  // @req REQ-180
  it("sends a proverb's Voir plus to its card, narrowed to the entity it matched", () => {
    render(<PlatesBlock items={[proverb]} />);

    expect(screen.getByRole("link", { name: "Voir plus" })).toHaveAttribute(
      "href",
      "/fr/dossiers/proverbes?pays=SEN#proverb-langue"
    );
  });

  // @req REQ-180
  it("keeps the source tier on desktop while the source list moves to the piece", () => {
    render(<PlatesBlock items={[anecdote]} />);

    expect(screen.getByText("Recueil").closest("ul")).toHaveClass(
      "min-[1200px]:hidden"
    );
    expect(
      screen
        .getAllByText("Référencée")
        .some((node) => node.className.includes("min-[1200px]"))
    ).toBe(true);
  });

  // @req REQ-178
  it("leaves the reviewed board card untouched", () => {
    render(<PlatesBlock reviewed items={[anecdote]} />);

    expect(screen.queryByRole("link", { name: "Voir plus" })).toBeNull();
  });
});
