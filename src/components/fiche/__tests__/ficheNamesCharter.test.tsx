import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FicheNamesChapter } from "@/components/fiche/FicheNamesChapter";
import { getPatronymeRoute } from "@/lib/routing";
import { getTranslation } from "@/lib/translations";

import { namesForCountry, namesForPeople } from "./corpusRecords";

const clan = (id: string, nameMain: string) => ({
  id,
  nameMain,
  nameSystem: "clan_name" as const,
});

const reach = (id: string, nameMain: string, peopleName: string) => ({
  ...clan(id, nameMain),
  viaPeoples: [{ id: "PPL_SAMPLE", nameMain: peopleName }],
});

/**
 * One names chapter for both records. People names are filed by naming
 * system; a country keeps its two registers apart — what a source attests
 * here, and what its peoples carry without an attestation here — because
 * summing them would publish the second as the first.
 */
describe("fiche names charter", () => {
  afterEach(cleanup);

  // @req REQ-133
  it("titles a people's names for what they are and keeps the published anchor", () => {
    const names = namesForPeople("PPL_OVAMBO");
    render(<FicheNamesChapter scope="people" names={names} language="fr" />);

    const chapter = screen.getByRole("region", {
      name: "Noms de personnes associés à ce peuple",
    });
    expect(chapter).toHaveAttribute("id", "chapitre-noms-portes");
    expect(
      within(chapter).getByRole("heading", { level: 3, name: "Nom de clan" })
    ).toBeVisible();
    // Pohamba and Shikongo are personal names turned family names (ETNI-2011,
    // sixth naming system); Amadhila, Hamutenya and Iipumbu are personal names
    // with no transmission shown. The Ovambo names split across three groups.
    expect(
      within(chapter).getByRole("heading", {
        level: 3,
        name: "Patronyme non héréditaire",
      })
    ).toBeVisible();
    expect(
      within(chapter).getByRole("heading", {
        level: 3,
        name: "Nom de famille héréditaire",
      })
    ).toBeVisible();
    expect(chapter).toHaveTextContent("3 noms");
    expect(chapter).toHaveTextContent("2 noms");
    expect(within(chapter).queryByRole("navigation")).toBeNull();

    const links = within(chapter).getAllByRole("link");
    expect(links).toHaveLength(8);
    const amadhila = names.find((name) => name.nameMain === "Amadhila")!;
    expect(
      within(chapter).getByRole("link", { name: "Amadhila" })
    ).toHaveAttribute("href", getPatronymeRoute("fr", amadhila.id));
  });

  // @req REQ-133
  it("uses personal names even when every entry is a patronymic", () => {
    render(
      <FicheNamesChapter
        scope="people"
        names={namesForPeople("PPL_HAUSA")}
        language="fr"
      />
    );
    expect(
      screen.getByRole("region", {
        name: "Noms de personnes associés à ce peuple",
      })
    ).toHaveAttribute("id", "chapitre-noms-portes");
  });

  // @req REQ-133
  it("indexes a group past the threshold across the whole alphabet", () => {
    const many = Array.from({ length: 25 }, (_, index) =>
      clan(`PAT_T${index}`, `${"ABK"[index % 3]}ame ${index}`)
    );
    render(<FicheNamesChapter scope="people" names={many} language="fr" />);

    const index = screen.getByRole("navigation", {
      name: /index alphabétique/i,
    });
    expect(index.querySelectorAll("[data-letter]")).toHaveLength(26);
    const letter = within(index).getByRole("link", { name: "K" });
    expect(document.querySelector(letter.getAttribute("href")!)).not.toBeNull();
  });

  // @req REQ-119 REQ-133
  it("distinguishes a failed read from a documented empty list", () => {
    const copy = getTranslation("fr").patronymes.onFiche;
    const { rerender } = render(
      <FicheNamesChapter scope="people" names={null} language="fr" />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      copy.peopleUnavailable
    );

    rerender(<FicheNamesChapter scope="people" names={[]} language="fr" />);
    expect(screen.getByRole("status")).toHaveTextContent(copy.peopleEmpty);
  });

  // @req REQ-133 REQ-154
  it("keeps the country's two registers apart and says whose names the second are", () => {
    render(
      <FicheNamesChapter
        scope="country"
        patronymes={{
          attested: [clan("PAT_KEITA", "Keïta")],
          borneByPeoples: [reach("PAT_MAGHRAWA", "Maghrawa", "Zénètes")],
        }}
        language="fr"
      />
    );

    const chapter = screen.getByRole("region", {
      name: "Noms de personnes rattachés à ce pays",
    });
    expect(chapter).toHaveAttribute("id", "chapitre-noms-attestes");

    const attested = chapter.querySelector<HTMLElement>(
      '[data-names-register="attested"]'
    )!;
    const carried = chapter.querySelector<HTMLElement>(
      '[data-names-register="reach"]'
    )!;
    expect(attested).toHaveTextContent("Attestés dans le pays");
    expect(within(attested).getByRole("link", { name: "Keïta" })).toBeVisible();
    expect(attested).not.toHaveTextContent("Maghrawa");

    const summary = carried.querySelector("details > summary");
    expect(summary).toHaveTextContent(
      "Portés par les peuples du pays, sans attestation ici"
    );
    expect(summary).toHaveTextContent("Zénètes");
    expect(
      within(carried).getByRole("link", { name: "Maghrawa" })
    ).toHaveAttribute("href", getPatronymeRoute("fr", "PAT_MAGHRAWA"));
  });

  // @req REQ-119 REQ-133
  it("states the gap when neither register reaches a name, and a failed read apart", () => {
    const copy = getTranslation("fr").patronymes.onFiche;
    const { rerender } = render(
      <FicheNamesChapter
        scope="country"
        patronymes={{ attested: [], borneByPeoples: [] }}
        language="fr"
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(copy.countryEmpty);

    rerender(
      <FicheNamesChapter scope="country" patronymes={null} language="fr" />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      copy.countryUnavailable
    );
  });

  // @req REQ-133
  it("lists the naming systems a register holds", () => {
    render(
      <FicheNamesChapter
        scope="country"
        patronymes={{
          attested: [
            clan("PAT_KEITA", "Keïta"),
            { id: "PAT_ANI", nameMain: "Ani", nameSystem: "nisba" as const },
          ],
          borneByPeoples: [],
        }}
        language="fr"
      />
    );
    const systems = document.querySelector(
      '[data-names-register="attested"] [data-names-systems]'
    );
    expect(systems).toHaveTextContent("Nom de clan");
    expect(systems).toHaveTextContent("Nisba");
  });
});

/**
 * Brief 10 §2 and REQ-153 as extended on 2026-10-17 (boards country-civ and
 * country-state-civ-names-open): a long list of names folds behind its count,
 * its title and tally staying in view.
 */
describe("fiche names — a long list folds behind its count", () => {
  afterEach(cleanup);

  // @req REQ-153
  it("folds the names attested in Côte d'Ivoire, their index and their systems line, under the title and tally", () => {
    // The board drew 47; the count is the corpus's, read here, not a constant.
    const attested = namesForCountry("CIV");
    const count = attested.length;
    expect(count).toBeGreaterThan(24);
    render(
      <FicheNamesChapter
        scope="country"
        patronymes={{
          attested,
          borneByPeoples: [reach("PAT_MAGHRAWA", "Maghrawa", "Zénètes")],
        }}
        language="fr"
      />
    );

    const group = document.querySelector(
      '[data-names-register="attested"]'
    ) as HTMLElement;
    const fold = group.querySelector("details.ea-fold") as HTMLDetailsElement;
    expect(fold.open).toBe(false);
    expect(
      fold.querySelector(':scope > summary [data-when="closed"]')
    ).toHaveTextContent(`+ Afficher les ${count} noms`);
    expect(
      fold.querySelector(':scope > summary [data-when="open"]')
    ).toHaveTextContent("− replier");
    const title = within(group).getByRole("heading", {
      level: 3,
      name: "Attestés dans le pays",
    });
    expect(fold).not.toContainElement(title);
    expect(fold).not.toContainElement(within(group).getByText(`${count} noms`));
    expect(fold).toContainElement(
      group.querySelector(".afh-name-index") as HTMLElement
    );
    expect(fold).toContainElement(
      group.querySelector("[data-names-systems]") as HTMLElement
    );
    expect(fold.querySelectorAll(".afh-name-pills a")).toHaveLength(count);

    // The second register is already a closed tile, and stays one.
    const carried = document.querySelector('[data-names-register="reach"]');
    expect(carried?.querySelector("details.ea-fold")).toBeNull();
    expect(carried?.querySelector("details.afh-tile")).not.toBeNull();
  });

  // @req REQ-153
  it("leaves a list of fewer than 12 names open", () => {
    const few = Array.from({ length: 11 }, (_, index) =>
      clan(`PAT_F${index}`, `Nom ${index}`)
    );
    const { container } = render(
      <FicheNamesChapter
        scope="country"
        patronymes={{ attested: few, borneByPeoples: [] }}
        language="fr"
      />
    );

    expect(container.querySelector("details.ea-fold")).toBeNull();
  });
});

// @req REQ-133 REQ-153
describe("approved country name disclosures", () => {
  afterEach(cleanup);

  // @req REQ-133 REQ-153
  it.each(["NAM", "BDI"])(
    "keeps all %s names available behind their count",
    (country) => {
      const attested = namesForCountry(country);
      const { container } = render(
        <FicheNamesChapter
          scope="country"
          patronymes={{ attested, borneByPeoples: [] }}
          language="fr"
        />
      );
      const disclosure = container.querySelector<HTMLDetailsElement>(
        '[data-names-register="attested"] details'
      );
      expect(disclosure).not.toBeNull();
      expect(disclosure).not.toHaveAttribute("open");
      expect(disclosure!.querySelector("summary")).toHaveTextContent(
        `Afficher les ${attested.length} noms`
      );
      expect(disclosure!.querySelectorAll("li a")).toHaveLength(
        attested.length
      );
      for (const name of attested)
        expect(disclosure).toHaveTextContent(name.nameMain);
      expect(
        screen.getByRole("region", {
          name: "Noms de personnes rattachés à ce pays",
        })
      ).toBeInTheDocument();
    }
  );
});
