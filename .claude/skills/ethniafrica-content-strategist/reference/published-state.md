# What exists, what shipped, and what it did

The state of the publication record, carried here so the skill knows rather than
points. **Rewritten 2026-09-14**, from `bilan-sujets.mjs` and the same-day
audience audit. Refresh the numbers each session; the structure is what does
not change.

## Where the truth lives

It is split, and the split is the point.

**The engine is here**, versioned: `social/harness/` renders — `ethni_montage.py`
for video, `ethni_carrousel2.py` for carousels, both composed by
`ethni_compose.py` with `ethni_brand.py` for the mark — and
`docs/design/gabarits-social/` is the spec they read.

**The productions are not**, and never will be. They live in the production
library, outside version control, at whatever path
`ETHNIAFRICA_SOCIAL_PROJECTS` points to on this machine. So do the publication
index, the dated editorial guides and the pipeline state. Read it with
`node social/tools/etat-pipeline/bilan-sujets.mjs`.

## What has shipped

**58 subjects, 61 posts.** The twenty-two approved-and-waiting pieces this file
described on 2026-09-09 did not trickle out — they, and more, shipped in two
concentrated waves that abandoned the launch plan's phasing outright:

- **2026-09-05 → 09-09**: nine solo videos, TikTok + Instagram only (the launch
  plan's Phase 1 channel set) — Afrique, Nigeria (Flora Shaw), Lingala, Bantou
  V5, the true-size-of-Africa correction, Cameroun, "Bantou n'est pas un nom",
  Ghana, Sénégal.
- **2026-09-11**: nine carousels — alliances, métiers, Bénin, commerce,
  diaspora, exonymes, the city-names série, Peul, Bantou-cent-soixante-dix —
  published simultaneously on **all five networks** (YouTube, TikTok,
  Instagram, Facebook, LinkedIn). This is Phase 3 opening four Sundays early;
  it was a deliberate operator call, not a plan violation left unnoticed, but
  it means the Phase 1 exit gate (3–4 Oct, TikTok/Reels/Shorts retention only)
  no longer matches what actually happened before it.
- **2026-09-12**: nine more pieces (Krou, Keïta-Coulibaly, Mami Wata, Akan,
  Amazigh, Dioula, Vodun, Zombie, Nzebi, Sawa — videos and carousels mixed),
  same five-network simultaneous release.
- **2026-09-13**: one video, the corrections call ("Vous connaissez votre
  peuple mieux que nous"), TikTok + Instagram + Facebook.

**Nothing is queued and validated for the next slot.** The library holds three
drafts flagged as near-duplicates of already-published subjects and blocked
by the pipeline tool until a new angle is chosen: `senegal-correction` (video,
duplicates the 09-09 Sénégal cut), `peul-douze-pays` (carousel, duplicates the
09-11 Peul carousel), `bantou-les-gens` (video, duplicates the 09-11 Bantou
carousel — never published as video). None should ship as-is.

## The measured lesson, still holding

- **No verdict on a short before 72 hours.** Confirmed again this window: the
  09-12 batch's YouTube retention (53–67 %) reads worse than the 09-05–09-09
  batch (63–97 %) at first glance, but the newer batch has had far less time to
  find its audience curve. Compare again no earlier than 09-15.
- **A measure that is unavailable is empty, never zero.** Still the rule; the
  2026-09-14 audit follows it explicitly (TikTok's Dioula row shows two
  contradictory view counts and neither is asserted).
- **Retention at three seconds is now partly collected.** YouTube's per-Short
  "average percentage viewed" is read in the audit's per-post table. TikTok
  and Instagram per-post retention are still not.

## The link problem — mostly still open, one exception found

`social/tools/link-builder/`'s UTM scheme is in every caption, and it still
produced almost nothing: the only scheme-tagged visit ever recorded is
`traore-diop`, one visitor, from 2026-09-09. **No post published on 09-11,
09-12 or 09-13 produced a tagged visit**, despite all of them carrying scheme
links.

**One link works, and it isn't a scheme link.** Instagram's bio link sent 28
visitors on 09-13 alone, tagged automatically by Instagram's own
`utm_source=ig&utm_content=link_in_bio` — attributable to the profile, not to
any specific post. This is the first evidence in the whole record that any
outbound link converts at all. See `reference/platforms.md` for what this
changes.

## The caption register

Unchanged and binding: `description-template-2026-09-09.md` — the hook, the
proof, the exit; the first hundred characters complete before the cut; the
claim identical on all five networks and the form rewritten for each. Plain
language everywhere except LinkedIn. TikTok's caption form changed on
2026-09-13 (operator decision, unmeasured): short "tu" sentences, source line
kept, one line asking for a comment, a pinned comment carrying a question —
replacing the longer description. The 3–4 Oct review keeps whichever form
measures better once there is data.

The recurring move — name the colonial-era fact, then return the autonym and
the people's own history — is confirmed as the brand by the one post with
real public argument: the Dioula carousel's TikTok comments dispute the
central claim and offer competing etymologies. That is engagement with the
method, not just the subject, and per the 2026-09-14 audit it needs a
curator check before the claim is reused.

## Decisions that were open, now resolved by what shipped

Both open items from the 2026-09-09 record are settled by publication: the
Nigeria cut question resolved to Flora Shaw (09-05); the Bénin and Sénégal
country-fiche pieces both shipped (Bénin carousel 09-11, Sénégal video 09-09).
The Bantou-excerpt clearance question is not directly verifiable from the
library index, but multiple Bantou pieces have since shipped without an
open flag, so treat it as cleared until told otherwise.

## Decisions now open

1. **The three flagged duplicate drafts** (above) — kill each, or give it a
   genuinely different angle before it can leave the queue.
2. **Whether LinkedIn keeps receiving the video cut.** The 09-12 batch's five
   LinkedIn video posts show 0–2 impressions and 0 clicks each, read directly
   from the page's per-post analytics on 2026-09-14 — the doctrine that video
   fails on LinkedIn holds even after the account grew to 34 followers and
   even inside the all-network blast. See `platforms.md`.
3. **Whether to keep publishing to all five networks simultaneously**, or
   return to the plan's phased cadence — the operator has already chosen
   simultaneous release twice; this file records it as the current default,
   not a question, unless the operator says otherwise.
