# Series video sound

The cues and music beds of the series video (EthniAfrica Cartes 1.13.0, `social/design-system/series.md`, « 13. Sound cues »). The operator produces and chooses every sound here (decision 10 of 21 October 2026): one cue palette shared by every series, and a default bed per series that an episode may replace with the bed of its own people's area (operator, 21 October 2026: « un fond par série par défaut, et si possible un son par épisode »). Nothing in this folder is downloaded from a sound library or chosen in the operator's place: an agent may generate candidates at the operator's request, and only the takes the operator keeps after listening come in.

The first palette and beds came in on 21 October 2026, generated with ElevenLabs on the operator's account (« ok pour eleven labs »): takes b and c of every cue family kept after listening (« b et c »), and eight beds in the style of African musical areas kept after listening alone and under narration (« je garde tous les fonds »). The operator asked for the Mande and Congolese rumba beds on the series with the most episodes. Each folder's `LICENCE.md` records the source and the choice.

`social/video/mix.mjs` reads this folder. While it holds no file, the engine muxes the voice alone, as before 1.13.0, and the video is complete: every cue doubles a visible event.

## What goes where

- `cues/<family>/*.wav`: any number of takes per family. The engine rotates through a family's files in name order, so a run of pops does not repeat one sample and the same plan always picks the same files.
- `beds/library/<name>.wav`: the beds, one per musical area (`akan`, `mandingue`, `touareg`, `amazigh`, `rumba-congolaise`, `afrique-du-sud`, `nigeria`, `afrique-centrale`). Each is looped to the video's length, so it loops without a seam.
- `beds/series.json`: each series' default bed, by name (`pays` → `mandingue`, `nom-recu` → `rumba-congolaise`, `nom-famille` → `akan`, `mots` → `afrique-centrale`, `frontieres` → `touareg`, `afrique-tout` → `afrique-du-sud`, `villes` → `nigeria`).
- An episode chooses its own bed with `"bed": "<name>"` in its sequence, from the area of the people it is about; a name the library lacks is refused. Without it, the series' default plays. A file at `beds/<series>.wav` still serves a series that `series.json` does not name.
- A licence for every file, recorded beside it: `cues/<family>/LICENCE.md` and `beds/LICENCE.md`, naming the author, the licence and where the file comes from.

WAV, PCM 16, 24 or 32-bit integer or 32-bit float, mono or stereo. Levels in the file do not matter: the engine sets each cue's peak from the voice's peak and the bed's loudness from the voice's loudness.

## The cue families

| Motion                                                                    | Family   | Length                              | Peak under the voice's peak |
| ------------------------------------------------------------------------- | -------- | ----------------------------------- | --------------------------- |
| a pop (name, word, pin, tag, form)                                        | `pop`    | 60 to 90 ms                         | −20 dB                      |
| the counter, each year shown                                              | `tick`   | 30 ms, 25 a second at most          | −26 dB                      |
| an area's swell, a flag unrolling                                         | `swell`  | 0.6 to 0.7 s                        | −20 dB (a flag −23)         |
| the whip zoom                                                             | `whoosh` | 0.55 s, peak on its fastest frame   | −16 dB                      |
| the flash                                                                 | `rise`   | 0.6 s, peak on the flash's peak     | −16 dB                      |
| the headline band                                                         | `whoosh` | 0.4 s in, 0.3 s out                 | −18 dB in, −24 dB out       |
| a word's parts lifting apart; the recap card's entry (reversed)           | `whoosh` | 0.3 to 0.35 s                       | −24 dB, −22 dB              |
| a drawn mark                                                              | `draw`   | the drawing's length                | −22 dB (circle, cross −20)  |
| the stamp, the counter's landing, the band's key word, the whip's landing | `impact` | 0.45 s                              | −17 dB (whip −21)           |
| the chapter card                                                          | `drum`   | 1.4 s, on the current chapter's dot | −16 dB                      |
| « S'abonner » in the intro, the networks of the end card                  | `ding`   | 0.9 s                               | −18 dB                      |

A `draw` take should be longer than the longest drawing (2.5 s): the engine cuts it to the drawing's length with a short fade. A `whoosh` or `rise` is placed so that its loudest sample lands on its frame; every other cue starts on its frame.

## The mix

- The bed sits 17 dB under the voice by short-term loudness while the voice speaks, and rises 4 dB in a pause of 0.8 s or more (attack 150 ms, release 500 ms). The engine keys the ducking on the voice's word timings, not on its waveform, so the bed does not pump between syllables.
- The whole mix is normalised in two passes to −16 LUFS integrated (ITU-R BS.1770, EBU R128 gating), −1 dBTP true peak, loudness range 8 LU. The manifest records the measured loudness and true peak.
