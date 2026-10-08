import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ContactPage from "../page";
import { CONTACT_EMAIL } from "@/lib/brand";
import { DID_YOU_KNOW_FACTS } from "@/lib/home/didYouKnowFacts";

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    language,
  }: {
    children: React.ReactNode;
    language: string;
  }) => (
    <div data-testid="page-layout" data-language={language}>
      {children}
    </div>
  ),
}));

const routeParams = (lang: string) => Promise.resolve({ lang });

const renderPage = async (lang = "fr") =>
  render(await ContactPage({ params: routeParams(lang) }));

describe("the contact page", () => {
  // @req REQ-045
  it("names itself once, at the top of the outline", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Contactez-nous" })
    ).toBeInTheDocument();
  });

  // @req REQ-045
  it("carries the form the retired Typeform never rendered", async () => {
    await renderPage();

    expect(
      screen.getByRole("button", { name: /Envoyer le message/ })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Objet/)).toBeInTheDocument();
  });

  // @req REQ-045
  it("offers the direct address beside the form", async () => {
    await renderPage();

    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`
    );
  });

  /**
   * A second `h2` painted at a third size is the heading-against-heading
   * divergence the typography charter forbids, and the aside is where it
   * would creep in — a rubric label and a fact headline both want to be one.
   */
  // @req REQ-045
  it("keeps a single section heading, so no two headings disagree on rank", async () => {
    await renderPage();

    const sectionHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(sectionHeadings).toHaveLength(1);
    expect(sectionHeadings[0]).toHaveTextContent("Envoyer un message");
  });

  // @req REQ-113
  it("spends the left column on a fact the bank actually holds", async () => {
    await renderPage();

    const band = screen.getByTestId("contact-did-you-know");
    expect(within(band).getByText("Saviez-vous que")).toBeInTheDocument();

    const headlines = DID_YOU_KNOW_FACTS.map((fact) => fact.headline);
    const rendered = headlines.filter((headline) =>
      band.textContent?.includes(headline)
    );
    expect(rendered).toHaveLength(1);
  });

  /**
   * A quoted fact carries no tier word: the reader is never told how far to
   * trust a source (doctrine §1.1).
   */
  // @req REQ-113 REQ-092
  it("never ranks the fact it shows", async () => {
    await renderPage();

    const band = screen.getByTestId("contact-did-you-know");
    expect(band.textContent).not.toMatch(
      /Source (officielle|référencée|non vérifiée)/i
    );
  });
});
