# Claude Design brief: EthniAfrica Cartes 1.6.0-proposition, the long series video and its chapters

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML, 1.4.1-proposition accepted on 14 October 2026). 1.5.0-proposition (a spoken map sequence, for « Touareg ») is a separate request; this one does not depend on it, and both can be accepted in either order.

The accepted files are in the public repository, branch `recette`: https://github.com/big-emotion/EthniAfrica/tree/recette/social/design-system. Read `series.md` (« Vidéo de série », the bands table, the endings) and `handoff.md` (« Renderer integration of 1.4.0 » and of 1.4.1). The engine is `social/video/series*.mjs`; its README section « Series video » lists what it draws and refuses. The script rules are in `.claude/skills/ethniafrica-social-production/references/script-lessons.md` (§ 2 to 4).

---

## Assignment

Make the series video able to carry a **full history of about three to four minutes**, guided by **chapters on screen**. Everything accepted in 1.4.1 stays: the full-screen frame, the series band at y 250, the head, the subtitles, the lit word, the foot, the legibility rule, the 300 ms card change, the map cards on imagery, the endings, and every carousel card. The result is **1.6.0-proposition**; only the operator accepts it.

## The operator's decisions (15 October 2026)

Settled, not to reopen:

1. **Length follows the argument.** 45 s « n'apporte aucune information » for a full name history. The operator approved a script of about 3 min 10 for series 6, episode 1, « Afrique ». About 3 min is « parfait » for a word history (series 4, « tribu », about 3 min 30). The engine already treats 35 to 75 s as a recommendation, not a refusal (branch `feat/social-series-video-length-advisory`); this request gives the long video its own design.
2. **Chapters are required in long videos.** Their titles reuse the script's own phrases.
3. **A reminder of the hook question** is spoken between 1 min 15 and 2 min. It reopens the main question; it is not a new loop.
4. **Each video carries part of the signed position** (« Nous pensons que… »), because a viewer may see only this one.

## The test case: « Afrique », series 6, episode 1 (v6, about 3 min 10)

Seven chapters, titled on screen (not spoken):

1. **Un continent entier**: 54 countries, 1.5 billion people, median age 19 against 31 for the world, more than 2,000 languages.
2. **D'où vient le mot**: a corner of today's Tunisia, the Roman province of 146 BCE, the hypothesis of the Afri, and four other readings (Berber, Phoenician, Latin, Greek), each with its author.
3. **Le nom s'étend**: the hook reminder (« Alors, comment le nom d'un coin de la Tunisie finit-il par nommer tout un continent ? »), the Latin geographers, Léon l'Africain, Ortelius in 1570, the « montagnes de Kong » that never existed.
4. **D'autres noms**: Libye, Éthiopie, Alkebulan (Thevet, 1575), Kemet.
5. **Sur place**: each people had its own name; the name that won came from outside.
6. **Un rassemblement choisi**: 1914, then the Organisation de l'unité africaine in 1963.
7. **Ce que nous pensons**: the signed ending, then the question to readers and « Cherchez Afrique sur EthniAfrica, lien en profil. »

The images available are archive maps (Ortelius 1570, Boston Public Library, no known restrictions; the T-O map of the 1483 Isidore), the province of 146 BCE on imagery (AWMC outline), and the corpus' own map cards. The full text is in the piece's `copy/narration-v6-3min.md`, which the operator can paste.

## What to design

1. **The chapter marker.** How a chapter opens on screen.
   - Options: a full-frame chapter card, a title held in the head for the chapter's first card, or a persistent label under the band.
   - Give its words (« 2 · D'où vient le mot »), its duration, how it enters and leaves within the 300 ms card change, and whether the voice pauses for it.
   - It must never hide the subtitle or sit under the networks' buttons.
2. **Where the viewer stands.** Whether the band or the marker shows the position (« 3 / 7 ») and how, without a progress bar that reads as a player control.
3. **Rhythm over three minutes.** About 20 to 30 cards.
   - How often the image changes, whether an image may return (Ortelius on several cards), and how a chapter with few images stays alive (zoom, crop, a detail of the same map).
   - Whether a chapter may hold a short silent beat.
4. **A card of attributed readings.** Today the video draws only the kicker, title, source and credit: no body and no forms table.
   - Design a video card that shows four or five readings side by side, unranked, each with its author (« berbère : Ifri, ancêtre des Banu Ifren — W. Vycichl »), legible at 430 px, at reading speed.
   - It must also work as a list of names with their dates (chapter 4).
5. **Figures.** A card for three or four figures with their source (chapter 1): numbers large, units and source small, in the head or the clear zone.
6. **The hook reminder.** Whether it gets a visual cue (the opener's question returning in the head) or stays in the voice only.
7. **The signed ending.** How the « Nous pensons » paragraph is set apart from the sourced facts on screen (a different card, ink or kicker such as « Notre position »), without changing the closing card.
8. **The closing card.** It needs a slot for the next episode (« Prochain épisode : le pays des Noirs »). Also check the source line: the field prefixes « Source : », so a source that starts with « Hypothèses : » reads « Source : Hypothèses : ».
9. **The band's numbering.** The band prints « n° 1 ». The operator first asked for « L'Afrique n'est pas un tout · 1/6 » for a season of six. Say whether a season count is shown, and how.
10. **Cover.** Which frame or card serves as the cover of a long video, inside the profile grid's 3:4 thumbnail.

## Deliverables

1. `series.md`, « Vidéo de série »: a section « Vidéo longue et chapitres » with the length range, the chapter rule, the rhythm rule and the new cards.
2. Boards at full size and at 430 px:
   - a chapter opening;
   - the readings card (chapter 2 of the test case);
   - the figures card (chapter 1);
   - the signed ending;
   - the closing card with the next-episode slot;
   - the cover.
3. A handoff section « Renderer integration of 1.6.0 »: what the engine draws and checks (chapter titles from the sequence, the readings and figures cards, the next-episode slot, the numbering), and the length range it recommends.

## Out of scope

The carousel cards and their references; the map cards on imagery (1.4.1) and the map sequence (1.5.0); the satellite video (Vidéo carte 0.4.0); any episode's text and sources; publication.
