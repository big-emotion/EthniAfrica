import { describe, expect, it } from "vitest";

import { frenchPathForLegacyEnglish } from "@/lib/legacyEnglishPaths";
import { getPageFromRoute } from "@/lib/routing";

describe("frenchPathForLegacyEnglish", () => {
  // @req REQ-140
  it.each([
    ["/en", "/fr"],
    ["/en/", "/fr"],
    ["/en/atlas/peoples/x", "/fr/atlas/peuples/x"],
    ["/en/atlas/countries", "/fr/atlas/pays"],
    ["/en/atlas/families/FLG_BANTU", "/fr/atlas/familles/FLG_BANTU"],
    ["/en/atlas/languages/yor", "/fr/atlas/langues/yor"],
    ["/en/atlas/search", "/fr/atlas/recherche"],
    ["/en/atlas/ethnonyms/PPL_X", "/fr/atlas/appellations/PPL_X"],
    ["/en/atlas/names/PAT_X", "/fr/atlas/noms/PAT_X"],
    ["/en/atlas/persons/PER_X", "/fr/atlas/personnes/PER_X"],
    [
      "/en/atlas/peoples/PPL_YORUBA/links",
      "/fr/atlas/peuples/PPL_YORUBA/liens",
    ],
    ["/en/dossiers/naming/the-thing", "/fr/dossiers/nommer/la-chose"],
    ["/en/dossiers/proverbs", "/fr/dossiers/proverbes"],
    [
      "/en/dossiers/perspectives/colonisation-and-resistances",
      "/fr/dossiers/regards/colonisation-et-resistances",
    ],
    ["/en/dossiers/kongo-kingdom", "/fr/dossiers/royaume-kongo"],
    ["/en/games/quiz", "/fr/jeux/quiz"],
    ["/en/games", "/fr/jeux"],
    ["/en/compare/countries/BEN/TGO", "/fr/comparer/pays/BEN/TGO"],
    [
      "/en/discoveries/kabyle-proverb-gentle-word",
      "/fr/decouvertes/proverbe-kabyle-parole-douce",
    ],
    ["/en/glossary", "/fr/glossaire"],
    ["/en/wallpapers", "/fr/fonds-decran"],
    ["/en/legal-notice", "/fr/mentions-legales"],
    ["/en/data-policy", "/fr/politique-de-donnees"],
    ["/en/accessibility", "/fr/accessibilite"],
    ["/en/sitemap", "/fr/plan-du-site"],
    ["/en/reports", "/fr/signalements"],
  ])("sends %s to %s", (english, french) => {
    expect(frenchPathForLegacyEnglish(english)).toBe(french);
  });

  // Words both vocabularies shared, identifiers and words it never knew
  // travel unchanged — the proxy's other tables, or a 404, handle the rest.
  // @req REQ-140
  it("carries shared words, identifiers and unknown segments verbatim", () => {
    expect(frenchPathForLegacyEnglish("/en/about")).toBe("/fr/about");
    expect(frenchPathForLegacyEnglish("/en/atlas/peoples/PPL_%C3%89WE")).toBe(
      "/fr/atlas/peuples/PPL_%C3%89WE"
    );
    expect(frenchPathForLegacyEnglish("/en/peuples")).toBe("/fr/peuples");
    expect(frenchPathForLegacyEnglish("/en/whatever/else")).toBe(
      "/fr/whatever/else"
    );
  });

  // Every French target of the head table must be a live page type, or the
  // redirect would land a retired English link on a 404.
  // @req REQ-140
  it("lands every translated head on a page the site serves", () => {
    for (const english of [
      "/en/atlas/countries",
      "/en/atlas/families",
      "/en/atlas/peoples",
      "/en/atlas/languages",
      "/en/atlas/search",
      "/en/atlas/ethnonyms",
      "/en/atlas/names",
      "/en/dossiers/proverbs",
      "/en/discoveries",
      "/en/compare",
      "/en/dossiers/naming",
      "/en/dossiers/resources",
      "/en/dossiers/luba-empire",
      "/en/dossiers/lunda-empire",
      "/en/dossiers/kongo-spiritualities",
      "/en/glossary",
      "/en/wallpapers",
      "/en/games",
    ]) {
      expect(
        getPageFromRoute(frenchPathForLegacyEnglish(english)),
        english
      ).not.toBeNull();
    }
  });
});
