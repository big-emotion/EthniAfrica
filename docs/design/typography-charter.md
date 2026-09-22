# Typography Charter

What the type on EthniAfrica asserts, and what it forbids. This is the
counterpart of [`atlas-charter.md`](./atlas-charter.md) and
[`games-charter.md`](./games-charter.md) for a surface that had a specimen
(`src/stories/design-system/Type.mdx`) but no doctrine: nine sizes were shown,
and nothing said when to reach for `h2` rather than `h3`.

The scale itself lives in `src/styles/tokens/type.css`.
`src/styles/__tests__/typeScaleCharter.test.ts` fails the build if the file
drifts from the rules in §1 and §2, and `afh/no-raw-font-size` fails it if a
component reintroduces a size outside the scale.

## 1. Nine roles, no tenth

A role is a job, not a size. Two things that do the same job take the same
token even when a designer would have nudged one of them by a pixel; two
things that do different jobs never share a token because they happen to
render at the same size.

| Role      | Token                | Renders          | Family · weight        | HTML                       |
| --------- | -------------------- | ---------------- | ---------------------- | -------------------------- |
| `hero`    | `--afh-text-hero`    | 34 → 52 px       | display 600            | `h1`, once per page        |
| `h1`      | `--afh-text-h1`      | 27 → 40 px       | display 600            | `h1`                       |
| `h2`      | `--afh-text-h2`      | 22 → 30 px       | display 600            | `h2`                       |
| `h3`      | `--afh-text-h3`      | 19 → 23 px       | display 600            | `h3`                       |
| `lead`    | `--afh-text-lead`    | 19 → 22 px       | body 400               | `p`, first of a fiche      |
| `body`    | `--afh-text-body`    | 17 → 19 px       | body 400               | `p`, `li`, `td`            |
| `small`   | `--afh-text-small`   | 16 px            | body 400               | control labels, `button`   |
| `caption` | `--afh-text-caption` | 13 px            | body 400               | `figcaption`, source lines |
| `eyebrow` | `--afh-text-eyebrow` | 12 px · UP · 600 | body 600, 0.16em track | `p`/`span` above a heading |

Each role carries a paired `--afh-leading-*`. Setting a size without its
leading is how a 52 px hero ends up on 1.65 and reads as a stack of unrelated
lines.

**The eyebrow is a dress, not a size.** `--afh-text-eyebrow` is 12 px, but the
role is uppercase, semibold and tracked at 0.16em — `--afh-eyebrow-transform`,
`--afh-eyebrow-weight` and `--afh-eyebrow-tracking` carry those. A caller that
takes the size alone has written a caption, and should say `caption`.

### Retired: `micro` and `nano`

They rendered at 10 px and 9 px. Both are gone, and their callers moved up to
`caption` or `eyebrow`.

Two reasons, and the second is the binding one. The audit found no reference
site that sets running text below 11 px, and none that sets lowercase text
there at all. And axe's `color-contrast` rule holds anything under 18.66 px
bold / 24 px regular to 4.5:1 — at 9 px on a warm parchment ground, the muted
ink the mockups use clears 2.8:1. The small roles were an accessibility debt
dressed as a density choice.

## 2. Fluid where it is read, fixed where it is operated

The six editorial roles (`hero` → `body`) are one `clamp()` each, anchored at
**390 px** and **1200 px**. No `@media` step, and none may come back: the two
breakpoint steps the scale used to carry are exactly what the clamps replace,
and a leftover step is a second, competing scale.

The three utility roles (`small`, `caption`, `eyebrow`) are fixed lengths. A
button label that grows with the window drifts away from the button.

**Every clamp intercept is written in `rem`.** A `clamp()` whose preferred term
is in pixels ignores the reader's browser font-size setting outright — the `vw`
term cannot restore it — and fails WCAG 1.4.4. This is the one line of §2 the
charter test asserts character by character.

