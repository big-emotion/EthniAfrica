# Lectures d'Afrique — reading-list carousel

Operator direction, 2026-09-27: reading recommendations published as carousels, one
card per book. This sits **outside the name-origin chain**: no name question, no myth,
no corpus entity, no numbered episode and no site record. It is a social-only feature,
registered in the private library only.

**It uses the standard carousel gabarit and no other.** A first version drew its own
layout (cover on a plain ground, small type) and the operator rejected it the same day:
every carousel keeps the look the account already has. A second version used the white
variant with the cover in the upper part; the operator preferred the cover as the
full-frame photograph of the card, like the Rastafari and Lingala carousels. There is no
reading-list layout, and none is to be added, and no plain, dark or solid-colour
background mode exists: every card has a full-frame image behind it (operator ruling,
2026-09-30).

The engine reads `profil: "lectures-afrique"` (`carousel-profiles/lectures-afrique.json`).
`ethni_carrousel2.py --brief lectures-afrique` returns this guide and an empty scaffold.

## What the profile does

Three things, none of them visual:

1. **Networks.** TikTok, Instagram, Facebook, YouTube and LinkedIn, as §1 bis gives the
   carousel. X has no carousel.
2. **Validation of a variable-length deck.** An opening (`ouverture`), one card per book
   (`serie`), and the unique closing (`bascule`). Every card carries an image.
3. **One licence declaration.** See below.

## Deck shape

`fond: "nuit"`, `disposition: "auto"` on every card: the engine chooses.

| Card | Role | Fields read |
| --- | --- | --- |
| Opening | `ouverture` | `titre` (the section title, eight words at most), `precision` (« N livres à lire ») |
| Book | `serie` | `titre` (the book title), `precision` (the author) |
| Closing | `bascule` | `titre` and `corps`: the project's unique closing, word for word |

Years and summaries live in the caption, not on the cards. The image carries the cover,
the caption carries the reading.

## The images

**A book card's photograph is the cover itself**, cut out and straightened beforehand, kept
with its own cropping (`cadrage: "50% 0%"` keeps the top of the cover). The standard layout
puts its text column and veil over it. Two consequences follow from the standard rules
rather than from anything in this profile:

- a cover under about 540 px wide would be enlarged past ×2, so the engine falls back to
  the standard cartouche for that card (§6). The lot quota (60 % in A at least, 30 % in C
  at most) then decides whether the post ships or stays a proof: a post whose covers are
  mostly small does not ship. The fix is a new, larger photograph of the cover, never a
  bent threshold;
- the cover's own lettering shows under the column of a long title. That is inherent to
  using the cover as background, and the veil keeps the title readable.

`ethni_couvertures.py <Sujet>` writes the images. It reads the covers from
`<projet>/couvertures/<image.couverture>` and writes `<projet>/assets/<image.fichier>`:
each cover unaltered, and, for the opening and the closing, every cover of the selection
side by side over a full-frame picture (the first cover, enlarged and blurred), placed above
the start of that card's own veil (read from the engine's plan, since a longer title means
a shorter free zone).

## Rights

Covers are protected works and the licence gate accepts only licences it knows. On
2026-09-27 the operator took responsibility for reproducing them, so the profile declares
one wording, `assumedLicence` (« couverture © éditeur »). It is a declaration by the
operator, not a licence that was read, and it is scoped:

- it clears the licence gate for decks of this profile only; the same words on an
  ordinary deck are refused;
- any other unnamed licence in the same deck is still refused;
- it counts as the most constraining licence of the lot, so the computed output licence
  and the credit lines say so.

The other gates are untouched. The message gate still needs its own verdict file
(`message.md`), and its grid was written for names: a reading list is read by analogy with
Mémoires sonores, and the verdict says so.
