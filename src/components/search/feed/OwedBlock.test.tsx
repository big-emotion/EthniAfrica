import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OwedBlock } from "@/components/search/feed/OwedBlock";

const contributionTarget = {
  type: "languageFamily",
  id: "FLG_MANDE",
  name: "Mandé",
  fieldPath: "content.appellations",
};

// @req REQ-180
describe("OwedBlock", () => {
  // @req REQ-180
  it("renders the closing parts in rhetorical order", () => {
    render(
      <OwedBlock
        silences={[{ title: "La date", detail: "Aucune attestation datée." }]}
        conviction={{
          title: "Un nom ne résume pas un peuple.",
          body: "Il ouvre une enquête.",
        }}
        invitation={{
          title: "Une source manque ?",
          body: "Elle sera lue.",
          action: "Proposer une source",
        }}
        contributionTarget={contributionTarget}
      />
    );

    const block = screen.getByTestId("feed-block-owed");
    const layout = block.firstElementChild;
    const parts = block.querySelectorAll("[data-feed-part]");
    expect(
      Array.from(parts, (part) => part.getAttribute("data-feed-part"))
    ).toEqual(["silences", "conviction", "invitation"]);
    expect(layout).toHaveClass("min-[1200px]:grid-cols-2");

    const contribution = screen.getByRole("button", {
      name: "Proposer une source",
    });
    expect(contribution).toHaveClass(
      "min-h-11",
      "border-[color:var(--accent)]",
      "bg-[color:var(--accent-tint)]",
      "text-[color:var(--accent-foreground)]"
    );
    expect(contribution).not.toHaveClass("bg-[color:var(--accent)]");
    expect(contribution).toHaveAttribute(
      "data-flag-kind",
      "correction-proposal"
    );
  });

  // @req REQ-180
  it("keeps a thin closing in one column and localises its fixed heading", () => {
    render(
      <OwedBlock
        language="en"
        thin
        silences={[{ title: "The date", detail: "No dated attestation." }]}
        conviction={{
          title: "A name does not sum up a people.",
          body: "It opens an inquiry.",
        }}
        invitation={{
          title: "Is a source missing?",
          body: "It will be read.",
          action: "Suggest a source",
        }}
        contributionTarget={contributionTarget}
      />
    );

    const layout = screen.getByTestId("feed-block-owed").firstElementChild;
    expect(layout).not.toHaveClass("min-[1200px]:grid-cols-2");
    expect(
      screen.getByRole("heading", { name: "What the atlas does not say" })
    ).toBeVisible();
    expect(
      screen.getByText("A declared silence, not an oversight.")
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Suggest a source" })
    ).toBeEnabled();
  });

  // @req REQ-180
  it("renders the inline markup a silence detail carries", () => {
    render(
      <OwedBlock
        silences={[
          {
            title: "Aucune attestation datée",
            detail:
              "L’atlas situe l’emprunt européen au milieu du XIX<sup>e</sup> siècle.",
          },
        ]}
        conviction={{
          title: "Un nom ne résume pas un peuple.",
          body: "Il ouvre une enquête.",
        }}
        invitation={{
          title: "Une source manque ?",
          body: "Elle sera lue.",
          action: "Proposer une source",
        }}
        contributionTarget={contributionTarget}
      />
    );

    const detail = screen.getByText((_content, element) =>
      Boolean(element?.textContent?.startsWith("L’atlas situe"))
    );
    expect(detail.querySelector("sup")).toHaveTextContent("e");
    expect(detail).not.toHaveTextContent("<sup>");
  });

  // @req REQ-180
  it("keeps a sparse unknown-name closing in one column", () => {
    render(
      <OwedBlock
        conviction={{
          title: "This silence is not an answer.",
          body: "The atlas can still learn.",
        }}
        invitation={{
          title: "Tell us about this name",
          body: "A source will be read.",
          action: "Contribute",
        }}
        contributionTarget={{ type: "search-query", id: "kossiwa" }}
      />
    );

    const layout = screen.getByTestId("feed-block-owed").firstElementChild;
    expect(layout).not.toHaveClass("min-[1200px]:grid-cols-2");
    expect(
      screen.queryByText("Ce que l’atlas ne dit pas")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contribute" })).toHaveAttribute(
      "data-flag-kind",
      "contribution"
    );
  });
});