**One narrow, scoped exception: `.search-feed-reviewed` in
`src/styles/search-feed.css`.** It re-declares `--afh-text-hero`,
`--afh-text-h3` and `--afh-text-body` inside that one class, to values that
round to the same pixel the forty approved boards
(`docs/design/mockups/search-feed/`) carry at their 430 px reference width —
the scale's own `clamp()` and the boards' generator (`generator/gen.py`)
compute the same fluid curve, but round its intercept to a different number
of decimal places, so the two disagree by about three thousandths of a pixel
at that one width. That is not a second scale: the values are the _same_
three roles, re-rounded to agree with the approved rendering they are
compared against pixel for pixel, and the override applies only inside the
one component tree (`SearchFeedLayout`) the boards govern. The alternative —
regenerating the boards at the clamp's full, unrounded precision instead —
was the preferred fix and was not done, so this line documents the decision
actually shipped (`docs/plans/search-result-feed-completion.md` §4)
rather than leave a second, silently competing definition undocumented.

## 3. Semantic and visual are allowed to disagree — up to a point

A `<h2>` may be painted with `--afh-text-body`. The document outline is what a
screen reader walks; the size is what a sighted reader weighs. They answer
different questions, so they are allowed to diverge.

Four cases are legitimate, and they are the only four:

1. **The key figure.** `789 peuples` set at `hero` inside a `<p>` — it is a
   number, not a section.
2. **The autonym.** `<AutonymExonymHeading>` sets the autonym at the heading
   role and the exonym one role down inside the same heading element. The
   exonym is not a subheading; it is a gloss.
3. **The verbatim.** An oral-narrative pull quote set at `lead` inside a
   `<blockquote>`. It outweighs the body around it without claiming a rank in
   the outline.
4. **The standfirst.** The `lead` paragraph under a fiche title, which is
   `<p>`, never `<h2>`.

**The hard limit: never between two headings.** An `<h2>` painted at `h3` and
an `<h3>` painted at `h2` on the same page is not a divergence, it is a lie —
the reader sees a hierarchy the document does not have, and the two readings
contradict each other rather than complementing each other. Divergence is
permitted between a heading and a non-heading. Between two headings it is a
defect.

## 4. The card: three levels, and the title never competes

A card is a preview, not a page. It gets exactly three levels:

1. **The title** — `--afh-text-body`, set in `--afh-font-display`. Display
   family, body size: it reads as a title without ever outweighing the section
   heading that governs the grid it sits in. A card title at `h3` makes twelve
   cards shout over the one `h2` above them.
2. **The support** — `--afh-text-small`, body family. One or two lines.
3. **The metadata** — `--afh-text-caption`, or `--afh-text-eyebrow` when it is
   a category kicker above the title.

No fourth level. A card that needs one is a fiche.

## 5. Measure is set by the container, not by a character count

Running prose carries **no measure of its own**. It fills the box it belongs
to — the parchment on a fiche, the page box on a document.

The charter used to say the opposite: prose was capped at `--afh-measure-prose`
(65ch), and long-form pages went through a 72ch reading column, on the argument
that 800 px of 19 px body runs to ~94 characters and legibility is a decision
about the paragraph, not about the page. The reasoning is sound about a page
that is nothing but paragraphs. It was wrong about this atlas, because our
paragraphs never sit alone: a fiche chapter puts prose next to stat cards,
rankings, tables and the atlas panel, all of which fill their container. Capped,
the paragraph became the one element on a desktop page that stopped mid-width,
against nothing — the reader sees a column someone forgot to finish, not a
comfortable measure.

So the cap is retired everywhere prose runs: fiche chapters, migration and
colonial-gaze narratives, legal notices, the doctrine pages, the about page and
the site map.

Two things are **not** covered by this and keep their measures:

- **Titles and ledes.** A headline held to 18–28ch breaks where the editor
  wants it to; a chapô at 58ch is a deliberate opening. These are composition,
  not reading comfort.
- **Band compositions.** A centred band — the home's `Saviez-vous`, the hero —
  states its own width. Centred text has no empty right half, so the defect
  above does not arise.

A page box (`max-w-5xl`, `--afh-shell-max`) is also not a reading measure: the
title, the rules and the prose all sit inside it together. Narrowing the text
alone is precisely what broke the column.

