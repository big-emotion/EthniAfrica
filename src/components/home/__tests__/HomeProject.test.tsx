import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeProject } from "@/components/home/HomeProject";
import { homePurposeCopy } from "@/lib/i18n/copy/homePurpose";
import { getLocalizedRoute } from "@/lib/routing";

describe("HomeProject — why the project exists and how it treats a claim", () => {
  // @req REQ-115
  it("states why, and links to the project page", () => {
    render(<HomeProject language="fr" />);

    const why = screen.getByTestId("home-project-why");
    expect(
      within(why).getByRole("heading", {
        level: 2,
        name: "Pourquoi EthniAfrica ?",
      })
    ).toBeInTheDocument();
    expect(within(why).getByText(homePurposeCopy.fr.why.body)).toBeVisible();
    expect(
      within(why).getByRole("link", { name: "Découvrir le projet" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "about"));
  });

  // @req REQ-115
  it("states the method, and links to the page that sets it out", () => {
    render(<HomeProject language="fr" />);

    const sources = screen.getByTestId("home-project-sources");
    expect(
      within(sources).getByRole("heading", {
        level: 2,
        name: "Des sources pour comprendre",
      })
    ).toBeInTheDocument();
    expect(
      within(sources).getByText(homePurposeCopy.fr.sources.body)
    ).toBeVisible();
    expect(
      within(sources).getByRole("link", { name: "Comment nous travaillons" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "doctrine"));
  });

  // The borders-versus-names statement left the home with the disclosure
  // that carried it; it stays the About page's position.
  // @req REQ-115
  it("no longer carries the borders statement or a disclosure", () => {
    const { container } = render(<HomeProject language="fr" />);

    expect(container.querySelector("details")).toBeNull();
    expect(container.textContent).not.toMatch(/frontières/i);
  });

  // @req REQ-145
  it("speaks English on the English home", () => {
    render(<HomeProject language="en" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Why EthniAfrica?" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How we work" })).toHaveAttribute(
      "href",
      getLocalizedRoute("en", "doctrine")
    );
  });
});
