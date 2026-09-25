# Search-result feed: implementation plan

Date: 2026-09-19. Status: **approved design, not started**. Target branch: `recette`.

> **Course-correction notice (2026-09-19).** Read this plan for the complete
> product scope, then follow
> [`search-result-feed-correction-plan.md`](./search-result-feed-correction-plan.md)
> for the corrected contracts and implementation order. The correction plan
> supersedes this file where block identity, responsive coverage, data contracts,
> phase order or visual-test mechanics differ; it does not reduce the approved
> feature scope.

This plan turns the search-result page (`/fr/atlas/recherche?q=…`) into a feed:
the name answer and the shorts in the first screen, then visual shelves, then the
reference material. It is written so that an agent with **only this repository**
— Codex, Claude, or a person — can reproduce the reviewed boards without asking
anything. Where the plan does not decide, it says so in §12 and names the default.

## 0. How to use this plan

**Read, in this order, before touching code:**

1. This file, entirely.
2. [`docs/plans/search-result-feed-correction-plan.md`](./search-result-feed-correction-plan.md),
   which closes the readiness findings and supplies the executable phase order.
3. [`docs/design/mockups/search-feed/README.md`](../design/mockups/search-feed/README.md)
   and the forty boards beside it — the rendering this plan is measured against.
   Serve the repository root over HTTP (`npx serve .` or
   `python3 -m http.server`) and open
   `/docs/design/mockups/search-feed/Mande.dc.html`; `file://` is blocked.
4. [`docs/design/mockups/search-feed/generator/gen.py`](../design/mockups/search-feed/generator/gen.py)
   — one Python function per tile. Every size, gap and colour quoted in §5 comes
   from it, and every number in it is already the token value (§3); when this
   plan and `gen.py` disagree, `gen.py` is the board.
5. [`docs/design/search-result-charter.md`](../design/search-result-charter.md) —
   the contract this plan amends (Phase 0).
6. `docs/design/brand-charter.md`, `typography-charter.md`, `actions-charter.md`,
   `games-charter.md` — the rules §3 applies.

**Working rules** (from `CLAUDE.md`, repeated because each has already cost a red
build):

- One git worktree per session; run `npm run worktree:setup` if you created it by
  hand. Branch off `recette`, open a PR into `recette`.
- **Test first in every phase.** Each phase lists the failing tests to write
  before the code. A phase is done when those tests pass and the phase's gates
  (§11) are green.
- Every new `it()`/`test()` carries `// @req REQ-NNN` within the three lines above
  it. Only IDs present in `docs/confluence-spec/req-catalog.json` are accepted.
  Use REQ-044 (result grammar), REQ-178 (name answer), REQ-124/125 (sourced
  highlight, near forms), REQ-164–167 (generated images). The feed's own REQ is
  created in Phase 0 — **never invent an ID**.
- API work touches all four layers: `src/app/api/v2/<r>/route.ts` →
  `src/api/v2/handlers/<r>.ts` → `src/api/v2/services/<r>.ts` →
  `src/lib/api/openapiV2.ts`.
- No French literal in a component: copy goes to `src/lib/i18n/copy/*` in **both**
  `fr` and `en` (`copyParity.test.ts`, `npm run check:copy-literals`).
- No hex, no raw font size, no shadcn colour class in search files
  (`src/components/__tests__/searchCharter.test.tsx`; add every new file to its
  `IN_SCOPE_FILES`).
- `logger` from `@/lib/api/logger`, never `console`, under `src/api/**`,
  `src/app/api/**`, `src/lib/{api,afrik,supabase}/**`.

**Definition of done for the whole plan:** §10's parity suite passes for the ten
cases at 430 and 1280, day and night; §11's gates are green; the stale e2e spec is
fixed; the charter, the grammar module and the boards agree.

## 1. What changes, in one screen

Today (`src/components/pages/RecherchePageContent.tsx`, 630 lines): a
`PageLayout` hero titled « Recherche », the form, a lens bar of entity kinds, then
`NameAnswer` (a text-only answer in three movements) and a list of
`SearchResultCard`s.

Target (the boards):

```
┌ site header (unchanged) ─────────────────────────────┐
│ search field (query kept)                           │
│ lens row: Tout · Shorts n · Images n · Jeux · Fiches n│  first screen
│ D'OÙ VIENT CE NOM · <kind>                          │  ≤ 800 px, both
│ <Name>                                              │  widths: the first
│ ┃ verdict sentence + one-line sub                   │  poster is fully
│ Les appellations  [chip][chip][chip][chip] +N       │  visible
│ Les shorts                              Tout voir → │
│ [9:16][9:16][9:16]→                                 │
├─────────────────────────────────────────────────────┤
│ D'où elles viennent — one card per form (swipe)     │  the feed, in
│ Ce que les peuples se donnent / tiles               │  canonical order
│ Anecdotes et proverbes (swipe)                      │  (§4)
│ Joue avec ce nom — one playable question            │
│ Les images — generated, announced                   │
│ long prose — problem, shared name, near name        │
│ Les fiches — at least one                           │
├─────────────────────────────────────────────────────┤
│ Ce que l'atlas ne dit pas · conviction · Nous nous  │  what the atlas owes
│ sommes trompés ? [Proposer une source]              │
└─────────────────────────────────────────────────────┘
```

Desktop (≥ 1200 px): the answer beside the appellations (7/5 of a 12-column
grid), the shorts in one row of up to six, then **a main column (8) and a rail
(4)**, then the owed band across the width. Thin pages (§4.3) keep an 880 px
single column.

## 2. The ten reference cases

Each case is a fixture (Phase 5) and a parity test (Phase 9). Boards:
`docs/design/mockups/search-feed/<Stem>{,Nuit,Desktop,DesktopNuit}.dc.html`.

| Stem          | Query      | Resolves to                                                                | Kind      | Thin | What it proves                                 |
| ------------- | ---------- | -------------------------------------------------------------------------- | --------- | ---- | ---------------------------------------------- |
| `Mande`       | `mandé`    | `FLG_MANDE`                                                                | family    | no   | Every tile present                             |
| `Peul`        | `peul`     | `PPL_FULANI`                                                               | people    | no   | Pejorative form flagged in the first screen    |
| `Fang`        | `pahouin`  | `PPL_FANG` + split fiches `_GABON`, `_EQGUINEE` (grouped)                  | people    | no   | A form matches; the answer names the people    |
| `Bassa`       | `bassa`    | `PPL_BASSA`, `PPL_BASSA_CAM`, `PPL_BASSA_NIGERIA`; near name `PPL_BASSARI` | people ×3 | no   | Disambiguation; one short per people           |
| `Ekpeye`      | `ekpeye`   | `PPL_EKPEYE`                                                               | people    | yes  | Nothing visual on the name; widening announced |
| `Nigeria`     | `nigeria`  | `NGA`                                                                      | country   | no   | Country naming; former names                   |
| `Lingala`     | `lingala`  | `lin` (+ `PPL_LINGALA`, `PPL_NGALA` related)                               | language  | no   | Sources disagree; the page says so             |
| `Traore`      | `traoré`   | `PAT_TRAORE`                                                               | patronyme | no   | Family name: clan, alliance, colonial spelling |
| `Introuvable` | `mandinké` | no exact entity; leads: Mandinka, Malinké, …                               | —         | yes  | Typo → nearest forms                           |
| `Inconnu`     | `kossiwa`  | nothing                                                                    | —         | yes  | Unknown name: admission, invitation, no filler |