## 6. How to reach a size

In descending order of preference:

1. **A Tailwind utility** — `text-afh-body`, `text-afh-caption`. The bridge is
   declared in `tailwind.config.ts` and every entry maps 1:1 onto a token.
2. **The token in CSS** — `font-size: var(--afh-text-body);`. For styled-jsx,
   `.css` files, and inline `style` objects.
3. **A surface-scoped token that aliases the scale** — `--country-text-*`.
   Legitimate only as a named, greppable holding pen for a value not yet
   reconciled with the scale, with a ticket against it. Never as a permanent
   parallel scale. The home's own pen, `--home-text-*`, was the last one
   emptied and is closed (§7).

Everything else is a defect the linter reports:

- `text-[14px]`, `xl:text-[10px]`, `text-[0.875rem]` — arbitrary Tailwind sizes.
- `font-size: 13px`, `font-size: clamp(30px, 5.6vw, 56px)` — raw CSS
  declarations. The sanctioned form is `font-size: var(--…)`; the rule keys off
  exactly that.

Two things the rule deliberately does **not** flag, because they are not
typography:

- `style={{ fontSize: 22 }}` in the satori OG-image routes, and `fontSize={11}`
  passed to Recharts, the atlas canvas and SVG label helpers. These are
  rendering parameters for a raster or a chart, and there are more than forty
  of them that must stay.
- `.css` files, which ESLint never parses. `country-tokens.css` and
  `people-tokens.css` are guarded by `src/styles/__tests__/colorTokens.test.ts`
  instead.

## 7. The ratchet

`afh/no-raw-font-size` is `error` across all of `src/`. It shipped alongside a
**debt register** in `eslint.config.mjs`: one line per file that still carried a
raw size, with its count — 31 files, 146 sizes. Each migration lot deleted its
lines and never added one. Deleting a line without fixing the file turned CI
red, so the register could not rot; adding a raw size to a file not on the list
failed immediately, so a directory awaiting its turn could not quietly
accumulate new debt.

**The register is now empty, and the ratchet is closed.** What remains in
`ignores` is the bench: `*.stories.*`, `*.test.*`, `__tests__/`, `*.mdx`.

Do not reopen it. A surface that needs a size the scale does not have takes
route 3 of §6 — a named, surface-scoped token with a ticket against it. The
worked example was `src/styles/home-tokens.css`: the home carried 25 hand-set
sizes, 20 of them half-steps (15.5, 14.5, 13.5, 12.5, 11.5, 10.5 px) that land
on no step of the scale. Rounding 12.5 to 12 or to 13 on the most visited page
in the product is a design decision no test here can settle, so the values were
named at their current pixel, byte for byte, and the reconciliation was a
separate ticket. The dette became one table for a designer to rule on, instead
of a diff across eight components.

**That pen is closed.** Its last token, the title's `clamp(30px, 5.6vw, 56px)`,
moved onto `--afh-text-hero` on 2026-09-14 with the rest of §8, and the file was
deleted. `homeTokensCharter.test.ts` keeps it closed: a `--home-text-*` token
reappearing anywhere on the home fails the build.

## 8. The home, element by element

The home's first screen was measured on 2026-09-14 at 430, 720 and 1200 px, and
it failed the eye before it failed any rule: **three families on one screen**
(Fraunces, Nunito Sans, and JetBrains Mono on the « Saviez-vous que » kicker),
**three Fraunces voices** (900 on the title, 700 on the anecdote headline, and
500 on « Notre propos », which asked for a 400 the face is not loaded in), and
**seven sizes**. Every element was defensible alone; together they did not read
as one page. This section is the operator's ruling on each of them.

### 8.1 The principle

**The display face names. The body face explains and operates. The monospace
aligns figures in a column.** The home has no column of figures, so it carries
no monospace. Any screen of the home therefore shows two families, and the
display face speaks at two weights only: 900 for the page's own title, a key
figure and the lockup; 700 for a heading role (brand charter §6).

**An ink states a status, never a decoration.** Four inks, and each one is a
claim about the text it paints. The contrast ratios are measured on the home's
own grounds, and every one clears AA, so the choice between them is about
meaning, not legibility:

