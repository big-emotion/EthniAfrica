import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FicheChronologyChapter } from "@/components/fiche/FicheChronologyChapter";
import type { ParagraphNoteData } from "@/components/people/peopleFicheNotes";
import { countryChronology, peopleChronology } from "@/lib/fiche/chronology";
import {
  transformPeopleHistory,
  transformPeopleOrigins,
} from "@/lib/peopleDataTransformer";

import { countryRecord, peopleRecord } from "./corpusRecords";

const stylesheet = readFileSync(
  join(process.cwd(), "src/styles/fiche-parchment.css"),
  "utf8"
);

function renderNamibia() {
  const chronology = countryChronology(countryRecord("NAM"), "fr");
  return render(
    <FicheChronologyChapter
      language="fr"
      stations={chronology.stations}
      etymology={chronology.etymology}
      etymologyAnchorId="chapitre-le-nom-et-son-histoire"
    />
  );
}

/**
 * The shared history timeline, as the reader meets it on both records
 * (operator ruling, 2026-09-12): one vertical line, a dot and a rule per
 * station inked by its regime, and in each station the period, then the
 * title, then the preview.
 */
describe("fiche chronology charter", () => {
  afterEach(cleanup);

  // @req REQ-148
  it("draws one list whose stations carry their regime, in order", () => {
    const { container } = renderNamibia();
    const lists = container.querySelectorAll("ol.afh-chronology");
    expect(lists).toHaveLength(1);
    expect(
      Array.from(lists[0].children, (item) => item.getAttribute("data-regime"))
    ).toEqual(["polity", "polity", "colonial", "colonial", "modern"]);
  });

  // @req REQ-148
  it("sets the period above the title and prints it once per station", () => {
    const { container } = renderNamibia();
    for (const station of container.querySelectorAll(
      "ol.afh-chronology > li"
    )) {
      const period = station.querySelector("[data-station-period]");
      const title = station.querySelector(".afh-tile-label");
      expect(period).not.toBeNull();
      expect(
        period!.compareDocumentPosition(title!) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      const periodText = period!.textContent!;
      expect(station.textContent!.split(periodText)).toHaveLength(2);
    }
  });

  // @req REQ-154
  it("names the territory at each station and opens on the etymology", () => {
    const { container } = renderNamibia();
    const etymology = container.querySelector(
      "#chapitre-le-nom-et-son-histoire"
    );
    expect(etymology).toHaveTextContent("D'où vient le nom");
    const list = container.querySelector("ol.afh-chronology")!;
    expect(
      etymology!.compareDocumentPosition(list) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    // Six tiles: the stations sit behind the fold (brief 10 §2) and open in
    // place, each still naming the territory.
    fireEvent.click(
      container.querySelector("details.ea-fold > summary") as HTMLElement
    );
    expect(
      within(list as HTMLElement).getByText("Deutsch-Südwestafrika")
    ).toBeVisible();
  });

  // @req REQ-148
  it("keys the three regimes in a legend, only for those present", () => {
    const { container } = renderNamibia();
    const legend = container.querySelector("[data-chronology-legend]");
    expect(legend).toHaveTextContent("Précolonial");
    expect(legend).toHaveTextContent("Colonial");
    expect(legend).toHaveTextContent("Contemporain");

    cleanup();
    const onlyDiaspora = render(
      <FicheChronologyChapter
        language="fr"
        stations={peopleChronology(
          { migrationRoutes: [], historicalSettlementZones: [] },
          { diaspora: "Communautés au Brésil." },
          "fr"
        )}
      />
    );
    const single = onlyDiaspora.container.querySelector(
      "[data-chronology-legend]"
    );
    expect(single).toHaveTextContent("Contemporain");
    expect(single).not.toHaveTextContent("Précolonial");
  });

  /**
   * A sourced passage keeps its citation. The preview is plain text — a
   * paragraph cannot sit in a summary — so the opened station restates the
   * passage in full with its note call, and the preview steps aside.
   */
  // @req REQ-155
  it("keeps a passage's note call and hides the preview it restates", () => {
    const people = peopleRecord("PPL_OVAMBO");
    const note: ParagraphNoteData = {
      noteNumber: 3,
      anchorId: "note-origines",
      fieldLabel: "Origines anciennes",
      assertionId: "assertion-1",
      assertionStatement: "Expansion bantoue.",
      contested: false,
      sources: [],
      numberBySourceId: {},
    };
    const { container } = render(
      <FicheChronologyChapter
        language="fr"
        stations={peopleChronology(
          transformPeopleOrigins(people.origins),
          transformPeopleHistory(people.historicalRole),
          "fr"
        )}
        notes={{ ancientOrigins: note }}
      />
    );
    const first = container.querySelector("ol.afh-chronology > li")!;
    expect(first.querySelector('[data-note-number="3"]')).not.toBeNull();
    expect(first.querySelector("details")).toHaveAttribute(
      "data-body-restates-preview",
      "true"
    );
    expect(stylesheet).toMatch(
      /\.afh-tile\[open\]\[data-body-restates-preview="true"\]\s+\.afh-tile-preview\s*\{[^}]*display:\s*none/
    );
  });

  // @req REQ-148
  it("inks each regime from its token, never a literal", () => {
    expect(stylesheet).toMatch(
      /\.afh-chronology\s*>\s*\[data-regime="polity"\]\s*\{[^}]*--afh-regime-ink:\s*var\(--afh-chronology-polity-ink\)/
    );
    expect(stylesheet).toMatch(
      /\.afh-chronology\s*>\s*\[data-regime="colonial"\]\s*\{[^}]*--afh-regime-ink:\s*var\(--afh-colonial-ink\)/
    );
    expect(stylesheet).toMatch(
      /\.afh-chronology\s*>\s*\[data-regime="modern"\]\s*\{[^}]*--afh-regime-ink:\s*var\(--afh-chronology-modern-ink\)/
    );
  });
});

const labelsIn = (root: ParentNode) =>
  Array.from(root.querySelectorAll(".afh-tile-label"), (n) => n.textContent);

/**
 * Brief 10 §2 (REQ-153 as amended 2026-10-17), boards people-fula and
 * country-civ: « Histoire » keeps its first tile and folds the rest. A legend
 * folds with what it explains once nothing it explains is in view (`Main`).
 */
describe("fiche chronology — a long history folds after its first tile", () => {
  afterEach(cleanup);

  // @req REQ-153
  it("keeps the people's first station under its legend, and folds the others", () => {
    const people = peopleRecord("PPL_FULA");
    const { container } = render(
      <FicheChronologyChapter
        language="fr"
        stations={peopleChronology(
          transformPeopleOrigins(people.origins),
          transformPeopleHistory(people.historicalRole),
          "fr"
        )}
      />
    );

    const fold = container.querySelector("details.ea-fold") as HTMLElement;
    const legend = container.querySelector("[data-chronology-legend]");
    expect(fold).not.toContainElement(legend as HTMLElement);
    const [open, folded] = Array.from(
      container.querySelectorAll("ol.afh-chronology")
    );
    expect(open.closest("details.ea-fold")).toBeNull();
    expect(labelsIn(open)).toEqual(["Formation et origines"]);
    expect(
      legend!.compareDocumentPosition(open) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(fold).toContainElement(folded as HTMLElement);
    expect(
      fold.querySelector(':scope > summary [data-when="closed"]')
    ).toHaveTextContent(
      "+ Voir aussi : Royaumes & chefferies, Influences extérieures, Conflits & alliances, Diaspora"
    );
    expect(labelsIn(folded)).toEqual([
      "Royaumes & chefferies",
      "Influences extérieures",
      "Conflits & alliances",
      "Diaspora",
    ]);
  });

  // @req REQ-153
  it("keeps the country's name origin open and folds the legend with every station", () => {
    const chronology = countryChronology(countryRecord("CIV"), "fr");
    const { container } = render(
      <FicheChronologyChapter
        language="fr"
        stations={chronology.stations}
        etymology={chronology.etymology}
        etymologyAnchorId="chapitre-le-nom-et-son-histoire"
      />
    );

    const fold = container.querySelector("details.ea-fold") as HTMLElement;
    const etymology = container.querySelector(
      "#chapitre-le-nom-et-son-histoire"
    ) as HTMLElement;
    expect(fold).not.toContainElement(etymology);
    expect(labelsIn(etymology)).toEqual(["D'où vient le nom"]);
    expect(fold).toContainElement(
      container.querySelector("[data-chronology-legend]") as HTMLElement
    );
    expect(container.querySelectorAll("ol.afh-chronology")).toHaveLength(1);
    expect(
      fold.querySelector(':scope > summary [data-when="closed"]')
    ).toHaveTextContent(
      "+ Voir aussi : 5 entités politiques, Royaume de Kong, Colonie de Côte d'Ivoire, République de Côte d'Ivoire"
    );
  });

  // @req REQ-153
  it("folds nothing when the history holds two tiles or fewer", () => {
    const chronology = countryChronology(countryRecord("CIV"), "fr");
    const { container } = render(
      <FicheChronologyChapter
        language="fr"
        stations={chronology.stations.slice(0, 1)}
        etymology={chronology.etymology}
      />
    );

    expect(container.querySelector("details.ea-fold")).toBeNull();
    expect(container.querySelector("[data-chronology-legend]")).not.toBeNull();
  });
});
