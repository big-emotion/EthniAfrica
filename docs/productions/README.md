# The production history and its cadence

This directory is the versioned answer to "where was this subject published,
in which format" — one JSON file per subject, at
`docs/productions/<typologie>/<NNN>-<slug>.json`. The schema, the gate that
enforces it (`scripts/ci/checkProductionLedger.ts`), and the reasoning behind
every decision below are in `docs/plans/production-history-plan.md`; this file
holds only what a skill or a human needs at hand while filing an entry.

**This directory holds no rendering doctrine.** How a carousel or a reel is
composed is `docs/design/gabarits-social/GABARITS-SOCIAL.md`'s job; this file
never restates it, only points at it where the two touch.

## The fixed format

- **Three publication days**: Monday, Wednesday, Friday.
- **Five subjects per publication day**, at the cadence stated below — not
  from day one.
- **One question, five typologies**: every subject answers « D'où vient le nom
  X ? », where X is a **peuple**, a **pays**, un **patronyme**, un **lieu**, or
  une **langue**.
- **Per subject: one video and one carousel.** The video walks the
  appellations — exonyms and endonyms — back up their history. The carousel
  opens on a myth to take apart, ten images maximum.
- **Numbered by episode, per typologie** — the 7th `langue` episode, the 3rd
  `pays` episode — never a single counter shared across typologies, so a
  reader can follow one series without the others' numbers interrupting it.
- **Every piece presents the project**, invites contribution, and explains why
  appellations are hard and why the word « ethnie » does not fit.
- **Under three minutes**, and each platform's own format constraints
  respected — see GABARITS §1 bis for exactly which network receives which
  format; this file does not repeat that table.
- **Current events are a reason to schedule a subject** ahead of the queue —
  the operator's own example is Goma.

## The network × format mapping

**Already fixed in GABARITS §1 bis, dated 2026-09-16 — not repeated or
re-derived here.** In short: the video/reel goes to Instagram, Facebook,
YouTube and X; the carousel goes to TikTok and Instagram only. LinkedIn and X
also carry a text-with-link form. `scripts/lib/socialFormatMatrix.ts` is the
one machine-readable copy of that table, used by the gate — if §1 bis is
revised, that file is revised in the same change, and this paragraph is not a
second copy to keep in sync.

## Typologies are not corpus kinds

A `langue`, `peuple`, `pays` or `patronyme` subject's `subjects[]` entry uses
the matching corpus kind (`language`, `people`, `country`, `patronyme`). A
**`lieu`** subject has no table of its own in the AFRIK corpus — a toponym is
always filed under whichever entity actually names it, almost always
`country` and sometimes `people`. `subjects[].kind` is therefore never derived
from `typologie`; the gate checks the id against the real corpus, not against
the typologie.

## The cadence ramp

Ten renders a publication day (five subjects × two formats), thirty a week, is
the target — not the starting point. The private production library holds 83
posts in total as of this ledger's creation; jumping straight to the target
cadence would outrun both editorial research and rendering capacity before
either has been measured at that rate.

| Stage         | Cadence                                 | Advance to the next stage when                                                                     |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 0 — bootstrap | 1 subject, filed by hand, no fixed day  | The schema, the gate and the site projection have proven themselves end to end on one real subject |
| 1             | Monday only, 2 subjects/day             | Three publication days run with zero gate failures                                                 |
| 2             | Monday + Wednesday, 3 subjects/day      | Stage 1's rate is sustained for two consecutive weeks with no backlog of unfiled publication URLs  |
| 3             | Monday/Wednesday/Friday, 5 subjects/day | This is the target cadence — stays here                                                            |

The **current stage is 0.** Advancing a stage is an
`/ethniafrica-content-strategist` decision, recorded in that skill's own dated
report, and is a one-line edit to this table — never a code change.

## Filing an entry

1. Resolve the corpus id(s) the subject is about (`subjects[]`) and the site
   path they resolve to (`sitePath`).
2. Pick the next free `episode` number for the subject's `typologie` — read
   the highest-numbered file already in that typologie's subdirectory.
3. Pick the `narrativePattern` from GABARITS §7 ter's table. If no row
   matches (a genuine gap exists today for a plain patronyme episode — see
   the plan's §5), raise it with the operator or `/ethniafrica-onomastique`
   before filing; a subject with no matching row has no closing, per §7 ter's
   own rule.
4. Leave `publications[]` empty until something is actually posted; add one
   row per network × format as it goes out, `url` included once known —
   never omitted for being unknown yet.
5. Run `npm run check:production-ledger` before committing.
