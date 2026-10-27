# Claude Design handoff brief: footage-first opening and transitions (Togo, pays-20)

Decision to commission: the operator's. Nothing is produced from this brief until the design result is returned and recorded with the `design` event.

## Why a design decision is needed

The accepted series system (EthniAfrica Cartes 1.14.0-proposition) documents map, still-picture, document, opener, intro and ending cards. It has **no external-video field**. The operator's 25 October 2026 decision makes every cut open on a scene of real footage, with the fixed opening sentence spoken over it and the series introduction in its own beat. That changes the accepted visual grammar and cannot be improvised in the renderer.

## Operator requirement, 26 October 2026: external video as a first-class medium

The series must be able to open on external video **and** to build whole montages of external video, as in the operator's finished four-network delivery (TikTok, Instagram, Facebook and LinkedIn, kept outside the repository). A contact sheet of that film shows the grammar to adopt:

- **Full-bleed footage** fills the 9:16 frame; the picture is chosen to illustrate the sentence being spoken, not as decoration.
- **A small place-and-credit line** sits low on the footage, in capitals with a dot marker (e.g. « LAGOS · … », « ABIDJAN · FINALE DE LA CAN 2024 »).
- **Word-timed subtitles** in the lower third, the key word of each sentence on an ochre pill.
- **The series mark** stays top-left throughout.
- **Footage alternates with designed cards** (large figure over footage, a headline over a small map, a stat panel, a device mock-up) and closes on the signature card.

Requirements for the system, each to be answered in the return:

1. **Clip as a full-screen picture phase**, in/out points per clip, with a per-clip **audio setting: source sound on, off, or ducked under the narration**. Default is off until the speech is transcribed, attributed and checked.
2. **Montage of several clips under one narrated sentence or phase**, with cut rules (minimum hold, transitions) written down.
3. **Footage with a designed overlay** (figure, date, word) and footage alone, both allowed.
4. **Per-network framing**: 9:16 for TikTok and Instagram, 4:5 for Facebook, with a crop/safe-area rule for 16:9 sources.
5. **Credit and rights record** shown on screen per clip and carried into the package's `images[]`-style rights record.
6. **Renderer field** for an external MP4 (path, in, out, audio, crop focal point) so the engine can render it deterministically; the engine has no such field today.

Editorial limit that stays: present-day footage never illustrates a dated historical event (1884, 1960); it shows a place or a living speaker. The illustration rule applies to the narration of the present and to attributed local voices.

## Questions for the designer

1. **Footage-first opener.** How do the series band, the ident and a 16:9 landscape clip coexist on a 9:16 phone (TikTok, Instagram, 1080×1920) and a 4:5 frame (Facebook, 1080×1350)? Safe regions for the subject, the band and the imagery credit at 320–430 px first.
2. **Crop rule.** When a 16:9 crop loses the subject, what is the approved « landscape window » treatment?
3. **Film ↔ card transitions.** The cut alternates film, one precise location map, source/document cards and dated text panels. Define the transition between each pair, with picture phases of at least six seconds.
4. **Credit line.** A visible, legible credit for each excerpt and for OpenStreetMap (ODbL) on the map, without crowding the band.
5. **Silent viewing.** Every fact spoken must carry a mark on screen; the opener's opening sentence needs a visible line.

## Fixed inputs

- Spoken opening, introduction and closing are exact (`docs/editorial/strategy/social-series.md`). Only their image treatment changes.
- Sequence and chapters: `sequence-strategy-v5.md` (approved). Scripts: `copy/narration-{tiktok,instagram,facebook}-v5.md`.
- One precise map only (Togoville and Lake Togo, `sources/map-data-togoville.md`); no invented historical borders. A second current map only if the narration needs it.
- Brand and mobile-first rules of the existing system apply; no old template is a fallback.

## Not yet decided, and not the designer's to settle

Which clips are kept and under what permission: see `sources/footage-provenance-audit-2026-10-25.md`. The design should work for a F03-type lakeside clip as the default opener.

## Expected return

A design reference file copied into the project, its version, and the operator's explicit decision, recorded with the `design` event.
