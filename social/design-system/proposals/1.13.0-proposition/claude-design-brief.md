# EthniAfrica Cartes 1.13.0: motion and sound grammar for every series video, short to long, one subject over many episodes

Brief for Claude Design, to paste into the Claude Design conversation of EthniAfrica Cartes
(https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML). It builds on the accepted 1.12.0 (teaching
cards in motion on the parchment ground), 1.11.0 (the animated satellite map), the operator's
chapter card of 20 October 2026 and the series idents. Every accepted rule stays unless an item
below says it is open: the head, the band, the subtitles with the lit word, the foot and sources,
the chapter card, the ending, the silent-viewing rule (every fact said has a mark on screen),
the reading speed (21 characters a second at most).

## Why

The operator, 20 October 2026, sharing a YouTube Short by La Minute Géographie (« La frontière la
plus bizarre du monde ! », about 57 s, the Caprivi Strip): « je la trouve parfaite sur la forme.
Elle est parfaitement animée et la forme accompagne parfaitement le fond. Mon objectif est
d'arriver à ce niveau de qualité, même sur les publications longues de plus de 4 min. » Two more
facts set the frame: videos will have **different lengths** (some shorter than 4 min), and
**several videos will cover the same country or the same people**. Everything stays centred on
the name, and some episodes will be about **the language and its words** (common nouns, proper
nouns), not only places and peoples.

What that Short does, measured frame by frame and on its spectrogram:

- every key word of the voice fires one event on screen (an area with its flag, a black label
  that pops, a hand-drawn yellow circle, a dotted route that draws itself, a river that draws in
  glowing cyan, a red cross, a curved double arrow), often with a short sound;
- the camera never stands still; there is one hard cut in 57 s; long moves are fast blurred zooms;
- the present is a realistic satellite map, the past a paper map; the switch is a warm light
  flash and a year counter rolling 1904 → 1890 and slowing down;
- something changes every one to two seconds;
- two black headline bands with the key word in red slide in with motion blur;
- sound: a music bed always present about 17 dB under the voice, whooshes and soft impacts on
  transitions, an interface « ding » on the subscribe button; mixed at −17 LUFS (our last video:
  −21 LUFS);
- it ends on an animated subscribe button and the logo, then loops into its first sentence.

## What we take, and what we leave (the operator's decisions to confirm)

Taken, adapted to our rules: items 1 to 13 below.

Left out, with the reason:

- **A short real-footage insert (1.5 s).** Operator, 19 October 2026: a picture is a phase of
  whole sentences, 6 s at least, never a 2 to 3 s insert between maps.
- **Sensational wording on screen** (« la plus bizarre », an unsourced « 100 fois plus rapide »).
  A headline band carries only what the narration states and the source supports.
- **A question as the spoken hook.** The series opens on its fixed sentence and a declarative fact.
- **No sources on screen.** We keep the foot with sources and credits.
- **Plain subtitles.** We keep the lit word.
- **The loop ending** (the last sentence replaying the first). The operator liked it but does not
  take it for now (20 October 2026); every format ends on the series closing and end card.
- **Flashes and whip zooms everywhere.** Reserved for the story's turns; never more than 3 flashes
  a second (photosensitive viewers, WCAG 2.3.1).
- **Flags on peoples, or a flag on a date when its state did not exist.** Never.
- **A change every 1 to 2 s on a 4-minute video.** About every 2 to 3 s on long formats; the rate
  is set per format (item 10).

## What 1.13.0 must define

1. **Motion tokens.** A small set of easings and durations shared by every element: enter, exit,
   emphasis, travel. One curve family for the series, so every video moves the same way.
2. **The « pop » entry.** Labels, words on the map, badges, markers: a short scale-up with a light
   overshoot and settle, its length and overshoot, its shadow; how it leaves. Areas keep a softer
   entry (fill that swells in) consistent with 1.11.0's area states.
