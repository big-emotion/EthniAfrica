// @req REQ-045
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopyAddress } from "@/components/assistant/CopyAddress";

const LABELS = {
  fieldLabel: "Adresse à coller dans votre assistant",
  copy: "Copier l'adresse",
  copied: "Adresse copiée",
  copyFailed: "Copie impossible ici. Copiez l'adresse sélectionnée.",
};
const ADDRESS = "https://exemple.test/api/v2/mcp";

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
});

describe("copying the address", () => {
  // @req REQ-045
  it("shows the address in a read-only field the reader can select", () => {
    render(<CopyAddress address={ADDRESS} labels={LABELS} />);

    const field = screen.getByLabelText(LABELS.fieldLabel);
    expect(field).toHaveValue(ADDRESS);
    expect(field).toHaveAttribute("readonly");
  });

  // @req REQ-045
  it("writes the address to the clipboard and confirms it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CopyAddress address={ADDRESS} labels={LABELS} />);

    fireEvent.click(screen.getByRole("button", { name: LABELS.copy }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(LABELS.copied)
    );
    expect(writeText).toHaveBeenCalledWith(ADDRESS);
  });

  // @req REQ-045
  it("selects the address and says so when the browser refuses the clipboard", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<CopyAddress address={ADDRESS} labels={LABELS} />);
    const field = screen.getByLabelText(LABELS.fieldLabel) as HTMLInputElement;

    fireEvent.click(screen.getByRole("button", { name: LABELS.copy }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(LABELS.copyFailed)
    );
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe(ADDRESS.length);
    expect(screen.queryByText(LABELS.copied)).not.toBeInTheDocument();
  });

  // @req REQ-045
  it("falls back to selection when there is no clipboard API at all", async () => {
    render(<CopyAddress address={ADDRESS} labels={LABELS} />);

    fireEvent.click(screen.getByRole("button", { name: LABELS.copy }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(LABELS.copyFailed)
    );
  });
});
