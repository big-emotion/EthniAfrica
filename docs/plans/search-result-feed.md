# Search-result feed: implementation plan

Date: 2026-09-19. Status: **approved design, not started**. Target branch: `recette`.

This plan turns the search-result page (`/fr/atlas/recherche?q=…`) into a feed:
the name answer and the shorts in the first screen, then visual shelves, then the
reference material. It is written so that an agent with **only this repository**
— Codex, Claude, or a person — can reproduce the reviewed boards without asking
anything. Where the plan does not decide, it says so in §12 and names the default.

## 0. How to use this plan

**Read, in this order, before touching code:**

1. This file, entirely.
2. [`docs/design/mockups/search-feed/README.md`](../design/mockups/search-feed/README.md)
   and the forty boards beside it — the rendering this plan is measured against.
   Serve the repository root over HTTP (`npx serve .` or
   `python3 -m http.server`) and open
   `/docs/design/mockups/search-feed/Mande.dc.html`; `file://` is blocked.
3. [`docs/design/mockups/search-feed/generator/gen.py`](../design/mockups/search-feed/generator/gen.py)
   — one Python function per tile. Every size, gap and colour quoted in §5 comes
   from it; when this plan and `gen.py` disagree on a number, `gen.py` is the
   board and §3 decides how the number becomes a token.
4. [`docs/design/search-result-charter.md`](../design/search-result-charter.md) —
   the contract this plan amends (Phase 0).
5. `docs/design/brand-charter.md`, `typography-charter.md`, `actions-charter.md`,
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

## 3. What « exact parity » means here

The boards are drawn with literal pixels and hex values. The code may not use
either: five contract tests and one ESLint rule refuse them. Parity is therefore
defined as **the same structure, the same copy, and every visual value replaced by
the token this section assigns to it** — deterministically, so two implementers
produce the same page.

### 3.1 Three levels, all gated

| Level          | Asserted by (Phase 9)                              | Tolerance                         |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Structure/copy | DOM parity test against the boards' text, per case | none: same blocks, order, strings |
| Tokens         | charter contract tests + this table                | none                              |
| Geometry       | Playwright at 430×800 and 1280×800, day and night  | §10.3                             |

### 3.2 Colour (day → token → night)

The page keeps its one accent, **ocre** (`afh-accent-ocre` on the page wrapper,
already there). Components read `var(--accent*)` and `--afh-*` semantics only —
never `--afh-cat-*`, `--afh-night-*` or a hex (color.css:319-327, :80-83).

| Board (day)                           | Use in boards                         | Token / class                                                                                                                       | Night value the code gives               |
| ------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `#fbf7f2`                             | page ground                           | `bg-afh-bg` (`--afh-bg`)                                                                                                            | `#120e0a` (= board)                      |
| `#ffffff`                             | cards, field, chips, quiz             | `bg-afh-surface`                                                                                                                    | `#271e14` (board `#1d1710`, **D6**)      |
| `#f5ede0`                             | tiles, proverb plate, conviction      | `bg-afh-bg-warm`                                                                                                                    | `#1d1710` (board `#271e14`, **D6**)      |
| `#e8dfd3`                             | every hairline and card border        | `border-afh-border`                                                                                                                 | `#3a2e1f` (= board)                      |
| `#2c2018`                             | text                                  | `text-afh-text`                                                                                                                     | `#f1e7d8` (= board)                      |
| `#746557`                             | secondary text, tags                  | `text-afh-text-soft`                                                                                                                | `#c9b99f` (= board)                      |
| `#835514`                             | eyebrows, links, « votre recherche »  | `text-[var(--accent-ink)]` (`var(--accent-ink)`)                                                                                    | `#c9821f` (board `#e8b96a`, **D7**)      |
| `#c9821f`                             | searched chip/card border, quiz frame | `border-[var(--accent)]` (`var(--accent)`)                                                                                          | `#c9821f` (= board)                      |
| `#f1d9ae`                             | invitation button, image label strip  | `bg-[var(--accent-tint)]` (`var(--accent-tint)`)                                                                                    | **verify** (Phase 7, **D8**)             |
| `#f0d2c8` + `#974331`                 | verdict box and its ink               | verdict box wrapped in `afh-accent-terre`, then `bg-[var(--accent-tint)]`, `border-[var(--accent-ink)]`, `text-[var(--accent-ink)]` | `#cd725e` ink; tint: **verify** (**D8**) |
| `#9b3030`                             | pejorative chip border/tag, card      | `border-[var(--afh-colonial-ink)]` / `text-[var(--afh-colonial-ink)]` (`--afh-colonial-ink`; never `--afh-error`)                   | `#d98a7a` (= board)                      |
| `#cfc3b4`                             | dashed border: silences, empty short  | `border-afh-border border-dashed` (existing `NameAnswer` silence)                                                                   | `#3a2e1f` (**D9**)                       |
| `#5b8db8`, `#2b6b42`, `#746557` pills | source tier badges                    | `<SourceStandingBadge>` (`src/components/sources/SourceStandingBadge.tsx`)                                                          | its own (**D5**)                         |
| `#2c2018` fill + `#fbf7f2` label      | selected lens chip                    | `bg-afh-text text-afh-bg`                                                                                                           | swaps correctly                          |
| poster gradients                      | placeholder art in the boards         | not implemented: posters are images (§5.6)                                                                                          | —                                        |
| `rgba(0,0,0,.55)` + `#f1e7d8`         | duration / label badge on a poster    | new tokens `--afh-media-badge-bg`, `--afh-media-badge-ink` (Phase 7)                                                                | same values both themes                  |

