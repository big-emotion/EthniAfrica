# Claude Design prompt, step 11 — brief 11, the result page (pass 2)

Text to paste in the **same Claude Design conversation** as the earlier briefs,
on the site canvas "EthniAfrica, relevé des pages en production"
(<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>), with the EthniAfrica
Design System selected. It starts brief 11
([`11-result-page-self-name-handoff.md`](11-result-page-self-name-handoff.md)),
the second of the three board passes approved on 2026-10-17. Procedure:
`docs/design/mockup-first-workflow.md`.

Nothing needs attaching. Do not start before the operator has read this text,
and not before pass 1 (briefs 10 and 6) is approved and recorded: the passes
share `Main` and `ea-live.css`. The two charter amendments the brief quotes
are approved with these boards.

## Text to paste

```text
We start brief 11: the result page, from the searched name to the self-name, one video, and labelled sources. Briefs 1 to 6, 9 and 10 are approved: do not touch search-unknown, search-state-nodate, the people or family boards, or the about and approach pages. The same rules as before apply: mockups first, 430 px then 768 then 1440, real French copy drawn word for word, existing tokens only, a source shows its type and never a tier, no name is crowned, the site never affirms. Work in the same canvas and edit the existing boards.

The full brief is in the public repository, branch recette: docs/design/mockups/briefs/11-result-page-self-name-handoff.md. Read it before drawing.

STEP 0 — before changing anything, reply in 8 lines: which boards you can see (search-peul, search-bassa, search-congo, search-state-competing, search-state-thin, language-lingala, country-civ, country-state-civ-quaqua, at 430, 768 and 1440, and Main); on search-peul-430, the y of the lead, of the chips, of « Fin de ce que nos recherches retracent pour le nom Peul. » and of « Voir la fiche complète »; which button styles Main has (solid, outlined, text); how many source diamonds each board draws; and where two tiles in a row share a period label. Change nothing yet.

BOARDS TO CHANGE, each at -430, -768 and -1440: search-peul (the model) and search-bassa for changes 1, 2, 4 and 5; search-congo, search-state-competing, search-state-thin, language-lingala, country-civ and country-state-civ-quaqua for change 3 (and change 4 on search-congo). Main gets the hand-off tile, the video row, the new sources button and the period rule.

CHANGE 1 — THE HAND-OFF TO THE SELF-NAME
a. Inside the lead « Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. », under its sentence, one line: « D'où vient le nom Fulɓe ? Les sources proposent cinq explications, sans que l'une l'emporte. » The count is the number of accounts in the explanations tile the timeline draws for Fulɓe (Hypothèse 1 to 5). With no such tile there is no line. The action keeps « Voir »; it opens the Fulɓe chip and shows the top of Fulɓe's timeline, its intro line first, never the explanations directly.
b. Directly after « Fin de ce que nos recherches retracent pour le nom Peul. », a tile set off the timeline's thread (no dot, not dated): eyebrow « Leur nom »; the name « Fulɓe » in the display face; « Ce peuple se nomme lui-même Fulɓe. Ce nom a aussi son histoire : les sources proposent cinq explications de son origine, sans que l'une l'emporte. »; an outlined button, 44 px, « Lire l'histoire du nom Fulɓe », which does what « Voir » does. It is not the solid ocre button: the page keeps one solid action.
c. On search-bassa, only the third subject (the Basaa of Cameroon) gets the tile, without a count: « Ce peuple se nomme lui-même Basaa. Ce nom a aussi son histoire. » and « Lire l'histoire du nom Basaa ». No tile on search-state-thin (« wolof »: the searched name is the self-name), and none once the self-name is open.
d. Draw search-peul with Fulɓe open: its timeline from the top, its explanations tile, no hand-off, and the closing band about Fulɓe: « Aucun récit transmis oralement n'est enregistré pour le nom Fulɓe. » and « Avant sa plus ancienne trace connue du projet, l'histoire du nom Fulɓe reste à écrire. »

CHANGE 2 — ONE VIDEO MADE ON THE SUBJECT
After the hand-off tile (directly after the end line when there is none), one compact row: a 9:16 poster 64 px wide at 430; eyebrow « Une vidéo sur ce peuple »; the title « D'où vient le nom « Fulbe » ? » with the action link's arrow, as on the next-step cards; the duration « 2 min 35 »; the whole row one link, 44 px tall at least. One row per page; the other pieces stay in the « Shorts » filter. No row and no empty slot when no piece is made on the subject. At 768 and 1440 the row keeps the reading column's width, poster on the left. Reuse the shelf card's poster and type.

CHANGE 3 — THE SOURCES BUTTON
Keep the diamond and its colour. After it, a visible label: « Source » for one source, « Sources » for several, no count. 16 px, weight 600, in an ink that reaches 4.5:1 on the tile ground; the diamond alone carries the family colour. Diamond and label are one button, joined to the passage's last word by a no-break space so they wrap together, with a 44 × 44 touch target from padding that does not change the passage's line height. Its screen-reader name starts with the visible label: « Source : Publication académique, voir les sources », « Sources : Publication académique et 3 autres, voir les sources ». The source sheet does not change. On Main, draw a one-source passage, a several-source passage, an oral-tradition passage, and a label that wraps to the next line with the last word.

CHANGE 4 — TWO TILES OF THE SAME PERIOD
When tiles in a row carry the same period label (search-peul: two « Usage contemporain »; search-congo: two « Rapporté en 2025 »), print the period once, on the first; the next tiles join it, each its own statement with its own sources button, separated by a hairline. Never merge their texts or drop one. A birth tile, a « before the name » tile and an explanations tile never join another tile.

CHANGE 5 — THE FILED NAME
On search-peul, « Voir la fiche complète · Fula (Fulbe / Peul) » becomes « Voir la fiche complète · Peul ».

Do not: quote, rank or crown an explanation; add « la plus probable » or a tier word; move Peul out of first place or open Fulɓe by default; jump to the explanations without the name's introduction; autoplay a video, add a second row or show an « Autour de ce nom » piece here; put a count next to « Sources » or one mark per source type; redraw the approved components.

Then reread the whole canvas: all boards share ea-live.css. Deliver the changed boards, labelled, and report the y of the hand-off tile and of the video row on search-peul-430, the measured target of the sources button, the label's contrast ratio, and each board's height at 430 before and after. After that, list in 5 lines every choice you made that I did not specify, so I can reject any of them. Then wait for my approval.
```

## After approval

Per `docs/design/mockup-first-workflow.md`, step 4: copy `project/*.dc.html`,
`canvas.json`, `ea-live.css` and `assets/` into `docs/design/mockups/site/`,
add an « Approved boards » section to `11-result-page-self-name-handoff.md`,
add a row to « Changes since the record » in
`docs/design/mockups/site/README.md`, apply the two approved amendments to
`docs/design/search-result-charter.md`, and update the verbatim part of
`ea-live.css` in the same commit as any change to `src/styles/`. Only then does
implementation start.
