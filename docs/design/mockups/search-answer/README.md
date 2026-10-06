# Search answer page, mockup v11

- Date: 2026-10-06
- Version: v11, validated by the operator
- Public URL (provenance only, it moves): https://claude.ai/artifact/53thPpv2nKxPXRb1VXyM7m

## Purpose

The reference every lot reads before coding the search answer page. The
implementation plan is [`../../search-answer-plan.md`](../../search-answer-plan.md).
Fixtures in `src/lib/search/__fixtures__/answerFixtures.ts` reproduce the text
of these mockups, so a rendering test and a mockup say the same words.

## Screens

| File                  | Query / state       | What it shows                                                                               |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `Main.dc.html`        | home                | The home with the search field, the entry to the answer page.                               |
| `Peul.dc.html`        | `peul`              | A people with several names: the full answer, "Tout" tab, six blocks.                       |
| `Peul-Shorts.dc.html` | `peul`, Shorts tab  | The same query with a media filter active, showing that tabs filter under the field.        |
| `Lingala.dc.html` | `lingala` | A language with a debated origin (two readings side by side) and geography as a declared speaker estimate in millions, not a sum of peoples. |
| `Bantou.dc.html`      | `bantou`            | A family treated as a myth to undo, in a light tone.                                        |
| `Congo.dc.html` | `congo` | Two countries sharing a name: former names in time, each country's peoples by share, the unsplit percentage declared. |
| `Camara.dc.html` | `camara` | A patronyme: three accounts of the origin side by side, spellings, country pills with no figures and a sentence saying the figures are missing. |
| `Pharaon.dc.html`     | `pharaon`           | A word whose origin is the subject, the answer reading the same six blocks.                 |

`canvas.json` is the layout of the design canvas the screens were drawn on.
The `.dc.html` files reference `./support.js`, which is not kept here; the
pages are static markup inside an `<x-dc>` element and render without it.
They are frozen byte for byte, do not edit them (the folder is prettier-ignored).

## Decisions

- Filters are tabs under the search field. They are dynamic: a tab shows only
  when it has content, carries its count, and is never shown with 0.
- "Tout" holds six blocks in this order: What it is, Where the name comes from,
  Its names, Where, And now, Sources in one line. Then the fiche button, then
  the invitation to correct.
- The lead and the follow-up question are optional fiche fields:
  `content.searchAnswer.lead` (at most 220 characters) and
  `content.searchAnswer.followUp` (at most 120 characters, ending in "?").
  When absent, a phrase template is the fallback.
- Geography of a language or a family is a declared speaker estimate in
  millions (`speakers.byCountry`), never a sum of peoples, and is labelled as
  an estimate.
- A patronyme shows country pills with no figures and says the figures are
  missing.
- A debated origin shows each account side by side before "Read more"; none is
  crowned.
- Bantou is treated as a myth to undo, in a light tone.
- The bracketed `[N]` counts in the mockups are placeholders for real counts.

## Captures

`captures/<Screen>-<width>.png`, one full-page PNG per screen at 320, 430, 768
and 1280 px (8 screens, 32 files), taken from a local HTTP server.

The mockup is only drawn at 430 px: its artboard is a fixed `width:430px` box.
At 320 px it overflows horizontally; at 768 and 1280 px it sits left-aligned.
Those widths show how the fixed artboard behaves and are the baseline the real
page is compared against. They are not a design.
