import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DossierPage } from "../DossierPage";
import { getDossierBySlug } from "@/lib/dossiers/corpus";
vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
describe("shared narrative reader", () => {
  // @req REQ-114
  it("omits empty quantitative and comparison sections", () => {
    const dossier = structuredClone(getDossierBySlug("royaume-kongo")!);
    dossier.thesis.figures = [];
    dossier.chapters.forEach((chapter) => {
      chapter.readings = [];
      chapter.illustration = null;
    });
    const { container } = render(
      <DossierPage dossier={dossier} language="fr" />
    );
    expect(container.querySelector(".afh-dossier-thesis")).toBeNull();
    expect(container.querySelector(".afh-dossier-readings")).toBeNull();
    expect(screen.getByText(dossier.chapters[0].title)).toBeVisible();
  });

  // @req REQ-114
  it("links citations to declared sources and numbers its chapters", () => {
    const { container } = render(
      <DossierPage dossier={getDossierBySlug("royaume-kongo")!} language="fr" />
    );
    expect(screen.getByText("Chapitre 01")).toBeVisible();
    const citations = container.querySelectorAll("a[data-dossier-citation]");
    expect(citations.length).toBeGreaterThan(5);
    citations.forEach((link) =>
      expect(container.querySelector(link.getAttribute("href")!)).not.toBeNull()
    );
  });

  // A source is shown by its type, never by its tier (doctrine §1.1).
  // @req REQ-092
  it("names each source by its type and never by its tier", () => {
    const dossier = structuredClone(getDossierBySlug("royaume-kongo")!);
    dossier.sources = dossier.sources.slice(0, 2);
    dossier.sources[0] = {
      ...dossier.sources[0],
      tier: "official",
      source_kind: "oral_tradition",
    };
    dossier.sources[1] = {
      ...dossier.sources[1],
      tier: "unverified",
      source_kind: undefined,
    };
    const { container } = render(
      <DossierPage dossier={dossier} language="fr" />
    );
    const notes = container.querySelectorAll(".afh-dossier-source-notes");
    expect(notes[0]).toHaveTextContent("Tradition orale");
    const list = container.querySelector(".afh-dossier-sources")!;
    expect(list).not.toHaveTextContent(/Officielle|Référencée|Non vérifiée/);
  });
});
