import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  NamedText,
  SourcedText,
} from "@/components/search/timeline/SourcedText";

describe("timeline text spacing", () => {
  // @req REQ-198
  it("uses no-break spaces before French punctuation and inside guillemets", () => {
    const { container } = render(
      <NamedText text={"« Lingala » : une forme ?!"} forms={["Lingala"]} />
    );

    expect(container.textContent).toBe(
      "«\u00a0Lingala\u00a0»\u00a0: une forme\u00a0?!"
    );
    expect(screen.getByText("Lingala", { selector: "em" })).toBeInTheDocument();
  });

  // @req REQ-194
  // @req REQ-198
  it("keeps the final word in the source-button group while normalizing punctuation", () => {
    render(
      <SourcedText
        text={"La forme Lingala : « ancienne forme », puis dernier mot"}
        forms={["Lingala"]}
      >
        <button type="button">Sources</button>
      </SourcedText>
    );

    const button = screen.getByRole("button", { name: "Sources" });
    const tail = button.parentElement;

    expect(tail).toHaveClass("afh-source-tail");
    expect(tail?.textContent).toBe("mot\u00a0Sources");
    expect(tail?.parentElement?.textContent).toContain(
      "La forme Lingala\u00a0: «\u00a0ancienne forme\u00a0», puis dernier mot\u00a0Sources"
    );
  });
});
