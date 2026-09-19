import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineMarkup } from "@/components/search/feed/InlineMarkup";

describe("InlineMarkup", () => {
  // @req REQ-180
  it("renders the reviewed emphasis subset without injecting arbitrary HTML", () => {
    const { container } = render(
      <p>
        <InlineMarkup
          text={
            "Du <strong>Manden</strong>, au XIX<sup>e</sup> siècle, dit <em>ancien</em>."
          }
        />
      </p>
    );

    expect(screen.getByText("Manden").tagName).toBe("STRONG");
    expect(screen.getByText("e").tagName).toBe("SUP");
    expect(screen.getByText("ancien").tagName).toBe("EM");
    expect(container).toHaveTextContent(
      "Du Manden, au XIXe siècle, dit ancien."
    );
  });

  // @req REQ-180
  it("maps the reviewed muted span and leaves unknown tags inert", () => {
    const { container } = render(
      <InlineMarkup
        text={
          'Peul <span style="font-weight: 400; color: #746557;">/ Peulh</span> <script>alert(1)</script>'
        }
      />
    );

    expect(screen.getByText("/ Peulh")).toHaveClass(
      "font-normal",
      "text-afh-text-soft"
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container).toHaveTextContent("<script>alert(1)</script>");
  });
});
