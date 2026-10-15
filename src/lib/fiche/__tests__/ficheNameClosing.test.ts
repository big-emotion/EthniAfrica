import { describe, expect, it } from "vitest";

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { ficheNextSteps, ficheSilences } from "@/lib/fiche/ficheNameClosing";

type Name = NameHistory["names"][number];
type Account = Name["accounts"][number];

const source = (
  source_kind: Account["sources"][number]["source_kind"],
  title = `Source ${source_kind}`
): Account["sources"][number] => ({
  title,
  author: "Auteur",
  year: 2000,
  url: null,
  tier: "referenced",
  source_kind,
});

const account = (
  label: string,
  from: number | null,
  kind: Account["sources"][number]["source_kind"] = "academic",
  extra: Partial<Account> = {}
): Account => ({
  period: { from, to: from, label },
  statement: `Le nom apparaît (${label}).`,
  sources: [source(kind)],
  ...extra,
});

const name = (nameText: string, accounts: Account[]): Name =>
  ({
    nameText,
    nameStatus: "current",
    selfGiven: true,
    languageOfOrigin: null,
    namedBy: null,
    accounts,
  }) as Name;

const history = (...names: Name[]): NameHistory =>
  ({ summary: "Résumé.", names }) as NameHistory;

// Brief 2, approved 2026-10-15: docs/design/mockups/site/people-*.dc.html.
describe("ficheSilences — the closing band of a fiche", () => {
  // @req REQ-198
  it("speaks of the names of the people when none cites an oral account", () => {
    const lines = ficheSilences(
      history(
        name("Fulɓe", [
          account("Voyage de 1849-1855", 1849, "academic", { birth: true }),
        ]),
        name("Futankooɓe", [account("Usage contemporain", null)])
      ),
      "people"
    );

    expect(lines).toEqual([
      "Aucun récit transmis oralement n’est enregistré pour les noms de ce peuple.",
      "L’origine du nom Futankooɓe n’est pas datée dans le projet pour l’instant.",
      "Avant sa plus ancienne trace connue du projet, l’histoire du nom Fulɓe reste à écrire.",
    ]);
  });

  // @req REQ-198
  it("declares no missing oral account when one exists, and dates the first trace", () => {
    const lines = ficheSilences(
      history(
        name("Bassa", [
          account("Usage contemporain", null, "linguistic_reference"),
          account("1904", 1904),
          account(
            "Avant l'arrivée des commerçants européens",
            null,
            "oral_tradition"
          ),
          account("Rapporté en 2013", 2013, "oral_tradition"),
        ])
      ),
      "people"
    );

    expect(lines).toEqual([
      "On ne sait pas avec certitude quand le nom Bassa a été écrit pour la première fois. La plus ancienne trace datée que le projet connaît est de 1904.",
    ]);
  });

  // @req REQ-198
  it("names the century of an oldest trace, and the year when it is a plain year", () => {
    const century = ficheSilences(
      history(
        name("Halaba", [
          account("XVe siècle", 1401, "intergovernmental", { birth: true }),
        ]),
        name("Alaba", [account("1885-1888", 1885, "archive", { birth: true })])
      ),
      "people"
    );
    const year = ficheSilences(
      history(
        name("Peul", [account("1842", 1842, "academic", { birth: true })])
      ),
      "people"
    );

    expect(century.at(-1)).toBe(
      "Avant sa plus ancienne trace connue du projet, au XVe siècle, l’histoire du nom Halaba reste à écrire."
    );
    expect(year.at(-1)).toBe(
      "Aucune trace du nom Peul plus ancienne que 1842 n’est connue du projet."
    );
  });
});

describe("ficheNextSteps — the next names of a fiche", () => {
  // @req REQ-198
  it("keeps two names whose fiche has a summary, each with its first sentence", () => {
    expect(
      ficheNextSteps([
        {
          kind: "Famille de langues",
          name: "Krou",
          summary:
            "Le nom krou désigne une famille. Le mot a d’abord nommé des gens.",
        },
        { kind: "Nom de famille", name: "Gbedee", summary: null },
        {
          kind: "Pays",
          name: "Libéria",
          summary:
            "Le nom Libéria désigne un pays. Il a d’abord désigné une colonie.",
        },
        { kind: "Pays", name: "Sierra Leone", summary: "Le nom Sierra Leone." },
      ])
    ).toEqual([
      {
        kind: "Famille de langues",
        name: "Krou",
        reason: "Le nom krou désigne une famille.",
      },
      {
        kind: "Pays",
        name: "Libéria",
        reason: "Le nom Libéria désigne un pays.",
      },
    ]);
  });
});
