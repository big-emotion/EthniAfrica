# Le Swipe — commentary-free montage of found clips

Framing approved by the operator on 2026-10-05, after an interview held on
2026-10-04 and 2026-10-05. **Experimental.** This document fixes what the format is and
the rules it follows. It approves no episode, no selection of clips and no
render. Nothing has been produced under it yet.

**Le Swipe** is the name the public sees. **Koulechov** is the name of the
process, and of the skill that may later automate it. The process is named after
the montage principle it relies on, filed as `kuleshov-montage` in the
`attention-architect` pattern ledger.

## What it is

A vertical montage of clips EthniAfrica did not film (archive footage first,
recent clips when they turn up), cut one after another with a vertical scroll
movement, as if the viewer were scrolling through a feed. No narration is
added. The model is Canal+'s *Le Zapping* (1989–2016), which carried an opinion
through the choice and order of its clips alone.

**What it does: it brings competing versions together.** On a given subject
(the name Lingala, the causes of « sous-développement », racism, a country's
name), everyone holds one version they have heard, and has rarely heard anyone
equally concerned tell a different one. Le Swipe puts those versions side by
side. The viewer leaves knowing that their version is one among several. This
is the project's doctrine (no form crowned; name several explanations or none),
carried by people's own voices instead of narration.

The comments, where viewers argue for one version or another, are the
continuation of the format, not a side effect.

## Editorial rules

