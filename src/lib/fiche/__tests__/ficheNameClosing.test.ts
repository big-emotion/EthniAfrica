import { describe, expect, it } from "vitest";

import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  ficheNextSteps,
  ficheSilences,
  undatedReadingsSilences,
} from "@/lib/fiche/ficheNameClosing";

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
  // An oral account is drawn as the corpus records it: carried by someone.
  ...(source_kind === "oral_tradition" ? { carrier: "Porteur" } : {}),
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
          relation: "family",
          name: "Krou",
          summary:
            "Le nom krou désigne une famille. Le mot a d’abord nommé des gens.",
        },
        { relation: "patronyme", name: "Gbedee", summary: null },
        {
          relation: "country",
          name: "Libéria",
          summary:
            "Le nom Libéria désigne un pays. Il a d’abord désigné une colonie.",
        },
        {
          relation: "country",
          name: "Sierra Leone",
          summary: "Le nom Sierra Leone.",
        },
      ])
    ).toEqual([
      {
        relation: "family",
        kind: "Famille de langues",
        name: "Krou",
        reason: "Le nom krou désigne une famille.",
      },
      {
        relation: "country",
        kind: "Pays",
        name: "Libéria",
        reason: "Le nom Libéria désigne un pays.",
      },
    ]);
  });

  // Rendered on the Lingala fiche as ?q=Lingala+%28locuteurs%29: a filed
  // label no reader types, and so no result page answers it.
  // @req REQ-198
  it("names each card by a form its history tells, not by its filed label", () => {
    const [songhay, lingala] = ficheNextSteps([
      {
        relation: "family",
        name: "Songhay / Sonrai",
        summary: "Le nom songhay désigne des langues.",
        names: ["Songhaï", "Songhay"],
      },
      {
        relation: "people",
        name: "Lingala (locuteurs)",
        summary: "Le nom Bato ya mangala désigne des locuteurs.",
      },
    ]);

    expect(songhay.name).toBe("Songhay");
    expect(lingala.name).toBe("Lingala");
  });
});

// Brief 4, approved 2026-10-15: docs/design/mockups/site/family-*.dc.html.
describe("ficheSilences — the closing band of a language family", () => {
  // @req REQ-198
  it("says a name no account tells yet, instead of calling it undated", () => {
    const lines = ficheSilences(
      history(
        name("Bantou", [account("1858", 1858, "archive", { birth: true })]),
        name("Bantu", [])
      ),
      "languageFamily"
    );

    expect(lines).toEqual([
      "Aucun récit transmis oralement n’est enregistré pour les noms de cette famille de langues.",
      "Aucune source du projet ne raconte encore le nom Bantu.",
      "Aucune trace du nom Bantou plus ancienne que 1858 n’est connue du projet.",
    ]);
  });

  // @req REQ-198
  // @req REQ-161
  it("names who wrote down oral traditions no carrier tells yet", () => {
    const reported = account("Avant Soundiata, selon la tradition", null);
    reported.sources = [
      { ...source("intergovernmental"), author: "Djibril Tamsir Niane" },
      {
        ...source(
          "oral_tradition",
          "Traditions des écoles de griots du Manden"
        ),
        carrier: undefined,
        author: "Écoles de griots du Manden",
      },
    ];
    const lines = ficheSilences(
      history(
        name("Mandé", [account("1867", 1867, "archive", { birth: true })]),
        name("Manden", [reported, account("1854", 1854)])
      ),
      "languageFamily"
    );

    expect(lines).toEqual([
      "Les traditions orales sur le nom Manden ne nous parviennent que par Djibril Tamsir Niane. Le projet n’a pas encore de récit recueilli auprès de celles et ceux qui les transmettent.",
      "Aucune trace du nom Mandé plus ancienne que 1867 n’est connue du projet.",
    ]);
  });
});

// Brief 5, approved 2026-10-15: docs/design/mockups/site/country-*.dc.html.
describe("undatedReadingsSilences — the country fiche", () => {
  // @req REQ-198
  it("says when the competing readings of a name carry no date at all", () => {
    const reading = (label: string) => ({
      ...account(label, null),
      hypothesisGroup: "origine du nom Quaqua",
    });
    const dated = {
      ...account("1475-1476", 1475),
      hypothesisGroup: "malagens",
    };
    expect(
      undatedReadingsSilences(
        history(
          name("Côte d'Ivoire", [
            account("1670", 1670, "archive", { birth: true }),
          ]),
          name("Côte de Quaqua", [reading("a"), reading("b"), reading("c")]),
          name("Costa de Malagens", [dated, { ...dated }])
        )
      )
    ).toEqual([
      "Les trois explications du nom Côte de Quaqua ne sont pas datées.",
    ]);
  });
});
