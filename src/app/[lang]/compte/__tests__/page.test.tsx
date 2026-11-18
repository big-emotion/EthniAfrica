import { render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountContribution } from "@/api/v2/services/account";

const mocks = vi.hoisted(() => ({
  getReaderSession: vi.fn(),
  listAccountContributions: vi.fn(),
}));

vi.mock("@/lib/account/readerAuth", () => ({
  getReaderSession: mocks.getReaderSession,
  sendReaderLink: vi.fn(),
}));

vi.mock("@/api/v2/services/account", () => ({
  listAccountContributions: mocks.listAccountContributions,
  eraseReaderAccount: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

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

import AccountPage, { generateMetadata } from "../page";

const READER = { id: "user-1", email: "aissatou@exemple.fr" };

function contribution(
  id: string,
  extra: Partial<AccountContribution> = {}
): AccountContribution {
  return {
    id,
    public_slug: `SLUG-${id}`,
    block_key: "people:PPL_PEUL:naming",
    entity_type: "people",
    body: `Commentaire ${id}`,
    publication: "published",
    status: "open",
    moderator_notes: null,
    resolved_at: null,
    corrected_at: null,
    replies: { total: 0, fromModeration: 0 },
    created_at: "2026-11-10T10:00:00.000Z",
    ...extra,
  };
}

async function renderPage(query: Record<string, string> = {}) {
  render(
    await AccountPage({
      params: Promise.resolve({ lang: "fr" }),
      searchParams: Promise.resolve(query),
    })
  );
}

function item(text: string) {
  return screen.getByText(text).closest("article");
}

describe("/fr/compte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReaderSession.mockResolvedValue(READER);
    mocks.listAccountContributions.mockResolvedValue([]);
  });

  // @req REQ-213
  it("sends a visitor without a reader session to the sign-in", async () => {
    mocks.getReaderSession.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("REDIRECT /fr/compte/connexion");
    expect(mocks.listAccountContributions).not.toHaveBeenCalled();
  });

  // @req REQ-213
  it("names the address in use and lists that reader's contributions", async () => {
    await renderPage();

    expect(
      screen.getByText(/Vous utilisez l'adresse aissatou@exemple\.fr\./)
    ).toBeTruthy();
    expect(mocks.listAccountContributions).toHaveBeenCalledWith(READER);
    expect(
      screen.getByRole("heading", { name: "Mes commentaires" })
    ).toBeTruthy();
  });

  // @req REQ-213
  it("shows a waiting comment with the way to get its link again", async () => {
    mocks.listAccountContributions.mockResolvedValue([
      contribution("a", { publication: "pending" }),
    ]);

    await renderPage();
    const card = within(item("Commentaire a"));

    expect(card.getByText("En attente de confirmation")).toBeTruthy();
    expect(card.getByRole("button", { name: "Renvoyer le lien" })).toBeTruthy();
    expect(card.queryByRole("link", { name: "Voir la discussion" })).toBeNull();
  });

  // @req REQ-213
  it("shows a published comment with its replies and the way to its discussion", async () => {
    mocks.listAccountContributions.mockResolvedValue([
      contribution("a", {
        block_key: "people:PPL_PEUL:sources",
        replies: { total: 0, fromModeration: 0 },
      }),
    ]);

    await renderPage();
    const card = within(item("Commentaire a"));

    expect(card.getByText("Peuple · Les sources du nom")).toBeTruthy();
    expect(card.getByText("Publié")).toBeTruthy();
    expect(card.getByText("Aucune réponse")).toBeTruthy();
    expect(
      card
        .getByRole("link", { name: "Voir la discussion" })
        .getAttribute("href")
    ).toBe("/fr/signalements/SLUG-a");
  });

  // @req REQ-213
  it("shows the decision and the date the fiche was corrected", async () => {
    mocks.listAccountContributions.mockResolvedValue([
      contribution("a", {
        status: "accepted",
        corrected_at: "2026-11-12T09:00:00.000Z",
        replies: { total: 2, fromModeration: 1 },
      }),
    ]);

    await renderPage();
    const card = within(item("Commentaire a"));

    expect(card.getByText("Pris en compte")).toBeTruthy();
    expect(
      card.getByText("Intégré à la fiche le 12 novembre 2026")
    ).toBeTruthy();
    expect(card.getByText("2 réponses, dont la modération")).toBeTruthy();
  });

  // @req REQ-213
  it("shows the moderation's note on a comment it did not keep", async () => {
    mocks.listAccountContributions.mockResolvedValue([
      contribution("a", {
        status: "rejected",
        moderator_notes: "Les sources citées ne disent pas la même chose.",
        resolved_at: "2026-11-02T09:00:00.000Z",
        replies: { total: 1, fromModeration: 1 },
      }),
    ]);

    await renderPage();
    const card = within(item("Commentaire a"));

    expect(card.getByText("Non retenu")).toBeTruthy();
    expect(
      card.getByText(/Les sources citées ne disent pas la même chose\./)
    ).toBeTruthy();
    expect(
      card.getByText("Modération EthniAfrica · 2 novembre 2026")
    ).toBeTruthy();
    expect(card.getByText("1 réponse de la modération")).toBeTruthy();
  });

  // @req REQ-213
  it("says a hidden comment is hidden and does not link to it", async () => {
    mocks.listAccountContributions.mockResolvedValue([
      contribution("a", { publication: "hidden" }),
    ]);

    await renderPage();
    const card = within(item("Commentaire a"));

    expect(card.getByText("Masqué")).toBeTruthy();
    expect(card.queryByRole("link", { name: "Voir la discussion" })).toBeNull();
  });

  // @req REQ-213
  it("offers sign-out and an account deletion that keeps the comments", async () => {
    await renderPage();

    expect(screen.getByRole("button", { name: "Me déconnecter" })).toBeTruthy();
    expect(
      screen.getByText(
        "Si vous supprimez votre compte, vos commentaires publiés restent en ligne, signés « Un lecteur »."
      )
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Supprimer mon compte" })
    ).toBeTruthy();
  });

  // @req REQ-213
  it("confirms a fresh link was sent", async () => {
    await renderPage({ lien: "envoye" });

    expect(screen.getByRole("status").textContent).toMatch(
      /Un nouveau lien vient de partir/
    );
  });

  // @req REQ-213
  it("keeps the page out of search engines", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "fr" }),
    });

    expect(metadata.robots).toMatchObject({ index: false });
  });
});
