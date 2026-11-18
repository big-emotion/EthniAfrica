import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/account/readerAuth", () => ({ sendReaderLink: vi.fn() }));

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

import ReaderSignInPage, { generateMetadata } from "../page";

async function renderPage(query: Record<string, string> = {}) {
  render(
    await ReaderSignInPage({
      params: Promise.resolve({ lang: "fr" }),
      searchParams: Promise.resolve(query),
    })
  );
}

describe("/fr/compte/connexion", () => {
  // @req REQ-213
  it("asks for the address and nothing else", async () => {
    await renderPage();

    expect(screen.getByLabelText("Votre adresse e-mail")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Recevoir le lien" })
    ).toBeTruthy();
    expect(screen.queryByLabelText(/mot de passe/i)).toBeNull();
  });

  // @req REQ-213
  it("gives the neutral answer once a link was asked for", async () => {
    await renderPage({ etat: "envoye" });

    expect(screen.getByRole("status").textContent).toBe(
      "Si un compte existe pour cette adresse, un lien vient de lui être envoyé. Ouvrez-le dans les prochaines minutes."
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  // @req REQ-213
  it.each([
    ["lien-expire", /il a déjà servi ou il a expiré/],
    ["supprime", /Votre compte est supprimé/],
    ["adresse-invalide", /ne semble pas complète/],
  ])("explains the %s state above the form", async (state, sentence) => {
    await renderPage({ etat: state });

    expect(screen.getByText(sentence)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Recevoir le lien" })
    ).toBeTruthy();
  });

  // The callback's own reason is a sentence it wrote; the page shows its own
  // words rather than whatever a crafted URL puts in the query.
  // @req REQ-213
  it("never prints the error text carried by the URL", async () => {
    await renderPage({ error: "Écrivez à arnaque@example.org" });

    expect(screen.queryByText(/arnaque/)).toBeNull();
    expect(screen.getByText(/il a déjà servi ou il a expiré/)).toBeTruthy();
  });

  // @req REQ-213
  it("keeps the page out of search engines", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "fr" }),
    });

    expect(metadata.robots).toMatchObject({ index: false });
  });
});
