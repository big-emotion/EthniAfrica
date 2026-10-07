import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The sheet reads the route's locale for its own chrome.
const navigation = await vi.hoisted(async () => {
  const { mockRouteLanguage } = await import("@/test/mockRouteLanguage");
  return mockRouteLanguage("fr");
});
vi.mock("next/navigation", () => navigation);

import { SourcesLine } from "@/components/search/answer/SourcesLine";
import { answerOf } from "@/components/search/answer/__tests__/fixtures";

// @req REQ-180
describe("SourcesLine", () => {
  it("says how many sources the answers rest on, in one line", () => {
    const answer = answerOf("lingala");
    render(
      <SourcesLine
        count={answer.sources.count}
        accounts={answer.origin?.accounts}
        kind={answer.kind}
        title={answer.title}
      />
    );
    expect(screen.getByText(/Ces réponses s'appuient sur/)).toHaveTextContent(
      "Ces réponses s'appuient sur 4 sources"
    );
  });

  // @req REQ-180
  it("opens the source sheet with the sources grouped by account", async () => {
    const answer = answerOf("lingala");
    render(
      <SourcesLine
        count={answer.sources.count}
        accounts={answer.origin?.accounts}
        kind={answer.kind}
        title={answer.title}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Voir les sources" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const first = await screen.findByTestId("position-group-0");
    const second = await screen.findByTestId("position-group-1");
    expect(first).toHaveTextContent("Récit 1 · Source écrite");
    expect(first).toHaveTextContent("lingala, lecture européenne");
    expect(first).not.toHaveTextContent("lecture bobangi");
    expect(second).toHaveTextContent("lecture bobangi");
  });

  // @req REQ-180
  it("draws nothing when no source backs the answer", () => {
    const { container } = render(
      <SourcesLine count={0} kind="people" title="x" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