Verify each resolution against the corpus in Phase 5 (`dataset/source/afrik/`);
if an ID differs, keep the case and fix the fixture, never the board copy.

## 3. Parity: what the boards guarantee

The boards are **version 2** (2026-09-19): every value in them is the value the
design system renders at 430 and 1280 px — the type roles evaluated at those
widths, the spacing ramp, the two radii, the page frame measured on the live
page, and the colours `.dark` actually binds. Code that uses the classes below
therefore reproduces the boards **to the pixel**, and §10.4 proves it by
comparing screenshots.

### 3.1 What is compared

| Level          | How (Phase 9)                                                                                             | Tolerance                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Structure/copy | DOM test: block ids, order and strings against the board's text                                           | none                                                          |
| Tokens         | charter contract tests + §3.3–3.5                                                                         | none                                                          |
| Pixels         | Playwright: screenshot of `[data-feed-root]` on the page vs on the board, 10 cases × 430/1280 × day/night | same width and height; ≤ 1 % differing pixels (anti-aliasing) |

Not compared: the site header (the boards draw a 61 px stand-in so the first
screen is measured from the right place), the footer, and nothing outside
`[data-feed-root]`.

### 3.2 The page frame (measured on `/fr/atlas/recherche`, 2026-09-19)

- `SiteHeader`: **61 px**, unchanged.
- `PageLayout` with **`hideHeader`** when a query is committed: no hero, no trail
  (the hero measured 277 px and pushed the form to y = 338).
- `main.afh-shell py-8` (32 px top) contains the page's own
  `div.afh-shell.afh-accent-ocre`, which receives **`data-feed-root`**. Keep both
  shells: they give a **24 px gutter at 430** (12 + 12; content x = 24, 382 wide)
  and **1152 px of content at 1280** (x = 64): `PageLayout wide` lifts the
  shell's max-width on this page (#1214), so the shells run the full width.
  `[data-feed-root]` itself measures x = 12, 406 wide at 430 and x = 32, 1216
  wide at 1280 — the boards match.
- 768–1199 px: the shells give 24 + 24; render the mobile layout inside.

### 3.3 Colour

Components read `var(--accent*)` and `--afh-*` semantics only.

| Board day                        | Role                                                  | Class                                                                 | Night (`.dark`)         |
| -------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- | ----------------------- |
| `#fbf7f2`                        | page ground; selected lens label                      | `bg-afh-bg` / `text-afh-bg`                                           | `#120e0a`               |
| `#ffffff`                        | cards, field, lens chips, quiz, owed boxes            | `bg-afh-surface`                                                      | `#271e14`               |
| `#f5ede0`                        | tiles, proverb plate, conviction, badge               | `bg-afh-bg-warm`                                                      | `#1d1710`               |
| `#e8dfd3`                        | every border, dashed silences and empty slot          | `border-afh-border`                                                   | `#3a2e1f`               |
| `#2c2018`                        | text; selected lens fill                              | `text-afh-text` / `bg-afh-text`                                       | `#f1e7d8`               |
| `#746557`                        | secondary text, tags, meta                            | `text-afh-text-soft`                                                  | `#c9b99f`               |
| `#835514`                        | eyebrows, links, state tags                           | `text-[var(--accent-ink)]`                                            | `#c9821f`               |
| `#c9821f`                        | searched chip/card border, quiz and invitation frames | `border-[var(--accent)]`                                              | `#c9821f`               |
| `#f1d9ae`                        | invitation button, image label strip                  | `bg-[var(--accent-tint)]`                                             | `#f1d9ae` (not rebound) |
| `#1a1208`                        | words on an ocre tint                                 | `text-[var(--accent-foreground)]`                                     | `#1a1208`               |
| `#f0d2c8`                        | verdict box (inside `afh-accent-terre`)               | `bg-[var(--accent-tint)]`                                             | `#f0d2c8` (not rebound) |
| `#974331`                        | verdict box left rule                                 | `border-[var(--accent-ink)]`                                          | `#cd725e`               |
| `#000000`                        | words in the verdict box                              | `text-[var(--accent-foreground)]`                                     | `#000000`               |
| `#9b3030`                        | pejorative chip/card border and tag                   | `border-[var(--afh-colonial-ink)]` / `text-[var(--afh-colonial-ink)]` | `#d98a7a`               |
| `rgba(18,14,10,.72)` + `#f1e7d8` | duration badge on a poster, play glyph                | new tokens `--afh-media-badge-bg` / `--afh-media-badge-ink` (Phase 7) | same                    |

**Rules.** Words on any `--accent-tint` fill take `--accent-foreground` in both
themes — the tints are deliberately not rebound at night (`color.css`, the
comment above `.dark`), so a light patch stays light and its ink stays dark. The
terre ink on the terre tint measures 4.22:1, under AA for 16 px, which is why the
verdict's words are not terre. Source-tier marks are `<SourceStandingBadge>`.

### 3.4 Type

Fonts are those `next/font` loads (`src/app/layout.tsx`): Fraunces 300/500/700/900,
Nunito Sans 300–800. The boards load the same files from Google Fonts, **without
the `opsz` axis**, so glyphs match. Sizes are the role tokens evaluated at 430 /
1280 (`src/styles/tokens/type.css`).

| Element                                                   | Classes                                                                   | px 430 / 1280 | lh         | weight                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | ------------- | ---------- | ------------------------- |
| Page eyebrow « D'où vient ce nom »                        | `text-afh-eyebrow font-semibold uppercase tracking-[0.16em]`              | 12            | 1.4        | 600                       |
| Card eyebrow (Anecdote, Proverbe, kinds, Joue…)           | same, `tracking-[0.14em]`                                                 | 12            | 1.4        | 600                       |
| The name `<h1>`                                           | `font-display text-afh-hero font-black leading-[var(--afh-leading-hero)]` | 34.88 / 52    | 1.05       | 900                       |
| Block headings `<h2>`, quiz stem, plain verdict           | `font-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)]`      | 19.2 / 23     | 1.3        | 700                       |
| Card titles (origin, plate, fiche, people, image caption) | `font-display text-afh-body font-bold leading-[1.3]`                      | 17.1 / 19     | 1.3        | 700                       |
| Chip name                                                 | `font-display text-afh-small font-bold`                                   | 16            | 1.5        | 700                       |
| Running text (cards, prose, lede, tiles, owed)            | `text-afh-small`                                                          | 16            | 1.5        | 400                       |
| Verdict line                                              | `text-afh-small font-bold`                                                | 16            | 1.5        | 700                       |
| Verdict sub                                               | `text-afh-caption min-[1200px]:text-afh-small line-clamp-2`               | 13 / 16       | 1.45 / 1.5 | 400                       |
| Subs, meta, credits, « Aujourd'hui » lines                | `text-afh-caption`                                                        | 13            | 1.45       | 400                       |
| Tags, poster meta, « Glissez », media badges              | `text-afh-eyebrow` (no uppercase)                                         | 12            | 1.4        | 700 state tags · 400 else |
| Lens chips                                                | `text-afh-caption font-bold` (count `font-semibold`)                      | 13            | 1.45       | 700                       |
| « Tout voir → » actions                                   | `text-afh-small font-semibold` via `ActionLink`                           | 16            | 1.5        | 600                       |
| Inline links (« Voir la source »…)                        | `text-afh-caption font-bold`                                              | 13            | 1.45       | 700                       |

### 3.5 Space, radius and fixed sizes

