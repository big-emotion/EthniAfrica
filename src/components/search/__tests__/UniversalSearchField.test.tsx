// @req REQ-002
// @req REQ-124
import { describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { UniversalSearchField } from "../UniversalSearchField";
import type { NameSuggestion } from "../UniversalSearchField";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/analytics/trackEvent", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "@/lib/analytics/trackEvent";

const results: NameSuggestion[] = [
  {
    type: "people",
    id: "PPL_FULA",
    form: "Fulɓe",
    note: "se nomme lui-même Peul",
    href: "/fr/atlas/recherche/Fulɓe",
  },
  {
    type: "country",
    id: "TCD",
    form: "Tchad",
    note: null,
    href: "/fr/atlas/recherche?q=Tchad",
  },
];

describe("UniversalSearchField", () => {
  // @req REQ-002
  it("uses the approved shared French label and placeholder", () => {
    render(
      <UniversalSearchField
        language="fr"
        surface="home"
        fetchResults={async () => []}
      />
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      /Quel nom cherchez-vous/
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "placeholder",
      "Un peuple, une langue, un pays…"
    );
  });

  // @req REQ-002
  it("shows unified suggestion names and a result destination", async () => {
    render(
      <UniversalSearchField
        language="fr"
        surface="modal"
        fetchResults={async () => results}
      />
    );
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "pe" } });
    const list = await screen.findByRole("listbox");
    expect(within(list).getByText("Fulɓe")).toBeInTheDocument();
    expect(within(list).getByText("Peuple")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: /Fulɓe/ })).toHaveAttribute(
      "href",
      expect.stringContaining("/fr/atlas/recherche")
    );
  });

  // @req REQ-002
  it("supports arrow selection, Enter navigation and a clear button", async () => {
    const onNavigate = vi.fn();
    render(
      <UniversalSearchField
        language="fr"
        surface="home"
        fetchResults={async () => results}
        onNavigate={onNavigate}
      />
    );
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "pe" } });
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(onNavigate).toHaveBeenCalled());
    expect(trackEvent).toHaveBeenCalledWith("search:result_click", {
      surface: "home",
      rank: 2,
      type: "country",
    });
    fireEvent.click(screen.getByRole("button", { name: "Effacer" }));
    expect(input).toHaveValue("");
  });

  // @req REQ-002
  it("closes suggestions on Escape without clearing the typed query", async () => {
    render(
      <UniversalSearchField
        language="fr"
        surface="home"
        fetchResults={async () => results}
      />
    );
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "pe" } });
    await screen.findByRole("listbox");

    fireEvent.keyDown(input, { key: "Escape" });

    expect(input).toHaveValue("pe");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  // @req REQ-002
  it("records a typed search separately from opening a suggestion", async () => {
    render(
      <UniversalSearchField
        language="fr"
        surface="modal"
        fetchResults={async () => []}
        onNavigate={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "zzz" },
    });
    await screen.findByText(/Aucun nom ne commence/);
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));
    expect(trackEvent).toHaveBeenCalledWith("search:submit", {
      surface: "modal",
      suggestions: 0,
    });
  });

  // @req REQ-002
  it("submits an exact addressed name to the API-provided answer URL", async () => {
    const onNavigate = vi.fn();
    render(
      <UniversalSearchField
        language="fr"
        surface="serp"
        fetchResults={async () => results}
        onNavigate={onNavigate}
      />
    );
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Fulɓe" } });
    await screen.findByRole("listbox");
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));
    expect(onNavigate).toHaveBeenCalledWith("/fr/atlas/recherche/Fulɓe");
  });

  // @req REQ-002
  it("can leave submit telemetry to the search page", async () => {
    const onNavigate = vi.fn();
    vi.mocked(trackEvent).mockClear();
    render(
      <UniversalSearchField
        language="fr"
        surface="serp"
        trackSubmit={false}
        fetchResults={async () => []}
        onNavigate={onNavigate}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "inconnu" },
    });
    await screen.findByText(/Aucun nom ne commence/);
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));
    expect(onNavigate).toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalledWith(
      "search:submit",
      expect.anything()
    );
  });
});
