# Lectures d'Afrique — reading-list carousel

Operator direction, 2026-09-27: reading recommendations published as carousels,
one card per book, with no narration. This profile sits **outside the name-origin
chain**: it has no name question, no myth and no corpus entity, and it never
receives a numbered episode or a site record. It is a social-only feature, like
Mémoires sonores, and is registered in the private library only.

The engine reads `profil: "lectures-afrique"` (`carousel-profiles/lectures-afrique.json`).
`ethni_carrousel2.py --brief lectures-afrique` returns this guide and an empty
opening / book / closing scaffold.

## Deck shape

One opening card, one card per book (at least one), one closing card. The number
of books is not fixed: the operator groups a shelf into posts by theme, and the
opening card counts the books from the deck rather than from typed copy.

| Card | Role | Fields read |
| --- | --- | --- |
| Opening | `ouverture` | `titre` (the section title, eight words at most) |
| Book | `serie` | `titre`, `precision` (the author), `image`, `source` (optional credit override) |
| Closing | `cloture` | `titre` and `corps`: the project's unique closing, word for word |

Book years and summaries live in the caption, not on the cards. That is the
operator's choice: the image carries the cover, the caption carries the reading.

## Layout `lectures-afrique-v1` (proposed, not yet approved)

1080 × 1350, night ground, ocre accent, the same header rule and footer as the
other serial carousels. A book card shows the cover **whole**, contained in a
944 × 785 box and never cropped or stretched, with a soft shadow, then the title
(two lines at most), the author in ocre and one line of credit.

Why a contained cover and not full bleed: a cover is a designed object with its
own margins and type. Cropping it to fill the frame destroys the thing being
recommended, and full-bleed layouts A/B/C were built for photographs to darken
under text.

A title that does not fit two lines, or a cover that would be enlarged past the
engine ceiling, makes the lot a proof. The type is never shrunk to fit, and the
layout quota of name carousels does not apply.

## Rights and gates

Covers are protected works, and the licence gate accepts only licences it knows.
On 2026-09-27 the operator approved the look and took responsibility for
reproducing the covers, so the profile declares one wording, `assumedLicence`
(« couverture protégée, reproduction assumée par l'opérateur »). It is a
declaration by the operator, not a licence that was read, and it is scoped:

- it clears the licence gate for decks of this profile only; the same words on an
  ordinary deck are refused;
- any other unnamed licence in the same deck is still refused;
- it counts as the most constraining licence of the lot, so the computed output
  licence says so.

The other gates are untouched. In particular the message gate still needs its own
verdict file (`message.md`) like any other lot.

## Networks

TikTok, Instagram, Facebook, YouTube and LinkedIn, as §1 bis gives the carousel.
X has no carousel and receives nothing.
