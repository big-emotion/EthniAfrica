import { describe, expect, it } from "vitest";

import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";
import {
  deduceSilences,
  firstSentence,
  groupAccountsBySourceFamily,
  nameFormOf,
  namingReason,
  nextStepTargets,
  otherVoiceKinds,
} from "@/lib/search/nameClosing";
import { sourceKindFamily } from "@/lib/sources/sourceKindFamily";
import { buildNameTimeline } from "@/lib/search/nameTimeline";
import type { SearchResult } from "@/types/afrik-frontend";

const peul = buildNameTimeline(PEUL_HISTORY, "peul");
const lingala = buildNameTimeline(LINGALA_HISTORY, "lingala");

describe("groupAccountsBySourceFamily — block 3, « Les sources »", () => {
  // @req REQ-198
  it("groups the open name's accounts by source family, in the code's fixed order", () => {
    const groups = groupAccountsBySourceFamily(peul.names[0]);
    const order = groups.map((group) => group.family);

    expect(order).toEqual(
      [
        "oral",
        "book",
        "encyclopedia",
        "press",
        "report",
        "archive",
        "other",
      ].filter((family) => order.includes(family as never))
    );
    for (const group of groups) {
      expect(group.accounts.length).toBeGreaterThan(0);
      for (const { sources } of group.accounts) {
        expect(sources.length).toBeGreaterThan(0);
      }
    }
  });

  // @req REQ-161
  it("never ranks: an account backed by two families appears in both", () => {
    const groups = groupAccountsBySourceFamily(lingala.names[0]);
    const all = groups.flatMap((group) => group.accounts.map((a) => a.account));
    const accounts = lingala.names[0].tiles.flatMap((tile) => tile.accounts);

    expect(new Set(all)).toEqual(new Set(accounts));
  });

  // @req REQ-198
  it("counts the distinct sources of each family", () => {
    for (const group of groupAccountsBySourceFamily(lingala.names[0])) {
      const titles = new Set(
        group.accounts.flatMap(({ sources }) => sources.map((s) => s.title))
      );
      expect(group.sourceCount).toBe(titles.size);
    }
  });
});

describe("otherVoiceKinds — the note under block 3", () => {
  const kindsOf = (name: (typeof peul.names)[number]) =>
    new Set(
      name.tiles.flatMap((tile) =>
        tile.accounts.flatMap((account) =>
          account.sources.map((source) => source.source_kind)
        )
      )
    );

  // @req REQ-198
  it("names only the kinds the other names cite and the open one does not", () => {
    for (const timeline of [peul, lingala]) {
      for (const open of timeline.names) {
        const own = kindsOf(open);
        const others = new Set(
          timeline.names
            .filter((name) => name !== open)
            .flatMap((name) => [...kindsOf(name)])
        );
        for (const kind of otherVoiceKinds(timeline.names, open)) {
          expect(own.has(kind)).toBe(false);
          expect(others.has(kind)).toBe(true);
          expect(sourceKindFamily(kind)).not.toBe("other");
        }
      }
    }
  });

  // @req REQ-198
  it("is silent for a subject with a single name", () => {
    expect(otherVoiceKinds([peul.names[0]], peul.names[0])).toEqual([]);
  });
});

describe("deduceSilences — the closing band", () => {
  // @req REQ-198
  it("declares a missing oral voice only when no account of the open name cites one", () => {
    const silences = deduceSilences([{ name: lingala.names[0] }]);
    const oral = lingala.names[0].tiles.some((tile) =>
      tile.accounts.some((account) =>
        account.sources.some(
          (source) => source.source_kind === "oral_tradition"
        )
      )
    );

    expect(silences.some((line) => line.includes("oralement"))).toBe(!oral);
  });

  // @req REQ-198
  it("says the origin is undated when the name has no birth, and what lies before it when it has one", () => {
    const [name] = lingala.names;
    const silences = deduceSilences([{ name }]);

    expect(
      silences.some((line) =>
        name.hasBirth
          ? line.includes("plus ancienne")
          : line.includes("pas datée")
      )
    ).toBe(true);
  });

  // @req REQ-198
  it("names a subject whose history is not written yet", () => {
    const silences = deduceSilences([], [{ label: "Langue", name: "Bassa" }]);

    expect(silences).toEqual([
      "L’histoire du nom Bassa (langue) n’est pas encore écrite.",
    ]);
  });
});