### 3.3 Type

Fonts are already loaded (`src/app/layout.tsx:18-39`): Fraunces
300/500/700/900, Nunito Sans 300–800. **Fraunces 600 is not loaded and
`displayWeightCharter.test.ts` allows 700 and 900 only**, so every board weight 600
on the display face becomes `font-bold` (700). `afh/no-raw-font-size` forbids
`text-[Npx]`; sizes below 12 px are retired (`typeScaleCharter.test.ts`).

The mapping is by board pixel size, applied everywhere:

| Board px           | Class                                                     | Rendered |
| ------------------ | --------------------------------------------------------- | -------- |
| 10, 10.5, 11, 12   | `text-afh-eyebrow` when uppercase-tracked, else `text-xs` | 12       |
| 13                 | `text-afh-caption`                                        | 13       |
| 14                 | `text-sm`                                                 | 14       |
| 15, 16             | `text-base`                                               | 16       |
| 17, 18             | `text-lg`                                                 | 18       |
| 19, 20, 21         | `text-xl`                                                 | 20       |
| 23                 | `text-2xl`                                                | 24       |
| 40 / 56 (the name) | `text-afh-hero` (34→52 clamp)                             | fluid    |

Faces: board `'Fraunces'` → `font-display`; everything else is the body face.
Eyebrows (uppercase, tracked): `uppercase tracking-[0.16em]` at 12 px for the page
eyebrow, `tracking-[0.14em]` for card eyebrows, weight `font-bold` — as
`NameAnswer.tsx:186` already does. The poster's burnt-in title is **not** set in
type (§5.6).

### 3.4 Space, radius, width

- **Spacing ramp** (brand charter §7): 4·8·12·16·24·32·48·64·96, tokens
  `afh-xs 4`, `afh-md 8`, `afh-lg 12`, `afh-2xl 16`, `afh-5xl 24`, `afh-6xl 32`,
  `[var(--afh-space-8xl)] 48`. Round every board gap/padding to the nearest step,
  ties upward: 6,7,9→8 · 10,11,13→12 · 14,15,18→16 · 20,22,26→24 · 28,30,34→32 ·
  40,44→48.
- **Between sections**: `--afh-section-gap` (24 / 32 / 48 at <768 / 768–1199 /
  ≥1200) and nothing else (**D3**).
- **Radius** (actions charter §6): every card, box, field, button, plate, poster →
  `rounded-afh-lg` (14); every chip and lens → `rounded-afh-full`; source marks →
  radius 0 (the badge component already does it). The verdict box keeps its square
  left edge: `rounded-r-afh-lg`.
