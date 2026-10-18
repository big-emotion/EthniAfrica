// @req REQ-200
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/queries/afrik/nameAddressEntries", () => ({
  getNameSuggestionRows: vi.fn(),
}));
vi.mock("@/api/v2/services/nameAddresses", () => ({
  getNameAddressSpellings: vi.fn(),
}));

import { getNameSuggestionRows } from "@/lib/supabase/queries/afrik/nameAddressEntries";
import { getNameAddressSpellings } from "@/api/v2/services/nameAddresses";
import { suggestNamesByPrefix } from "@/api/v2/services/nameSuggestions";

const history = (...forms: Array<string | [string, boolean]>) => ({
  summary: "Un nom étudié dans la fiche.",
  names: forms.map((form) => {
    const [nameText, selfGiven] =
      typeof form === "string" ? [form, false] : form;
    return {
      nameText,
      nameStatus: "current",
      selfGiven,
      languageOfOrigin: null,
      namedBy: null,
      accounts: [
        {
          period: { from: 1900, to: 1950, label: "Début du XXe siècle" },
          statement: `Le nom ${nameText} est attesté.`,
          birth: false,
          sources: [
            {
              title: "Source",
              author: "Auteur",
              year: 1950,
              url: null,
              tier: "referenced",
              source_kind: "academic",
            },
          ],
        },
      ],
    };
  }),
});

describe("suggestNamesByPrefix", () => {
  beforeEach(() => {
    vi.mocked(getNameSuggestionRows).mockReset();
    vi.mocked(getNameAddressSpellings).mockReset();
  });

  // @req REQ-200
  it("folds accents and case, retains African letters, orders forms alphabetically and returns address-aware links", async () => {
    vi.mocked(getNameAddressSpellings).mockResolvedValue(["Fulɓe"]);
    vi.mocked(getNameSuggestionRows).mockResolvedValue([
      {
        id: "PPL_FULA",
        type: "people",
        name: "Peul",
        nameHistory: history("Peul", ["Fulɓe", true]),
      },
      {
        id: "PPL_PAPEL",
        type: "people",
        name: "Papel",
        nameHistory: history(["Pepel", true]),
      },
      {
        id: "PPL_PEDI",
        type: "people",
        name: "Pedi",
        nameHistory: history(["Bapedi", true], ["Pedi", true]),
      },
      {
        id: "PPL_KPELLE",
        type: "people",
        name: "Kpelle",
        nameHistory: history("Pessy"),
      },
      {
        id: "PPL_OTHER",
        type: "people",
        name: "Fulɓe",
        nameHistory: history("ɓeta"),
      },
    ]);

    const result = await suggestNamesByPrefix("PE", 8);

    expect(result.map(({ form }) => form)).toEqual([
      "Pedi",
      "Pepel",
      "Pessy",
      "Peul",
    ]);
    expect(result[0]).toMatchObject({
      type: "people",
      id: "PPL_PEDI",
      note: "se nomme lui-même Bapedi",
      href: "/fr/atlas/recherche?q=Pedi",
    });
    expect(result[1].note).toBe("nom que se donnent les Papel");
    expect(result[2].note).toBe("un nom des Kpelle");
    expect(result[3]).toMatchObject({
      form: "Peul",
      note: "se nomme lui-même Fulɓe",
      href: "/fr/atlas/recherche?q=Peul",
    });
    expect(await suggestNamesByPrefix("ful", 8)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          form: "Fulɓe",
          href: "/fr/atlas/recherche/ful%C9%93e",
        }),
      ])
    );
    expect((await suggestNamesByPrefix("ɓe", 8))[0].form).toBe("ɓeta");
  });

  // @req REQ-200
  it("caps matching suggestions to the requested limit", async () => {
    vi.mocked(getNameAddressSpellings).mockResolvedValue([]);
    vi.mocked(getNameSuggestionRows).mockResolvedValue([
      {
        id: "PPL_A",
        type: "people",
        name: "Keita",
        nameHistory: history("Keita"),
      },
      {
        id: "PPL_B",
        type: "people",
        name: "Kéïta",
        nameHistory: history("Kéïta"),
      },
      {
        id: "PPL_C",
        type: "people",
        name: "Kongo",
        nameHistory: history("Kongo"),
      },
    ]);

    expect(await suggestNamesByPrefix("ke", 1)).toHaveLength(1);
  });

  // @req REQ-200
  it("suggests the Macina form with its self-given name in the note", async () => {
    vi.mocked(getNameAddressSpellings).mockResolvedValue([]);
    vi.mocked(getNameSuggestionRows).mockResolvedValue([
      {
        id: "PPL_FULANI_MASSINA",
        type: "people",
        name: "Fulbe du Massina (Peuls du Massina / Macina)",
        nameHistory: history(["Fulɓe Maasina", true], "Peuls du Macina"),
      },
    ]);

    expect(await suggestNamesByPrefix("pe", 8)).toContainEqual({
      form: "Peuls du Macina",
      type: "people",
      id: "PPL_FULANI_MASSINA",
      note: "se nomme lui-même Fulɓe Maasina",
      href: "/fr/atlas/recherche?q=Peuls+du+Macina",
    });
  });
});
