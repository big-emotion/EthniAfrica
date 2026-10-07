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
});