- **Gutters**: the page keeps `.afh-shell` (`--afh-page-padding` 12 / 24 / 32)
  (**D4**).
- **Breakpoints**: mobile < 768 renders the mobile board; 768–1199 renders the
  mobile board inside a 720 px centred column; ≥ 1200 renders the desktop board.
  Tailwind has no custom screens: use `md:` for 768 and `min-[1200px]:` for 1200.
  Desktop content max-width 1184 (1280 − 2×48); thin pages 880.
- Touch targets ≥ 44 px on every control (chips, lens, options, buttons).

### 3.5 Deliberate deviations from the boards

Each is forced by a rule a test enforces; each is visible in a side-by-side
review, and none changes structure or copy.

| ID  | Board                                  | Code                                 | Why (rule → test)                                           |
| --- | -------------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| D1  | text at 10.5–11 px                     | 12 px                                | no size < 12 → `typeScaleCharter.test.ts`                   |
| D2  | Fraunces 600                           | 700                                  | display weights 700/900 → `displayWeightCharter.test.ts`    |
| D3  | section gaps 30–34 px on mobile        | 24 px (`--afh-section-gap`)          | brand charter §7                                            |
| D4  | 20 / 48 px gutters                     | 12 / 32 px (`.afh-shell`)            | layout tokens; the page already uses the shell              |
| D5  | coloured round tier pills              | neutral square `SourceStandingBadge` | tiers are neutral marks, radius 0 → actions charter §6      |
| D6  | night: cards `#1d1710`, warm `#271e14` | cards `#271e14`, warm `#1d1710`      | `.dark` rebinding in `color.css:390-391`                    |
| D7  | night accent ink `#e8b96a`             | `#c9821f`                            | `--accent-ink` under `.afh-accent-ocre` (color.css:514-519) |
| D8  | night tints `#33281a`, `#2f201a`       | whatever `--accent-tint` gives       | resolved in Phase 7                                         |
| D9  | dashed `#cfc3b4`                       | dashed `--afh-border`                | no token; matches today's `NameAnswer` silences             |
| D10 | radii 9–12 px                          | 14 px                                | actions charter §6 → `actionsCharter.test.tsx`              |

**If the operator wants pixel identity instead**, the generator is re-run with §3's
table applied (a one-hour change to `gen.py`) and the boards are republished; the
plan does not change. Do not edit boards by hand.

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

- Row 1: 12-column grid, `column-gap` 32 (§3.4): verdict (block 2) spans 7,
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

Numbers are the board's (mobile / desktop) before §3's translation. Component
names are the ones to create under `src/components/search/feed/` (Phase 6).

### 5.1 `FeedLensRow` (block 1)

Horizontal row, no wrap, overflow hidden on mobile, centred 640 px on desktop.
Chips: pill, `text-sm` bold, padding 6×13 → `py-afh-md px-afh-lg`, min-height 44.
Selected: `bg-afh-text text-afh-bg`, `aria-current="true"`. Others:
`bg-afh-surface border border-afh-border`, label + count in `text-afh-text-soft`.
Items: « Tout », « Shorts n », « Images n », « Jeux » (no count), « Fiches n »;
an item with count 0 is not rendered. Filtering (Phase 8): Shorts → only block 4
as a 2-column grid of every short; Images → blocks 10 and 12; Jeux → block 11;
Fiches → block 15 plus today's `SearchLensBar` (entity kinds) as a second row.
`Images n` = anecdotes + proverbs + images linked; `Fiches n` = `counts.all`.

### 5.2 `FeedVerdict` (block 2)

- Eyebrow: « D'où vient ce nom », `text-afh-eyebrow` uppercase tracking .16em
  bold `text-[var(--accent-ink)]`; kind suffix « · Pays » / « · Langue » / « · Nom de
  famille » in `text-afh-text-soft` (peoples and families: no suffix).
