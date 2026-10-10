// @req REQ-022
// @req REQ-025
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DoctrineLinkCard, isDoctrineSlug } from "../DoctrineLinkCard";
import { getLocalizedRoute } from "@/lib/routing";

describe("DoctrineLinkCard", () => {
  describe("French explanatory copy per slug", () => {
    it("renders endonymes-vs-exonymes copy", () => {
      render(<DoctrineLinkCard slug="endonymes-vs-exonymes" />);
      expect(
        screen.getByText(/les noms que les personnes emploient pour se nommer/i)
      ).toBeInTheDocument();
    });

    it("renders classifications-contestees copy", () => {
      render(<DoctrineLinkCard slug="classifications-contestees" />);
      expect(
        screen.getByText(/Les chercheurs ne regroupent pas tous/i)
      ).toBeInTheDocument();
    });

    it("renders heritage-colonial copy", () => {
      render(<DoctrineLinkCard slug="heritage-colonial" />);
      expect(
        screen.getByText(/Ce nom est lié à la période coloniale/i)
      ).toBeInTheDocument();
    });

    it("renders topics-sensibles copy", () => {
      render(<DoctrineLinkCard slug="topics-sensibles" />);
      expect(
        screen.getByText(/Ce sujet peut toucher à l’identité/i)
      ).toBeInTheDocument();
    });
  });

  describe("Live (no version) link target", () => {
    // @req REQ-025
    it("links the live doctrine page when version is undefined", () => {
      render(<DoctrineLinkCard slug="endonymes-vs-exonymes" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `${getLocalizedRoute("fr", "doctrine")}/endonymes-vs-exonymes`
      );
    });

    // @req REQ-025
    it("does not render the obsolete historical note", () => {
      render(<DoctrineLinkCard slug="heritage-colonial" />);
      expect(
        screen.queryByText(/historique disponible prochainement/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Pinned (with version) link target", () => {
    // @req REQ-025
    it("links the pinned doctrine revision when version=42", () => {
      render(
        <DoctrineLinkCard slug="classifications-contestees" version={42} />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `${getLocalizedRoute("fr", "doctrine")}/classifications-contestees@v42`
      );
    });

    // @req REQ-025
    it("does not render the obsolete historical note", () => {
      render(<DoctrineLinkCard slug="topics-sensibles" version={2} />);
      expect(
        screen.queryByText(/historique disponible prochainement/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Doctrine slug validation", () => {
    // @req REQ-025
    it.each([
      "endonymes-vs-exonymes",
      "classifications-contestees",
      "heritage-colonial",
      "topics-sensibles",
    ])("accepts the seeded slug %s", (slug) => {
      expect(isDoctrineSlug(slug)).toBe(true);
    });

    // @req REQ-025
    it("rejects an untrusted slug", () => {
      expect(isDoctrineSlug("classification-status")).toBe(false);
    });
  });
});
