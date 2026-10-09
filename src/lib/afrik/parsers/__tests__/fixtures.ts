import type { NameHistory } from "../nameHistoryParser";

/**
 * A block that passes the shared schema, for tests that need one to travel
 * through a layer rather than to exercise the schema itself.
 */
// @req REQ-196
export const VALID_NAME_HISTORY: NameHistory = {
  summary: "Le nom Yoruba a plusieurs origines possibles, présentées plus bas.",
  names: [
    {
      nameText: "Yoruba",
      nameStatus: "current",
      selfGiven: false,
      languageOfOrigin: "hau",
      namedBy: "Des voisins haoussa, selon les récits",
      accounts: [
        {
          period: { from: 1600, to: 1699, label: "XVIIe siècle" },
          statement: "Le nom Yoruba est d'abord donné par des voisins.",
          birth: true,
          sources: [
            {
              title: "Récit des anciens d'Oyo",
              author: "Conteurs d'Oyo",
              year: null,
              url: null,
              tier: "unverified",
              source_kind: "oral_tradition",
            },
          ],
        },
      ],
    },
  ],
};