- Name: `<h1>` — the page's only h1 — `font-display font-bold text-afh-hero
leading-[1.02]`, margin-top 6/10 → 8/12. Peoples render through
  `<AutonymExonymHeading>` (`src/components/ui/AutonymExonymHeading.tsx`) so the
  `lang` attribute is kept.
- Verdict box (subject found): wrapper `afh-accent-terre`, `bg-[var(--accent-tint)]`,
  left border 3/4 px `border-[var(--accent-ink)]`, `rounded-r-afh-lg`, padding
  12×14 / 16×20. Line 1: verdict, `text-base min-[1200px]:text-lg font-bold
text-[var(--accent-ink)]`. Line 2 (sub), `text-afh-caption
min-[1200px]:text-base leading-relaxed text-afh-text`.
- Plain verdict (typo, unknown): no box; `font-display font-bold text-xl
min-[1200px]:text-2xl leading-tight`, sub `text-sm min-[1200px]:text-base`.
- Copy: the verdict sentence comes from the corpus (§6.1); the eyebrow, suffixes
  and plain verdicts from `nameAnswerCopy`.

### 5.3 `FeedAppellations` (block 3)

- `<h2>` `font-display font-bold text-xl min-[1200px]:text-2xl`; sub `text-xs
text-afh-text-soft` « Les plus communes d'abord. Aucune n'est « la bonne ». »
  (country: « Le nom, puis ceux qui l'ont précédé ou suivi. »; disambiguation:
  « Trois peuples, trois familles de langues. »).
- Chips: wrap, gap 7 → 8. Chip: pill, `bg-afh-surface border border-afh-border`,
  padding 6×12 / 7×14 → `py-afh-md px-afh-lg`; name `font-display font-bold
text-base min-[1200px]:text-lg`; tag `text-xs`.
- States: searched form → `border-[var(--accent)]`, tag « votre recherche »
  `text-[var(--accent-ink)] font-bold`; self-given name → `bg-afh-bg-warm`, tag « leur
  nom » `text-[var(--accent-ink)] font-bold`; pejorative (a form the corpus declares
  pejorative — never inferred, Fang proves it) → `border-[var(--afh-colonial-ink)]`, tag
  « péjoratif » `text-[var(--afh-colonial-ink)] font-bold`; others → qualifier in
  `text-afh-text-soft` when the corpus has one, no tag otherwise.
- **At most four chips**, in corpus order (most common first); if more, a link
  « +N autres » (`text-sm font-bold`) scrolling to block 5 (`href="#origines"`).
- Disambiguation variant: one chip per subject, name + « famille · pays » tag.
- Typo variant: one chip per lead; the first is the suggested one (`you` style).

### 5.4 First-screen budget

At 430×800 and 1280×800 **the first poster of block 4 is fully visible** without
scrolling (§10.3). If a real case overflows, compress in this order and stop as
soon as it fits: (1) hide the appellations sub on mobile; (2) clamp the verdict
sub to two lines (`line-clamp-2`); (3) cap chips at three plus « +N ». Never
shrink posters below 130×231.

### 5.5 `FeedShelf` (the row used by blocks 4, 5, 10)

A horizontal row that scrolls on touch and never auto-advances: `flex gap`,
`overflow-x-auto snap-x snap-mandatory`, `scroll-padding` equal to the gutter,
items `snap-start flex-none`, the next item peeking at the edge (item widths below
guarantee it at 430). Keyboard: the row is a `role="list"` region with
`aria-label`; items are links/buttons in tab order. `prefers-reduced-motion`:
no smooth scroll. No dots, no arrows on mobile (NN/g; the boards have none).
Desktop: blocks 4 and 10 remain rows (no scroll needed at ≤ 6 / ≤ 3 items; hide
overflow), block 5 becomes a 2-column grid (§5.7).

### 5.6 Shorts (block 4)

- Header: `<h2>` « Les shorts » + action link « Tout voir → » (`ActionLink`,
  `src/components/ui/ActionLink.tsx` — the arrow lives there only) to the scoped
  Découvertes deck (§6.5). Desktop only: sub « Chacun répond à « D'où vient le
  nom… ? » en moins d'une minute. » Optional note line (`text-xs font-bold