describe("nextStepTargets — the next step", () => {
  const people: SearchResult = {
    type: "people",
    id: "PPL_FULA",
    name: "Peul",
    languageFamilyId: "FLG_ATLANTIQUE" as SearchResult["languageFamilyId"],
    languageFamilyName: "Atlantique",
  };
  const patronyme: SearchResult = {
    type: "patronyme",
    id: "PAT_CONGO",
    name: "Congo",
    associatedPeoples: [{ id: "PPL_MOSSI", name: "Mossi" }],
  };

  // @req REQ-198
  it("offers names the data already links: a people's family, a family name's people", () => {
    expect(nextStepTargets([people, patronyme])).toEqual([
      {
        type: "languageFamily",
        id: "FLG_ATLANTIQUE",
        name: "Atlantique",
        relation: "family",
      },
      { type: "people", id: "PPL_MOSSI", name: "Mossi", relation: "people" },
    ]);
  });

  // @req REQ-198
  it("offers two names at most, never a subject of the page itself", () => {
    const mossi: SearchResult = {
      type: "people",
      id: "PPL_MOSSI",
      name: "Mossi",
    };
    const targets = nextStepTargets([people, patronyme, mossi]);

    expect(targets.length).toBeLessThanOrEqual(2);
    expect(targets.map((target) => target.id)).not.toContain("PPL_MOSSI");
  });

  /** The Peul fiche files its French form as coming from Wolof (`wol`). */
  const withOrigin = (nameText: string, languageOfOrigin: string) => ({
    ...PEUL_HISTORY,
    names: PEUL_HISTORY.names.map((name) =>
      name.nameText === nameText ? { ...name, languageOfOrigin } : name
    ),
  });

  // Brief 1, board search-peul-430: « Peuple · Wolof » before the family.
  // @req REQ-198
  it("offers the language a searched outside name comes from, before the family", () => {
    const targets = nextStepTargets(
      [people],
      [{ subject: people, nameHistory: withOrigin("Peul", "wol") }],
      "peul"
    );

    expect(targets).toHaveLength(2);
    expect(targets[0]).toMatchObject({
      type: "language",
      id: "wol",
      relation: "namer",
    });
    expect(targets[1]).toMatchObject({
      id: "FLG_ATLANTIQUE",
      relation: "family",
    });
  });

  // @req REQ-198
  it("offers no namer for a self-name, an undated origin or the subject's own language", () => {
    const namers = (history: typeof PEUL_HISTORY, searched: string) =>
      nextStepTargets(
        [people],
        [{ subject: people, nameHistory: history }],
        searched
      ).filter((target) => target.relation === "namer");

    // Fulɓe is the name the people gives itself.
    expect(namers(withOrigin("Fulɓe", "ful"), "fulɓe")).toEqual([]);
    // The fiche does not say which language the name comes from.
    expect(namers(PEUL_HISTORY, "peul")).toEqual([]);
    // A name from the language of its self-name was not given by others.
    const ownLanguage = {
      ...PEUL_HISTORY,
      names: PEUL_HISTORY.names.map((name) => ({
        ...name,
        languageOfOrigin: "ful",
      })),
    };
    expect(namers(ownLanguage, "peul")).toEqual([]);
  });

  // Doctrine §1.1: competing readings stand side by side, unranked. A card
  // that quoted one of them would crown it, so a namer's reason is read only
  // from the accounts no other reading contests (« Avatime », four readings).
  // @req REQ-198
  it("keeps the readings a hypothesis group sets side by side out of a namer's reason", () => {
    const account = PEUL_HISTORY.names[0].accounts[0];
    const told = (statement: string, hypothesisGroup?: string) => ({
      ...account,
      statement,
      hypothesisGroup,
    });
    const history = {
      ...PEUL_HISTORY,
      names: PEUL_HISTORY.names.map((name) =>
        name.nameText === "Peul"
          ? {
              ...name,
              languageOfOrigin: "wol",
              accounts: [
                told("Le nom Peul viendrait du wolof pal.", "origine du nom"),
                told("Le nom Peul viendrait du wolof pël.", "origine du nom"),
                told("Le nom Peul a une seule lecture.", "lecture unique"),
                told("Le nom Peul est employé en français."),
              ],
            }
          : name
      ),
    };

    const [namer] = nextStepTargets(
      [people],
      [{ subject: people, nameHistory: history }],
      "peul"
    );

    expect(namer.namingAccounts).toEqual([
      "Le nom Peul a une seule lecture.",
      "Le nom Peul est employé en français.",
    ]);
  });
});

