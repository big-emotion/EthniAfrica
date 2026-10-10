# Content fit and accessibility

The card never hides or shrinks essential text below a readable size. When text does not fit, the content changes, not the type.

## What happens when text does not fit

The renderer measures the panel after the fonts and images load, then applies these steps in order and records each one in the fit report (`report`):

1. **Title step.** A title that reaches three lines at 88 px is set at 72 px (`report.titleStep = "m"`). A title still longer than three lines is a warning: shorten it.
2. **Dense body.** If the panel is taller than 900 px, the body drops from 32 px to 28 px (`report.autoDense`). 28 px is the floor. A card may also ask for `density: "dense"` explicitly.
3. **Overflow.** If the panel is still taller than 900 px, `report.overflow` is true, `report.ok` is false, and in diagnostic mode the card shows a red border and a dashed guide at 900 px. The production tools must refuse to export such a card. The fix is editorial: split the card or shorten it.

Nothing else adapts automatically. The engine never changes margins, never shrinks sources below 22 px or credits below 19 px, and never lets a panel cover more than two thirds of the card. A map card with running text also gets a warning: the map, its title and its legend should be enough.

## What may vary, what stays fixed

| Varies with the content                                                 | Stays fixed                                                                        |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Panel height (up to 900 px), and so the image window                    | Card size 1080 × 1350, margins 72 px                                               |
| Title size 88 or 72 px                                                  | Body sizes 32 px or 28 px, nothing in between, nothing smaller                     |
| Number of lines of every text block                                     | Order of the panel: kicker, status, date, title, blocks, source, credit, signature |
| Image focal point, anchor and zoom                                      | Text always on the opaque panel, never on the image                                |
| Theme (one per carousel)                                                | One accent word per title                                                          |
| Up to two document insets, up to four forms rows, up to three map areas | Signature row and its logo                                                         |

## What moves to another card

- A second idea, or a second date: a new card.
- A body longer than about 330 characters (three sentences): split at a sentence boundary. Most cards should hold one or two sentences.
- A forms table with more than four rows: two tables, or a table and an explanation.
- Any explanation of a map: an explanation card after the map card. The map card keeps a title, a legend and a caption line.
- A dated card with more than the date, the name and two fields: the extra sentence goes on the next card, except on the origin card, which may carry one short sentence.
- A source line longer than two lines: shorten the card's source to author, date and page; the full reference goes in the package.
- Context older than the name (what existed before it): its own card, with the `contexte` status mark (« Avant ce nom »), after the origin card.

## Capacity guide, measured on the reference cards

Nunito Sans sets about 62 characters per line at 32 px across the 936 px measure; Anton sets about 26 characters per line at 88 px, 32 at 72 px and 20 at 116 px.

| Card                   | Title                                         | Text                                               | Other blocks                                | Example (panel height)                              |
| ---------------------- | --------------------------------------------- | -------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Opener                 | up to 3 lines at 116 px (about 50 characters) | none                                               | « Faites défiler »                          | `seq-1` (489 px)                                    |
| Explanation            | up to 2 lines at 88 px, or 3 at 72 px         | one to three sentences, up to about 330 characters | source up to 2 lines                        | `seq-5` (696 px)                                    |
| Explanation with forms | up to 3 lines at 72 px                        | one sentence                                       | up to 4 rows                                | `seq-4` (870 px)                                    |
| Document               | as Explanation                                | as Explanation                                     | up to 2 insets                              | `seq-7` (593 px), `seq-8` (666 px, three sentences) |
| Dated name             | none                                          | none, one sentence on the origin card              | name 1 line, two fields up to 3 lines each  | `chr-2` (693 px), `chr-4` (794 px)                  |
| Map                    | up to 2 lines at 72 px                        | none                                               | legend up to 4 items, caption up to 2 lines | `map-c` (468 px)                                    |
| Closing                | the slogan, 3 lines                           | one sentence                                       | recap up to 5 steps, site pill              | `seq-9` (702 px), `chr-5` (851 px)                  |

The approved text of the 9 October Uganda carousel fits these sizes without rewriting: every body of the pilot stays on one card. Only its opening paragraph moved, into a forms table (card 2), so that the opener keeps its title alone.

## Reading sizes

The exported pixels never change; the reading size does. A phone feed shows the card 320 to 430 px wide, a tablet around 600 px, Instagram on a computer at 468 px. The phone is therefore the deciding case: review every final card at 375 px first, then at 320 px, then at tablet and desktop sizes. The `ReadingSizes` preview and the `Lecture` images show the same card at each width.

At 375 px, the 32 px body reads at 11.1 px and the 28 px floor at 9.7 px; at 320 px, 9.5 and 8.3 px. That is small, and it is why every card carries so little text: a short paragraph at that size reads well, a long one does not.

## Contrast and colour

Every text pair holds at least 4.5:1 in both themes (values in each token's usage note). Status marks always carry a word and a shape. Map areas are labelled directly on the map and in the legend; uncertain areas add hatching and a dashed edge, so the map still reads in greyscale.

## Alternative text

Each exported image ships with an alternative text, written in plain French, in this order:

1. what the image shows, in one sentence (`imageAlt`), with place and date when known;
2. every word printed on the card, in reading order: kicker, date, title, fields, body, table rows, call to action.

The source and credit lines are left out of the alternative text, because the package repeats them in full. `EthniCards.altText(card)` composes this text from the card data when `alt` is not written by hand; the editor rereads it before approval 3. The text is stored with the card in `cards.json` and copied into the package's `post.md`, next to the file name it belongs to. Check the current length limit of each platform when packaging.