text-[var(--accent-ink)]`) when the shelf is widened (texts in §5.9).
- Poster card (`ShortPosterCard`): width 130 / 160, ratio 9:16 (231 / 284 tall),
  `rounded-afh-lg overflow-hidden`. **The poster is the cover image the production
  pipeline exports next to each video (GABARITS-SOCIAL §1 ter)** — its title is
  burnt in, so the site sets no title over it. Overlays: duration badge top-right,
  optional relation label top-left, both `text-xs font-bold`, padding 2×6 →
  `py-afh-xs px-afh-md`, `rounded-afh-full` (they are chips; the boards' 4 px
  corner is not a token), `bg-[var(--afh-media-badge-bg)]
text-[var(--afh-media-badge-ink)]`. A play glyph
  (inline SVG, `aria-hidden`) centred at 44 % height, 32 / 36 px, filled circle
  `--afh-media-badge-ink`, triangle `--afh-media-badge-bg`.
- Under the poster: title « D'où vient le nom « X » ? » `text-xs
min-[1200px]:text-sm font-bold leading-snug` (non-breaking spaces inside the
  guillemets), meta « 0:41 · Découvertes » `text-xs text-afh-text-soft`.
- Whole card is one link to the short's Découvertes permalink.
- Count: mobile shows up to 5 (row scrolls), desktop up to 6.
- **Empty slot** (`ShortEmptySlot`), first in the row when the searched subject
  has no short: same size, `border border-dashed border-afh-border
rounded-afh-lg p-afh-lg`, space-between column: the question in `font-display
font-bold uppercase text-base text-afh-text-soft`, a sentence `text-xs
text-afh-text-soft`, an action link `text-xs font-bold`; caption below « Pas encore
  de short » `text-xs font-bold text-afh-text-soft`. Sentences: no documented
  origin → « Aucune source lue ne dit d'où vient ce nom. Pas de short sans
  réponse. » + « Vous savez ? Proposer une source → »; documented but not
  produced → « Pas encore de short sur ce nom. » + « Proposer une source → »;
  unknown name → « Personne ne nous l'a encore raconté. » + « Nous parler de ce
  nom → ».
- Relation labels (top-left), derived, never typed per page: patronyme of a
  searched people/family → « Nom de famille »; alliance partner → « Son allié »;
  the people of a searched patronyme → « Le peuple »; language of a searched
  people → « La langue »; people of a searched country → « Peuple du {pays} »;
  neighbouring people (relations) → « Peuple voisin »; widened by family → the
  family name (« Bénoué-Congo »); multiple subjects → « {nom} · {pays} ». A video
  may override with its manifest `label` (e.g. « Le fleuve »). Exact subject and
  the peoples a family/name designates → no label.

### 5.7 `FeedOrigins` (block 5)

- `<h2>` « D'où elles viennent » (country/language/patronyme: « D'où il vient »),
  sub `text-xs text-afh-text-soft` (« Chaque forme, d'où elle vient, et qui
  l'emploie encore. » — or the disagreement notice, §5.13), anchor
  `id="origines"`.
- Optional lede paragraph `text-sm leading-relaxed` when the entity-level origin
  explains all forms at once (Fang).
- Cards: mobile, `FeedShelf` items 290 wide, then « Glissez · N formes » `text-xs
text-afh-text-soft` when N > 1; desktop, 2-column grid, gap 12.
- `OriginCard`: `bg-afh-surface border rounded-afh-lg p-afh-2xl flex-col
gap-afh-md`, border as the chip states (searched/pejorative/else). Header row:
  form `font-display font-bold text-xl`, tag `text-xs font-bold` right-aligned.
  Text `text-sm leading-relaxed`. Optional line `text-afh-caption
