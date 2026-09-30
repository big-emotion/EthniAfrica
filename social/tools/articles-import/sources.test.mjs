/**
 * Words and references carried over from the workshop, never written anew.
 *
 *     node --test social/tools/articles-import/
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { cardsToSlides, parseCreditsSources } from "./sources.mjs";

const cards = {
  cartes: [
    {
      rang: 2,
      titre: "Deuxième",
      corps: "Corps deux.",
      source: "A. Auteur, Livre, 1981 · B. Autre, Revue 12, 1991",
      image: {
        identite: "Une gravure de vapeur.",
        credit: "Le vapeur",
        depot: "Wikimedia Commons",
        licence: "domaine public",
      },
    },
    { rang: 1, titre: "Premier", corps: "", source: "", image: null },
  ],
};

test("slide text keeps the card order and the card's own words", () => {
  const { slides, sources, credits } = cardsToSlides(cards);
  assert.deepEqual(
    slides.map((s) => s.text),
    [
      "Premier",
      "Deuxième\n\nCorps deux.\n\nA. Auteur, Livre, 1981 · B. Autre, Revue 12, 1991",
    ]
  );
  // A text-only card is described by what it shows: its words.
  assert.equal(slides[0].alt, "Premier");
  assert.equal(slides[1].alt, "Une gravure de vapeur.");
  // Image credits are media credits, never factual sources.
  assert.equal(credits, "Le vapeur · Wikimedia Commons · domaine public");
  assert.deepEqual(
    sources.map((s) => [s.title, s.tier]),
    [
      ["A. Auteur, Livre, 1981", "needs_review"],
      ["B. Autre, Revue 12, 1991", "needs_review"],
    ]
  );
});

test("a slogan printed in the source slot is not a reference", () => {
  const { sources } = cardsToSlides({
    cartes: [
      {
        rang: 1,
        titre: "Fin",
        source: "Nommer un peuple aussi facilement qu'un pays.",
      },
      { rang: 2, titre: "Réf", source: "M. Meeuwis, APiCS Online" },
    ],
  });
  assert.deepEqual(
    sources.map((s) => s.title),
    ["M. Meeuwis, APiCS Online"]
  );
});

const CREDITS = `# Publication credits

## Assets

- map: Natural Earth — Domaine public — https://www.naturalearthdata.com/about/terms-of-use/
- photo: Someone / Wikimedia Commons — CC BY-SA 3.0 — https://commons.wikimedia.org/wiki/File:X.jpg

## Sources

- Natural Earth, Admin 0 Countries, public domain. — https://www.naturalearthdata.com/about/terms-of-use/ (official)
- Someone, X, Wikimedia Commons, CC BY-SA 3.0. — https://commons.wikimedia.org/wiki/File:X.jpg (referenced)
- Office of the Historian, Mali. — https://history.state.gov/countries/mali (official)
- EthniAfrica, approved project closing, 2026-09-25. — https://ethniafrica.com/fr/atlas/pays/MLI (referenced)
- A book cited through an encyclopedia, pages not checked. — https://en.wikipedia.org/wiki/Mali_Federation (unverified)

## Voice rights

Voice named in production.json.
`;

test("release credits: factual sources apart from asset credits and self-citation", () => {
  const { sources, set_aside, credits } = parseCreditsSources(CREDITS);
  assert.equal(
    credits,
    "Natural Earth — Domaine public ; Someone / Wikimedia Commons — CC BY-SA 3.0"
  );
  assert.deepEqual(
    sources.map((s) => [s.title, s.url, s.tier]),
    [
      [
        "Office of the Historian, Mali.",
        "https://history.state.gov/countries/mali",
        "official",
      ],
      [
        "A book cited through an encyclopedia, pages not checked.",
        "https://en.wikipedia.org/wiki/Mali_Federation",
        "unverified",
      ],
    ]
  );
  assert.deepEqual(
    set_aside.map((s) => s.reason),
    ["media credit", "media credit", "self-citation"]
  );
});