All values are on the ramp 4·8·12·16·24·32·48 (`afh-xs`, `afh-md`, `afh-lg`,
`afh-2xl`, `afh-5xl`, `afh-6xl`, `[var(--afh-space-8xl)]`).

| Where                                            | 430      | 1280                                                      |
| ------------------------------------------------ | -------- | --------------------------------------------------------- |
| Field → lens row                                 | 12       | 12                                                        |
| Lens row → verdict                               | 16       | 24                                                        |
| Eyebrow → name                                   | 4        | 8                                                         |
| Name → verdict box                               | 8        | 12                                                        |
| Verdict box padding                              | 12 × 16  | 16 × 24                                                   |
| Verdict → appellations                           | 12       | beside it (7/5 grid, column gap 32, appellations 8 lower) |
| Appellations heading → chips; chip gap           | 12; 8    | 12; 8                                                     |
| Appellations → shorts                            | 12       | 24                                                        |
| Shorts heading → row; poster gap                 | 8; 12    | 12; 16                                                    |
| Between feed blocks (`--afh-section-gap`)        | 24       | 48                                                        |
| Desktop main (span 8) / rail (span 4) column gap | —        | 32                                                        |
| Card padding; gap inside a card                  | 16; 8    | 16; 8                                                     |
| Grids: tiles; cards, fiches, peoples; origins    | 8; 12; — | 8; 12; 16                                                 |

- Radius: every surface and control `rounded-afh-lg` (14); chips and lenses
  `rounded-afh-full`; the verdict box `rounded-r-afh-lg`; source marks 0.
- Fixed sizes: field height 48; lens chips `min-h-11` (44) with `px-afh-2xl`;
  posters 130 × 231 / 160 × 284; origin cards 290 wide on mobile; plates 250 /
  232 wide, their image 0.62 × width tall; generated image card 300 wide, image
  4:5; quiz options and owed buttons `min-h-11`.
- Chips in « Les appellations » are **labels, not controls** (no 44 px minimum):
  padding 4 × 12.

## 4. The feed grammar

### 4.1 Blocks, in canonical order

This table replaces `RESULT_BLOCKS` in `src/lib/search/resultGrammar.ts`
(Phase 0). The order **is** the contract; a block renders only under its
condition, and **a block never renders to say it is empty** (charter §3 bis).

| #   | id             | Zone  | Condition (read from data)                                                                                                                       | Heading (fr)                                                                             | Source (§6)           |
| --- | -------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------- |
| 1   | `lenses`       | first | page loaded and something to show                                                                                                                | —                                                                                        | counts                |
| 2   | `verdict`      | first | always (subject, typo or unknown)                                                                                                                | eyebrow « D'où vient ce nom » (+ ` · <kind>`)                                            | naming                |
| 3   | `appellations` | first | the subject carries ≥ 1 form; **or** ≥ 2 subjects (then titled « Lequel cherchez-vous ? »); **or** typo leads (then « Formes proches trouvées ») | « Les appellations »                                                                     | naming / leads        |
| 4   | `shorts`       | first | always when a query was answered (exact, widened, or unknown rule §5.6)                                                                          | « Les shorts »                                                                           | companions.shorts     |
| 5   | `origins`      | feed  | ≥ 1 form with an origin text **or** an entity-level origin                                                                                       | « D'où elles viennent » / « D'où il vient » (country, language, patronyme)               | naming + name records |
| 6   | `peoples`      | feed  | ≥ 2 subjects                                                                                                                                     | « Les trois peuples » (« Les N peuples »)                                                | subjects              |
| 7   | `shared-name`  | feed  | ≥ 2 subjects                                                                                                                                     | « Pourquoi le même nom ? »                                                               | naming                |
| 8   | `tiles`        | feed  | family: its peoples' self-names; country: major peoples; patronyme: alliances and people                                                         | « Ce que les peuples se donnent » / « Les peuples du Nigeria » / « Ce que ce nom relie » | naming / entity       |
| 9   | `atlas-holds`  | feed  | fewer than two of blocks 5–8 rendered                                                                                                            | « Ce que l'atlas tient »                                                                 | entity                |
| 10  | `plates`       | feed  | ≥ 1 anecdote or attested proverb, exact or widened (§5.9)                                                                                        | « Anecdotes et proverbes »                                                               | companions            |
| 11  | `quiz`         | feed  | ≥ 1 playable question for a subject or its ring-1 entities                                                                                       | eyebrow « Joue avec ce nom »                                                             | companions.quiz       |
| 12  | `images`       | feed  | ≥ 1 generated image linked to a subject                                                                                                          | « Les images »                                                                           | companions.images     |
| 13  | `problem`      | feed  | `naming.problem` present, or a disagreement recorded (§5.13)                                                                                     | « Ce que ces noms posent problème »                                                      | naming                |
| 14  | `near-name`    | feed  | a lead whose name resembles the query but is another entity                                                                                      | « Vous cherchiez peut-être … ? »                                                         | leads                 |
| 15  | `fiches`       | feed  | ≥ 1 result                                                                                                                                       | « Les fiches »                                                                           | results               |
| 16  | `silences`     | owed  | ≥ 1 declared silence (always at least « aucune attestation datée » when no form is dated)                                                        | « Ce que l'atlas ne dit pas »                                                            | naming                |
| 17  | `conviction`   | owed  | always when a subject or unknown                                                                                                                 | —                                                                                        | copy                  |
| 18  | `invitation`   | owed  | always                                                                                                                                           | « Nous nous sommes trompés ? »                                                           | copy + `FlagTarget`   |
| 19  | `further`      | owed  | typo and unknown only                                                                                                                            | « Aller plus loin »                                                                      | copy                  |

`usage-today` and `through-time` are **merged into block 5** (a line per card);
the old `disambiguation` block becomes the first-screen chips (3) plus block 6.

### 4.2 Desktop placement (≥ 1200 px)

- Row 1: 12-column grid, `column-gap` 32 (§3.5): verdict (block 2) spans 7,
  appellations (3) span 5 with 8 px top offset.
- Row 2: shorts (4), full width.
- Row 3: **main column** span 8 stacks, in canonical order, the blocks
  `origins`, `peoples`, `plates`, `fiches`; **rail** span 4 stacks every other feed
  block (`shared-name`, `tiles`, `atlas-holds`, `quiz`, `images`, `problem`,
  `near-name`) in canonical order. Gap between stacked blocks: 48. If one column
  is empty, the other spans 12.
- Row 4: the owed band — silences span 6, conviction + invitation span 6 stacked;
  without silences, conviction and invitation side by side.

### 4.3 Thin pages

A page is thin when it is a typo, an unknown name, or when **fewer than two of
blocks 5–8** render (Ekpeye). Thin pages never spread: on desktop, one 880 px
column centred, the first row still 7/5, then every block stacked, then the owed
band in its mobile layout.

## 5. Tile specifications

Component names are the ones to create under `src/components/search/feed/`
(Phase 6). Type classes are §3.4's, spacing §3.5's, colours §3.3's; this section
states what each tile holds and how it behaves. The generator function that drew
each tile is named in brackets — its markup is the reference.

### 5.1 `FeedLensRow` (block 1) [`lenses`]