text-afh-text-soft` with a bold ink label — « Aujourd'hui — … » for usage,
  « Quand — … », « Selon — … », « Une nuance — … » as the data says. Footer:
  `<SourceStandingBadge>` + « Voir la source » inline link opening the
  record's sources (existing `SourceChainSheet`).
- After the cards: « Il en manque une ? Proposer une source → » (`text-sm
font-bold`) — opens the invitation dialog (§5.15) with `fieldPath` =
  `appellations`.

### 5.8 `FeedTiles`, `FeedPeoples`, `FeedAtlasHolds` (blocks 6, 8, 9)

- Tiles: 2-column grid gap 8; tile `bg-afh-bg-warm rounded-afh-lg py-afh-lg
px-afh-lg`; label `text-sm font-bold`, meta `text-xs text-afh-text-soft`; optional
  link below (« Les 31 peuples mandé → »). Each tile links to its fiche.
- Peoples (disambiguation): cards `bg-afh-surface border rounded-afh-lg
p-afh-2xl`, name `font-display font-bold text-xl`, meta `text-xs soft`, text
  `text-sm`; 1 column mobile, N columns desktop.
- Atlas holds: 2-column grid of warm tiles, label `text-xs soft` above value
  `text-sm font-bold` (Famille, Région, Pays, Sources).

### 5.9 `FeedPlates` (block 10)

- `<h2>` « Anecdotes et proverbes » + « Tout voir → » (scoped Découvertes); when
  widened, a sub naming the widening, e.g. « Rien encore sur Ekpeye. Autour : le
  Nigeria, son pays. » / « Rien encore sur Traoré lui-même. Autour : les Bambara,
  le peuple auquel l'atlas le rattache. »
- Plates 250 wide, row gap 10 / 14, equal heights (`items-stretch`).
- `AnecdotePlate`: `bg-afh-surface border rounded-afh-lg overflow-hidden`; image
  250×155 `object-cover` (`next/image`, `alt` from the illustration record); body
  padding 12×14: eyebrow « Anecdote · {sujet} » (`text-afh-eyebrow tracking-[0.14em]
text-[var(--accent-ink)]`), headline `font-display font-bold text-lg leading-snug`,
  `<SourceStandingBadge>`, credit « Photo : {credit} » `text-xs soft`. Links to
  the anecdote reader (`/fr/dossiers/anecdotes?a={id}`).
- `ProverbPlate`: `bg-afh-bg-warm rounded-afh-lg p-afh-2xl gap-afh-md`: eyebrow
  « Proverbe {langue} », text in guillemets `font-display font-bold text-xl`,
  original `text-afh-caption italic soft` **with `lang="{ISO 639-1 or -3}"`**,
  meaning `text-afh-caption`, origin line `text-xs soft`. Only **attested**
  proverbs (`origin.status === "attested"`).
- Widening (both shelves 4 and 10), in this order, stopping at the first ring with
  content, max ring 1: the subject → its linked entities (family ↔ its peoples,
  patronyme → its peoples, language → its speaker peoples and family, country →
  its major peoples) → its country. The shelf then carries the note/sub naming
  the ring. Never widen to unrelated content, except block 4 for an unknown name:
  « Les plus récents de l'atlas — sans rapport avec « {q} » » (3 most recent).

### 5.10 `FeedNameQuiz` (block 11)

- `bg-afh-surface border border-[var(--accent)] rounded-afh-lg p-afh-2xl gap-afh-lg`;
  eyebrow « Joue avec ce nom »; stem `font-display font-bold text-xl`; options:
  stacked full-width `<button>`s, `text-sm font-bold text-left bg-afh-surface
