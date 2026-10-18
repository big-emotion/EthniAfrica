import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ApproachPageContent from "@/components/pages/ApproachPageContent";
import {
  allApproachSources,
  approachClaimFiches,
  approachClaimSources,
  approachSources,
} from "@/lib/approach/sources";
import { approachCopy } from "@/lib/i18n/copy/approach";
import {
  getLocalizedRoute,
  getPatronymeRoute,
  getStaticPageRoute,
} from "@/lib/routing";
import { SOURCE_KINDS, SOURCE_TIERS } from "@/types/sources";

describe("ApproachPageContent (ETNI-2133)", () => {
  // @req REQ-132
  it("presents the approved copy in order and signs the position separately", () => {
    render(<ApproachPageContent language="fr" />);

    expect(
      screen.getByRole("heading", { name: "Notre démarche" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes."
      )
    ).toBeInTheDocument();

    const sections = screen.getAllByTestId("approach-section");
    expect(sections).toHaveLength(4);
    expect(
      sections.map(
        (section) => within(section).getByRole("heading").textContent
      )
    ).toEqual([
      "L’Afrique n’est pas un seul bloc",
      "Chaque peuple a son nom",
      "Tous les noms ne sont pas venus de l’extérieur",
      "Décoloniser leur emploi",
    ]);
    expect(screen.getByTestId("approach-position")).toHaveTextContent(
      "C’est une position d’EthniAfrica, pas un fait établi par une source."
    );
  });

  // @req REQ-132
  it("shows ten linked sources with public types and no internal tiers", () => {
    render(<ApproachPageContent language="fr" />);

    const list = screen.getByRole("list", { name: "Sources" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(10);
    expect(list.textContent).toContain("Statistiques officielles");
    expect(list.textContent?.match(/Statistiques officielles/g)).toHaveLength(
      2
    );
    expect(
      within(list).queryByText(/official|referenced|unverified/i)
    ).not.toBeInTheDocument();
    expect(approachSources).toHaveLength(10);
    expect(Object.keys(approachCopy.fr.sources)).toEqual(
      approachSources.map((source) => source.id)
    );
    expect(
      approachSources.every((source) =>
        source.hrefs.every((href) => href.startsWith("https://"))
      )
    ).toBe(true);
    expect(approachSources.every((source) => source.claims.length > 0)).toBe(
      true
    );
    expect(
      approachSources.every(
        (source) =>
          SOURCE_TIERS.includes(source.tier) &&
          SOURCE_KINDS.includes(source.sourceKind)
      )
    ).toBe(true);
    for (const [claim, sourceIds] of Object.entries(approachClaimSources)) {
      expect(sourceIds.length, claim).toBeGreaterThan(0);
      for (const sourceId of sourceIds) {
        expect(
          allApproachSources.find((source) => source.id === sourceId)?.claims,
          `${claim} → ${sourceId}`
        ).toContain(claim);
      }
    }
    expect(approachClaimFiches["kouassi-baoule-day"]).toContain("PAT_KOUASSI");
    expect(approachClaimFiches["yao-baoule-day"]).toContain("PAT_YAO");
    expect(approachClaimFiches["kwasi-twi-day"]).toContain("PAT_KOUASSI");
    expect(approachClaimFiches["yaw-twi-day"]).toContain("PAT_YAO");
    expect(
      approachSources.find((source) => source.id === "ivorian-name-laws")?.tier
    ).toBe("unverified");
    expect(
      approachSources.find((source) => source.id === "britannica-africa")?.tier
    ).toBe("unverified");
    expect(
      approachSources.find((source) => source.id === "ethnologue-africa")?.tier
    ).toBe("official");
  });

  // @req REQ-132
  it("links to the two name pages, method page, search and error report", () => {
    render(<ApproachPageContent language="fr" />);

    expect(
      screen.getByRole("link", { name: "Le nom Kouassi" })
    ).toHaveAttribute("href", getPatronymeRoute("fr", "PAT_KOUASSI"));
    expect(screen.getByRole("link", { name: "Le nom Yao" })).toHaveAttribute(
      "href",
      getPatronymeRoute("fr", "PAT_YAO")
    );
    expect(
      screen.getByRole("link", { name: "Comment nous travaillons" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "doctrine"));
    expect(
      screen.getByRole("link", { name: "Chercher un nom" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "search"));
    expect(
      screen.getByRole("link", { name: "Signaler une erreur" })
    ).toHaveAttribute("href", getStaticPageRoute("fr", "reportError"));
  });
});
