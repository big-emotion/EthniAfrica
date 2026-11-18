import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../actions", () => ({ deleteReaderAccount: vi.fn() }));

import { AccountDeletion } from "../AccountDeletion";

describe("AccountDeletion", () => {
  // Deleting cannot be undone, so the first press only asks.
  // @req REQ-213
  it("asks before deleting, and lets the reader keep the account", () => {
    render(<AccountDeletion language="fr" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer mon compte" })
    );

    expect(
      screen.getByText(/Voulez-vous vraiment supprimer votre compte \?/)
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Oui, supprimer mon compte" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Garder mon compte" }));

    expect(
      screen.queryByRole("button", { name: "Oui, supprimer mon compte" })
    ).toBeNull();
  });
});