border border-afh-border rounded-afh-lg py-afh-lg px-afh-lg min-h-11`; footer
  `text-xs soft` « Une question tirée de cette page » + « Toutes les questions → »
  (`/fr/jeux/quiz` with `pays=`/`famille=` when the subject maps to a scope).
- Behaviour: reuse `QuizQuestionCard` / `QuizAnswerReveal`
  (`src/components/quiz/`) in their single-question mode; the reveal keeps the
  games charter §7 (right/wrong, verbatim, source + tier, « A way in » link). The
  tile is **lazy**: dynamic import when it enters the viewport; the quiz island
  budget (`scripts/quiz-bundle-size.ts`, 15 KB gzip) must stay green.
- Only questions from `quiz_questions` for a subject or ring-1 entity, not revoked,
  locale = page locale, with a non-`unverified` source (charter §7). Board
  questions are illustrative.

### 5.11 `FeedGeneratedImage` (block 12)

`<h2>` « Les images », sub « Des interprétations, jamais des portraits. »; card
250 / 300 wide `bg-afh-surface border rounded-afh-lg overflow-hidden`; **label
strip first** « Image générée — une interprétation » (`text-xs font-bold
text-[var(--accent-ink)] bg-[var(--accent-tint)]`, padding 9×12 → 8×12) — the reader is told
before seeing it (brand charter §9, DEC-053); image 4:5; caption `font-display
font-bold text-lg`; `<SourceStandingBadge>` + source short title; licence line
`text-xs soft` from `generatedImagesCopy`. Reuse `GeneratedImageBadge` if it
renders the same strip. Links to the Découvertes permalink.

### 5.12 `FeedProse` (blocks 7, 13, 14)

`<h2>` + one `bg-afh-surface border rounded-afh-lg p-afh-2xl` box, paragraphs
`text-sm leading-relaxed` spaced 12, optional badge + « Voir la source ». Copy is
translated from corpus fields, never pasted (charter §3: no scholarly word).

### 5.13 Disagreement and silence copy

When sources disagree (Lingala: date of the name, speaker counts), the page says
so in the sub of block 5 and in block 13, **never picks one** (CLAUDE.md,
« Assertion tracks certainty »). Silences come from the corpus's declared gaps
(`gaps[]`, missing attestation dates, missing origin), one dashed card each.

### 5.14 `FeedFiches` (block 15)

`<h2>` « Les fiches », sub « Pour aller au fond : chaque fiche, avec toutes ses
sources. »; grid 2 columns mobile (1 if a single fiche), 4 on desktop main column
(fewer if fewer); card `bg-afh-surface border rounded-afh-lg py-afh-lg px-afh-2xl`:
kind eyebrow `text-afh-eyebrow tracking-[0.14em] text-afh-text-soft`, name
`font-display font-bold text-lg`, meta `text-xs soft`. Links via `ficheHrefFor`
(`SearchResultCard.tsx:59`). At least one fiche whenever a subject exists; all
remaining results follow as today's `SearchResultCard` list under « Fiches ».

### 5.15 `FeedOwedBand` (blocks 16–19)

Silences: `<h2>` + sub « Un silence déclaré, pas un oubli. », dashed cards
`rounded-afh-lg p-afh-2xl`, title `text-sm font-bold soft`, text
`text-afh-caption soft`. Conviction: `bg-afh-bg-warm rounded-afh-lg p-afh-2xl`,
title `text-sm min-[1200px]:text-base font-bold`, body `text-afh-caption
min-[1200px]:text-sm`. Invitation: `bg-afh-surface border border-[var(--accent)]
rounded-afh-lg p-afh-2xl`, title `text-base font-bold`, body `text-sm`, button
`bg-[var(--accent-tint)] border border-[var(--accent)] rounded-afh-lg min-h-11 px-afh-2xl
text-sm font-bold` (a `variant="accent"` button if it renders identically). **The
button opens `FlagTarget`** (`src/components/flags/FlagTarget.tsx`) with
`target = { type: <subject type>, id, name, fieldPath: "appellations" }` and
`flag_kind` `correction-proposal` — today it is a plain link to `/contact`, which
loses the subject. Unknown name: button « Nous parler de ce nom », target
`{ type: "name-proposal", id: q }`, kind `contribution`. Further (typo/unknown):
pill links « Parcourir les peuples », « Les familles de langues ».

## 6. Data: where each tile comes from

### 6.1 Name answer (blocks 2, 3, 5, 7, 13, 16)

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
  (`docs/tasks/discoveries-social-inventory.md`) get a manifest record each, with
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

- Tests first (`colorTokens.test.ts`): `--afh-media-badge-bg/ink` exist and
  contrast ≥ 4.5:1; under `.dark`, `--accent-tint` inside `.afh-accent-ocre` and
  `.afh-accent-terre` resolves to a dark tint (target `#33281a` / `#2f201a`, the
  boards' values) with ink ≥ 4.5:1 on it. If the test shows today's tint is
  already dark, keep it and close D8.
