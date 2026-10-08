// (illustrative, not data) — shape-only fixture for relationParser tests. Never loaded into Supabase.
// Invalid: a numeric tier 3 is outside the vocabulary the parser accepts.
// @req REQ-032
export const invalidTier3Source = {
  id: "REL_TEST_INVALID_03",
  relationType: "religious",
  peopleIdA: "PPL_TEST_A",
  peopleIdB: "PPL_TEST_B",
  direction: "bidirectional",
  period: { startYear: null, endYear: null, label: "Illustratif" },
  description: "Fixture invalide illustrative.",
  sources: [
    {
      title: "Titre illustratif Tier 3 (interdit)",
      author: "Auteur illustratif",
      year: 2020,
      url: "https://example.org/forbidden-tier-3",
      tier: 3,
      notes: "",
    },
  ],
};
