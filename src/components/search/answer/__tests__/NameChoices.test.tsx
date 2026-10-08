import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NameChoices } from "@/components/search/answer/NameChoices";
import { buildRelationSearchHref } from "@/lib/search/relationSearch";
import { getFamilyRoute } from "@/lib/routing";

const choices = [
  {
    kind: "languageFamily" as const,
    eyebrow: "Famille de langues",
    label: "Les langues bantoues",
    href: getFamilyRoute("fr", "FLG_BANTU"),
  },
  {
    kind: "people" as const,
    eyebrow: "Peuples",
    label: "Les peuples qui les parlent",
    href: buildRelationSearchHref("fr", { kind: "family", id: "FLG_BANTU" }),
  },
];

// @req REQ-178
describe("NameChoices", () => {
  it("asks what the reader is after and offers every way in at the same weight", () => {
    render(<NameChoices title="Que cherchez-vous ?" choices={choices} />);
    expect(
      screen.getByRole("heading", { name: "Que cherchez-vous ?" })
    ).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      choices.map(({ href }) => href)
    );
    expect(links[0]).toHaveTextContent("Famille de langues");
    expect(links[0]).toHaveTextContent("Les langues bantoues");
    expect(links[1]).toHaveTextContent("Peuples");
  });

  // @req REQ-178
  it("gives each card the accent of what it leads to, and a 44 px target", () => {
    render(<NameChoices title="Que cherchez-vous ?" choices={choices} />);
    const [family, people] = screen.getAllByRole("link");
    expect(family.className).toContain("afh-accent-perv");
    expect(people.className).toContain("afh-accent-ocre");
    expect(family.className).toContain("min-h-11");
  });

  // @req REQ-178
  it("draws nothing when there is a single way in", () => {
    const { container } = render(
      <NameChoices title="Que cherchez-vous ?" choices={choices.slice(0, 1)} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
