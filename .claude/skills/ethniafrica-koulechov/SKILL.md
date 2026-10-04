---
name: ethniafrica-koulechov
description: Build an EthniAfrica « Swipe » — a vertical montage under three minutes of found clips (archive first) on one theme, with no narration, chained by a vertical scroll, where the choice and order of the clips set competing versions of a subject side by side (the Kuleshov effect, as in Canal+'s Le Zapping). Two modes. Collect files a clip the operator found into the theme's stash and says whether the stash is ready. Produce checks where the sources lean, proposes a running order (conducteur) for the operator to approve, then renders a proof and the final package (reel, cover, one description per network). Use for « range ce clip pour un swipe », « où en est mon swipe X », « fais un swipe sur X », « le swipe », « koulechov », or /ethniafrica-koulechov. Social-only and experimental, outside the idee → structure → produire chain; it publishes nothing, schedules nothing and clears no rights.
---

# Koulechov — found clips in, a Swipe out

**Le Swipe** is the name the public sees. **Koulechov** is the process this skill
runs. The format's rules are written once, in
`docs/design/gabarits-social/LE-SWIPE.md`. **Read it before anything else.** This
file holds the procedure, not a second copy of the rules.

The point of the format in one sentence: on a given subject, everyone holds one
version they have heard and has rarely heard anyone else tell a different one. A
Swipe sets those versions side by side and leans only where the sources lean.

## Who decides what

| The operator                                                 | This skill                                          |
| ------------------------------------------------------------ | --------------------------------------------------- |
| finds the videos                                             | files them, transcribes them, measures the stash    |
| has the final say on the thread and the order                | checks the sources, proposes a running order        |
| approves the running order — **nothing renders before that** | renders the proof, then the final package           |
| supplies translations from African languages                 | never ships a machine translation of those passages |
| publishes, then records the figures                          | publishes nothing, schedules nothing                |

## Mode 1: Collect

Most of the time the operator is building up material, not producing. Each
clip they bring goes into the **stash** for its theme:
`$ETHNIAFRICA_SOCIAL_PROJECTS/swipe-<theme>/stash.md`. When that variable is
unset, use the checkout's gitignored `output/social/` fallback, and **say that
those files will be lost** along with the worktree. Never write into a tracked
directory. The entry shape is in
`.claude/skills/ethniafrica-koulechov/references/stash.md`.

For each clip:

1. **Record** the file or link, title · channel · year, its language, and the
   moments if the operator gave them (in and out points, as « 1:12–1:34 »).
2. **Name the version it carries**, in one line, in the speaker's terms
   (« le lingala a été inventé par les Belges »). Never in the project's terms.
3. **Flag what is missing:** a year nobody knows, a passage in Lingala, Wolof,
   Dioula or Bambara with no translation yet, a clip whose speaker cannot be
   identified.

On « où en est mon swipe X », report on the stash with these four figures and
make no promise beyond them:

- **versions covered**, and the obvious ones still missing;
- **a clip that can lean**: is there a clip carrying the version the sources
  support, or the one saying it is not settled? Without one, the Swipe has no
  ending;
- **usable duration**, estimated on 15–25 s per kept moment, against the
  target of 7 to 10 clips under 3:00;
- **open blockers**: translations, unknown years, identified moments.

**Ready** means at least three distinct versions, one clip that can lean, and
enough material for about two minutes. Say « ready » or « not yet, missing:… »,
never something in between.

## Mode 2: Produce

**0. Restate.** The theme, the versions, the operator's thread if they have one,
and which clips are in play. Wait if anything is ambiguous.

**1. Check where the sources lean.** Read the corpus fiche for the subject (a
language under `dataset/source/afrik/langues/`, a people, a country), then the
Wikipedia article and what it cites. Tell the operator in plain French: « les
sources penchent vers… », or « rien n'est tranché : ces explications circulent,
attribuées à… ». That decides the last clip. A lean resting on intuition alone
is refused (rule 4 of the spec).

**2. Transcribe.** Word-level timestamps, locally, with the transcription script
from the clip-reel skill:
`.claude/skills/ethniafrica-clip-reel/scripts/transcribe.py` (setup in
`.claude/skills/ethniafrica-clip-reel/SKILL.md`, step 1). Its two measured traps
apply here too: a source that repeats itself, and crosstalk at a cut.

**3. Propose the running order.** Use the shape in
`.claude/skills/ethniafrica-koulechov/references/conducteur.md`: three lines on
the arc, then one row per clip with its role (opens, contradicts, raises the
stakes, makes laugh, leans, closes). Cut each clip on one complete thought: a gag
on its punchline, a serious passage at the end of a sentence. Choose the last
clip first and build backwards from it.

**Stop here.** Show the running order and wait for an explicit approval. The
operator reorders, removes, adds, and supplies the translations.

**4. Render a proof.** For the frame, captions, cover and descriptions, use the
clip-reel engine (`social/harness/ethni_clip_reel.py`, tests in
`social/harness/test_ethni_clip_reel.py`).

**Known gap, measured on 2026-10-05:** that engine cuts several ranges from
**one** source, but does not take several sources, a credit line per clip, a
context marker, or a push transition. The first real Swipe adds them **in that
engine, test first**. Never in a one-off script. Propose the plan extension to
the operator before writing it. Until it exists, say so instead of assembling by
hand.

Then check it the way a reader would:

- re-transcribe the rendered audio: no clipped first words, no bleed from the
  next clip;
- pull a frame at every cut and look: the credit line belongs to the clip
  under it, the scroll goes upward, the source's own logos are still there;
- check the total is under 3:00.

**5. Deliver.** The final reel and the cover, with the theme word on the cover
and never in the video. Then one description per network, from
`.claude/skills/ethniafrica-clip-reel/references/network-captions.md`: the theme,
the credited sources, and a question that sends the debate back to the comments
(« Et toi, quelle version on t'a racontée ? »). Close with a report that lists:

- the files and where they are;
- what was cut and why;
- every claim a clip makes that the sources do not support;
- the rights reminder: a credit line is not a licence.

**6. After publication.** Remind the operator to record the figures for the
one-month review: views, share from non-followers, average watch time, saves,
shares, profile visits, new followers, and whether the comments set versions
against each other.

## What this skill refuses

- rendering before the running order is approved;
- cutting a clip so that its speaker appears to say the opposite of what they said;
- leaning where the sources do not lean;
- narration, added music, or a card that explains the thread;
- a machine translation of a passage in an African language;
- a total over 3:00;
- writing into the repository, publishing, scheduling, or clearing rights.