1. **A theme, then a thread.** The theme is a single word or name (racisme,
   sous-développement, Côte d'Ivoire, Cameroun, lingala). It appears on the
   cover and in the caption, never in the video. One theme can carry several
   Swipes. Each Swipe has a **thread**, written down before cutting and never
   shown: what the order of the clips is meant to make the viewer see.
2. **Every emotion is allowed.** Humour, the absurd, the dismaying, the sad, the
   serious. A Swipe mixes registers, and the message often lands better through
   laughter (operator ruling, 2026-10-04). A clip may take on a meaning from what
   surrounds it. That is the format, and it is deliberate.
3. **A clip is never turned against its speaker.** It may say more because of
   its neighbour. It is never cut so that its speaker appears to say the
   opposite of what they said.
4. **The montage leans where the sources lean.** Before selecting clips, check
   the corpus fiche, plus a web check (Wikipedia first, then what it cites).
   Where the sources establish a version, the Swipe may lean toward it.
   Where they disagree, it leans toward checking the sources and accepting
   that interpretations differ. It never leans by intuition alone.
5. **By default, the Swipe ends on the clip that leans.** The last word goes to
   the best-supported version, or, when nothing is settled, to the clip that
   says so.
6. **Mockery has a target.** Absurdity aimed at a claim, a cliché or whoever
   imposed a name serves the thread. Absurdity aimed at a people for being who
   they are is contempt.

## On screen

| Layer | Content | When |
| --- | --- | --- |
| Credit line (synthé) | whatever is known, in this order: title · author · channel · year. A network handle alone (« @chaine ») is enough. | throughout each clip, just under the frame |
| Context marker | place, date, broadcaster, in a few words, never a sentence | 2–3 s at the start of a clip, only when the image does not already say it |
| Subtitles | French transcription; French translation when the audio is in another language | continuous |
| Watermark | EthniAfrica | throughout |
| Transition | the next clip pushes the previous one upward (vertical push), as a feed scroll does: 0.6 s for a full screen, a soft start and a soft landing (ease-in-out) | between clips |

The scroll imitates the gesture, not any network's interface: no copied buttons,
icons or layout, which would imitate a brand.

No narration, no added music, no explanatory card. The context marker situates.
It never interprets.

The framing follows the [`clip-reel`](../../../.claude/skills/ethniafrica-clip-reel/SKILL.md)
reel: 9:16, the clip over its own blur, subtitles in French. The Swipe renderer,
`social/harness/ethni_swipe.py`, draws each segment with that engine, then chains
the segments and lays the watermark once, so that it stays still through every
scroll.

**Each source is framed by its own shape, and never cropped (`layout: auto`).** A
wide source fills the width of the screen, as in a clip-reel. A vertical one, a
Reel or a Short, is contained in a box the height of the screen. The fixed clip-reel
box had shrunk those to 360 px wide. A full-screen crop (`layout: fill`, with
`focus_x` choosing the side kept) exists too. The operator rejected it on the first
Swipe (2026-10-05) because it cut the wide archives badly.

**A source may come back.** The same video may give several segments at different
moments of the Swipe when a second passage adds to the thread (operator ruling,
2026-10-05). Each segment is cut and credited on its own.

**Every Swipe ends on the reels' outro.** One last scroll lands on the approved
social-networks outro (`social/harness/outro-reseaux-sociaux.mp4`, 5 s), used as it
is (operator request, 2026-10-05). The watermark leaves once that scroll has landed,
since the outro carries the logo. The outro counts toward the 3:00 target.
`"outro": false` leaves it off.

**The scroll lasts 0.6 s and eases in and out.** It first copied a finger's flick,
measured on an Instagram screen recording (200–250 ms, fastest at the start). On the
first real Swipe that read as a cut: the next clip seemed to appear from nowhere. In
a feed the viewer makes the gesture and expects the change. In a montage nothing
warns the eye, so the push needs a soft start and a soft landing. The incoming
clip's sound starts at full level while the outgoing one fades, so no first word
is swallowed.

**Never blocking.** The credit, the marker's length and the total duration are
editorial limits the operator may knowingly exceed (operator ruling,
2026-10-05). The engine reports them as warnings and still renders. It refuses
only what it cannot draw correctly: fewer than two segments, a phrase straddling
a cut, or a clip too short to rest between two scrolls.

## Rhythm and length

- **Under 3:00 in total, as a target, not a lock.** One file for every network. A
  longer Swipe renders, with a warning. Past 3:00, a Reel probably
  stops being placed in Instagram's Reels tab: Socialinsider found a median of
  4,428 views above 180 s against about 9,000 at 120–180 s, across 6 M brand Reels
  in January–June 2026. That study covers brands, not creators.
- **A clip lasts one complete thought.** A gag is short and cut on its
  punchline. A serious passage runs longer and is cut at the end of a sentence,
  once its subtitle has been read.
- **The measured reference.** The operator's recording of *Le Zapping*,
  measured to the second on 2026-10-05. In a fan compilation, clips ran 7, 11,
  14, 19, 20, 22, 25, 25 and 41 s (median about 20 s). In a 1998 weekly edition,
  they ran 35, 16 and 14+ s. Gags ran 7–14 s, building situations 25–41 s. Under
  3:00, that means roughly 7 to 10 clips.

## Before any render: the running order

The Swipe sits **outside the idee → structure → produire chain** and its gates
(`ethniafrica-message`, `ethniafrica-mythe`) while it is experimental. The
operator checks every montage personally, and approves a **running order
(conducteur)** before anything is rendered:

- **Above:** three lines on the arc: where it starts, what is set against what,
  where it lands.
- **One row per clip:** thumbnail, source (title · channel · year), in and out
  points, duration, what the speaker says in one sentence, and the clip's
  **role in the arc** (opens, contradicts, raises the stakes, makes laugh,
  leans, closes).

Two ways to arrive at it: the operator supplies the videos **and** the moments,
or the operator supplies the videos and the process **proposes** a running order
to approve. Finding the videos stays the operator's job.

## Risks accepted, and how they are contained

- **Platform originality rules.** Facebook (July 2025) says that stitching clips
  together or adding a watermark is not a meaningful enhancement. Instagram
  (April 2026) judges the **whole account over 30 days**, and stops
  recommending an account whose output is mostly other people's content. TikTok
  removes reposted content without creative edits from For You. Containment:
  - **Occasional.** A Swipe now and then; the project's own productions stay
    the bulk of every account's output.
  - **Visibly edited.** Selection, order, context markers, translated
    subtitles and the push transition are the transformation the platforms
    ask for.
- **Rights.** Television archives are detected by YouTube's Content ID and
  Meta's Rights Manager. The operator accepts that a Swipe will occasionally be
  blocked or muted. Every clip is credited on screen. Crediting a clip is not a
  licence, and this framing grants none.
- **Translation.** Automatic transcription handles African languages poorly. The
  operator sources a human translation for any passage in Lingala, Wolof, Dioula,
  Bambara or another such language. No such passage ships on a machine
  translation alone.

## Evidence so far

- **Not a Swipe, but the closest signal:** the Instagram reel built on one clip
  from Jubilee's *Surrounded* debate on racism (media 3997063475169552414). It drew
  104,328 views, 93.7 % from non-followers, 2,016 saves, 297 comments and 508
  new followers, as read on the operator's insights screen (2026-10-05). Shares
  were shown as 0, which is implausible beside 4,502 likes, so treat it as
  unread. It shows that **a confrontation of views** works with this audience. It
  does not yet show that **a montage of several sources** does. An extract from
  such a debate may appear inside a Swipe.
- **The audience the Swipe meets** is described in
  [audience-personas.md](../../editorial/audience-personas.md) and the dated
  report in [docs/audience/](../../audience/). Le Swipe serves the curious
  newcomer (P3) first. A newcomer who misses the thread but visits the profile,
  likes, saves or shares has still been reached (operator, 2026-10-05).

## Pilot

**Lingala.** The competing versions are clear (« inventé par les Belges », by
the Portuguese, by the Italians…). The corpus language record (`lin`) carries a
sourced and explicitly debated account. Citing Meeuwis, it says that Europeans
arriving on the Congo river in 1881–1882 learned Bobangi, the riverside trade
language, imperfectly and simplified it. That speech was named « Bangala » at
Bangala Station in 1884–1885, then renamed « Lingala » by the Scheut missionaries
in 1901–1902, a name no earlier source records. The
distinction between the language and its name is what the pilot leans on. The
earlier Lingala carousel reached about 34K lifetime views on TikTok, and its
comments already show the disagreement. No clips have been gathered yet.

There is no success threshold yet. **Review after one month** of Swipes. Record
for each one: views, share from non-followers, average watch time, saves,
shares, profile visits and new followers, plus whether the comments set
versions against each other or merely react.

## Not decided here

- The production profile and the library registration of a Swipe.
- Whether the measured scroll still feels right on a real Swipe. The
  [`ethniafrica-koulechov`](../../../.claude/skills/ethniafrica-koulechov/SKILL.md)
  skill and its renderer exist, but they have only been tested on synthetic
  footage. The Lingala pilot is their first real test.
- Whether a Swipe ever goes through the chain's gates once it stops being
  experimental.