`<nav aria-label="Filtrer les résultats">`, one row, no wrap, overflow hidden on
mobile, centred 640 px on desktop. Chips are links: pill, `min-h-11`, `px-afh-2xl`,
lens-chip type. Selected: `bg-afh-text text-afh-bg`, `aria-current="true"`.
Others: `bg-afh-surface border border-afh-border`, count in
`text-afh-text-soft font-semibold`. Items: « Tout », « Shorts n », « Images n »,
« Jeux » (no count), « Fiches n »; a zero count is not rendered. Filtering
(Phase 8): Shorts → block 4 alone as a 2-column grid of every short; Images →
blocks 10 and 12; Jeux → block 11; Fiches → block 15 plus today's `SearchLensBar`
(entity kinds) as a second row. `Images n` = anecdotes + proverbs + images
linked; `Fiches n` = `counts.all`.

### 5.2 `FeedVerdict` (block 2) [`answer`]

- Eyebrow « D'où vient ce nom » in `text-[var(--accent-ink)]`; kind suffix
  « · Pays » / « · Langue » / « · Nom de famille » in `text-afh-text-soft`
  (peoples and families: none).
- `<h1>` — the page's only h1 — the name. Peoples render through
  `<AutonymExonymHeading>` so the `lang` attribute is kept.
- Verdict box when a subject is found: wrapper `afh-accent-terre`; left rule 3 /
  4 px; words per §3.3; sub clamped to two lines.
- Plain verdict (typo, unknown): no box, heading style, sub `text-afh-small`
  clamped to two lines.
- Copy: the verdict sentence and sub from the corpus (§6.1); eyebrow, suffixes and
  plain verdicts from `nameAnswerCopy`.

### 5.3 `FeedAppellations` (block 3) [`appellations`, `chip`]

- `<h2>` « Les appellations »; sub **desktop only** (« Les plus communes d'abord.
  Aucune n'est « la bonne ». »; country « Le nom, puis ceux qui l'ont précédé ou
  suivi. »; disambiguation « Trois peuples, trois familles de langues. »).
- Chips are **labels** (`<span>`, not links): pill, padding 4 × 12, name +
  optional tag, baseline-aligned, gap 8.
- States: searched form → `border-[var(--accent)]`, tag « votre recherche »;
  self-given name → `bg-afh-bg-warm`, tag « leur nom »; pejorative (declared by the
  corpus, never inferred — Fang proves it) → colonial border, tag « péjoratif »;
  other forms → `border-afh-border`, qualifier tag when the corpus has one.
- **Mobile: three chips, and tags only for the three states above.** Desktop:
  four chips, every tag. The searched form is always among the chips shown (it
  replaces the last one if it would fall outside). Beyond, a link « +N autre(s) »
  to `#origines`.
- Disambiguation: one chip per subject, tag « famille · pays ». Typo: one chip
  per lead, the suggested one in the searched style.

### 5.4 First-screen budget

At 430 × 800 and 1280 × 800 **the first poster of block 4 is entirely visible**
without scrolling. The boards satisfy it for all ten cases (measured: first row
of posters starts at y ≤ 569 on mobile, ≤ 516 on desktop); §10.3 asserts it on the
page. The three measures that made it fit are part of the spec, not options: the
appellations sub is hidden on mobile, the verdict sub is clamped to two lines,
mobile shows three chips.

### 5.5 `FeedShelf` (the row of blocks 4, 5, 10) [`shorts`, `origins`, `plates`]

`role="list"` with an `aria-label`; `flex`, `overflow-x-auto snap-x
snap-mandatory`, items `snap-start flex-none`, `scroll-padding-inline` equal to
the gutter; the next item peeks at 430 by construction of the widths. Never
auto-advances, no dots, no arrows; `prefers-reduced-motion` → no smooth scroll.
Desktop: blocks 4 and 10 stay rows (≤ 6 and ≤ 3 items fit), block 5 becomes a
2-column grid.

### 5.6 Shorts (block 4) [`shorts`, `poster`, `empty_poster`]

- Header: `<h2>` « Les shorts » + `ActionLink` « Tout voir → » to the scoped
  Découvertes deck (§6.5). Desktop only: sub « Chacun répond à « D'où vient le
  nom… ? » en moins d'une minute. » Widened shelf: a note line
  (`text-afh-caption font-bold text-[var(--accent-ink)]`), texts in §5.9.
- `ShortPosterCard`: one link to the short's Découvertes permalink. The poster is
  an **image** — the cover the production pipeline exports next to each video
  (GABARITS-SOCIAL §1 ter), title burnt in — `rounded-afh-lg overflow-hidden`,
  130 × 231 / 160 × 284, `object-cover`, `alt` « Couverture : D'où vient le nom
  « X » ? ». Over it: the duration badge top-right (media-badge tokens, pill,
  padding 2 × 8) and a play glyph (inline SVG, `aria-hidden`, 32 / 36 px, centred
  at 44 % height). Under it: « D'où vient le nom « X » ? » (`text-afh-caption
font-bold`, non-breaking spaces inside the guillemets) and a meta line
  « {durée} · {relation label or « Découvertes »} ».
- Up to 5 on mobile (the row scrolls), up to 6 on desktop.
- `ShortEmptySlot`, first in the row when the searched subject has no short: same
  size, `border border-dashed border-afh-border rounded-afh-lg p-afh-lg`, three
  lines spaced apart — the question (`font-display text-afh-small font-bold
