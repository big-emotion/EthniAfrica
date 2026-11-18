import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  publishPendingFlagForEmail: vi.fn(),
  findPendingComment: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ auth: { verifyOtp: mocks.verifyOtp } })
  ),
}));

vi.mock("@/api/v2/services/comments", () => ({
  publishPendingFlagForEmail: mocks.publishPendingFlagForEmail,
  findPendingComment: mocks.findPendingComment,
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

function hiddenValue(form: HTMLFormElement, name: string) {
  return (form.querySelector(`input[name="${name}"]`) as HTMLInputElement)
    ?.value;
}

describe("/fr/compte/confirmer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findPendingComment.mockResolvedValue({
      public_slug: "K7M2Q9X4AB",
      block_key: "people:PPL_PEUL:naming",
      body: "On dit aussi Fulbe sans le ɓ.",
    });
  });

  // Mail scanners open the links of an e-mail before the reader does. A page
  // that redeemed the token on load would publish on the scanner's behalf.
  // @req REQ-213
  it("publishes nothing and redeems nothing when the page is only loaded", async () => {
    await renderPage({
      token_hash: "pkce_abc",
      type: "signup",
      commentaire: "K7M2Q9X4AB",
    });

    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(mocks.publishPendingFlagForEmail).not.toHaveBeenCalled();
  });

  // The reader sees exactly what they are about to publish.
  // @req REQ-213
  it("shows the comment above one button that carries the token and the comment", async () => {
    await renderPage({
      token_hash: "pkce_abc",
      type: "signup",
      commentaire: "K7M2Q9X4AB",
    });

    expect(mocks.findPendingComment).toHaveBeenCalledWith("K7M2Q9X4AB");
    expect(screen.getByText("On dit aussi Fulbe sans le ɓ.")).toBeTruthy();
    expect(screen.getByText("Peuple · Les autres noms")).toBeTruthy();
    const button = screen.getByRole("button", {
      name: "Publier mon commentaire",
    });
    const form = button.closest("form");
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(hiddenValue(form, "token_hash")).toBe("pkce_abc");
    expect(hiddenValue(form, "type")).toBe("signup");
    expect(hiddenValue(form, "commentaire")).toBe("K7M2Q9X4AB");
  });

  // A comment already published, or one the link does not name, gives a
  // page that opens the account and claims to publish nothing.
  // @req REQ-213
  it("only opens the account when the comment is no longer waiting", async () => {
    mocks.findPendingComment.mockResolvedValue(null);

    await renderPage({
      token_hash: "pkce_abc",
      type: "magiclink",
      commentaire: "K7M2Q9X4AB",
    });

    expect(
      screen.getByRole("button", { name: "Ouvrir mon compte" })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Publier mon commentaire" })
    ).toBeNull();
  });

  // @req REQ-213
  it("names the account when the link names no comment", async () => {
    await renderPage({ token_hash: "pkce_abc", type: "magiclink" });

    expect(mocks.findPendingComment).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Ouvrir mon compte" })
    ).toBeTruthy();
    const form = screen
      .getByRole("button", { name: "Ouvrir mon compte" })
      .closest("form");
    expect(hiddenValue(form, "commentaire")).toBeUndefined();
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
