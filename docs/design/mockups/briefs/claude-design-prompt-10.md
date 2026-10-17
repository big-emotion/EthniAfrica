# Claude Design prompt, step 10 — brief 10, the fiche boards (pass 1)

Text to paste in the **same Claude Design conversation** as the earlier briefs,
on the site canvas "EthniAfrica, relevé des pages en production"
(<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>), with the EthniAfrica
Design System selected. It starts brief 10
([`10-fiche-story-link-and-folds.md`](10-fiche-story-link-and-folds.md)), the
first of the three board passes approved on 2026-10-17. Procedure:
`docs/design/mockup-first-workflow.md`.

Nothing needs attaching. Do not start before the operator has read this text
and the brief is approved. The fold depends on the REQ-153 amendment the brief
quotes: paste this only once the operator has written it, or tell Claude Design
that the fold is drawn for review, pending that amendment.

Brief 6 ([`claude-design-prompt-06.md`](claude-design-prompt-06.md)) is pasted
after this pass is approved, so `name-traore` reuses the story link from
`Main`.

## Text to paste

```text
We start brief 10: two changes to the approved fiche boards. Briefs 1 to 5 and 9 are approved: do not touch the search boards, the about and approach pages, or name-traore (brief 6 owns it and comes next). The same rules as before apply: mockups first, 430 px then 768 then 1440, real French copy drawn word for word, existing tokens only, a source shows its type and never a tier, no name is crowned, the site never affirms. Work in the same canvas and edit the existing boards.

The full brief is in the public repository, branch recette: docs/design/mockups/briefs/10-fiche-story-link-and-folds.md. Read it before drawing.

STEP 0 — before changing anything, reply in 10 lines: which boards you can see (people-fula, people-bassa, people-thin-alaba, language-lingala, language-thin-havu, family-bantu, family-mande, country-civ, country-state-civ-quaqua, country-state-thin-gab, country-state-shared-congo, at 430, 768 and 1440, and Main); each board's height at 430; for each board, the y at 430 where the story link would land in the place given below; the height at 430 of each chapter that folds; and which disclosure Main already draws that the fold control can reuse. Change nothing yet.

BOARDS TO CHANGE, each at -430, -768 and -1440:
- story link and folds: people-fula, people-bassa, people-thin-alaba, country-civ, family-bantu, family-mande;
- story link only: language-lingala, language-thin-havu, country-state-civ-quaqua, country-state-thin-gab, country-state-shared-congo;
- Main: the story link and the fold control, once each, plus a note for a fiche with no name story (no link).

CHANGE 1 — THE LINK TO THE NAME'S STORY
One action link, the same on every type, in the first chapter: « Suivre l'histoire du nom Fulɓe », label then the action link's arrow, no container, 16 px weight 600, 44 px tall. Under it, in caption size: « La page du nom présente ce que disent les sources : qui l'a donné, à qui, quand et pourquoi, en remontant le temps. » No badge, no card, no new colour, no second glyph.
Names: people-fula Fulɓe; people-bassa Bassa; people-thin-alaba Halaba; language-lingala Lingala; language-thin-havu Kihavu; family-bantu Bantou; family-mande Mandé; country-civ and country-state-civ-quaqua Côte d'Ivoire; country-state-thin-gab Gabon; country-state-shared-congo Congo.
Place, at 430:
- people: the last line of « D'où vient le nom ? », after « voir les sources », before « Les autres noms »;
- language: the last line of « L'histoire des noms », after the name rows (and, on Lingala, after the explanations grid), before « Les sources parlent »;
- family and country: directly under the lead sentence and its « Lire la suite », before the name rows (inside « En bref » on a country board).
At 768 and 1440 it keeps the same place in the reading column. Move no other block to make room.

CHANGE 2 — A LONG CHAPTER FOLDS AFTER ITS FIRST TILE
A reference chapter of three tiles or more keeps its heading and its first tile open. The tiles after it go behind one control, where the second tile was. Its closed label names what it hides; opened, the tiles appear in place and the control reads « − replier ». The chapter never closes. On the family boards, a chapter of prose fields folds the same way, its first field standing for the first tile. Reuse a disclosure Main already has; add a component only if none fits, and say which.
- people-fula and people-bassa: « Langue »: « Langue principale » open, « Voir aussi : Famille, Parlers, Rôle véhiculaire ». « Histoire »: « Formation et origines » open, « Voir aussi : Royaumes & chefferies, Influences extérieures, Conflits & alliances, Diaspora ». « Culture et société »: « Rites » open, « Voir aussi : Symboles, Arts et musique, Spiritualités, Organisation ».
- people-thin-alaba: the same, « Histoire » folding « Royaumes & chefferies, Influences extérieures, Conflits & alliances ».
- country-civ: « Histoire »: « D'où vient le nom » open, « Voir aussi : 5 entités politiques, Royaume de Kong, Colonie de Côte d'Ivoire, République de Côte d'Ivoire ». « Culture et société »: « Religions » open, « Voir aussi : Modes de vie, Organisation, Relations, Traditions ». « Noms de personnes rattachés à ce pays »: the group « Attestés dans le pays · 47 noms » keeps its title and count, and its A to Z index and names go behind one control, « Voir les 47 noms »; the second group stays a closed tile.
- family-mande: « Caractéristiques linguistiques »: « Typologie » open, « Voir aussi : Traits phonologiques, Relations avec les voisins ». « Histoire et origines »: « Origine probable » open, « Voir aussi : Période d'émergence, Diffusion, Ruptures historiques, Zones de contact, Événements majeurs ».
- family-bantu: « Caractéristiques linguistiques »: « Typologie » open, « Voir aussi : Traits phonologiques, Relations avec les voisins, Innovations majeures ». « Histoire et origines »: « Origine probable » open, « Voir aussi : Période d'émergence, Diffusion, Ruptures historiques, Zones de contact ».
Never fold: « D'où vient le nom ? », « Les autres noms », « L'histoire des noms », « Qui raconte… », « Appellations et décolonisation », « D'où vient le nom de la famille », « Où vit ce peuple », « Peuples liés », « Peuples du pays », « Langues », the closing band, « Poursuivre avec un autre nom », « Sources ». « Poursuivre avec un autre nom » stays where it is, at the end: move no chapter.

CHANGE 3 — THE FILED NAME « PEUL »
Replace « Fula (Fulbe / Peul) » by « Peul », word for word otherwise: the people-fula breadcrumb (« Fulbe (pluriel), Pullo (singulier) — Peul »), the country-civ preview of « Portés par les peuples du pays, sans attestation ici » (« Par Hausa, Akan, Asante, Bambara, Peul, Malinké, … »), and on Main the fiche-head breadcrumb and the button « Voir la fiche complète · Peul ».

TO REPORT, DO NOT CHANGE
a. On country-civ, the first tile of « Histoire », « D'où vient le nom », repeats the lead sentence of « L'histoire des noms » word for word; it is the tile the rule leaves open.
b. On the family boards, « D'où vient le nom de la famille » is one paragraph that repeats what « Lire la suite » opens in « L'histoire des noms ».
c. The Fula h1 writes Fulbe and the name story Fulɓe; the Havu h1 leads with Havu and the name story holds Kihavu. The link follows the name story; say if that reads wrong on the board.

STATES TO DRAW (430 first, then 768 and 1440)
- every board with the story link, and the six fold boards with every fold closed;
- people-fula with « Culture et société » open (the four tiles in place, « − replier »);
- country-civ with « Voir les 47 noms » open;
- on Main, a note for a fiche with no name story: no link.

Do not: move the closing band, « Poursuivre avec un autre nom » or any chapter; fold a chapter about the fiche's own names or close a chapter whole; write a control that hides without naming (« Voir plus »); give the story link a badge, card, colour or second glyph; show a tier or a score; redraw the approved components.

Then reread the whole canvas: all boards share ea-live.css. Deliver the changed boards, labelled, and report each board's height at 430 before and after, the y of the story link and the y of « Poursuivre avec un autre nom » before and after. After that, list in 5 lines every choice you made that I did not specify, so I can reject any of them. Then wait for my approval.
```

## After approval

Per `docs/design/mockup-first-workflow.md`, step 4: copy `project/*.dc.html`,
`canvas.json`, `ea-live.css` and `assets/` into `docs/design/mockups/site/`,
add an « Approved boards » section to `10-fiche-story-link-and-folds.md` as the
earlier briefs have, add a row to « Changes since the record » in
`docs/design/mockups/site/README.md`, and update the verbatim part of
`ea-live.css` in the same commit if `src/styles/` is touched. Then paste
`claude-design-prompt-06.md`. Only then does implementation start.
