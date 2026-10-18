import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  FichesBlock,
  type FeedFicheItem,
} from "@/components/search/feed/FichesBlock";
import {
  getFamilyRoute,
  getPatronymeRoute,
  getPeopleRoute,
} from "@/lib/routing";

function patronymeCard(name: string, meta?: string): FeedFicheItem {
  return {
    kind: "Nom",
    name,
    ...(meta ? { meta } : {}),
    href: getPatronymeRoute("fr", `PAT_${name.toUpperCase()}`),
  };
}

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

  // "Dans l’atlas" said where the entries were and not what to do with them;
  // the heading now names the action the shelf offers.
  // @req REQ-180
  it("names the shelf by what the reader can do with it", () => {
    render(<FichesBlock language="fr" items={[]} />);

    expect(
      screen.getByRole("heading", { name: "Découvrir" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Dans l’atlas")).not.toBeInTheDocument();
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

  // Brief 12 (approved 2026-10-17): in the « Fiches » lens a card carries its
  // fiche's own line, too long for half of a 382 px phone column, so a group
  // stays in one column below 768 px and takes its columns from its own cards.
  // @req REQ-180
  it("lays each lens group out from its own card count, one column below 768 px", () => {
    render(
      <FichesBlock
        lens="grouped"
        items={[
          {
            kind: "Peuple",
            name: "Fulbe (Peul / Fulani)",
            meta: "2 fiches",
            onName: true,
            links: [
              { name: "Peul", href: getPeopleRoute("fr", "PPL_FULA") },
              {
                name: "Fulbe du Massina (Peuls du Massina / Macina)",
                href: getPeopleRoute("fr", "PPL_FULANI_MASSINA"),
              },
            ],
          },
          ...["Bello", "Diallo", "Sidibé", "Baldé"].map((name) =>
            patronymeCard(name, `La ligne de ${name}.`)
          ),
        ]}
      />
    );

    const onName = screen.getByRole("region", { name: "Sur ce nom · 1" });
    const around = screen.getByRole("region", {
      name: "Autour de ce nom · 4",
    });
    const onNameGrid = within(onName).getAllByRole("list")[0];
    expect(onNameGrid).toHaveClass("grid-cols-1");
    expect(onNameGrid).not.toHaveClass("min-[768px]:grid-cols-2");
    expect(within(around).getByRole("list")).toHaveClass(
      "grid-cols-1",
      "min-[768px]:grid-cols-2",
      "min-[1200px]:grid-cols-4"
    );
    expect(
      within(around).getByText("Un contexte lié, pas le même nom.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Découvrir" })).toBeNull();
    // The boards set a group heading in the body face; a bare h2 would take
    // the display face every heading of the site has by default.
    for (const heading of screen.getAllByRole("heading", { level: 2 })) {
      expect(heading).toHaveClass("font-afh");
    }
  });

  // A fiche whose name carries no line shows its eyebrow and its name: an
  // empty line, or a generic one, would tell the reader nothing (brief 12).
  // @req REQ-180
  it("draws a lens card with no line as its eyebrow and name only", () => {
    render(
      <FichesBlock
        lens="ungrouped"
        items={[
          patronymeCard("Abdi"),
          patronymeCard("Bello", "Un nom personnel."),
        ]}
      />
    );

    const abdi = screen.getByRole("link", { name: /Abdi/ });
    expect(abdi.children).toHaveLength(2);
    expect(abdi).toHaveTextContent(/^NomAbdi$/);
    expect(screen.getByRole("link", { name: /Bello/ })).toHaveTextContent(
      "Un nom personnel."
    );
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