uppercase text-afh-text-soft`), a sentence (`text-afh-caption soft`), an action
  link — and the caption « Pas encore de short ». Sentences: no documented origin →
  « Aucune source lue ne dit d'où vient ce nom. Pas de short sans réponse. » +
  « Vous savez ? Proposer une source → »; documented but not produced → « Pas encore
  de short sur les … » + « Proposer une source → »; unknown name → « Personne ne
  nous l'a encore raconté. » + « Nous parler de ce nom → ».
- Relation labels, derived, never typed per page: patronyme of a searched
  people/family → « Nom de famille »; alliance partner → « Son allié »; the people
  of a searched patronyme → « Le peuple »; language of a searched people → « La
  langue »; people of a searched country → « Peuple du {pays} »; neighbouring
  people (relations) → « Peuple voisin »; widened by family → the family name
  (« Bénoué-Congo »); several subjects → « {nom} · {pays} ». A video may override
  with its manifest `label` (« Le fleuve »). Exact subject and the peoples a
  family/name designates → no label.

### 5.7 `FeedOrigins` (block 5) [`origins`, `origin_card`]

- `<h2 id="origines">` « D'où elles viennent » (country, language, patronyme:
  « D'où il vient »), sub (« Chaque forme, d'où elle vient, et qui l'emploie
  encore. », or the disagreement notice §5.13). Optional lede (`text-afh-small`)
  when one entity-level origin explains all forms (Fang).
- Mobile: `FeedShelf` of 290-wide cards, then « Glissez · N formes » when N > 1.
  Desktop: 2-column grid, gap 16.
- `OriginCard`: `bg-afh-surface border rounded-afh-lg p-afh-2xl flex-col
gap-afh-md`, border by state as the chips. Header: form (card title) and tag
  (state colour, right-aligned). Text `text-afh-small`. Optional line
  `text-afh-caption soft` with a bold `text-afh-text` label — « Aujourd'hui », « Quand »,
  « Selon », « Une nuance » as the data says. Footer: `<SourceStandingBadge>` +
  « Voir la source » (opens the existing `SourceChainSheet`).
- Then « Il en manque une ? Proposer une source → » (`text-afh-small font-bold`),
  opening the invitation dialog (§5.15) with `fieldPath: "appellations"`.

### 5.8 `FeedTiles`, `FeedPeoples`, `FeedAtlasHolds` (blocks 6, 8, 9) [`tiles`, `people_cards`, `facts`]

- Tiles: 2-column grid, gap 8; each tile is a link to its fiche,
  `bg-afh-bg-warm rounded-afh-lg p-afh-lg`, name `text-afh-small font-bold`, meta
  `text-afh-caption soft`; optional link below (« Les 31 peuples mandé → »).
- Peoples: cards `bg-afh-surface border rounded-afh-lg p-afh-2xl gap-afh-md`,
  card title, meta caption, text small; 1 column mobile, N columns desktop.
- Atlas holds: 2-column grid of warm tiles, label caption above value
  `text-afh-small font-bold` (Famille, Région, Pays, Sources).

### 5.9 `FeedPlates` (block 10) [`plates`, `plate`]

- `<h2>` « Anecdotes et proverbes » + `ActionLink` « Tout voir → »; when widened, a
  sub naming the ring (« Rien encore sur Ekpeye. Autour : le Nigeria, son pays. »,
  « Rien encore sur Traoré lui-même. Autour : les Bambara, le peuple auquel l'atlas
  le rattache. »).
- Plates 250 / 232 wide, gap 12 / 16, equal heights.
- `AnecdotePlate` (link to `/fr/dossiers/anecdotes?a={id}`): `bg-afh-surface
border rounded-afh-lg overflow-hidden`; image `next/image`, width × 0.62,
  `object-cover`, `alt` from the illustration record; body padding 12/16/16/16,
  gap 8: card eyebrow « Anecdote · {sujet} », headline (card title),
  `<SourceStandingBadge>`, « Photo : {credit} » caption.
- `ProverbPlate`: `bg-afh-bg-warm rounded-afh-lg p-afh-2xl gap-afh-md`: card
  eyebrow « Proverbe {langue} », the text in guillemets (card title), the original
  `text-afh-small italic soft` **with its `lang` attribute**, meaning
  `text-afh-small`, origin line caption. Attested proverbs only.
- Widening (shelves 4 and 10), stopping at the first ring with content, max ring 1:
  the subject → its linked entities (family ↔ peoples, patronyme → peoples,
  language → speaker peoples and family, country → major peoples) → its country.
  The shelf then carries the note/sub naming the ring. Never unrelated content,
  except block 4 for an unknown name: « Les plus récents de l'atlas — sans rapport
  avec « {q} » » (the three most recent).

### 5.10 `FeedNameQuiz` (block 11) [`quiz`]

- `bg-afh-surface border border-[var(--accent)] rounded-afh-lg p-afh-2xl
gap-afh-lg`; card eyebrow « Joue avec ce nom »; stem in heading style; options:
  stacked full-width `<button>`s, `text-afh-small font-bold text-left