- Code: the tokens in `src/styles/tokens/color.css`, nothing else.

### Phase 8 — Page composition and states

- Tests first (`RecherchePageContent.test.tsx`, happy-dom, mocked fetch with the
  Phase 5 fixtures): for each case, the ordered list of rendered block ids equals
  §9's expectation; lens filtering (§5.1); loading renders the skeleton of §8.1;
  `failed` renders the outage message with no companion shelves; relation mode
  (`?country=`) keeps today's behaviour without the feed.
- Code: `RecherchePageContent` renders `<SearchFeed>` when a query is committed;
  `PageLayout` gets `hideHeader` in that state (the boards have no page hero and
  no trail); the form stays at the top. Remove `SourcedHighlightBlock` from the
  page (the anecdote shelf replaces it). Keep `NoResultsLeads` data but render it
  through blocks 2–3 typo variant.

#### 8.1 Loading and failure

Loading: skeletons in the shape of the first screen — eyebrow bar, name bar,
verdict box, four chips, three poster boxes (`bg-afh-bg-warm rounded-afh-lg`,
`motion-safe:animate-pulse`); no spinner alone. Failure: the name stays in the
field, « La recherche ne répond pas pour l'instant. », a « Réessayer » button;
**no** substitute shelf.

### Phase 9 — Parity suite

See §10. Tests only; fix components until green.

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
widened with its note.

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
grammar test: between `</helmet>` and `</x-dc>`, tags stripped, entities
decoded), after normalising `'`/`’`, `&nbsp;`, whitespace. Assert: the ordered
block headings are identical; every sentence of the board's verdict, forms,
silences, conviction and invitation appears verbatim. Illustrative content
(short titles, durations, lens counts, quiz stems) is compared **by presence and
count**, not text. Mobile board for < 1200, desktop board for the desktop layout
(render at both with `matchMedia` mocked).

### 10.2 Tokens

Existing contract tests (§0) plus: no file under `src/components/search/feed/`
contains `#`-hex, `rgb(`, `text-[`, `rounded-[`, `--afh-cat-`, `--afh-night-`.

### 10.3 Geometry — `e2e/search-feed.spec.ts` (Playwright)

Route the page to the fixtures (`page.route` on `/api/v2/search*` and
`/api/v2/search/companions*`), for each case at 430×800 and 1280×800, with and
without `.dark` on `<html>`:

- the first poster's box is fully inside the viewport (top ≥ 0, bottom ≤ 800);
- `document.documentElement.scrollWidth === innerWidth` (no horizontal scroll);
- blocks appear in §9 order (`data-feed-block="<id>"` on each block root);
- desktop: main and rail columns exist when both are non-empty; thin cases are
  ≤ 880 px wide;
- poster size 130×231 / 160×284 (±1 px); lens and option targets ≥ 44 px;
- a screenshot per case/width/theme is attached to the report for the
  art-director review (`/afrik-art-director`), which is the last gate.

Playwright is outside `make check`; run `npm run e2e -- search-feed` and attach
the report to the PR.

### 10.4 Accessibility

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
npm run e2e -- search-feed      # Phase 9 onward
```

## 12. Open decisions (defaults apply until the operator says otherwise)

| ID  | Question                                                | Default in this plan                                |
| --- | ------------------------------------------------------- | --------------------------------------------------- |
| D-A | Video playback: self-hosted, YouTube embed, or link out | Link out (« Regarder sur YouTube »), no iframe      |
| D-B | Pixel identity with the boards (§3.5)                   | Token parity; regenerate boards only if asked       |
| D-C | Terre verdict box as a second accent                    | Kept, recorded as a charter exception (Phase 0)     |
| D-D | Who writes per-form origins where the corpus has none   | Nobody in this plan: entity-level lede + bare cards |
| D-E | Relation labels vocabulary (§5.6)                       | As listed; new relations need a charter line        |

## 13. Out of scope

Hashtag search in Découvertes (its data — `subjects` — is laid here); producing
the shorts; English publication; the atlas fiches themselves; any change to the
home page.
