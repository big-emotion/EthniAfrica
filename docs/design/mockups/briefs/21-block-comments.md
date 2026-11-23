# Brief 21 — Comments per passage, the block footer

Status: **approved by the operator on 2026-11-18** for ETNI-2203 (REQ-212). The
boards below are the reference for the result-page comments story of ETNI-2197.

## Decision

Readers can comment on, correct or add to each passage of the search result page.
Three placements of the button that opens the comments were drawn on the same
content, with the site's styles, at 430, 768 and 1440 px:

- **A, the margin badge**: « 2 commentaires » at the top right of a passage.
- **B, the block footer**: a line « 2 commentaires · Commenter » closes each passage.
- **C, the discussion mode**: one « Voir les discussions (5) » toggle near the top of
  the page, off by default.

The operator chose **B** on 2026-11-18. Why B wins:

- « Commenter » is always written, even when nobody has commented yet. That is
  where the invitation matters most, and only B shows it on every passage.
- It comes at the end of the passage, when the reader has just read it and knows
  whether they have something to add. A puts it before the reading; C hides it.
- Its cost is known and bounded: one 44 px line per passage, about 220 px more on
  the Peul page at 430 px. Counts stay plain, with no badge or highlighted number.

## Approval record

Decided by the operator on 2026-11-18, with the choice of B:

1. **One form for every contribution (merge).** The page-end « Signaler une erreur »
   and « Proposer une source » open the same comment form as « Commenter ». They are
   buttons now, drawn exactly as the two links were. The comment form already asks
   for a correction and a source link, so a second form would only split the queue.
2. **The participation sentence comes after the first answer, never before it.** The
   result page answers the searched name first
   ([search-result charter](../../search-result-charter.md) §3 bis). The
   sentence sits after the answer tile and its « Voir aussi », before the names.
3. **Text-only buttons are allowed explicitly.** The comment count, « Répondre »,
   « Signaler », « Fermer » and « Voir la discussion » are buttons written as their
   label alone, as « Voir aussi » already is. The rule is added to
   [`actions-charter.md`](../../actions-charter.md) §4.
4. **No new glyph.** Every control is written. The sheet closes with « Fermer », not
   a cross.

The shared rules drawn with all three proposals stay:

- The thread opens as a sheet from the bottom on phone and tablet, and as a right
  panel from 1024 px, like the sources sheet (`SourceChainSheet`).
- The « Corrigé le … » banner has sharp corners (`--afh-radius-0`), like the source
  apparatus: it states what changed on the page. The moderation's verdict
  (« Pris en compte ») keeps the rounded pill of a value among several.
- After sending, the sheet says what to do: open the e-mail, click the link, then
  press « Publier mon commentaire ». The link does not publish on its own, so that
  software opening the links of an e-mail cannot publish in the reader's place.

## Boards

Group 7 of the canvas, « Commentaires par passage (brief 21) », right of group 6.

| Board | What it shows |
| --- | --- |
| `search-state-comments-peul-430`, `-768`, `-1440` | `search-peul` with a footer on five passages: the answer (2), the names (0), the timeline (2), « Leur nom » (0), the sources (1); the participation sentence after « Voir aussi »; the page-end pair as buttons |
| `search-state-comments-panel-1440` | The first screen at 1440 px with the thread open as a right panel: the quoted passage, two comments, a moderation reply, the form |
| `search-state-comments-unknown-430`, `-768`, `-1440` | `search-unknown` with « Aucun commentaire · Commenter » closing the verdict |
| `comments-sheet-430` | The thread open from the bottom at 430 px, with the form |
| `comments-empty-430` | An empty thread (« Leur nom · Fulɓe ») and the form |
| `comments-sent-430` | The sheet after sending: check your mailbox |
| `comments-corrected-430` | The timeline passage with its « Corrigé le 12 novembre 2026 grâce à une contribution » banner |
| `account-430` | The account page `/fr/compte`: the reader's comments with their state (waiting for confirmation, published, taken into account, not kept) |

The `-430` boards of the shared states are the only width drawn: at 768 px the
sheet is the same, and from 1024 px it is the panel of
`search-state-comments-panel-1440`.

The comment texts, readers' names, e-mail addresses, counts and dates are
examples. The passages of the Peul and unknown-name pages are those of the
recorded `search-peul` and `search-unknown` boards.

## Choices made while recording

Where the recorded boards differ from proposal B as published on 2026-11-18, the
reason is a charter or a fact:

- **The participation sentence.** The proposal read « Ces informations viennent de
  travaux universitaires et de connaissances locales ». The Peul page records no
  oral account (its closing block says so), so the board says « Ces informations
  viennent des sources citées sur cette page. » The rest is unchanged.
- **« Fermer » and « Voir la discussion » are text-only buttons**, under arbitration 3;
  the proposal drew « Fermer » bordered and « Voir la discussion » underlined, which
  read as an inline link.
- **The corrected banner is on its own board.** The proposal also drew it on the
  Peul page; the page boards show the default state, so they do not claim a
  correction that did not happen.
- **The account page** says « Vous utilisez l'adresse … » rather than « Vous êtes
  connecté avec … », which is shorter and does not assume the reader's gender.

## Open point

On the unknown-name page, the verdict keeps its « Proposer une source » (briefs 12
and 17) and gains the footer « Commenter ». With arbitration 1 both open the same
form. The proposal noted that the form may later replace « Proposer une source »
there; that is not decided, and the boards keep both.

## Out of scope

Implementation (ETNI-2197), fiche pages, the moderation queue, the e-mail itself.