describe("namingReason — why a namer card is offered", () => {
  // An initial is not the end of a sentence: the Nupe fiche attributes the
  // name Tapa to « l'historien E. J. Alagoa », and the card cut him to « E. ».
  // @req REQ-198
  it("keeps an author's initials inside the sentence that names the namer", () => {
    const tapa =
      "Le nom Tapa est celui que les Yoruba donnent aux Nupe, voisins du royaume d'Oyo, selon l'historien E. J. Alagoa. Il le relève dans les récits d'Oyo.";

    expect(namingReason([tapa], "Yoruba")).toBe(
      "Le nom Tapa est celui que les Yoruba donnent aux Nupe, voisins du royaume d'Oyo, selon l'historien E. J. Alagoa."
    );
  });

  // @req REQ-198
  it("reads a page or an era reference as part of its sentence", () => {
    const reference =
      "Le nom Tapa apparaît vers 1500 apr. J.-C. chez les Yoruba, selon Niane (1985, p. 141). Le reste suit.";

    expect(namingReason([reference], "Yoruba")).toBe(
      "Le nom Tapa apparaît vers 1500 apr. J.-C. chez les Yoruba, selon Niane (1985, p. 141)."
    );
  });

  // @req REQ-198
  it("reads up to the sentence that names the namer, and no further", () => {
    expect(
      namingReason(
        ["Forme française du nom. Les sources la font venir du wolof. Suite."],
        "Wolof"
      )
    ).toBe("Forme française du nom. Les sources la font venir du wolof.");
    expect(namingReason(["Aucun lien n'est dit."], "Wolof")).toBeUndefined();
  });
});

describe("nameFormOf — the name a next-step card shows and searches", () => {
  // A filed label is a workshop label: searched as is, « Songhay / Sonrai »
  // or « Lingala (locuteurs) » is a name no reader types.
  // @req REQ-198
  it("cuts a filed label to the form its history tells", () => {
    expect(nameFormOf("Songhay / Sonrai", ["Songhaï", "Songhay"])).toBe(
      "Songhay"
    );
    expect(nameFormOf("Rwandais (Tutsi)", ["Tutsi", "Watusi"])).toBe("Tutsi");
  });

  // @req REQ-198
  it("falls back on the label's lead form, and keeps a plain name whole", () => {
    expect(nameFormOf("Lingala (locuteurs)")).toBe("Lingala");
    expect(nameFormOf("Côte d'Ivoire")).toBe("Côte d'Ivoire");
  });
});

describe("firstSentence", () => {
  // @req REQ-198
  it("keeps the first sentence of a summary", () => {
    expect(
      firstSentence(
        "Le nom Krou désigne une famille. Le mot a d’abord nommé des gens."
      )
    ).toBe("Le nom Krou désigne une famille.");
  });
});
