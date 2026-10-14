# Claude Design brief: EthniAfrica Cartes 1.4.1-proposition, map cards of the series video on satellite imagery

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML, 1.4.0-proposition accepted on 14 October 2026). The satellite video's own design is the Vidéo carte canvas (https://claude.ai/artifact/Ddics3FaKf1jjcnKMHZYSs, 0.4.0 « plein écran » accepted on 12 October 2026).

The accepted files are in the public repository, branch `recette`: https://github.com/big-emotion/EthniAfrica/tree/recette/social/design-system — read `series.md` (« Vidéo de série », the « Map card » paragraph and the bands table) and `handoff.md` (« Renderer integration of 1.4.0 »). The engines are `social/video/series*.mjs` (the series video) and `social/video/` (the satellite video: `README.md`, sections « Why this engine », « Plein écran, chunks and areas »).

---

## Assignment

Amend **one rule** of 1.4.0: how a **map card** is drawn in the series video. Everything else in 1.4.0 stays as accepted: the full-screen frame, the series band at y 250, the head, the subtitles, the foot, the legibility rule, the long dates, the card change, the endings, and every carousel card. The result is **1.4.1-proposition**; only the operator accepts it.

## The operator's decision (14 October 2026)

1.4.0 says a map card whose base map is too short for 9:16 needs « a 9:16 base map built per region, from Natural Earth », and until then the card is refused (`serie-frontieres-02` is). The operator chose instead: **in the series video, a map card is drawn by the satellite video engine**, not on a flat base map. Settled, not to reopen:

1. **The satellite view fills the frame**, edge to edge, like every image of the series video (the 1.4.0 rule: the image takes the whole screen, only text sits on it, no band, no veil, no fitting to the feed).
2. **No flat 9:16 base map is built per region.** The flat base maps (`assets/Cartes/*.json`) stay for the carousel cards only.
3. **One map grammar in video**: the satellite video's overlays (certain areas filled with a solid edge, uncertain areas hatched with a dashed edge, borders none, quiet or strong, a dark keyline under every bright mark, every name on its own halo or plate), already accepted in Vidéo carte 0.2 to 0.4.

Why: it is already built and tested (`social/video`), it is full screen by nature, it shows any region of Africa without new base maps, and the Natural Earth 5.1.2 layers it needs are already pinned in the repository.

## What to design

1. **Framing.** How a map card's subject (the highlighted country, or the union of its areas) becomes a satellite view in the series frame: a still, top-down view (flat style) fitted so the subject sits between the head and the foot (below y 724, above the foot at 1652), with the slow zoom 100 → 104 % of the other images. No globe opening and no camera travel inside a card: a map card is one card among others, entered and left by the 300 ms cross-fade. Say whether relief is ever allowed on a series map card.
2. **Grade.** Which of the two accepted grades (`sat-grade-base`, `sat-grade-recede`) a series map card uses; recede is the expected one, since overlays are on screen from the first frame.
3. **What carries over from the card's map**, and how:
   1. `highlight` (a country): drawn as an area from the Natural Earth country outline, in which ink;
   2. `areas` (certain and approximate): the same areas, solid or hatched; the card's areas are in the flat base map's units, and each base map's `meta` names its projection (an equirectangular projection at N px per degree from a stated origin), so the engine converts them to longitude and latitude;
   3. `borders` (none, quiet, strong, dotted): their look on imagery;
   4. `countryLabels`, `waterLabels`, `labels`, `places`: names on imagery, at most six on screen as in 0.4.0, inside the map's band;
   5. the key: it goes into the foot as text, as 1.4.0 already says.
4. **Atlas cards** (`atlas-1880`, `atlas-1914`, independences: categorical territories, regional keys, numbered marks, the period marker, insets): drawn on imagery, kept on the carousel only, or refused in the video. Show the choice on `serie-atlas-1914-parchemin`.
5. **Parchemin.** 1.4.0 keeps the Parchemin map palette as « ground of its own » on a map card (open question 1). With imagery there is no Parchemin ground: say what a Parchemin series map card looks like in the video (series 2, 5 and 7 are Parchemin).
6. **Scale limit.** The satellite design stops at about 350 km across the map window with Blue Marble (500 m); under that, Sentinel-2 cloudless. Give the rule for a series map card whose subject is smaller (a city, a small kingdom): zoom limit, refusal, or the other source.
7. **Credits.** The imagery credit (Blue Marble, NASA) and the boundaries (Natural Earth, public domain) in the foot, in the 1.4.0 credit style.

## Deliverables

1. `series.md`, « Vidéo de série »: the « Map card » paragraph rewritten for the satellite view; the sentence about building a 9:16 base map per region withdrawn.
2. Boards at full size and at 430 px: `serie-nom-famille-02` (a highlighted country, Côte d'Ivoire), `serie-frontieres-02` (two areas across a border, today refused), an atlas card, a Parchemin map card, and a card change from a photograph to a map.
3. A handoff section « Renderer integration of 1.4.1 »: the framing rule and its limits, the grade, the conversion of card map units to longitude and latitude, the overlay styles reused from Vidéo carte 0.4.0, the credits, and what the engine checks (subject between head and foot, scale limit, at most six names, every text box in its band).

## Out of scope

The carousel cards and their 89 references; the flat base maps; the satellite video itself (Vidéo carte 0.4.0 is unchanged); any episode's text; publication.
