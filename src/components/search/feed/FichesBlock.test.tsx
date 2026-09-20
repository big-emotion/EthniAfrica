import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FichesBlock } from "@/components/search/feed/FichesBlock";
import { getFamilyRoute, getPeopleRoute } from "@/lib/routing";

// @req REQ-180
describe("FichesBlock", () => {
  it("derives its columns from the number of available entries", () => {
    render(
      <FichesBlock
        items={[
          {
            kind: "Peuple",
            name: "Mande",
            meta: "Afrique de l’Ouest",
            href: getPeopleRoute("fr", "PPL_MANDE"),
          },
        ]}
      />
    );

    expect(screen.getByRole("list")).toHaveClass(
      "grid-cols-1",
      "min-[1200px]:grid-cols-1"
    );
    expect(screen.getByRole("link", { name: /Mande/ })).toHaveClass("min-h-11");
  });

  // @req REQ-180
  it("keeps multiple fiches in one column until a full 430 px mobile canvas", () => {
    render(
      <FichesBlock
        items={[
          {
            kind: "Famille de langues",
            name: "A very long documented name",
            meta: "Fiche documentée",
            href: getFamilyRoute("fr", "test-a"),
          },
          {
            kind: "Famille de langues",
            name: "Another very long documented name",
            meta: "Fiche documentée",
            href: getFamilyRoute("fr", "test-b"),
          },
        ]}
      />
    );

    expect(screen.getByRole("list")).toHaveClass(
      "grid-cols-1",
      "min-[430px]:grid-cols-2"
    );
  });

  // @req REQ-180
  it("uses the English shelf copy when requested", () => {
    render(<FichesBlock language="en" items={[]} />);

    expect(
      screen.getByRole("heading", { name: "In the atlas" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Go deeper with each entry and all of its sources.")
    ).toBeInTheDocument();
  });

  // @req REQ-002
  it("keeps split people fiches grouped while every member remains reachable", async () => {
    const onNavigate = vi.fn();
    render(
      <FichesBlock
        items={[
          {
            kind: "Peuple",
            name: "Peul",
            meta: "2 fiches",
            links: [
              {
                name: "Peul",
                href: getPeopleRoute("fr", "PPL_PEUL"),
                onNavigate,
              },
              {
                name: "Peul du Massina",
                href: getPeopleRoute("fr", "PPL_PEUL_MASSINA"),
                onNavigate,
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    await userEvent.click(
      screen.getByRole("link", { name: "Peul du Massina" })
    );
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
