# Claude Design brief: EthniAfrica Cartes 1.4.0-proposition, the series video in full screen

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML, version 12, 1.3.0-proposition accepted on 14 October 2026). Attach the operator's screenshot of 14 October 2026 (the layout B frame « Deux mots, deux langues du pays » with its dark band) and, if useful, the Vidéo carte 0.4.0 « plein écran » boards.

The accepted design files are in the public repository, branch `feat/social-design-system-1.3.0-proposition` (PR #1722): https://github.com/big-emotion/EthniAfrica/tree/feat/social-design-system-1.3.0-proposition/social/design-system — read `series.md`, « Vidéo de série ». The layout B engine built from it, with its frames and tests, is on branch `feat/social-series-video-b` (PR #1730), in `social/video/series*.mjs`.

---

## Assignment

Replace **only the series video's layout** of 1.3.0. Decision 4 of 13 October 2026 (layout B, the video's own card kept inside the feed's safe zone) is withdrawn by the operator on 14 October 2026: it came from a misunderstanding of the design. The cards, the series band on cards, the seven carousel models, the image proposal and every other 1.3.0 rule stay as accepted. The result is **1.4.0-proposition**; only the operator accepts it.

## The operator's decision (14 October 2026)

In his words: « L'image dans la vidéo doit prendre tout l'écran. Il ne doit pas y avoir de zones d'ombre comme sur les cartes des carrousels, et il ne doit pas y avoir de réajustement par rapport à la visibilité de l'écran. La vidéo prend tout l'écran, et il n'y a que le texte. »

So, settled, not to reopen:

1. **The image fills the whole 1080 × 1920 frame**, edge to edge, for the whole video. It is not a window under a band and it does not stop at y 902.
2. **No shadow zones**: no dark panel, no fade into `ground`, no veil band, no carousel scrim. Legibility comes from the text itself (the Vidéo carte 0.4.0 subtitle treatment: 9 px dark stroke painted under each letter and a soft shadow), never from darkening a region of the image. If a text cannot be read on a given image without a band, say so and propose a text treatment, not a band.
3. **The layout is not fitted to the social networks' interface**: the Meta and TikTok safe zone and the button column no longer place anything. The operator accepts that the apps cover part of the text in the feed, as he did for the 0.4.0 « plein écran » satellite video.
4. **Only text sits on the image**: the series band's words, the head of the card (kicker, title or date with the name employed), the subtitle chunks with the lit word, sources, credits and signature, and on the ending the slogan, its sentence and the pill.

Model to follow: **Vidéo carte 0.4.0 « plein écran »** (accepted 12 October 2026), which already lays text in fixed bands over a clear image, with stroke and shadow instead of bands, minus its veil from y 1540, which this decision excludes.

## What to design

1. **Full-screen frame layout**: where each text sits on the full image (fixed bands, as in 0.4.0, are welcome), at 1080 × 1920, 30 fps. The series band becomes text over the image (same words, same colours: name `ink`, separator `ink-faint`, « n° N » `accent`); say whether it keeps a rule line.
2. **The photograph**: framing of a carousel photo (1080 × 1350 or other ratios) to fill 1080 × 1920 around its focal point; the slow zoom 100 → 104 % stays. Say what happens to an image too small or too wide, and to a map card (it must fill the frame too, with its own view).
3. **Legibility rule**: one text treatment for all text on images, light and dark photographs alike, in both themes (series 2, 5 and 7 are Parchemin). Show it on the hardest images of the seven models.
4. **Long dates**: « 1er mars 1919 » in Anton 124/118 wrapped onto two lines in layout B. Give the rule for a date that does not fit one line (size step or display), never shrinking below a stated minimum.
5. **Cover, card change, ending**: frame 0 is the opener with its band text and no subtitle; one 300 ms cross-fade between cards, nothing slides; the « série » ending (voice « Cherchez [nom] sur EthniAfrica, lien en profil. », `pageOnline: true` required), all on the full image.
6. **Settle the seven gaps found between the layout B boards and the engine**, for the new layout:
   1. the kicker on a dated card, shown or not;
   2. the signature on content cards;
   3. the ending signature's exact y;
   4. whether the outgoing card's last subtitle stays during the cross-fade (the 0.4.0 voice rule keeps it);
   5. French narrow no-break spaces (« Faso ? », « Source : »);
   6. the subtitle stroke values (engine: 0.4.0's rgba(11,8,6,.92), 6 px radius; board: #1a120a, 4 px);
   7. the lit word's timing (it lights with its spoken word, about 150 ms after the chunk appears).
7. **« Image à trouver » slots**: their label must stay readable on a video frame.

## Deliverables

1. `series.md`, « Vidéo de série », rewritten for the full-screen layout; layouts A and B kept only as the record of the comparison.
2. Boards at full size and at feed size (430 px): cover, a subtitle frame with the lit word, a card change, a dated card with a long date, a map card, a Parchemin card, the ending.
3. A handoff section « Renderer integration of 1.4.0 » for `social/video`: the bands with their y and x limits, the legibility rule, the long-date rule, and what the engine checks. The card renderer is unchanged: cards without video context render as in 1.3.0.

## Out of scope

The carousel cards and their 89 references; the series band on cards; research or validation of any episode's text; publication.
