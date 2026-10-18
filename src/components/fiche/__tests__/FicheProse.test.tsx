import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FicheProse } from "@/components/fiche/FicheProse";

describe("FicheProse French punctuation spacing", () => {
  // @req REQ-122
  it("normalizes plain, strong, and emphasis runs while preserving their markup", () => {
    const { container } = render(
      <FicheProse text="Avant : **fort :** puis *italique ?* ensuite !" />
    );

    const paragraph = container.querySelector("p");
    expect(paragraph?.textContent).toBe(
      "Avant\u00a0: fort\u00a0: puis italique\u00a0? ensuite\u00a0!"
    );
    expect(container.querySelector("strong")?.textContent).toBe("fort\u00a0:");
    expect(container.querySelector("em")?.textContent).toBe("italique\u00a0?");
  });
});
