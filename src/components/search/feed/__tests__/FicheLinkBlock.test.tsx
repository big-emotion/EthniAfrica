import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FicheLinkBlock } from "@/components/search/feed/FicheLinkBlock";
import type { SearchResult } from "@/types/afrik-frontend";

const subject = (type: SearchResult["type"], id: string, name: string) =>
  ({ type, id, name }) as SearchResult;

// @req REQ-178
describe("FicheLinkBlock", () => {
  it("names the fiche after its subject", () => {
    render(
      <FicheLinkBlock
        subjects={[subject("people", "PPL_FULA", "Fula")]}
        language="fr"
      />
    );
    expect(
      screen.getByRole("link", { name: "Voir la fiche complète · Fula" })
    ).toBeVisible();
  });

  // The country and the family name « Congo » would otherwise carry two
  // buttons with one label, and a reader cannot tell which fiche is which.
  // @req REQ-178
  it("tells two buttons of one name apart by what each leads to", () => {
    render(
      <FicheLinkBlock
        subjects={[
          subject("country", "COG", "Congo"),
          subject("patronyme", "PAT_CONGO", "Congo"),
        ]}
        language="fr"
      />
    );
    const labels = screen.getAllByRole("link").map((link) => link.textContent);
    expect(new Set(labels).size).toBe(2);
    expect(labels[0]).toContain("Pays");
    expect(labels[1]).toContain("Nom");
  });

  // The page has one solid primary action. Several fiches are equal ways on,
  // so none of them is the solid one: choosing which would promote a subject.
  // @req REQ-178
  it("draws one solid button for one fiche and none for several", () => {
    const solid = (links: HTMLElement[]) =>
      links.filter((link) =>
        link.className.includes("bg-[color:var(--accent)]")
      );

    const single = render(
      <FicheLinkBlock
        subjects={[subject("people", "PPL_FULA", "Fula")]}
        language="fr"
      />
    );
    expect(solid(screen.getAllByRole("link"))).toHaveLength(1);
    single.unmount();

    render(
      <FicheLinkBlock
        subjects={[
          subject("country", "COG", "Congo"),
          subject("country", "COD", "RD Congo"),
          subject("patronyme", "PAT_CONGO", "Congo"),
        ]}
        language="fr"
      />
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(solid(links)).toHaveLength(0);
    for (const link of links) expect(link.className).toContain("min-h-11");
  });
});
