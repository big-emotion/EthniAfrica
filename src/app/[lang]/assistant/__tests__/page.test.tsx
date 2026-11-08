// @req REQ-045
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AssistantPage, { generateMetadata } from "../page";
import { getStaticPageRoute } from "@/lib/routing";

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

const routeParams = Promise.resolve({ lang: "fr" });

afterEach(() => {
  vi.unstubAllEnvs();
});

async function renderPage() {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemple.test");
  return render(await AssistantPage({ params: routeParams }));
}

describe("the assistant install page", () => {
  // @req REQ-045
  it("opens on one title that names both assistants", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "EthniAfrica dans Claude et ChatGPT",
      })
    ).toBeInTheDocument();
  });

  // @req REQ-045
  it("offers the address built from the site origin, never a fixed host", async () => {
    await renderPage();

    expect(
      screen.getByLabelText("Adresse à coller dans votre assistant")
    ).toHaveValue("https://exemple.test/api/v2/mcp");
    expect(
      screen.getByRole("button", { name: "Copier l'adresse" })
    ).toBeInTheDocument();
  });

  // @req REQ-045
  it("says one-click install is not there yet, without promising a date", async () => {
    await renderPage();

    expect(
      screen.getByText(
        "Bientôt : l'ajout en un clic, depuis les répertoires de Claude et de ChatGPT."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-045
  it("gives each assistant its own three steps", async () => {
    await renderPage();

    for (const name of ["Dans Claude", "Dans ChatGPT"]) {
      const card = screen
        .getByRole("heading", { level: 3, name })
        .closest("div") as HTMLElement;
      expect(within(card).getAllByRole("listitem")).toHaveLength(3);
    }
  });

  // @req REQ-045
  it("lists the questions to try", async () => {
    await renderPage();

    const tries = within(
      screen.getByRole("heading", { level: 2, name: "Questions à essayer" })
        .parentElement as HTMLElement
    ).getAllByRole("listitem");
    expect(tries.map((item) => item.textContent)).toContain("Traoré");
  });

  // @req REQ-045
  it("names a source's type to the reader and never its tier", async () => {
    const { container } = await renderPage();

    expect(container.textContent).toMatch(/tradition orale/);
    expect(container.textContent).not.toMatch(/\btier\b|niveau de source/i);
  });

  // @req REQ-045
  it("promises only what the read-only connector does, and links the data policy", async () => {
    await renderPage();

    const section = screen
      .getByRole("heading", { level: 2, name: "Vos données" })
      .closest("section") as HTMLElement;
    expect(section).toHaveTextContent(
      "EthniAfrica ne garde ni votre nom, ni votre compte, ni vos conversations."
    );
    expect(section).not.toHaveTextContent(/récit familial/i);
    expect(
      within(section).getByRole("link", {
        name: "Lire la politique de données",
      })
    ).toHaveAttribute("href", getStaticPageRoute("fr", "dataPolicy"));
  });
});

describe("the assistant page head", () => {
  // @req REQ-141
  it("declares its canonical under the assistant route", async () => {
    const head = await generateMetadata({ params: routeParams });

    expect(String(head.alternates?.canonical)).toMatch(/\/fr\/assistant$/);
    expect(head.title).toBe("EthniAfrica dans Claude et ChatGPT");
  });
});
