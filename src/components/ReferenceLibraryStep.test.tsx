import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "@/types/shared";

const { mockHasAccess } = vi.hoisted(() => ({ mockHasAccess: vi.fn() }));

vi.mock("@/lib/auth/referenceLibraryAccess", () => ({
  hasReferenceLibraryAccess: mockHasAccess,
}));

vi.mock("@/lib/supabase/auth-client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: {} }) },
  }),
}));

import { ReferenceLibraryStep } from "./ReferenceLibraryStep";

function renderStep(language: Language = "fr") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReferenceLibraryStep language={language} />
    </QueryClientProvider>
  );
}

describe("ReferenceLibraryStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-042
  it("hands a moderator the reference library", async () => {
    mockHasAccess.mockResolvedValue(true);
    renderStep();

    expect(
      await screen.findByRole("heading", { name: "Ajouter une référence" })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Rechercher une référence existante")
    ).toBeInTheDocument();
  });

  // @req REQ-042
  it("tells anyone else the library is for moderators and where their sources go instead", async () => {
    mockHasAccess.mockResolvedValue(false);
    renderStep();

    expect(
      await screen.findByRole("heading", { name: "Bibliothèque de références" })
    ).toBeInTheDocument();
    expect(screen.getByText(/réservé aux modérateurs/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Rechercher une référence existante")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enregistrer la référence" })
    ).not.toBeInTheDocument();
  });

  // @req REQ-145
  it("says the same in English", async () => {
    mockHasAccess.mockResolvedValue(false);
    renderStep("en");

    expect(
      await screen.findByRole("heading", { name: "Reference library" })
    ).toBeInTheDocument();
    expect(screen.getByText(/reserved for moderators/)).toBeInTheDocument();
    expect(
      screen.queryByText("Bibliothèque de références")
    ).not.toBeInTheDocument();
  });

  // @req REQ-042
  it("shows neither the tool nor the notice before the answer arrives", () => {
    mockHasAccess.mockReturnValue(new Promise(() => {}));
    const { container } = renderStep();

    expect(container).toBeEmptyDOMElement();
  });
});
