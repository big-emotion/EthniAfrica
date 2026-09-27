# Lectures d'Afrique — reading-list carousel

Operator direction, 2026-09-27: reading recommendations published as carousels, one
card per book. This sits **outside the name-origin chain**: no name question, no myth,
no corpus entity, no numbered episode and no site record. It is a social-only feature,
registered in the private library only.

**It uses the standard carousel gabarit and no other.** A first version drew its own
layout (cover on a night ground, small type) and the operator rejected it the same day:
every carousel keeps the look the account already has, the dark variant (Rastafari,
Lingala) or the white variant (Griot). Reading lists use the white variant, `fond:
"parchemin"`. There is no reading-list layout, and none is to be added.

The engine reads `profil: "lectures-afrique"` (`carousel-profiles/lectures-afrique.json`).
`ethni_carrousel2.py --brief lectures-afrique` returns this guide and an empty scaffold.

## What the profile does

Three things, none of them visual:

1. **Networks.** TikTok, Instagram, Facebook, YouTube and LinkedIn, as §1 bis gives the
   carousel. X has no carousel.
2. **Validation of a variable-length deck.** An opening (`ouverture`), one card per book
   (`serie`, layout `A`), and the unique closing (`bascule`). Every card carries an image.
3. **One licence declaration.** See below.

## Deck shape

| Card | Role | Fields read |
| --- | --- | --- |
| Opening | `ouverture` | `titre` (the section title, eight words at most), `precision` (« N livres à lire ») |
| Book | `serie`, `disposition: "A"` | `titre` (the book title), `precision` (the author) |
| Closing | `bascule` | `titre` and `corps`: the project's unique closing, word for word |

Years and summaries live in the caption, not on the cards. The image carries the cover,
the caption carries the reading.

## The images

A cover is an object with its own margins, so it must not sit under the text column of
layout A. Like the light cards of the Griot deck, each card gets a prepared 4:5 image on
the deck's ground: the cover, cut out and straightened, in the upper part, and the
column of the standard layout written over the rest.

`ethni_couvertures.py <Sujet>` prepares them. It reads the covers from
`<projet>/couvertures/<image.couverture>` and writes `<projet>/assets/<image.fichier>`.
The free zone is read from the engine's own plan for that card, because a long title makes
a taller column and therefore a shorter zone: a four-line title leaves a cover about 380
px high, a two-line one about 590 px. The cover may enter the veil ramp a little (it melts
into the ground like the photographs of other decks) but never the column itself. The
opening and the closing show every cover of the selection side by side.

Use one file name per card (`ouverture-clair.png`, `cloture-clair.png`): the two cards have
different text, so different free zones.

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
