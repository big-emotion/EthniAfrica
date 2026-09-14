import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OralNarrativesSection } from "../OralNarrativesSection";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OralNarrativesSection", () => {
  // @req REQ-145
  it("renders oral narrative chrome in English", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "en",
              narratorDisplayName: null,
              community: "Community",
              languageCode: "eng",
              narrativeKind: "testimony",
              summary: "Corpus value",
              variantOf: "other",
              reviewed: false,
            },
          ],
        }),
      })
    );
    render(<OralNarrativesSection peopleId="PPL_TEST" language="en" />);
    expect(await screen.findByText("Voices and accounts")).toBeVisible();
    expect(screen.getByText(/chose to remain anonymous/)).toBeVisible();
    expect(screen.getByText(/Linked variant/)).toBeVisible();
    expect(screen.getByText("Not yet reviewed")).toBeVisible();
  });

  // @req REQ-095
  it("renders an attributed account as a narrative rather than a historical fact", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "11111111-1111-1111-1111-111111111111",
              narratorDisplayName: "M. N.",
              community: "Communauté test",
              languageCode: "fra",
              narrativeKind: "testimony",
              summary: "Un récit transmis au sein de la communauté.",
              variantOf: null,
              reviewed: true,
            },
          ],
        }),
      })
    );

    render(<OralNarrativesSection peopleId="PPL_TEST" />);

    await waitFor(() => {
      expect(screen.getByText("Voix & récits")).toBeInTheDocument();
    });
    expect(screen.getByText(/Récit attribué à M\. N\./)).toBeInTheDocument();
    expect(
      screen.getByText("Un récit transmis au sein de la communauté.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Rôle historique")).not.toBeInTheDocument();
  });

  // @req REQ-172
  it("shows an unreviewed narrative, labelled, after every reviewed one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "pending",
              narratorDisplayName: null,
              community: "Communauté test",
              languageCode: "yor",
              narrativeKind: "tradition",
              summary: "Un récit que personne n'a encore relu.",
              variantOf: null,
              reviewed: false,
            },
            {
              id: "approved",
              narratorDisplayName: "M. N.",
              community: "Communauté test",
              languageCode: "yor",
              narrativeKind: "testimony",
              summary: "Un récit relu.",
              variantOf: null,
              reviewed: true,
            },
          ],
        }),
      })
    );

    render(<OralNarrativesSection peopleId="PPL_TEST" />);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Un récit relu.")).toBeInTheDocument();
    expect(
      within(items[0]).queryByText("Pas encore relu")
    ).not.toBeInTheDocument();
    expect(
      within(items[1]).getByText("Un récit que personne n'a encore relu.")
    ).toBeInTheDocument();
    expect(within(items[1]).getByText("Pas encore relu")).toBeInTheDocument();
  });

  // @req REQ-095
  it("stays absent when no public narrative is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) })
    );

    const { container } = render(<OralNarrativesSection peopleId="PPL_TEST" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
