---
name: ethniafrica-koulechov
description: Build an EthniAfrica « Swipe » — a vertical montage of about three minutes (the first ran 4:36) of found clips (archive first) on one theme, with no narration, chained by a vertical scroll, where the choice and order of the clips set competing versions of a subject side by side (the Kuleshov effect, as in Canal+'s Le Zapping). Two modes. Collect files a clip the operator found into the theme's stash and says whether the stash is ready. Produce checks where the sources lean, proposes a running order (conducteur) for the operator to approve, then renders a proof and the final package (reel, cover, one description per network). Use for « range ce clip pour un swipe », « où en est mon swipe X », « fais un swipe sur X », « le swipe », « koulechov », or /ethniafrica-koulechov. Social-only and experimental, outside the idee → structure → produire chain; it publishes nothing, schedules nothing and clears no rights.
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
   moments if the operator gave them (in and out points, as « 1:12–1:34 »). For a
   YouTube link, read its title and channel from
   `https://www.youtube.com/oembed?url=<link>&format=json` rather than asking: a
   credit is never invented. A film extract may name an author further up (the
   Chinese engineer's clip is a piece of _Empire of Dust_, by Bram Van Paesschen):
   credit the work, then say who posted the extract.
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
- **usable duration**, estimated on 15–25 s per kept moment, against a target of
  about three minutes. 3:00 is a target, not a lock: the first Swipe ran 4:36
  and the operator accepted it. Past 3:00 it only loses Instagram (see step 5);
- **the registers**: at least one funny clip and one serious one. A Swipe of
  versions alone, with nothing to laugh at, was judged flat on the first try;
- **open blockers**: translations still to come, and moments not yet chosen. A
  missing title, author or year is not a blocker: the credit shows whatever is
  known, and a handle alone is enough.

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

Four more, measured on the first Swipe (2026-10-05):

- **One model per language.** Transcribe each source in its own language
  (`--lang en --model small.en` for English). A short in English read as French
  gave nonsense. A passage in a language the model does not know gives text that
  looks fluent and is invented: the engineer's Mandarin came back as English
  filler. For those, read the film's own burned-in subtitles instead.
- **Cut in the silence, never on a guess.** Measure the level of the audio around
  each planned end (a 50 ms window is enough) and put the cut in the quiet stretch
  that follows the last word. Two passages were cut too early because their end was
  read from a sentence that had not finished. The word times give the start of the
  quiet, the level gives its end.
- **Read the end of the sentence twice.** When the last words are hard to make
  out, transcribe the tail again with the `medium` model and tell the operator what
  is uncertain, instead of writing the most plausible words as if they were heard.
- **A source may already carry subtitles.** INA shorts and the film extracts burn
  theirs into the picture, so ours double them. Say so to the operator, and do not
  pick a cover frame with one cut off at the edge.

**3. Propose the running order.** Use the shape in
`.claude/skills/ethniafrica-koulechov/references/conducteur.md`: three lines on
the arc, then one row per clip with its role (opens, contradicts, raises the
stakes, makes laugh, leans, closes). Cut each clip on one complete thought: a gag
on its punchline, a serious passage at the end of a sentence. Choose the last
clip first and build backwards from it.

Three checks before the order is shown, each one a defect of the first Swipe:

- **Every register is allowed, and the order must show them** (humour, absurd,
  dismay, sadness, gravity). Count them. If nothing makes the viewer laugh, say so
  and look in the stash for a clip that does, before presenting.
- **A neighbour can confirm a prejudice.** Two clips side by side say more than
  each alone (the whole point), so before placing one, ask what the clip just
  before it asserts about a people, and whether this one would seem to prove it.
  A sapeurs' clip right behind « les Congolais dépensent sans stress » would have
  confirmed the stereotype by itself; far from it, after the schoolchildren on
  make-up, it reads as a different question. Name the risk to the operator
  instead of deciding alone.
- **Give a passage the time its joke needs.** A gag cut on a line that is not the
  punchline reads as an error. If the operator says a passage « coupe trop tôt »,
  look for the line the speaker is building toward, then re-measure the silence.

**Stop here.** Show the running order and wait for an explicit approval. The
operator reorders, removes, adds, and supplies the translations.

**4. Render a proof.** Write the Swipe plan, one segment per passage, in the shape of
`.claude/skills/ethniafrica-koulechov/references/swipe-plan.example.json`. The same
source may come back in several segments when a second passage adds to the thread.

- `source`, `clips`, `phrases` and `reframes` work exactly as in a clip-reel plan,
  in that segment's own source time;
- `credit` holds whatever is known (`title`, `author`, `channel`, `year`). A
  network handle alone (`"channel": "@chaine"`) is enough;
- `marker` is the optional context marker (`text`, `duration` in seconds);
- `thumbnail.segment` names the segment the cover frame is taken from;
- `layout` defaults to `auto`: a wide source fills the width, a vertical one gets
  a box the height of the screen, and nothing is cropped. Leave it alone unless
  the operator asks: `fill` crops the wide archives badly, as the first Swipe
  showed.

Then:

```
python3 social/harness/ethni_swipe.py validate plan.json
python3 social/harness/ethni_swipe.py swipe plan.json <out>/swipe.mp4
python3 social/harness/ethni_swipe.py thumbnail plan.json <out>/cover.png
```

The renderer is `social/harness/ethni_swipe.py`, tested by
`social/harness/test_ethni_swipe.py`. It draws each segment with the clip-reel
engine, then chains the segments with the feed scroll: a 0.6 s push, eased in
and out, so that the eye sees it move. The incoming sound starts at full level.
A last scroll lands on the reels' approved outro (5 s, counted in the 3:00);
`"outro": false` leaves it off.
**Change behaviour there, test first — never in a one-off script.**

A screen recording of a vertical video sits inside a page. Crop it to its own
picture before planning: a `reframes` rect is rescaled to the source's own shape
and would squash it.

Validation separates two kinds of finding:

- **Refused (errors):** a plan that cannot be drawn correctly. That means fewer
  than two segments, a phrase straddling a cut, or a clip too short to rest
  between its two scrolls.
- **Accepted with a warning:** the editorial limits the operator may knowingly
  exceed. That means a segment with no credit at all, a marker over eight
  words, or a total over 3:00. **Pass each warning on to the operator**, never
  silently.

Then check it the way a reader would:

- re-transcribe the rendered audio: no clipped first words, no bleed from the
  next clip;
- pull a frame at every cut and look: the credit line belongs to the clip
  under it, the scroll goes upward, the source's own logos are still there.

**5. Deliver.** The final reel and the cover. The cover carries **the question the
Swipe answers** (« Sous-développée, l'Afrique ? »), over a frame of the montage,
and it never appears in the video (operator ruling, 2026-10-05; the theme word
alone was tried and dropped). Choose the frame by what it says before anything
else: **two people facing each other**, since that is what the Swipe does. A lone
face reads as the answer to the question. A smiling speaker beside the question
reads as his reply. Take a frame with no player buttons and, where possible, no
burned-in subtitle. Render two or three candidates and show them with a
recommendation.

Then one description per network, from
`.claude/skills/ethniafrica-clip-reel/references/network-captions.md`: the theme,
the credited sources, and a question that sends the debate back to the comments
(« Et toi, quelle version on t'a racontée ? »). Attribute each position to who
holds it; never state a claim a clip makes that the sources do not settle, such as
« il n'y a aucune étoile Michelin en Afrique ». Say only what the speaker says.

**Where it can go, by length.** Check the networks' limits at the time (they
move):

| Network   | A Swipe over 3:00                                              |
| --------- | -------------------------------------------------------------- |
| TikTok    | yes                                                            |
| Facebook  | yes, no length limit since June 2025                           |
| YouTube   | yes, as a regular video (a Short stops at 3 min), with a title |
| LinkedIn  | possible (10 min)                                              |
| Instagram | risky: past 3 min a Reel probably loses the Reels tab          |
| X         | no, except with a subscription (about 2 min 20 otherwise)      |

Close with a report that lists:

- the files and where they are;
- what was cut and why;
- every claim a clip makes that the sources do not support;
- what is uncertain (the end of a sentence heard badly, a name taken from a
  narrator, an English subtitle on the cover);
- the rights reminder: a credit line is not a licence.

**5 bis. File it in the library** once the operator says it is validated. The
Swipe is outside the chain, so nothing files it for you, and
`ethniafrica-reseaux-help` cannot see a Swipe that is not in the ledger. With
`ETHNIAFRICA_SOCIAL_POSTS` set:

```
node social/tools/library/register-post.mjs --id <slug> --dir <Themes-Sujet>/<slug> \
  --title "…" --subject "Thème · …" --pillar EthniAfrica --status pret \
  --family comparison --format video --copy <subject>/out/descriptions.md \
  --video <slug>.video-9x16.mp4=<subject>/out/<final>.mp4 --notes "…"     # dry run
# the same line with --write once the shelf shown is Valide
node <library>/00-Index/sync-deliverables.mjs          # report first
node <library>/00-Index/sync-deliverables.mjs --write
node <library>/00-Index/build-index.mjs                # writes post.md
```

Register **the video alone**: the ledger sends a post with several files and no
`selected` to Brouillon, and the dry run prints the shelf it would use. Copy the
cover by hand to the folder's root. Record the three facts the library cannot
guess in `--notes`: that rights were not obtained, that no site page exists, and
which networks the length excludes. No `--link-path`: a Swipe has no fiche, so its
visits arrive as « Direct / None »; say so, and ask whether a page is worth
linking if the operator wants the post measured.

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
- a transcript of a language the model does not know, presented as heard;
- a cover frame that makes the question look answered by a lone speaker;
- writing into the repository, publishing, scheduling, or clearing rights.
