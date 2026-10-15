# Claude Design brief: EthniAfrica Cartes 1.7.0-proposition, document cards and chapters in the series video

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML). It builds on the latest accepted version: 1.5.0-proposition, the map sequence, accepted on 15 October 2026. It changes nothing that [1.5.0](../1.5.0-proposition/claude-design-brief.md) or the pending [1.6.0](../1.6.0-proposition/claude-design-brief.md) (the signature line) covers.

The accepted files are in the public repository, branch `recette`: https://github.com/big-emotion/EthniAfrica/tree/recette/social/design-system. Read:

- `series.md`, « Vidéo de série »: the settled points 1 to 4 (the image fills the frame, no shadow zones, nothing fitted to the feed, only text on the image), the bands table, « The photograph », « Legibility: one text treatment »;
- `handoff.md`, « Renderer integration of 1.4.0 »;
- the engine: `social/video/series.mjs`, `series-page.mjs` and `README.md`, section « Vidéo de série ».

---

## Why this brief

The first episode of series 4, « D'où vient le mot tribu ? » (2026-10-27), is the first series video built on **documents**. Five of its sixteen cards show printed text: a press column captured from the web, pages of dictionaries, a law and a colonial book. These are the proof of what the narration says, so they cannot be replaced by photographs.

On the proof stills (15 October 2026, attached by the operator), a document card does not hold together. The head (kicker and title in Anton 88) sits on the page's own lines of text, and the two texts mix. The opener is the worst case: « D'où vient le mot tribu ? » lands on the column's own headline. The photographs of the same video (a portrait, a Roman relief, a landscape) read well. The operator noted that the outlined letters remain legible on these light pages, and chose the proper route: a design rule rather than a workaround in the engine.

The episode also introduced **chapters** (operator, 15 October 2026: « il faut des chapitres dans la vidéo »). For now the engine shows them in the existing kicker (« 1 · D'où vient le mot »). That use needs the design's ruling.

## Assignment

Add **two rules** to the series video, and change nothing else:

1. **The document card**: how a card whose image is a page of text (a scan, a facsimile, a captured web page) is drawn in the full-screen series frame, so that the head, the subtitle and the quoted passage can each be read.
2. **Chapters**: how a long series video shows its chapters.

The carousel cards, the photographs, the map cards and the map sequence (1.4.1, 1.5.0), the endings and the signature line (1.6.0) stay as accepted. The result is **1.7.0-proposition**; only the operator accepts it.

## Settled, not to reopen

The 1.4.0 decisions stay: the image fills the 1080 × 1920 frame for the whole video, only text sits on it, and nothing is fitted to the networks' interface. If a document card cannot hold without departing from one of these points, say so explicitly, show both variants, and leave the choice to the operator. Do not change a settled point silently.

## What to design

### 1. The document card

1. **Framing on the quoted passage.** A document card names the passage the narration quotes, for example « Une tribu de sauvages » on the Académie page or article 1 of the 1863 text. Give the rule that places that passage in the clear zone (y 700 to 1300), at a size it can be read on a phone. Give the enlargement limits: the photograph's limit of 1.5 source pixels per frame pixel applies, and the scans are 1419 to 3919 px wide. Propose the card field, for example `image.document: { passage: [x, y, w, h] }` in source pixels.
2. **The head over printed text.** Say what the head sits on when the frame above the clear zone is printed text too. Possible routes: framing that brings a margin or a blank part of the page under the head; a smaller head on document cards; another treatment of the text. Show the one you recommend on all five cases below, and say why the others fail.
3. **Marking the passage.** Say whether the quoted passage is marked on the scan, and how, without a band and without darkening a region: an underline, a frame or a highlight in `on-image-accent`. Say whether the mark enters with the word that quotes it, as the lit word does.
4. **Captured web pages.** A press column captured from the web (1080 × 1920 at device pixel ratio 2) carries the site's own headline, menus and buttons. Give the capture rule: what must show (the headline, the author, the date, the site's name), what is removed (ads, faces that are not the subject, a top bar that shows the capture date, cookie dialogs), and how the credit reads. Say whether the column's own headline may stand in for the card's title on the opener.
5. **Scan marks.** Some scans carry « Digitized by Google » or a library stamp. Say whether they are cropped out, kept, or credited.
6. **Credits.** The foot credit for a document: title, date, page, holder of the scan, in the 1.4.0 credit style.

The five cases, files in the episode's working folder, each with its licence recorded in the production record:

| Card             | Document                                                                                         | Size (px)   | Passage quoted by the narration                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------- |
| Opener           | Camer.be column, 16 April 2025, web capture                                                      | 1080 × 1920 | the headline « … pendant que le Cameroun s'enlise dans la tribu »                 |
| « 1835 »         | Dictionnaire de l'Académie française, 6th ed., 1835, vol. 2, p. 883 (University of Toronto scan) | 2300 × 3002 | « Une tribu de sauvages »                                                         |
| « 1863 »         | _Code de l'Algérie annoté_, 1896, p. 269: the sénatus-consulte of 22 April 1863 (Google scan)    | 3919 × 6171 | « Art. 1er. Les tribus de l'Algérie sont déclarées propriétaires… »               |
| « Lugard, 1922 » | F. D. Lugard, _The Dual Mandate in British Tropical Africa_, 1922, p. 72 (Cornell scan)          | 1419 × 2304 | « the primitive tribes, the advanced communities, and the Europeanised Africans » |
| « qabīla »       | Hanoteau and Letourneux, _La Kabylie et les coutumes kabyles_, vol. II, p. 4 (Google scan)       | 3672 × 5670 | « la tribu (ârch) » and the Arabic footnote                                       |

### 2. Chapters

The « tribu » video lasts about 3 min 30 and has five chapters, whose titles come from the script: « D'où vient le mot » · « Le sens glisse » · « Le mot change de niveau » · « Un mot pour gouverner » · « Les mots des peuples ». The engine currently prints them in each card's kicker, numbered (« 2 · Le sens glisse »). Rule on:

1. **Where the chapter shows**: in the kicker as now, on a chapter card of its own when a chapter starts, or both. Use only existing card types if you can.
2. **Its wording**: numbered or not, and the separator.
3. **The change of chapter**: whether it gets a longer pause in the voice (the voice script already inserts 1.2 s of silence) or any visible mark beyond the 300 ms card change. Nothing slides, as in 1.4.0.
4. **Carousels**: whether a carousel built from the same cards shows chapters.

## Deliverables

1. `series.md`, « Vidéo de série »: a « Document card » paragraph and a « Chapters » paragraph.
2. Boards at full size and at 430 px: the five document cases above, one card change from a photograph to a document, and one chapter change.
3. A handoff section « Renderer integration of 1.7.0 »: the card fields (passage, capture rule), the framing and enlargement rule, the head rule on documents, the passage mark and its timing, the chapter display, and what the engine checks (passage inside the clear zone, enlargement within limits, head legibility, chapter wording).

## Out of scope

The carousel cards and their references; photographs, maps and the map sequence; the endings and the signature line; any episode's text; publication.
