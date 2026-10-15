# Claude Design brief: EthniAfrica Cartes 1.7.0-proposition, the long series video

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML). Send it **after 1.6.0-proposition (the signature line) has been accepted**: this brief builds on it.

**One brief instead of three.** On 15 October 2026 three sessions drafted their own brief for the same need, the long series video with chapters:

- « Afrique », series 6 episode 1 (numbered 1.6.0, PR #1773, file `social/design-system/proposals/1.6.0-proposition/claude-design-brief.md` on branch `worktree-social-afrique-tout-01`);
- « Kouassi et Yao », series 3 episode 1 (numbered 1.5.0, local file `.claude/worktrees/yao-kouassi-series3/.local/productions/2026-10-15-yao-kouassi-nom-famille/claude-design-brief-1.5.0.md`);
- « tribu », series 4 episode 1 (numbered 1.7.0, PR #1780, branch `worktree-design-brief-document-card`; its chapters half comes here, its document card goes to 1.8.0).

Both numbers 1.5.0 and 1.6.0 were already taken (map sequence, signature line). This brief replaces the three and takes **1.7.0**. The episode-specific cards (document card, name-making formula, side-by-side forms, week table) are **1.8.0**, a separate brief that follows this one. You may read the three source briefs for detail; where they disagree, this text wins.

The accepted files are in the public repository, branch `recette`: https://github.com/big-emotion/EthniAfrica/tree/recette/social/design-system. Read `series.md` (« Vidéo de série », the bands table, the endings, the map sequence of 1.5.0, the signature line of 1.6.0) and `handoff.md` (« Renderer integration » of 1.4.0, 1.4.1, 1.5.0 and 1.6.0). The engine is `social/video/series*.mjs`. The script rules are in `.claude/skills/ethniafrica-social-production/references/script-lessons.md` (§ 2 to 4).

---

## Assignment

Make the series video able to carry a **full history of about three to four minutes**, guided by **chapters on screen**, without changing anything accepted: the full-screen frame, the series band at y 250, the head, the subtitles, the lit word, the foot, the legibility rule, the 300 ms card change, the map cards and map sequence, the signature line and the order of the ending, and every carousel card. The result is **1.7.0-proposition**; only the operator accepts it.

## Settled, not to reopen (operator, 15 October 2026)

1. **Length follows the argument.** 45 s « n'apporte aucune information » for a full name history. The engine treats 35 to 75 s as a recommendation, not a refusal (#1760). Subtitles read at up to **21 characters a second** (#1778).
2. **Chapters are required in long videos**, titled with the script's own phrases.
3. **A reminder of the hook question** is spoken between 1 min 15 and 2 min. It reopens the main question; it is not a new loop.
4. **Each video carries part of the signed position** (« Nous pensons que… »), set apart from the sourced facts (doctrine §1.1 exception).
5. **No band, no veil, nothing darkens the image** (1.4.0).

## The three test cases

| Episode                                      | Length                      | Chapters (titles on screen)                                                                                                                      |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| « Afrique », series 6 ep. 1, slot 22 October | about 3 min 10, ~25 cards   | Un continent entier · D'où vient le mot · Le nom s'étend · D'autres noms · Sur place · Un rassemblement choisi · Ce que nous pensons             |
| « Kouassi et Yao », series 3 ep. 1           | 3 min 43, voiced, ~15 cards | Un nom pour chaque jour · La fabrication du nom · De l'autre côté de la frontière · Ce que le nom dit · Devenu nom de famille · Une base commune |
| « tribu », series 4 ep. 1, slot 27 October   | about 3 min 30, 16 cards    | D'où vient le mot · Le sens glisse · Le mot change de niveau · Un mot pour gouverner · Les mots des peuples                                      |

The texts are in each piece's folder (`copy/narration-v6-3min.md` for Afrique, `copy/narration-v6.md` and `video/chunks-v6.txt` for Kouassi et Yao); the operator can paste them. « Afrique » is the main test case: its result is needed by **18 October**.

## What to design

1. **The chapter marker.** How a chapter opens on screen. One rule for all three episodes.
   - The three proposals on the table: a full-frame chapter card of its own (about 1.5 s, voiced by the 1.2 s silence the voice script already inserts); a title held in the head over the chapter's first image; or the chapter in the kicker of every card, as the engine does today for « tribu » (« 2 · Le sens glisse »). Choose one, or a combination, and say why the others fail.
   - Its wording: numbered or not, the separator (« 2 · » or « 2. »).
   - How it enters and leaves within the 300 ms card change. Nothing slides.
   - It never hides the subtitle and never sits under the networks' buttons.
2. **Where the viewer stands.** Whether the band or the marker shows the position (« 3 / 7 ») and how, without a progress bar that reads as a player control.
3. **The band's numbering.** The band prints « n° 1 ». The operator first asked for « L'Afrique n'est pas un tout · 1/6 » for a season of six. Say whether a season count shows, and how it sits with a chapter number if both are in the band.
4. **Rhythm over three minutes.** 15 to 30 cards. How often the image changes; whether an image may return or hold across several sentences (Ortelius 1570 on several cards); how a chapter with few images stays alive (zoom, crop, a detail of the same image); whether a chapter may hold a short silent beat. Confirm that nothing in the accepted grammar (zoom, card change, band) breaks past 45 s.
5. **Attributed readings and quoted people.**
   - A card that shows four or five readings side by side, unranked, each with its author (« berbère : Ifri, ancêtre des Banu Ifren — W. Vycichl »), legible at 430 px at reading speed. It also works as a list of names with their dates (Afrique, chapter 4).
   - An attribution line for a person quoted by role while the voice speaks (« la linguiste ghanéenne Florence Abena Dolphyne »): whether name and role appear on screen, and where (the foot's source line or a lower third).
6. **Figures.** A card for three or four figures with their source (Afrique, chapter 1): numbers large, units and source small.
7. **The hook reminder.** Whether it gets a visual cue (the opener's question returning in the head) or stays in the voice only.
8. **The signed position.** How a « Nous pensons que… » sentence or paragraph is set apart on screen: a different card, ink, or a kicker such as « Notre position ». One rule, for a single signed sentence (Kouassi et Yao) and a signed closing chapter (Afrique).
9. **The ending of a long video.** Keep the 1.6.0 order of the ending (band, the series' fixed closing, the signature line, the invitation, the site pill, the signature row). Two additions, which the three sessions asked for in different forms:
   1. **The invitation has two forms**: the named form « Cherchez [nom] sur EthniAfrica, lien en profil. » (Afrique), and a general form with no searched name, « Vous aussi, cherchez votre nom sur EthniAfrica, lien en profil. » (Kouassi et Yao), which leads to the search page. Show both.
   2. **An optional next-episode slot** (« Prochain épisode : le pays des Noirs »). Say where it sits in the 1.6.0 order, and how the content splits across two cards if it does not fit, without shrinking any text below its accepted size.
      Also fix the source line: the field prefixes « Source : », so a source that starts with « Hypothèses : » reads « Source : Hypothèses : ».
10. **Cover.** Which frame or card serves as the cover of a long video, inside the profile grid's 3:4 thumbnail.
11. **Carousels.** Whether a carousel built from the same cards shows chapters.

## Deliverables

1. `series.md`, « Vidéo de série »: a section « Vidéo longue et chapitres » with the length range, the chapter rule, the position and numbering, the rhythm rule, the readings, attribution, figures and signed cards, and the ending of a long video.
2. Boards at full size and at 430 px, in Nuit and Parchemin where it matters:
   - a chapter opening, for each of the three episodes;
   - the readings card (Afrique, chapter 2) and the attributed sentence (Dolphyne);
   - the figures card (Afrique, chapter 1);
   - the signed sentence and the signed closing chapter;
   - the ending with the named invitation and the next-episode slot, and with the general invitation;
   - the cover.
3. A handoff section « Renderer integration of 1.7.0 »: what the engine draws and checks (chapter titles from the sequence, the position and numbering, the readings, attribution and figures cards, the two invitation forms, the next-episode slot, the « Source : » fix), and the length range it recommends.

## Out of scope

The carousel cards and their references; map cards and the map sequence (1.4.1, 1.5.0); the signature line itself (1.6.0); the document card, the name-making formula, the side-by-side forms card and the week table (1.8.0); any episode's text and sources; publication.
