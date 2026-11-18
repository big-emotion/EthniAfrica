import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  publishPendingFlagsForEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ auth: { verifyOtp: mocks.verifyOtp } })
  ),
}));

vi.mock("@/api/v2/services/comments", () => ({
  publishPendingFlagsForEmail: mocks.publishPendingFlagsForEmail,
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

import ConfirmReaderLinkPage, { generateMetadata } from "../page";

async function renderPage(query: Record<string, string>) {
  render(
    await ConfirmReaderLinkPage({
      params: Promise.resolve({ lang: "fr" }),
      searchParams: Promise.resolve(query),
    })
  );
}

describe("/fr/compte/confirmer", () => {
  beforeEach(() => vi.clearAllMocks());

  // Mail scanners open the links of an e-mail before the reader does. A page
  // that redeemed the token on load would publish on the scanner's behalf.
  // @req REQ-213
  it("publishes nothing and redeems nothing when the page is only loaded", async () => {
    await renderPage({ token_hash: "pkce_abc", type: "signup" });

    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(mocks.publishPendingFlagsForEmail).not.toHaveBeenCalled();
  });

  // @req REQ-213
  it("offers one button that carries the token to the server action", async () => {
    await renderPage({ token_hash: "pkce_abc", type: "signup" });

    const button = screen.getByRole("button", {
      name: "Publier mon commentaire",
    });
    const form = button.closest("form");
    expect(form).not.toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      (form.querySelector('input[name="token_hash"]') as HTMLInputElement).value
    ).toBe("pkce_abc");
    expect(
      (form.querySelector('input[name="type"]') as HTMLInputElement).value
    ).toBe("signup");
  });

  // @req REQ-213
  it("names the account when the reader only asked to sign in", async () => {
    await renderPage({
      token_hash: "pkce_abc",
      type: "magiclink",
      raison: "connexion",
    });

    expect(
      screen.getByRole("heading", { name: "Ouvrir mon compte" })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ouvrir mon compte" })
    ).toBeTruthy();
  });

  // @req REQ-213
  it("explains an incomplete link and leads to a new one instead of a dead button", async () => {
    await renderPage({});

    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Demander un nouveau lien" })
        .getAttribute("href")
    ).toBe("/fr/compte/connexion");
  });

  // @req REQ-213
  it("keeps the page out of search engines", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: "fr" }),
    });

    expect(metadata.robots).toMatchObject({ index: false });
  });
});
