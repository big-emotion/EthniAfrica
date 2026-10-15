# Claude Design prompt — brief 9, « Notre démarche »

Text to paste in the Claude Design conversation of the site canvas,
"EthniAfrica, relevé des pages en production"
(<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>), with the EthniAfrica
Design System selected. It starts brief 9 ([`09-our-approach.md`](09-our-approach.md)).
Procedure: `docs/design/mockup-first-workflow.md`.

This is the site canvas, not « EthniAfrica Cartes ». The social cards'
signature-line brief (1.5.0-proposition) goes to « EthniAfrica Cartes ».

Nothing needs attaching. Do not start before the operator has read this text.

## Text to paste

```text
We start brief 9: a new page, « Notre démarche », which carries the project's message on the site. The same rules as the earlier briefs apply: mockups first, 430 px then 768 then 1440, real French copy drawn as given, existing tokens only, a source shows its type and never a tier. The site never affirms, except in the one signed section this page has. Work in the same canvas.

The full brief, with the page's final copy, is in the public repository, branch recette: docs/design/mockups/briefs/09-our-approach.md. Read it before drawing. The copy is final and passed our plain-language check: draw it word for word, and tell me if anything does not fit.

STEP 0 — before changing anything, reply in 6 lines: whether you can see about-430, about-768, about-1440 and Main; how « À propos » sets « Notre conviction » apart from the rest of its page; where the footer's tagline « L'Afrique à travers ses noms » and the « Le projet » column sit at 430 px; and which display face and size the about page's lead uses. Change nothing yet.

BOARDS TO CREATE: approach-430, approach-768, approach-1440, in group « 4 · Other pages », beside about. Add them to canvas.json.
BOARDS TO TOUCH: about-430/768/1440 (one link only); the footer on Main and on the three new boards (two states, see below).
DO NOT TOUCH: name-traore or any family-name board (another piece of work owns that template); the search, people, language, family and country boards.

THE PAGE, top to bottom:
1. Head. The title « Notre démarche ». Then the lead, which is the project's signature line: « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. ». Set it as the page's one display sentence, in sentence case, not in capitals: on the site it is a sentence, not a slogan. Then the intro: « Cette phrase termine chacune de nos vidéos et chacun de nos carrousels. Cette page explique d'où elle vient et ce qu'elle veut dire. » No image.
2. Five sections, in the brief's order: « L'Afrique n'est pas un seul bloc », « Chaque peuple a son nom », « Tous les noms ne sont pas venus de l'extérieur » (ending on two links, « Le nom Kouassi » and « Le nom Yao »), « Décoloniser leur emploi », « Notre position ». Use the reading measure and rhythm of the about page.
3. « Notre position » is a signed opinion, not a sourced fact. Set it apart the way the about page sets « Notre conviction » apart, so a reader sees where the sourced facts end and EthniAfrica's opinion begins. Never style it like a sourced finding.
4. Sources: ten entries, as listed in the brief, each showing its type (encyclopédie, statistiques officielles, site officiel, ouvrage de référence linguistique, textes de loi, article, thèse) and never a tier. At 430 px they fold behind one line, like the source chapters of the fiches.
5. Closing: « Chercher un nom », « Comment nous travaillons », « Signaler une erreur ». No silences block: this is not a fiche.
At 768 and 1440 keep the same order and measure: wider screens add margin, not columns.

ABOUT: in « Notre conviction », after its two paragraphs, add one link « Lire notre démarche ». Change none of its text.

FOOTER: draw two states on Main and on the three new boards.
A — one more link « Notre démarche » in the « Le projet » column, after « À propos ».
B — A, plus the signature line under the tagline « L'Afrique à travers ses noms », smaller than the tagline.
My brief recommends B: the footer is the site's equivalent of an account's bio, and the bio carries the line. Show both so I can judge whether the two sentences compete at 430 px. Do not spread either state to the other boards until I choose.

Do not: show a tier, a score or a « most reliable » label; put the signature line in capitals on the site; add an image or an illustration I did not ask for; fill the fiches' [THÈSE — texte à fixer] slot.

Deliver: the three new boards and the touched ones, labelled, in the canvas. After them, list in 5 lines every choice you made that I did not specify, so I can reject any of them. Then wait for my approval.
```

## After approval

Per `docs/design/mockup-first-workflow.md`, step 4:

1. Copy `project/*.dc.html`, `canvas.json`, `ea-live.css` and `assets/` into
   `docs/design/mockups/site/`.
2. Fill « Approved boards » in `09-our-approach.md`, and record the
   operator's footer choice there.
3. If `src/styles/` is touched, update the verbatim part of `ea-live.css` in
   the same commit.

Only then does implementation start: the route `/fr/notre-demarche`, its copy
in `src/lib/i18n/copy/`, its tests first, and the footer. Compare at 430, 768
and 1440 before merging.
