import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LanguageFamilyDetailViewV2 } from "@/components/family/LanguageFamilyDetailViewV2";
import { ficheNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { getLocalizedRoute } from "@/lib/routing";
import type { LanguageFamily } from "@/types/afrik";

vi.mock("@/hooks/use-consent", () => ({
  useOptionalConsent: () => null,
  useConsent: () => ({
    consentState: {
      hasConsented: true,
      preferences: { essential: true, analytics: false, functional: true },
      consentDate: null,
    },
    acceptAll: vi.fn(),
    rejectAll: vi.fn(),
    updatePreferences: vi.fn(),
    showBanner: false,
    setShowBanner: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

/** A family fiche as the loader reads it from the corpus. */
function familyRecord(id: string): LanguageFamily {
  const raw = JSON.parse(
    readFileSync(
      join(
        process.cwd(),
        "dataset/source/afrik/famille_linguistique",
        `${id}.json`
      ),
      "utf8"
    )
  ) as LanguageFamily & { nameHistory?: unknown };
  return { ...raw, nameHistory: ficheNameHistory(raw, id) };
}

function chapter(title: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(
    `[data-fiche-section="${title}"]`
  );
  if (!found) throw new Error(`No chapter « ${title} »`);
  return found;
}

const terms = (root: ParentNode) =>
  Array.from(root.querySelectorAll(".afh-prose-term"), (n) => n.textContent);

function expectFolded(title: string, open: string, hidden: string[]) {
  const section = chapter(title);
  const folds = section.querySelectorAll("details.ea-fold");
  expect(folds).toHaveLength(1);
  const fold = folds[0] as HTMLElement;
  expect(
    fold.querySelector(':scope > summary [data-when="closed"]')
  ).toHaveTextContent(`+ Voir aussi : ${hidden.join(", ")}`);
  expect(terms(fold)).toEqual(hidden);
  const first = section.querySelector("dl.afh-prose-fields") as HTMLElement;
  expect(fold).not.toContainElement(first);
  expect(terms(first)).toEqual([open]);
  expect(fold).not.toContainElement(section.querySelector("h2") as HTMLElement);
}

/**
 * Brief 10 §2 (REQ-153 as amended 2026-10-17), boards family-mande and
 * family-bantu: a chapter of prose fields folds the same way as a chapter of
 * tiles, its first field standing for the first tile.
 */
describe("LanguageFamilyDetailViewV2 — a long prose chapter folds after its first field", () => {
  // @req REQ-153
  it("folds Mandé's traits and history after « Typologie » and « Origine probable »", () => {
    render(
      <LanguageFamilyDetailViewV2
        family={familyRecord("FLG_MANDE")}
        language="fr"
      />
    );

    expectFolded("Caractéristiques linguistiques", "Typologie", [
      "Traits phonologiques",
      "Relations avec les voisins",
    ]);
    expectFolded("Histoire et origines", "Origine probable", [
      "Période d'émergence",
      "Diffusion",
      "Ruptures historiques",
      "Zones de contact",
      "Événements majeurs",
    ]);
    // The section's report control closes the chapter, outside the fold.
    const report = document.querySelector(
      '[data-testid="section-flag-target-history"]'
    ) as HTMLElement;
    expect(report.closest("details.ea-fold")).toBeNull();
  });

  // @req REQ-153
  it("folds Bantou's the same way, with its own fields", () => {
    render(
      <LanguageFamilyDetailViewV2
        family={familyRecord("FLG_BANTU")}
        language="fr"
      />
    );

    expectFolded("Caractéristiques linguistiques", "Typologie", [
      "Traits phonologiques",
      "Relations avec les voisins",
      "Innovations majeures",
    ]);
    expectFolded("Histoire et origines", "Origine probable", [
      "Période d'émergence",
      "Diffusion",
      "Ruptures historiques",
      "Zones de contact",
    ]);
  });

  // @req REQ-153
  it("never folds the chapters about the family's own names", () => {
    render(
      <LanguageFamilyDetailViewV2
        family={familyRecord("FLG_MANDE")}
        language="fr"
      />
    );

    for (const title of [
      "L’histoire des noms",
      "D'où vient le nom de la famille",
      "Appellations et décolonisation",
    ]) {
      expect(chapter(title).querySelector("details.ea-fold")).toBeNull();
    }
  });
});