| Ink                   | Means                                  | Contrast                                                       |
| --------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `--afh-text`          | text that is read                      | 14.8:1 on `--afh-bg`                                           |
| `--afh-text-soft`     | secondary or optional                  | 5.3:1 on `--afh-bg`, 4.8:1 on `--afh-bg-warm`                  |
| `--accent-ink`        | leads into the corpus, or codes a kind | 6.0:1 (ocre) and 5.8:1 (teal) on `--afh-bg`                    |
| `--accent-foreground` | text laid on the accent fill           | 5.9:1 on the ocre fill, where `--afh-text-soft` measures 1.8:1 |

### 8.2 The table

| Element                                   | Face · weight                        | Step                                                   | Ink                                                | Why this, and not another                                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masthead name                             | display 900                          | `h3`                                                   | `--afh-text`                                       | It is the mark. It takes the title's weight so the brand and the page speak in one voice.                                                                                                                                       |
| Masthead qualifier                        | display 700                          | `caption`                                              | brand gradient                                     | The one place the gradient is licensed (brand charter §5.3). At 13 px a 900 fills the counters.                                                                                                                                 |
| Masthead navigation                       | body 400                             | `body`                                                 | `--afh-text-soft`                                  | Chrome, not content: present on every page, so it never outweighs the page it sits above.                                                                                                                                       |
| Page title                                | display 900                          | `hero`                                                 | `--afh-text`                                       | The one thing to read first. The scale's top step, and no higher: the bespoke 56 px clamp it replaced sat above the scale's ceiling and ignored the reader's font-size setting (§2).                                            |
| Description under the title               | body 400                             | `body`                                                 | `--afh-text`                                       | Prose takes the body face. `body`, not `lead`: it is the band's only paragraph and must not compete with the title. A `<p>`, not an `<h2>`: it is the title's standfirst (§3.4), and the search field's accessible description. |
| Search label                              | body 600                             | `small`                                                | `--afh-text`                                       | It instructs the primary action, so full ink rather than soft.                                                                                                                                                                  |
| Search field and button                   | body 400 · 500                       | `small`                                                | `--afh-text` · `--accent-foreground`               | 16 px is the floor under which iOS Safari zooms a focused field. The button's label is the darkest ink because it sits on the fill.                                                                                             |
| Seed words                                | body 400                             | `small`                                                | `--accent-ink`                                     | The accent ink says « leads to a record ». 400, so three chips never outweigh the button above them.                                                                                                                            |
| Seed intro (« Essayez avec »)             | body 400                             | `small`                                                | `--afh-text-soft`                                  | It introduces the chips and is not one of them, so the soft ink; the chips' own step, so the row reads as one line.                                                                                                             |
| Search failure message · « Réessayer »    | body 400 · body 600                  | `small`                                                | `--afh-text-soft` · `--accent-ink`                 | The empty state's dress, because it sits where that state would; the retry is an action, so the accent and the control weight.                                                                                                  |
| Featured answer heading                   | display 700                          | `h2`, `h1` from 768 px                                 | `--afh-text`                                       | A heading role's weight. At 900 it made a second title beside the page's own from 1200 px, where the tile shares the band with the search.                                                                                      |
| Featured answer support · sources         | body 400                             | `small` · `caption`                                    | `--afh-text-soft`                                  | Secondary to the heading and the forms; the sources are provenance (the source-line row below).                                                                                                                                 |
| Featured answer forms                     | body 700                             | `caption`                                              | `--afh-text-soft`, `--accent-ink` on the self-name | Every form at one weight and one size; only the ink marks the people's own name — marked, never promoted (DEC-057).                                                                                                             |
| Featured answer quote                     | body 400 italic                      | `body`                                                 | `--afh-text`                                       | The verbatim case (§3.3), in the body face: Fraunces is not loaded at 400, and the quote must not outweigh the heading above it.                                                                                                |
| Featured answer link                      | body 600                             | `small`                                                | `--accent-foreground` on `--accent`                | The primary action's colour (brand charter §5.4), the same fill as the search button.                                                                                                                                           |
| Section title (stories, project, figures) | display 700                          | `h1`                                                   | `--afh-text`                                       | `SectionHeading`'s dress (`section-heading.css`): one rung under the page title, one dress for every section of the home.                                                                                                       |
| Stories intro · project paragraphs        | body 400                             | `body`                                                 | `--afh-text`                                       | Prose, so the description's own dress.                                                                                                                                                                                          |
| Story card title                          | display 700                          | `body`                                                 | `--afh-text`                                       | The card title (§4): display face at the body step, so three cards never shout over the section title.                                                                                                                          |
| Story link · project links                | body 600                             | `small`                                                | `--accent-ink`                                     | Action links, so the accent, as « Lire d'autres anecdotes ».                                                                                                                                                                    |
| Corpus figures                            | display 900 · label body 600         | `h2` · `caption`                                       | `--afh-text` · `--afh-text-soft`                   | The key-figure case (§3.1). The label qualifies the number and never competes with it.                                                                                                                                          |
| Section kicker (« Saviez-vous que »)      | body 600, uppercase, 0.16em          | `small` when the band is untitled (brand charter §8.5) | `--accent-ink`                                     | A label, so the body face. In the monospace it was the third family on the first screen, and the monospace's job — a figure in a column — is not a kicker's.                                                                    |
| Anecdote headline                         | display 700                          | `h2`                                                   | `--afh-text`                                       | A heading role's weight, one weight and one step under the title, so the question on the left is still read first.                                                                                                              |
| Anecdote first paragraph                  | body 400                             | `body`                                                 | `--afh-text`                                       | At `lead` it ran 22 px beside the answer's 19 px, and the visual column outweighed the copy column it serves.                                                                                                                   |
| Anecdote following paragraphs             | body 400                             | `body`                                                 | `--afh-text-soft`                                  | Set back by ink, not by size: the reader keeps one reading size inside one card.                                                                                                                                                |
| Entity chips                              | body 600 · kind in the eyebrow dress | `caption` · `eyebrow`                                  | `--accent-ink` (ocre people, teal country)         | The colour is the entity code, the legitimate nested accent of brand charter §5.2. The kind wears the eyebrow tokens, never a tracking of its own.                                                                              |
| Source line, figure caption               | body 400                             | `caption`                                              | `--afh-text-soft`                                  | Provenance is always present and never competes with what it sources.                                                                                                                                                           |
| « Lire d'autres anecdotes »               | body 600                             | `small`                                                | `--accent-ink`                                     | An action link, so the accent.                                                                                                                                                                                                  |
| Search panel group label                  | body 600, uppercase, 0.16em          | `eyebrow`                                              | `--accent-ink`                                     | The kicker's role, so the kicker's dress. It carried 0.06em of its own.                                                                                                                                                         |
| Footer lockup name                        | display 900                          | `h2`                                                   | `--afh-text`                                       | One lockup, one treatment (brand charter §5.3). With no weight declared it rendered at Fraunces 500 against the masthead's 900.                                                                                                 |
| Footer rubric                             | display 700                          | `body`                                                 | `--afh-text`                                       | A card title (§4): display face at the body step.                                                                                                                                                                               |
| Footer links                              | body 400                             | `small`                                                | `--afh-text-soft`                                  | Control labels.                                                                                                                                                                                                                 |

### 8.3 Holding it

A new element on the home takes a row of this table. One that fits no row is a
design decision to rule on and add here, never a new dress invented in its
component — which is how the home reached seven sizes with every one of them
defensible.

Gated by `homeTypographyCharter.test.ts` (the title's step, the anecdote's
first paragraph, the two small kickers, the footer lockup's weight, the story
card title, the seed intro, the featured heading's weight),
`SectionHeading.test.tsx` (the kicker's face), `HomeHero.test.tsx` (the
description's step and ink) and `homeTokensCharter.test.ts` (the closed pen).

The « Notre propos » toggle and statement rows were retired on 2026-09-22 with
the disclosure itself; the project and method now speak through the section
title, prose and link rows above.