bg-afh-surface border border-afh-border rounded-afh-lg py-afh-md px-afh-2xl
min-h-11`, gap 8; footer caption « Une question tirée de cette page » + « Toutes
  les questions → » (`/fr/jeux/quiz` with `pays=` / `famille=` when a scope exists).
- Reuse `QuizQuestionCard` / `QuizAnswerReveal` single-question mode; the reveal
  keeps games charter §7. Lazy: dynamic import when the tile enters the viewport;
  `scripts/quiz-bundle-size.ts` (15 KB gzip) stays green.
- Only active, locale-matching, non-`unverified` questions for a subject or ring-1
  entity. Board questions are illustrative.

### 5.11 `FeedGeneratedImage` (block 12) [`gen_image`]

`<h2>` « Les images », sub « Des interprétations, jamais des portraits. »; card
300 wide `bg-afh-surface border rounded-afh-lg overflow-hidden`; **label strip
first** « Image générée — une interprétation » (`text-afh-caption font-bold`,
`bg-[var(--accent-tint)] text-[var(--accent-foreground)]`, padding 8 × 12) — the
reader is told before seeing it (brand charter §9, DEC-053); image 4:5; body:
caption (card title), `<SourceStandingBadge>` + source short title, licence line
from `generatedImagesCopy`. Links to the Découvertes permalink.

### 5.12 `FeedProse` (blocks 7, 13, 14) [`prose`]

`<h2>` + one `bg-afh-surface border rounded-afh-lg p-afh-2xl` box, paragraphs
`text-afh-small` spaced 12, optional badge + « Voir la source ». Copy is
translated from corpus fields, never pasted (charter §3: no scholarly word).

### 5.13 Disagreement and silence copy

When sources disagree (Lingala: date of the name, speaker counts), the page says
so in the sub of block 5 and in block 13, **never picks one** (CLAUDE.md,
« Assertion tracks certainty »). Silences come from the corpus's declared gaps
(`gaps[]`, missing attestation dates, missing origin), one dashed card each.

### 5.14 `FeedFiches` (block 15) [`fiches`]

`<h2>` « Les fiches », sub « Pour aller au fond : chaque fiche, avec toutes ses
sources. »; grid 2 columns mobile (1 for a single fiche), up to 4 in the desktop
main column; card link `bg-afh-surface border rounded-afh-lg py-afh-lg
px-afh-2xl gap-afh-xs`: card eyebrow (kind) in `text-afh-text-soft`, name (card
title), meta caption. Links via `ficheHrefFor` (`SearchResultCard.tsx:59`).
Remaining results follow as today's `SearchResultCard` list under « Fiches ».

### 5.15 `FeedOwedBand` (blocks 16–19) [`band`, `further`]

Silences: `<h2>` + sub « Un silence déclaré, pas un oubli. », dashed cards
`border-afh-border rounded-afh-lg p-afh-2xl`, title `text-afh-small font-bold
soft`, text caption soft, gap 12. Conviction: `bg-afh-bg-warm rounded-afh-lg
p-afh-2xl`, title `text-afh-small font-bold`, body caption (mobile) / small
(desktop). Invitation: `bg-afh-surface border border-[var(--accent)]
rounded-afh-lg p-afh-2xl`, title `text-afh-small font-bold`, body small, button
`bg-[var(--accent-tint)] text-[var(--accent-foreground)] border
border-[var(--accent)] rounded-afh-lg min-h-11 px-afh-2xl text-afh-small
font-semibold`. **The button opens `FlagTarget`**
(`src/components/flags/FlagTarget.tsx`) with `target = { type: <subject type>, id,
name, fieldPath: "appellations" }`, `flag_kind` `correction-proposal` — today it
is a plain link to `/contact`, which loses the subject. Unknown name: « Nous parler
de ce nom », target `{ type: "name-proposal", id: q }`, kind `contribution`.
Desktop: silences span 6, conviction + invitation stacked span 6; thin pages
stack all three. Further (typo/unknown): pill links `min-h-11 px-afh-2xl
text-afh-caption font-semibold` « Parcourir les peuples », « Les familles de
langues ».

## 6. Data: where each tile comes from

### 6.1 Name answer (blocks 2, 3, 5, 7, 13, 16)

**Which entities are the subjects** is decided by `selectNameSubject`
(`src/lib/search/nameSubject.ts`, REQ-178): an exact name or form match, plus —
since #1168 — entries whose filed name starts with the searched word, bounded
(no parenthesis next, same kind as the exact match, not the same
`peopleGroupId`, never without an exact match). That rule is what makes « bassa »
answer with its three peoples; the feed consumes the subjects as they come and
adds no rule of its own.

`readNaming` in `src/lib/search/naming.ts` → `NamingProjection {selfGiven, forms,
origin, problem, usageToday, eras}`, built in `mapSearchEnvelope`
(`src/lib/search/searchEnvelope.ts`). Per class:

| Class     | Forms                                       | Per-form origin                                                                                                                                                                                               | Entity-level origin                                      |
| --------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| people    | `content.appellations` exonyms              | `name_records` (`GET /api/v2/peoples/{id}/names`, `getPeopleNamesDossier` in `src/api/v2/services/names.ts`: `language_of_origin`, `meaning`, `imposed_by`, `why_problematic`, `contemporary_usage`, sources) | `originOfExonyms`, `whyProblematic`, `contemporaryUsage` |
| family    | `content.decolonialHeader`                  | none                                                                                                                                                                                                          | decolonial header prose                                  |
| country   | `content.historicalNames.formerNames`       | none (one card per era / former name)                                                                                                                                                                         | root `etymology`, `nameOriginActor`                      |
| language  | `content.alternateNames`, `spellingAliases` | none                                                                                                                                                                                                          | none in `langues/*.json`; related people fiches carry it |
| patronyme | `content.spellings[]`                       | `content.origin.{oralTraditions,…}[].claim` + `claimStatus`                                                                                                                                                   | same                                                     |

**Bug to fix first (Phase 1):** `readNaming("patronyme" | "language", content,
root)` reads `root.spellings` / `root.alternateNames`, but `toRankedPatronyme` and
`toRankedLanguage` (`src/lib/supabase/queries/afrik/search.ts:402-497`) only pass
`content`. On the live page Traoré and Lingala get no forms. `naming.test.ts:94`
injects the fields at the root, so it passes anyway.

**Second bug (fix in Phase 1):** `NameAnswer.tsx` uses `text-afh-accent-ink`,
`border-afh-accent-ink` and `bg-afh-accent-tint`, which no Tailwind key or CSS
rule defines — they generate nothing, so « votre recherche », the searched
form's frame and the « Proposer une source » button carry no accent today. The
accent is read with arbitrary values everywhere else in `src/components`
(`text-[var(--accent-ink)]`, `border-[var(--accent)]`, `bg-[var(--accent-tint)]`);
this plan uses that form throughout.

When per-form origins are absent, block 5 renders the entity-level origin as its
lede and one card per form **without** text (form, tag, badge). The board copy for
Nigeria, Lingala and Traoré cards is an editorial synthesis of their fiches; the
live page renders what the corpus exposes (§10.1 tolerates it by fixture).

**Pejorative flag:** no field exists (`NamingForm.qualifier` is never parsed).
Phase 2 reads it from `name_records.why_problematic` + `imposed_by` for peoples
and from a corpus field for others; until then no chip is marked pejorative.

### 6.2 Anecdotes

`DID_YOU_KNOW_FACTS` (`src/lib/home/didYouKnowFacts.ts`, 67 facts, `entities`
people/country/family, `tier`, `sources`), English via `localizeDidYouKnowFact`;
image via `illustrationFor(id)` (`didYouKnowIllustrations.ts`: `src`, `alt`,
`credit`, `licenceUrl`, `filePage`). No helper returns all facts for an entity —
add `factsForEntities(ids)` (Phase 3).

### 6.3 Proverbs

`src/lib/proverbs/proverbs.ts` (54, `entities`, `original.lang` ISO 639-3,
`origin.status`), `filterProverbs`, `localizeProverb`. Add
`proverbsForEntities(ids, { attestedOnly: true })` and a language filter on
`original.lang`.

### 6.4 Generated images

`generatedImagePublications()` (`src/lib/discoveries/generatedImages.ts`, 12,
entities people/country), sources in `generatedImageSources.json`, copy in
`generatedImagesCopy`, permalink `discoveryPath(lang, entry)`.

### 6.5 Shorts — the missing model

Nothing in the repository describes a video. Phase 4 adds it:

- `DiscoveryPublication.kind` gains `"video"`; a video carries
  `video: { durationSec, poster: { src, alt, width, height }, watch: { youtube?,
tiktok?, instagram? }, transcript?: Record<Language,string> }` and `subjects:
Array<{ kind: "people"|"country"|"family"|"language"|"patronyme", id, label? }>`
  (`label` = the optional relation override of §5.6).
- The manifest lives in `src/lib/discoveries/videos.ts` (typed records, like
  `generatedImages.ts`); posters under `public/images/discoveries/videos/<slug>/poster.jpg`
  (the cover PNG from the production pipeline, converted to JPEG ≤ 120 KB).
- `eligiblePublications` gains an explicit `video` branch: poster present with
  `alt`, ≥ 1 subject whose id exists in the corpus, a `watch` link, FR copy; the
  generic « cleared picture + filePage » rule must not accept a video by accident.
- **Playback (decision D-A, §12)**: default, the Découvertes item shows the poster
  and « Regarder sur YouTube » (external link, no iframe, no CSP change).
- `DiscoveryReader` renders the video item (poster full-bleed, the same rail).
- `?autour=<id,id>` on `/fr/decouvertes` builds a deck restricted to publications
  whose subjects/entities intersect the ids — the target of every « Tout voir ».
- **Content** (operator, not code): the 16 published videos
  (listed in the former social-library inventory, since deleted) get a manifest record each, with
  subjects. `cards.json` (GABARITS-SOCIAL §10) gains `sujets: ["PPL_…"]` so the
  production chain writes subjects from now on (`/ethniafrica-structure`).

### 6.6 Quiz

`quiz_questions` (migration 036 + 046 + 087): `entity_type ∈ {people, country}`,
`entity_id`, `locale`, `revoked_at`. No endpoint serves one question by entity:
the companions service (6.7) selects one active, sourced question for the
subjects then ring 1. Families, languages and patronymes have none — block 11 then
widens to their peoples (Mandé → Bambara, Maninka…), else is absent.

### 6.7 One companions endpoint

`GET /api/v2/search/companions?ids=PPL_FULANI,FLG_ATLANTIC&lang=fr` — route,
handler, service, OpenAPI entry; zod schema in `src/api/v2/schemas/`. Response:

```ts
interface SearchCompanions {
  ring: "exact" | "linked" | "country" | "recent"; // the widest ring used
  ringLabel?: string; // « la famille bénoué-congo »
  shorts: CompanionShort[]; // ≤ 6, exact first, with relationLabel
  anecdotes: CompanionAnecdote[]; // ≤ 3
  proverbs: CompanionProverb[]; // ≤ 2, attested only
  images: CompanionImage[]; // ≤ 1
  quiz: QuizSessionQuestion | null;
  counts: { shorts: number; images: number; quiz: number };
}
```

Static banks are read server-side so the client bundle does not ship 67 facts;
ring-1 ids come from the corpus (family ↔ peoples, patronyme → peoples, country →
`majorPeoples`, language → `familyId` + speaker peoples). Cache `s-maxage=3600`.
The page calls it once the subjects are known (after `searchWithLeads`).

## 7. Copy

All new strings go to a new module `src/lib/i18n/copy/searchFeed.ts`
(`searchFeedCopy`, registered in `src/lib/i18n/copy/index.ts`), `fr` and `en`.
French strings are the boards' verbatim (typographic apostrophes `’` as in
`nameAnswerCopy`; the boards use `'` — normalise when comparing, §10.1). Existing
keys in `nameAnswerCopy` are reused, not duplicated. English copy is written in
the same change (`copyParity.test.ts` fails otherwise); publication stays
French-only by `SITE_LOCALE_MODE`.

## 8. Phases

Each phase: **tests first**, then code, then its gates. Commit per phase
(conventional commits).

### Phase 0 — Spec and contract

1. Run `/ethniafrica-spec` (or ask the operator) to create, as Pending on
   Confluence: a DEC « the result page is a feed » superseding the grammar's
   three-movement order for the first screen, and a REQ « search-result feed »
   (acceptance criteria = §10). Record the new REQ id in
   `docs/confluence-spec/req-catalog.json` the way the spec skill does.
2. Amend `docs/design/search-result-charter.md`: new §3 ter « The feed » = §4 of
   this plan (blocks table, desktop placement, thin pages, first-screen rule);
   point « the reviewed rendering » at `mockups/search-feed/`; record the terre
   verdict box as the charter's one sanctioned second accent (it is another kind of
   object: the answer).
3. **Tests first** — `src/lib/search/__tests__/feedGrammarCharter.test.ts`
   (`@req` new REQ): reads every `docs/design/mockups/search-feed/*.dc.html`,
   asserts 10 cases × 4 variants, and that the drawn blocks follow
   `FEED_BLOCKS` order (probes = the §4.1 headings; same parser as
   `resultGrammarCharter.test.ts`, extract it to a shared helper).
4. Code: `FEED_BLOCKS` in `src/lib/search/resultGrammar.ts` (keep
   `RESULT_BLOCKS` until Phase 10 deletes it with its test).

### Phase 1 — Fix the naming read for patronymes and languages

- Tests first (`naming.test.ts`, `searchEnvelope.test.ts`, REQ-178): a patronyme
  row whose `spellings` live in `content` yields forms; a language row with
  `content.alternateNames` yields forms; `selectNameSubject` matches `Tarawele` to
  `PAT_TRAORE` and `Ngala` to `lin`.
- Code: read from `content` first, root second (tolerate both, one release).
- Tests first, then code: `NameAnswer` renders the accent through
  `text-[var(--accent-ink)]` / `border-[var(--accent)]` / `bg-[var(--accent-tint)]`
  (assert the class names; happy-dom does not compute Tailwind).

### Phase 2 — Per-form naming

- Tests first: `NamingForm` gains `origin?`, `usage?`, `pejorative?: boolean`,
  `tier?`, `sourceIds?`; a people with `name_records` yields per-form origins in
  sort_rank order; a form with `imposed_by` + `why_problematic` flagged
  pejorative only when the record says so; a country yields one form per former
  name with its era; a patronyme yields its spellings and origin claims with
  `claimStatus`.
- Code: extend `readNaming`; for peoples, batch-load `name_records` for the
  subjects in the search service (one query per page, AR17 map pattern).

### Phase 3 — Companion helpers

- Tests first: `factsForEntities`, `proverbsForEntities` (attested only, language
  filter), `imagesForEntities`, ring-1 resolution per class (fixtures: Ekpeye →
  Nigeria; Traoré → Bambara; Mandé → its peoples).

### Phase 4 — The video model and scoped Découvertes

- Tests first: catalog accepts a complete `video` record and rejects one without
  poster alt / subjects / watch link, and does **not** accept it through the
  generic picture rule; `?autour=` deck contains only intersecting publications and
  keeps `orderedDeck` ordering; `DiscoveryReader` renders a video item with its
  « Regarder sur YouTube » link.
- Code: §6.5. Seed the manifest with **one** real published short (Nigeria) so the
  path is exercised end to end; the operator fills the rest.

### Phase 5 — The companions endpoint and fixtures

- Tests first (`src/app/api/v2/__tests__/`, handler and service tests): the ten
  cases' subject ids return the expected rings and counts (Ekpeye → ring
  `linked`, Kossiwa → shorts ring `recent`, Bassa → one short per subject);
  OpenAPI diff lists the new path.
- Fixtures: `src/lib/search/__fixtures__/feedCases.ts` — for each case of §2, the
  search envelope + companions response that reproduce the board (illustrative
  shorts included, marked `fixture: true`).

### Phase 6 — Presentational components

- Tests first, one file per component under
  `src/components/search/feed/__tests__/`: renders its block heading, its states
  (searched / self / pejorative chip; empty short slot variants; widened notes;
  lazy quiz placeholder), accessibility (h1 unique, h2 per block, list roles,
  44 px targets via class assertions, `lang` on proverb originals, image alt).
- Code: §5 components. Stories in `src/stories/search-feed/` for every component
  and for the ten fixtures × day/night (Storybook uses `@storybook/react-vite`).
- Add each new file to `searchCharter.test.tsx` `IN_SCOPE_FILES`.

### Phase 7 — Tokens for night and media badges

- Tests first (`colorTokens.test.ts`): `--afh-media-badge-bg` (`rgba(18, 14, 10,
0.72)`) and `--afh-media-badge-ink` (`#f1e7d8`) exist, identical in both themes,
  ink on badge ≥ 4.5:1; `--accent-foreground` on `--accent-tint` ≥ 4.5:1 inside
  `.afh-accent-ocre` and `.afh-accent-terre`, day and night (the tints are not
  rebound at night — the boards assume it).
- Code: the two tokens in `src/styles/tokens/color.css`, nothing else.

### Phase 8 — Page composition and states

- Tests first (`RecherchePageContent.test.tsx`, happy-dom, mocked fetch with the
  Phase 5 fixtures): for each case, the ordered list of rendered block ids equals
  §9's expectation; lens filtering (§5.1); loading renders the skeleton of §8.1;
  `failed` renders the outage message with no companion shelves; relation mode
  (`?country=`) keeps today's behaviour without the feed.
- Code: `RecherchePageContent` renders `<SearchFeed>` when a query is committed;
  `PageLayout` gets `hideHeader` in that state (the boards have no page hero and
  no trail); `data-feed-root` goes on the page's own `div.afh-shell` (§3.2). The
  form is the field alone, 48 px high, full width on mobile and 640 px centred on
  desktop: search icon, input, clear button (`aria-label` « Effacer »); submission
  by Enter plus a visually hidden submit button — the visible « Rechercher »
  button of today (which stacks under the field on mobile, 56 px) is removed. Remove `SourcedHighlightBlock` from the
  page (the anecdote shelf replaces it). Keep `NoResultsLeads` data but render it
  through blocks 2–3 typo variant.

#### 8.1 Loading and failure

Loading: skeletons in the shape of the first screen — eyebrow bar, name bar,
verdict box, four chips, three poster boxes (`bg-afh-bg-warm rounded-afh-lg`,
`motion-safe:animate-pulse`); no spinner alone. Failure: the name stays in the
field, « La recherche ne répond pas pour l'instant. », a « Réessayer » button;
**no** substitute shelf.

### Phase 9 — Parity suite

§10.1 to §10.5, in that order: the structure test first (cheap, in `make check`),
then geometry, then the pixel comparison, then axe. Tests only; fix components
until the forty pixel comparisons pass.

### Phase 10 — Clean-up

- `e2e/search-results-consolidation.spec.ts` asserts `search-pivot`,
  `dominant-answer-panel-wrapper`, `search-results-main`, which no longer exist:
  rewrite it on the feed's `data-testid`s.
- Delete `RESULT_BLOCKS` + `resultGrammarCharter.test.ts` once the charter points
  at the feed; keep `docs/design/mockups/search/` as history (README says so).
- Remove the unused `AutonymExonymHeading` import from `RecherchePageContent`
  if still unused; update `docs/design/search-result-data-shape.md`.

## 9. Expected blocks per case

Order of rendered block ids (mobile; desktop places them per §4.2). « w » =
widened with its note. Appellation counts are the desktop ones; mobile shows three
chips at most (§5.3), the rest behind « +N ».

| Case        | First screen                                                                       | Feed                                                                                | Owed                                                        |
| ----------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Mande       | lenses, verdict, appellations (4), shorts (6)                                      | origins (4 cards), tiles (self-names, 6), plates (4), quiz, images, fiches (4)      | silences (1), conviction, invitation                        |
| Peul        | lenses, verdict, appellations (4, 1 pejorative), shorts (4)                        | origins (5), plates (3), quiz, problem, fiches (4)                                  | silences (1), conviction, invitation                        |
| Fang        | lenses, verdict, appellations (4 + « +1 »), shorts (4)                             | origins (lede + 5), plates (1, unverified), quiz, problem, fiches (4)               | silences (2), conviction, invitation                        |
| Bassa       | lenses, verdict, appellations = 3 subjects, shorts (empty slot + 2 labelled)       | peoples (3), shared-name, plates (1), quiz, near-name (Bassari), fiches (4)         | silences (2), conviction, invitation                        |
| Ekpeye      | lenses, verdict, appellations (1, self), shorts (empty slot + 2 w)                 | atlas-holds, plates (1 w), quiz, fiches (2)                                         | silences (3), conviction, invitation                        |
| Nigeria     | lenses, verdict (· Pays), appellations (4 + « +1 »), shorts (5)                    | origins (4), tiles (peoples, 6), plates (1), quiz, problem, fiches (4)              | silences (1), conviction, invitation                        |
| Lingala     | lenses, verdict (· Langue), appellations (4), shorts (4)                           | origins (3, disagreement sub), plates (1), quiz, problem (speakers), fiches (4)     | silences (2), conviction, invitation                        |
| Traore      | lenses, verdict (· Nom de famille), appellations (3), shorts (4)                   | origins (3), tiles (relations, 4), plates (2 w), quiz, problem (status), fiches (4) | silences (2), conviction, invitation                        |
| Introuvable | lenses, verdict (plain, « Vouliez-vous dire »), appellations = 3 leads, shorts (3) | plates (1), fiches (3)                                                              | further                                                     |
| Inconnu     | lenses (Shorts only), verdict (plain, unknown), shorts (empty slot + 3 recent)     | —                                                                                   | conviction, invitation (« Nous parler de ce nom »), further |

## 10. Parity suite (Phase 9)

### 10.1 Structure and copy — `src/components/search/feed/__tests__/feedBoardParity.test.tsx`

For each case: render the page with the case fixture (day), extract visible text
in document order, and compare with the board's text (same extraction as the
grammar test: between `</helmet>` and `</x-dc>`, tags stripped, entities decoded),
after normalising `'`/`’`, `&nbsp;` and whitespace. Assert the ordered
`data-feed-block` ids and headings are identical, and that every sentence of the
board appears verbatim. Mobile board below 1200 px, desktop board above
(`matchMedia` mocked).

### 10.2 Tokens

The charter contract tests of §0, plus: no file under `src/components/search/feed/`
contains a `#`-hex, `rgb(`, `text-[` with a size, `rounded-[`, `--afh-cat-` or
`--afh-night-`.

### 10.3 Geometry — `e2e/search-feed.spec.ts`

Route the page to the fixtures (`page.route` on `/api/v2/search*` and
`/api/v2/search/companions*`, and on the poster URLs to
`docs/design/mockups/search-feed/posters/*.jpg`). For each case at 430 × 800 and
1280 × 800:

- the first poster's box is entirely inside the viewport;
- no horizontal scroll (`scrollWidth === innerWidth`);
- `[data-feed-root]` is at x = 12, 406 wide (430) and x = 52, 1176 wide (1280);
- blocks carry `data-feed-block` and appear in §9's order; desktop main and rail
  exist when both are non-empty; thin cases are 880 px wide inside the root;
- posters 130 × 231 / 160 × 284; lens chips, quiz options and owed buttons ≥ 44 px.

### 10.4 Pixels — `e2e/search-feed-parity.spec.ts`

The board is the baseline, rendered at test time — no image is committed:

```ts
// @req REQ-<feed REQ from Phase 0>
test(`${stem} ${width} ${theme}`, async ({ page, browser }, testInfo) => {
  const name = `${stem}-${width}-${theme}.png`;
  const board = await browser.newPage({ viewport: { width, height: 800 } });
  await board.goto(pathToFileURL(boardFile(stem, width, theme)).href);
  await board.evaluate(() => document.fonts.ready);
  const expected = await board.locator("[data-feed-root]").screenshot();
  fs.mkdirSync(path.dirname(testInfo.snapshotPath(name)), { recursive: true });
  fs.writeFileSync(testInfo.snapshotPath(name), expected);

  if (theme === "night")
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await routeFixtures(page, stem);
  await page.setViewportSize({ width, height: 800 });
  await page.goto(`/fr/atlas/recherche?q=${encodeURIComponent(query(stem))}`);
  await page.evaluate(() => document.fonts.ready);
  const actual = await page
    .locator("[data-feed-root]")
    .screenshot({ animations: "disabled" });
  expect(actual).toMatchSnapshot(name, { maxDiffPixelRatio: 0.01 });
});
```

- 10 cases × 2 widths × 2 themes = 40 comparisons; a size mismatch fails outright.
- Fixtures reproduce the boards' illustrative content exactly (shorts titles and
  durations, lens counts, quiz questions), and the posters are the committed
  images of `docs/design/mockups/search-feed/posters/`.
- `next-themes` stores the theme under `localStorage.theme` (`attribute="class"`,
  `src/app/providers.tsx`); verify the key before relying on it.
- Run: `npm run e2e -- search-feed-parity`. Attach the diff images of any failure
  to the PR. The art-director review (`/afrik-art-director`) reads the passing
  screenshots last.

### 10.5 Accessibility

`scripts/a11yRoutes.ts` already lists the search route; add `?q=mandé` and
`?q=kossiwa` for both locales. axe must be clean in day and night.

## 11. Gates to run before every push

```bash
make check                      # lint + typecheck + format:check + tests
npm run lint:req
npm run check:copy-literals -- --base origin/recette
npm run test:charter-contracts
npm run check:dead
npm run check:local-paths
npx tsx scripts/quiz-bundle-size.ts
npm run openapi:diff            # after Phase 5
npm run e2e -- search-feed          # Phase 9 onward
npm run e2e -- search-feed-parity   # Phase 9 onward: 40 pixel comparisons
```

## 12. Open decisions (defaults apply until the operator says otherwise)

| ID  | Question                                                | Default in this plan                                |
| --- | ------------------------------------------------------- | --------------------------------------------------- |
| D-A | Video playback: self-hosted, YouTube embed, or link out | Link out (« Regarder sur YouTube »), no iframe      |
| D-C | Terre verdict box as a second accent                    | Kept, recorded as a charter exception (Phase 0)     |
| D-D | Who writes per-form origins where the corpus has none   | Nobody in this plan: entity-level lede + bare cards |
| D-E | Relation labels vocabulary (§5.6)                       | As listed; new relations need a charter line        |

## 13. Out of scope

Hashtag search in Découvertes (its data — `subjects` — is laid here); producing
the shorts; English publication; the atlas fiches themselves; any change to the
home page.
