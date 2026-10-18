# Brief 15 — The result page, each account told once

Read [`README.md`](README.md), [`01-result-page-timeline.md`](01-result-page-timeline.md),
[`11-result-page-self-name-handoff.md`](11-result-page-self-name-handoff.md) and
[`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18. Status: **scope approved by the operator on 2026-10-18;
boards not drawn yet.** Prompt: [`claude-design-prompt-15.md`](claude-design-prompt-15.md).

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
