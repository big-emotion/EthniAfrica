import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppellationsBlock } from "@/components/search/feed/AppellationsBlock";

const forms = [
  { form: "Fang", selfGiven: true },
  { form: "Pahouin", selfGiven: false, qualifier: "français colonial" },
  { form: "Pangwe", selfGiven: null },
  { form: "Pamue", selfGiven: null },
  { form: "M’fan", selfGiven: null, searched: true },
];

const numbered = (count: number, subjectId?: string) =>
  Array.from({ length: count }, (_, index) => ({
    form: `Forme ${index + 1}`,
    subjectId,
  }));

describe("AppellationsBlock", () => {
  // @req REQ-180
  it("marks rather than promotes the searched and self-given forms", () => {
    render(<AppellationsBlock language="fr" forms={forms} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Les appellations" })
    ).toBeVisible();
    expect(screen.getByText("le nom qu’ils se donnent")).toBeVisible();
    expect(screen.getByText("votre recherche")).toBeVisible();
    expect(screen.getByText("français colonial")).toBeVisible();
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

    expect(screen.getByText("forme contestée")).toBeVisible();
    expect(screen.getByText("votre recherche")).toBeVisible();
    expect(screen.getByText("le nom qu’ils se donnent")).toBeVisible();
  });

  // @req REQ-180
  it("hides only ordinary qualifiers on narrow screens", () => {
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
          { form: "Toucouleur", selfGiven: null, problematic: "recorded" },
        ]}
      />
    );

    expect(screen.getByText("français colonial")).toHaveClass(
      "hidden",
      "min-[1200px]:inline"
    );
    expect(screen.getByText("le nom qu’ils se donnent")).not.toHaveClass(
      "hidden"
    );
    expect(screen.getByText("forme contestée")).not.toHaveClass("hidden");
  });

  // @req REQ-180
  it("uses a marked form's own qualifier as its tag when the corpus provides one", () => {
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
            form: "Nigeria",
            searched: true,
            qualifier: "votre recherche · 1914",
          },
        ]}
      />
    );

    expect(screen.getByText("leur nom, et celui de tous")).not.toHaveClass(
      "hidden"
    );
    expect(screen.getByText("votre recherche · 1914")).not.toHaveClass(
      "hidden"
    );
    expect(screen.queryByText("le nom qu’ils se donnent")).toBeNull();
    expect(screen.queryByText("votre recherche")).toBeNull();
  });

  // @req REQ-180
  it("mounts one list, with no width-specific copy that could hold its own state", () => {
    render(<AppellationsBlock language="fr" forms={forms} />);

    expect(screen.getAllByTestId("appellations-list")).toHaveLength(1);
  });
});

// @req REQ-180
describe("AppellationsBlock expansion", () => {
  // @req REQ-180
  it("shows up to eight forms in full, with no button and no dead anchor", () => {
    const { container } = render(
      <AppellationsBlock language="fr" forms={numbered(8)} />
    );

    expect(container.querySelectorAll("[data-appellation]")).toHaveLength(8);
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector('a[href="#origins"]')).toBeNull();
  });

  // @req REQ-180
  it("expands and collapses a long list in place with a real button", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppellationsBlock language="fr" forms={numbered(12)} />
    );

    const expand = screen.getByRole("button", {
      name: "Afficher les 4 autres appellations",
    });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(expand).toHaveAttribute(
      "aria-controls",
      screen.getByTestId("appellations-list").id
    );
    expect(screen.queryByText("Forme 12")).toBeNull();

    await user.click(expand);
    expect(screen.getByText("Forme 12")).toBeVisible();
    expect(container.querySelector('a[href="#origins"]')).toBeNull();

    const collapse = screen.getByRole("button", { name: "Réduire" });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    await user.click(collapse);
    expect(screen.queryByText("Forme 12")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Afficher les 4 autres appellations" })
    ).toHaveFocus();
  });

  // @req REQ-180
  it("keeps the searched form visible while the list is collapsed", () => {
    render(
      <AppellationsBlock
        language="fr"
        forms={[...numbered(11), { form: "Cherchée", searched: true }]}
      />
    );

    expect(screen.getByText("Cherchée")).toBeVisible();
  });

  // @req REQ-180
  it("counts the hidden forms from the list it was given", () => {
    render(<AppellationsBlock language="fr" forms={numbered(9)} />);

    expect(
      screen.getByRole("button", { name: "Afficher l’autre appellation" })
    ).toBeVisible();
  });

  // @req REQ-180
  it("expands one subject's group without touching another's", async () => {
    const user = userEvent.setup();
    render(
      <AppellationsBlock
        language="fr"
        forms={[...numbered(10, "people:A"), ...numbered(10, "language:B")]}
        groupLabels={{ "people:A": "A · Peuple", "language:B": "B · Langue" }}
      />
    );

    const [firstButton] = screen.getAllByRole("button", {
      name: "Afficher les 2 autres appellations",
    });
    await user.click(firstButton);

    const [first, second] = screen.getAllByTestId("appellations-list");
    expect(within(first).getAllByRole("listitem")).toHaveLength(10);
    expect(within(second).getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByText("A · Peuple")).toBeVisible();
    expect(screen.getByText("B · Langue")).toBeVisible();
  });

  // @req REQ-180
  it("does not merge identical spellings across subjects", () => {
    const { container } = render(
      <AppellationsBlock
        language="fr"
        forms={[
          { form: "Bambara", subjectId: "people:PPL_BAMBARA" },
          { form: "Bambara", subjectId: "language:bam" },
        ]}
        groupLabels={{
          "people:PPL_BAMBARA": "Bambara · Peuple",
          "language:bam": "Bambara · Langue",
        }}
      />
    );

    expect(container.querySelectorAll("[data-appellation]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-appellation-group]")).toHaveLength(
      2
    );
  });
});

// @req REQ-180
describe("AppellationsBlock form semantics", () => {
  // @req REQ-180
  it("opens a form's own detail in place and closes it again", async () => {
    const user = userEvent.setup();
    render(
      <AppellationsBlock
        language="fr"
        forms={[
          { form: "Lingala", detail: { text: "Langue des marchés" } },
          { form: "Ngala" },
        ]}
      />
    );

    const form = screen.getByRole("button", { name: /Lingala/ });
    expect(form).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Langue des marchés")).toBeNull();

    await user.click(form);
    expect(screen.getByText("Langue des marchés")).toBeVisible();
    expect(form).toHaveAttribute("aria-expanded", "true");

    await user.click(form);
    expect(screen.queryByText("Langue des marchés")).toBeNull();
  });

  // @req REQ-180
  it("renders a destination-only form as a link and a bare form as plain text", () => {
    render(
      <AppellationsBlock
        language="fr"
        forms={[
          { form: "Kongo", href: "/fr/atlas/peoples/PPL_KONGO" },
          { form: "Ngala" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: /Kongo/ })).toHaveAttribute(
      "href",
      "/fr/atlas/peoples/PPL_KONGO"
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link", { name: /Ngala/ })).toBeNull();
    expect(screen.getByText("Ngala")).toBeVisible();
  });
});
