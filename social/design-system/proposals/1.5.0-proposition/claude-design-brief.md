# Claude Design brief: EthniAfrica Cartes 1.5.0-proposition, a spoken map sequence in the series video

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML, 1.4.1-proposition accepted on 14 October 2026). The satellite video's own design is the Vidéo carte canvas (https://claude.ai/artifact/Ddics3FaKf1jjcnKMHZYSs, 0.4.0 « plein écran » accepted on 12 October 2026).

The accepted files are in the public repository, branch `recette`: https://github.com/big-emotion/EthniAfrica/tree/recette/social/design-system — read `series.md` (« Vidéo de série », « Map cards on satellite imagery ») and `handoff.md` (« Renderer integration of 1.4.0 » and of 1.4.1). The engines are `social/video/series*.mjs` (the series video) and `social/video/` (the satellite video: `README.md`, « Plein écran, chunks and areas », « Area files »).

## Assignment

Add one thing to 1.4.1: a map sequence inside the series video, in which areas and names appear on the word that says them, and which can span several consecutive cards. Everything else in 1.4.1 stays as accepted. The result is 1.5.0-proposition; only the operator accepts it.

## The operator's request (15 October 2026)

For series 2, episode 1 (« Touareg »), the operator asked that, while the voice names the Tuareg self-names region by region, « on voit les différentes régions apparaître sur la carte à plat », each region « avec une couleur différente », the name appearing when it is said; then the language names appear on the same regions; then, in the summary, the map comes back with the names and languages. Today a series map card (1.4.1) is drawn once, with everything on screen from its first frame; the satellite video (0.4.0) already makes « what a chunk names enter at its first word », but only in its own chained format. The request joins the two.

The episode's beats, as approved by the operator, are the test case:

1. « Chez les Touaregs, on dit plutôt Imuhagh, Imajeghen ou Imushagh, selon la région. » Regions: Ahaggar and Ajjer (Imuhagh), Aïr (Imajeghen), Adrar des Ifoghas (Imushagh).
2. « C'est le même mot qu'Amazigh, prononcé selon les parlers de chaque région. » The Amazigh (Berber) area of North Africa appears.
3. « Leur langue aussi change de nom selon la région : tamahaq, tamajaq ou tamasheq. » The language names appear on the same regions.
4. Later, after a photograph card: « En résumé… Eux se nomment Imuhagh, Imajeghen ou Imushagh, et leur langue tamahaq, tamajaq ou tamasheq. » The map returns with every name and language.

Areas come from sourced files only (`social/video/data/areas/`, built by `areas.mjs` from Natural Earth and the corpus, `kind: "approximate"`); none is drawn by hand.

## What to design

1. Entry on the word. How an area and its name enter when the chunk that names them is said, inside a series map card: the 0.4.0 entry (700 ms apart, a name waits until its area is 60 % visible) or a variant; what happens when two names are said in one chunk.
2. A colour per region. 1.4.1 draws areas certain or hatched in the satellite grammar, by category. The operator asks for one colour per region. Propose a small categorical set for imagery (three to five areas, both themes), its keyline, its legibility on the recede grade, and whether hatching (approximate areas) survives with colour.
3. Two labels on one area. The self-name first, then the language name on the same region (beat 3): replace, stack, or append (« Imuhagh · tamahaq »), within the six-names limit and the map band.
4. A map that spans cards. Consecutive map cards on the same view (beats 1 to 3) should not cross-fade the imagery between them; only the overlays and the head change. Say how the head (kicker, title) changes while the map stays.
5. Return to the map. A later map card on the same view (beat 4) after a photograph card: does it re-enter with everything shown, or replay the entries?
6. A wider area beside small ones. The Amazigh area (North Africa) is much larger than the Tuareg regions: framing that shows both, or a camera move between the two views within the card (and whether any move is allowed in a series card).
7. Credits and key. Areas' sources in the foot, in the 1.4.1 style.

## Deliverables

1. `series.md`, « Vidéo de série »: a « Map sequence » paragraph.
2. Boards at full size and at 430 px: the four beats above (Parchemin, series 2), frames at the entry of each name, and the card change from the photograph back to the map.
3. A handoff section « Renderer integration of 1.5.0 »: the entry timing, the categorical colours, the label rule, the continuity rule across cards, and what the engine checks.

## Out of scope

The carousel cards and their references; the satellite video's own format; the area geometries (built by `areas.mjs`, not designed); the episode's text; the length rule (a 35 to 75 s recommendation since 15 October 2026, not a limit); publication.