3. **Continuous camera.** A slow push-in or drift on every map card and every parchment card, so no
   frame is ever static; its speed, its limits at 430 px, how it stops on a word. Whether the
   6-second picture phase of 1.11.0 gains this slow move (open question).
4. **Transitions for the story's turns only.** A fast blurred zoom (whip zoom) between distant
   places; a warm light flash in the brand's palette (not a stock light leak) for a change of era
   or a twist; their length, and the rule of when each is allowed (a new era, a new place, the
   twist, a chapter).
5. **The era map.** A paper-map variant of the satellite map for historical phases (« en 1890 »),
   with the same areas, inks and labels; the satellite map stays the present. How the switch is
   made (flash, then the paper map), and how it comes back.
6. **The date counter.** A large date that rolls from the present (or a start year) to the target
   year and slows down as it lands; its face, size, length; where it sits relative to the band.
7. **Drawn marks.** A route drawn as a dotted line along a path; a river drawn as a glowing line;
   a hand-drawn circle that surrounds a place; a cross or pin that pops on a point; a curved double
   arrow for an exchange. Widths, colours, drawing speed, and how they stay subordinate to the areas
   (1.11.0 proportions).
8. **Flag texture inside a territory.** A state's or colony's flag filling its area, gently
   waving; only for a state or colony that existed at the date shown; never for a people. Colonial
   powers keep their cream ink from 1.11.0 where a flag would glorify; say when each applies.
9. **The headline band.** A black band with large capitals and the key word in accent colour,
   sliding in with motion blur; at most two per video (the hook's fact, the twist's number); only
   words the narration says.
10. **Format tiers.** The same grammar at three lengths: short (30–60 s), medium (60 s–3 min), long
    (3–6 min). For each: the target change rate, how many strong transitions, chapters or not,
    and the intro ident's and end card's length (no loop ending in any tier).
11. **One subject over many episodes.** A subject key reused by every episode on the same country
    or people: its ink, its base map view and globe landing point, its title formula (« Les Akan ·
    épisode 2 »), its thumbnail family; a short recap card for episodes 2 and later (« Dans
    l'épisode précédent… », 6 s at most) drawn from the previous episode's map; how the episode
    number sits with the series band.
12. **Episodes about words and the language.** The same motion grammar for an episode whose
    subject is a word (a common noun, a proper noun) rather than a place: the word set large on
    the parchment, its parts lifting apart and joining (extending 1.12.0's formula moves), its
    forms in other languages or spellings popping in around it, its first written attestation as
    a dated stamp, and the map only when the word is placed somewhere. How such an episode keeps
    the change rate of item 10 with fewer maps.
13. **Sound cues, as a specification only** (we produce the sounds): for each motion of items 2 to
    9, its cue family (pop, swell, whoosh, draw, impact, chapter drum, interface ding), its level
    relative to the voice (cues around −16 to −20 dB under the voice peak; the music bed about
    17 dB under the voice, ducking under speech), and the loudness target of the final mix
    (−16 LUFS integrated, true peak −1 dB). The video must stay complete without sound.

## Questions

1. One easing family for everything, or two (map versus parchment)?
2. The pop's overshoot: how much at 430 px before it feels cheap?
3. Slow camera on the 6-second picture phases: yes or no?
4. The flash: one warm brand flash for every turn, or a different one for eras and for twists?
5. The era map: a separate paper texture, or the satellite map desaturated and toned?
6. Flags: where is the line between showing a colony and glorifying it?
7. Change rate per format tier: what targets?
8. The subject key: how much of it is fixed per subject, and what changes per episode?
9. The recap card: map, words, or both?
10. Sound: one sound palette for all series, or one per series?
11. Word episodes: how far can the parchment carry an episode alone before it needs a map?

Deliver boards at 1080 × 1920 and the 3:4 grid crop, with timings, and short animated previews
of the motions with their sound cues placed (silent boards are fine where sound is only
specified). The operator accepts the proposition before it is integrated in the engine.
