# Claude Design brief: EthniAfrica Cartes 1.8.0-proposition, document cards and teaching cards in the series video

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML). Send it **after 1.7.0-proposition (the long series video and its chapters) has been accepted**: chapters are settled there and are not reopened here.

**Where this comes from.** Two sessions drafted these cards in briefs that also covered chapters:

- « tribu », series 4 episode 1, slot 27 October: the **document card**, first drafted in PR #1780 (branch `worktree-design-brief-document-card`) and carried over in full below;
- « Kouassi et Yao », series 3 episode 1: the **name-making formula**, the **side-by-side forms card** and the **week table**, from `.claude/worktrees/yao-kouassi-series3/.local/productions/2026-10-15-yao-kouassi-nom-famille/claude-design-brief-1.5.0.md`, items 2 to 4.

Read the Kouassi et Yao items in full for their data; this brief gathers everything under one number and removes what 1.7.0 already settles (chapters, attribution, signed sentence, ending, length).

The accepted files are on branch `recette`: https://github.com/big-emotion/EthniAfrica/tree/recette/social/design-system. Read `series.md` (« Vidéo de série », settled points 1 to 4, the bands table, « The photograph », « Legibility: one text treatment », and the 1.7.0 section) and the engine `social/video/series.mjs`, `series-page.mjs`, `README.md`.

---

## Assignment

Add **four card rules** to the series video, and change nothing else. The result is **1.8.0-proposition**; only the operator accepts it.

## Settled, not to reopen

The image fills the 1080 × 1920 frame for the whole video, only text sits on it, nothing is fitted to the networks' interface, nothing darkens the image (1.4.0). If a card cannot hold without departing from one of these points, say so, show both variants, and leave the choice to the operator.

## What to design

### 1. The document card (« tribu »)

A card whose image is a page of text: a scan, a facsimile, a captured web page. Five of the episode's sixteen cards are documents; they are the proof of what the narration says, so they cannot be replaced by photographs. On the proof stills of 15 October the head (Anton 88) lands on the page's own lines, and the two texts mix; the opener is the worst case, « D'où vient le mot tribu ? » landing on the column's own headline. The operator noted that the outlined letters stay legible on these light pages, and chose a design rule rather than a workaround in the engine.

| Card             | Document                                                                                         | Size (px)   | Passage quoted by the narration                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------- |
| Opener           | Camer.be column, 16 April 2025, web capture                                                      | 1080 × 1920 | the headline « … pendant que le Cameroun s'enlise dans la tribu »                 |
| « 1835 »         | Dictionnaire de l'Académie française, 6th ed., 1835, vol. 2, p. 883 (University of Toronto scan) | 2300 × 3002 | « Une tribu de sauvages »                                                         |
| « 1863 »         | _Code de l'Algérie annoté_, 1896, p. 269: the sénatus-consulte of 22 April 1863 (Google scan)    | 3919 × 6171 | « Art. 1er. Les tribus de l'Algérie sont déclarées propriétaires… »               |
| « Lugard, 1922 » | F. D. Lugard, _The Dual Mandate in British Tropical Africa_, 1922, p. 72 (Cornell scan)          | 1419 × 2304 | « the primitive tribes, the advanced communities, and the Europeanised Africans » |
| « qabīla »       | Hanoteau and Letourneux, _La Kabylie et les coutumes kabyles_, vol. II, p. 4 (Google scan)       | 3672 × 5670 | « la tribu (ârch) » and the Arabic footnote                                       |

Rule on:

1. framing on the quoted passage inside the clear zone (y 700 to 1300), within the 1.5 source pixels per frame pixel limit, and the card field (for example `image.document: { passage: [x, y, w, h] }`);
2. what the head sits on when the frame above the clear zone is printed text too; show the recommended route on all five cases and say why the others fail;
3. whether and how the passage is marked (underline, frame or highlight in `on-image-accent`), and whether the mark enters with the word that quotes it;
4. the capture rule for a web page: what must show (headline, author, date, site), what is removed, how the credit reads, and whether the column's own headline may stand in for the opener's title;
5. scan marks (« Digitized by Google », library stamps): cropped, kept or credited;
6. the foot credit for a document: title, date, page, holder of the scan.

The contact sheet of the proof stills and the five documents are in the main checkout's `.local/productions/2026-10-27-mots-tribu/` (`video/proof-stills/contact.jpg`; `images/camer-be-2025-04-16_video.png`, `page-academie-1835.jpg`, `page-code-algerie-1863.jpg`, `page-lugard-1922-p72.jpg`, `page-hanoteau-1873-p4.jpg`), with their licences in `images/rights.md`. The tribu video needs this rule accepted by about **22 October**.

### 2. The name-making formula, in motion (« Kouassi et Yao »)

The voice says: « En baoulé, le vendredi se dit ya. Pour une fille, on ajoute A devant le jour : A, ya… Aya. Pour un garçon, on ajoutait Kwa devant le jour. Avec ya, ce Kwa est tombé : il reste Yao. » Then the same for Monday: « kissié », « A + kissi = Akissi », « Kwa + (ki)ssi → Kouassi ».

Design the animated formula synced to the per-word timings the engine already has: typography, place (the clear zone?), the girl's and boy's marking, and the timing grammar (enter, morph, hold). It must not claim more than the source: Delafosse says the day name is « plus ou moins modifié », and the cut « (ki)ssi » is a teaching gloss and may be shown as one.

### 3. The side-by-side forms card (« Kouassi et Yao »)

Two columns, « Côte d'Ivoire (baoulé) » | « Ghana (twi) ». Rows: Kouassi / Akissi, lundi | Kwasi / Akosua, dimanche; Yao / Aya, vendredi | Yaw / Yaa, jeudi. Rows enter with the voice; the day under each name appears on « un jour plus tôt ». A smaller third line for the Nzema if it fits; otherwise say it is spoken only. Say how this card relates to the 1.7.0 readings card: a variant of it, or its own type.

### 4. The week table (« Kouassi et Yao »)

Seven days × two sides (Baoulé-Agni | Twi-Fante), boy and girl, from `research/notes-week-table.md` in the piece folder (Pagnet 2005; Christaller 1881, Agyekum 2006). If seven rows do not read at 430 px, propose the split (two cards, a carousel-only card) and say which. The operator said « on attend un peu pour ça »: design it now so the system is done once; whether it enters this episode is the operator's call.

## Deliverables

1. `series.md`, « Vidéo de série »: « Document card », « Name-making formula », « Side-by-side forms » and « Week table » paragraphs.
2. Boards at full size and at 430 px: the five document cases and one change from a photograph to a document; four key frames of the formula; the side-by-side card before and after « un jour plus tôt »; the week table or its split.
3. A handoff section « Renderer integration of 1.8.0 »: the card fields, the framing and enlargement rule, the head rule on documents, the passage mark and its timing, the formula's timing tied to word timings, the table's fit rule, and what the engine checks.

## Out of scope

Everything 1.7.0 settles (chapters, position, numbering, rhythm, readings and figures cards, attribution, signed sentence, ending, cover); the carousel cards; photographs, maps and the map sequence; the signature line; any episode's text; publication.
