# Brief 15 — The result page, each account told once

Read [`README.md`](README.md), [`01-result-page-timeline.md`](01-result-page-timeline.md),
[`11-result-page-self-name-handoff.md`](11-result-page-self-name-handoff.md) and
[`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18. Status: **scope approved by the operator on 2026-10-18;
boards approved on 2026-10-18 and recorded (see « Approved boards »).** Prompt: [`claude-design-prompt-15.md`](claude-design-prompt-15.md).

**Pass 6.** It changes the approved result boards, so it starts once passes 4
and 5 are approved and recorded.

## Decisions the operator took on 2026-10-18

1. **The sources block lists the sources, not the accounts.** Under « Les
   sources du nom … » (renamed on 2026-10-17, PR #1830), each line is one
   source: its type, its title, its author or carrier, and a link to the
   account it backs in the timeline. The accounts are no longer written a
   second time.
2. **Three accounts open in the timeline, the rest folded.** The three most
   recent accounts are open, and the origin tile (« Origine la plus ancienne
   connue du nom … ») is always open even when it is not among them. The other
   accounts sit behind « Voir les N autres récits », using the fold of
   brief 10.

## Why

Measured on `/fr/atlas/recherche/traore` (same page as `?q=traore`) at 430 px
on 2026-10-17:

| Block | Height |
| --- | --- |
| Field and lens bar | 220 px |
| Summary, name chips, period controls | 540 px |
| Timeline, 11 accounts open | 3 440 px |
| Sources block, the same 11 accounts written again | 1 450 px |
| « Ce que nous ne savons pas encore » | 730 px |
| « Poursuivre avec un autre nom » | 380 px |
| Footer | 1 300 px |
| **Total** | **8 059 px, nine screens** |

The first account starts 760 px down. Audit of 2026-10-13: the result page's
bounce rose from 8 % to 34 %; it is the entry page of 34 visitors who come from
Google and ChatGPT, through this address. On PAT_TRAORE readers scroll 38 % of
the page: most never reach the sources block nor the closing band.

## Boards to change

`search-peul`, `search-bassa`, `search-congo` at -430, -768 and -1440, and
the `search-state-*` boards that draw the timeline or the sources block.
`Main` for the new sources line.

**New state boards:** `search-state-long-traore-430`, `-768`, `-1440`,
titled « État : nom à onze récits (« traore ») », drawn from the live page
<https://ethniafrica.com/fr/atlas/recherche/traore>: it is the long case the
three approved boards do not show. Copy its text word for word.

## What changes

1. **The sources block.** Keep the title and the sentence of PR #1830, and the
   strip of source types. Replace the folded families of accounts with one
   list of sources, oral first, then the order of the seven source families.
   Each line: the type mark, the title (a link when the source has one), the
   author or the carrier and place for an oral account, then « Voir le récit »,
   which scrolls to the tile in the timeline and opens it if folded. A source
   that backs several accounts shows « Voir les 2 récits ».
2. **The timeline fold.** Three accounts open plus the origin tile, the rest
   behind « Voir les N autres récits ». On the Peul board (four accounts) one
   account folds; on the Traoré state board eight fold.
3. **One row of controls above the timeline.** « Du plus récent au plus
   ancien » and « Ailleurs à la même époque » (renamed in PR #1830) join the
   period chips in one row that scrolls sideways at 430, instead of three rows.
4. **The lens bar goes under the verdict**, as one line « Voir aussi :
   Récits 4 · Jeux 1 », so that the first screen answers before it offers
   other lenses. « Histoire du nom » stays the default; the full lens bar
   returns when the reader taps « Voir aussi ».

Measure each board at 430 px before and after and report the heights block by
block. The review estimated about 4 400 px for Traoré after the change, about
five screens; the boards decide.

## Not to touch

The verdict and the hand-off to the self-name (brief 11), the closing band and
« Poursuivre avec un autre nom » (brief 1), the unknown-name page (brief 12),
every fiche board. The fiche variant of the sources block (« Les sources des
noms de ce peuple ») keeps its accounts in this pass: a fiche has no timeline
to link back to. Report whether the same change would suit it.

## Acceptance (for the implementation, after approval)

- Given a name with eleven accounts, when the result page loads at 430 px,
  then three accounts and the origin tile are open and the others are folded.
- Given the sources block, when the reader taps « Voir le récit », then the
  page scrolls to that account in the timeline and opens it.
- Given any account, when the page renders, then its text appears once on the
  page.
- Given the sources block, when it renders, then each source shows its type and
  never a tier.

## Approved boards (2026-10-18)

Recorded in `docs/design/mockups/site/`, group « 1 · Search » of
`canvas.json`. The boards start from the repository copies, with the labels
of PR #1830. The operator approved them on 2026-10-18 with three decisions:

1. A tile that gathers competing hypotheses always stays open, like the
   origin tile, and never folds with the other accounts. Doctrine §1.1 puts
   competing origins side by side, and the opening sentence announces them.
   On `search-state-peul-fulbe-open` the five explanations of the name Fulɓe
   stay open; only the 1966 account folds.
2. The fiche variant of the sources block (« Les sources des noms de ce
   peuple ») does not follow in this pass. On a fiche the block is almost
   always the only place the accounts are written: 91 accounts on
   `people-fula`, none written elsewhere on the fiche. Only `language-lingala`
   (4 of 19) and `country-civ` (3 of 30) repeat an account above the block.
3. Traoré at 5,796 px instead of the estimated 4,400, and Congo slightly
   longer than before, are accepted: no account is written twice anymore.

The boards:

- `search-peul`, `search-bassa`, `search-congo`, `search-state-thin`,
  `search-state-competing`, `search-state-nodate` and
  `search-state-peul-fulbe-open`, at 430, 768 and 1440:
  - the lens bar leaves the top of the page; one line « Voir aussi : … »
    sits under the verdict, and tapping it shows the full bar
    (`.ea-seealso`);
  - « Du plus récent au plus ancien », « Ailleurs à la même époque » and the
    period chips share one row that scrolls sideways (`.ea-tl-controls`);
  - the timeline keeps open the three most recent accounts, the tile
    « Origine la plus ancienne connue du nom … » and any tile of competing
    hypotheses; the other accounts sit behind « + Voir les N autres récits »,
    the fold of brief 10 (`.ea-tl-fold`);
  - the sources block keeps its title, its sentence and its strip of types,
    and lists the sources, one line each: the type mark, the title (a link
    when the source has one), the author, or the carrier and place for an
    oral account, then « Voir le récit » or « Voir les N récits », which
    scrolls to the account and opens it if folded (`.ea-src*`).
- `search-state-long-traore` at 430, 768 and 1440 (new), « État : nom à onze
  récits (« traore ») », drawn from the live page
  <https://ethniafrica.com/fr/atlas/recherche/traore> on 2026-10-18, text
  word for word. The live page still showed the labels from before PR #1830;
  the board takes the repository labels. Like the live page, it has no lead
  line, no hand-off and no video, and the fiche link reads « Traore ». Three
  accounts and the origin tile are open, seven fold: 11 accounts, minus the
  three most recent, minus the origin.
- `Main`: a new section « Composants · Voir aussi, récits repliés dans la
  frise (brief 15) »; the one row of controls in « Composants · recherche,
  lentilles, noms »; in « Composants · les sources du nom, bande de clôture,
  pas suivant », the result variant drawn as the list of sources, with an
  oral line and a line backing three accounts. The fiche variant is
  unchanged.
- `ea-live.css` gains the `.ea-seealso`, `.ea-tl-controls`, `.ea-tl-fold*`
  and `.ea-src*` selectors. New selectors only, tokens only.

Choices made while drawing, kept by the operator:

1. « Voir aussi » names every lens that has a count, in the order of the
   bar: Traoré shows « Récits 4 · Jeux 1 · Fiches 21 ». « Tout » has no
   count and returns only with the full bar. On a page with several
   subjects the line sits under the first verdict; the state boards, which
   have no lens bar, have no line.
2. The fold counts accounts, not tiles, and never splits a tile that joins
   several accounts or gathers hypotheses. When a tile that stays open
   separates two folded runs, each run has its own control; one account
   reads « + Voir l’autre récit ». The fold sits on the thread without a
   dot.
3. Within a family, sources follow the order of their first account in the
   timeline; « Voir les N récits » leads to the most recent of them. The
   precise type stays after the author (« Publication académique »), never a
   tier. The carrier and place replace the author only for an oral source
   that names a carrier: « Abba Karnga, Liberia » on `search-bassa`, in
   place of Heath Vogel. Community sources keep their author.
4. « Voir le récit » is a plain link in accent ink, not underlined, on a
   24 px line with a 44 px target (ten pixels of padding cancelled by the
   same negative margin, as on the sources button). From 768 px it moves to
   a right-hand column. The title link stays underlined, so the two links
   read apart.
5. The sentence « Voici leurs N récits, rangés par type de source » is kept,
   as the brief asked. The canvas also carries, in its own stylesheet only,
   the brief 11 class names that its boards not yet moved to the repository
   names still use; the repository stylesheet gains only the brief 15 block.

Measured at 430 px, before and after, with the board fonts installed
locally:

| Board | Before | After | What moved |
| --- | --- | --- | --- |
| `search-peul` | 6,094 | 5,835 | lens bar 68 → line 56; controls 134 → 56; sources 995 → 813; nothing folds |
| `search-bassa` | 10,319 | 9,847 | controls 134 → 56 three times; timelines 952 → 716, 1,223 → 962, 660; sources 812 → 600, 392 → 510, 274 → 626 |
| `search-congo` | 11,743 | 11,830 | controls 134 → 56 three times; timelines 2,282 → 1,168, 1,049 → 877, 1,007; sources 1,057 → 1,808, 380 → 577, 434 → 1,094 |
| `search-state-competing` | 5,801 | 5,100 | controls 82 → 46; sources 1,500 → 835 |
| `search-state-nodate` | 3,820 | 3,666 | controls 82 → 46; sources 437 → 319 |
| `search-state-thin` | 3,871 | 3,679 | controls 82 → 46; sources 467 → 311 |
| `search-state-peul-fulbe-open` | 6,137 | 5,886 | controls 134 → 56; timeline 2,236 → 2,063 |
| `search-state-long-traore` | 8,087 | 5,796 | controls 134 → 56; timeline 3,397 → 1,217; sources 1,190 → 1,158 |

The first account moves up 78 px on every board with a lens bar (Peul 1,026
→ 948, Traoré 792 → 714). Every timeline has one row of controls instead of
three. No account text remains in a sources block. Congo grows because the
eleven sources of the country now all show, where before only the first
family was open.
