import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppellationsBlock } from "@/components/search/feed/AppellationsBlock";

const forms = [
  { form: "Fang", selfGiven: true },
  { form: "Pahouin", selfGiven: false, qualifier: "français colonial" },
  { form: "Pangwe", selfGiven: null },
  { form: "Pamue", selfGiven: null },
  { form: "M’fan", selfGiven: null, searched: true },
];

describe("AppellationsBlock", () => {
  // @req REQ-180
  it("marks rather than promotes the searched and self-given forms", () => {
    render(<AppellationsBlock language="fr" forms={forms} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Les appellations" })
    ).toBeVisible();
    expect(screen.getAllByText("le nom qu’ils se donnent")).toHaveLength(2);
    expect(screen.getAllByText("votre recherche")).toHaveLength(2);
    expect(screen.getAllByText("français colonial")).toHaveLength(2);
  });

  // @req REQ-180
  it("keeps a recorded problematic form visible and explicitly marked", () => {
    render(
      <AppellationsBlock
        language="fr"
        forms={[
          {
            form: "Toucouleur",
            selfGiven: true,
            searched: true,
            problematic: "recorded",
          },
        ]}
      />
    );

    expect(screen.getAllByText("forme contestée")).toHaveLength(2);
    expect(screen.getAllByText("votre recherche")).toHaveLength(2);
    expect(screen.getAllByText("le nom qu’ils se donnent")).toHaveLength(2);
  });

  // @req REQ-180
  it("keeps mobile labels compact and hides only ordinary qualifiers", () => {
    render(
      <AppellationsBlock
        language="fr"
        forms={[
          { form: "Fang", selfGiven: true },
          {
            form: "Pahouin",
            selfGiven: false,
            qualifier: "français colonial",
          },
          {
            form: "Toucouleur",
            selfGiven: null,
            problematic: "recorded",
          },
        ]}
      />
    );

    const mobile = screen.getByTestId("appellations-mobile");
    for (const item of mobile.querySelectorAll("[data-appellation]")) {
      expect(item).not.toHaveClass("min-h-11");
    }

    expect(within(mobile).getByText("français colonial")).toHaveClass(
      "hidden",
      "min-[1200px]:inline"
    );
    expect(
      within(mobile).getByText("le nom qu’ils se donnent")
    ).not.toHaveClass("hidden");
    expect(within(mobile).getByText("forme contestée")).not.toHaveClass(
      "hidden"
    );
  });

  // @req REQ-180
  it("caps the mobile list at three and keeps the searched form visible", () => {
    render(<AppellationsBlock language="fr" forms={forms} />);

    const mobile = screen.getByTestId("appellations-mobile");
    expect(mobile.querySelectorAll("[data-appellation]")).toHaveLength(3);
    expect(within(mobile).getByText("Fang")).toBeVisible();
    expect(within(mobile).getByText("Pahouin")).toBeVisible();
    expect(within(mobile).getByText("M’fan")).toBeVisible();
    expect(within(mobile).queryByText("Pangwe")).not.toBeInTheDocument();
    expect(
      within(mobile).getByRole("link", { name: "+2 autres" })
    ).toHaveAttribute("href", "#origins");
  });

  // @req REQ-180
  it("uses a marked form's own qualifier as its tag, on every width, when the corpus provides one", () => {
    render(
      <AppellationsBlock
        language="fr"
        forms={[
          {
            form: "Ekpeye",
            selfGiven: true,
            qualifier: "leur nom, et celui de tous",
          },
          {
            form: "Tarawele",
            selfGiven: true,
            qualifier: "la forme mandingue",
          },
          {
            form: "Nigeria",
            searched: true,
            qualifier: "votre recherche · 1914",
          },
        ]}
      />
    );

    const mobile = screen.getByTestId("appellations-mobile");
    expect(
      within(mobile).getByText("leur nom, et celui de tous")
    ).not.toHaveClass("hidden");
    expect(within(mobile).getByText("la forme mandingue")).not.toHaveClass(
      "hidden"
    );
    expect(within(mobile).getByText("votre recherche · 1914")).not.toHaveClass(
      "hidden"
    );
    expect(
      screen.queryByText("le nom qu’ils se donnent")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("votre recherche")).not.toBeInTheDocument();
  });

  // @req REQ-180
  it("adds only the explicit 1200 px desktop composition", () => {
    render(<AppellationsBlock language="fr" forms={forms} />);

    expect(screen.getByTestId("appellations-mobile")).toHaveClass(
      "min-[1200px]:hidden"
    );
    const desktop = screen.getByTestId("appellations-desktop");
    expect(desktop).toHaveClass("hidden", "min-[1200px]:flex");
    expect(desktop.querySelectorAll("[data-appellation]")).toHaveLength(4);
    expect(within(desktop).getByText("M’fan")).toBeVisible();
    expect(
      within(desktop).getByRole("link", { name: "+1 autre" })
    ).toBeVisible();
  });
});
