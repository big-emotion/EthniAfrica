# Claude Design prompt, step 2 — brief 2, the people fiche

Text to paste in the **same Claude Design conversation** as brief 1, on the
site canvas "EthniAfrica, relevé des pages en production"
(<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>), with the EthniAfrica
Design System selected. Brief 1 is approved and implemented; this message
starts brief 2 ([`02-people.md`](02-people.md)). Procedure:
`docs/design/mockup-first-workflow.md`.

Nothing needs attaching. Do not start before the operator has read this text.

## Text to paste

```text
We start brief 2, the people fiche. Brief 1 is approved and implemented: do not touch search-peul, search-bassa, search-congo, search-unknown or the three search-state boards. The same rules as brief 1 apply: mockups first, 430 px then 768 then 1440, real French copy, existing tokens only, a source shows its type and never a tier, no name is crowned, the site never affirms, the thesis only in the closing band as [THÈSE — texte à fixer] and not shown until its text is fixed. Work in the same canvas and edit the existing boards.

STEP 0 — before changing anything, reply in 8 lines: which of people-fula, people-bassa and people-thin-alaba you can see at 430, 768 and 1440; the chapters on each, in order; which chapters are open or folded today; the height of each at 430; and whether the three components approved in brief 1 (« Les sources parlent », the closing band « Ce que nous ne savons pas encore », « Poursuivre avec un autre nom ») are on Main so you can reuse them. Change nothing yet.

BOARDS TO CHANGE, each at -430, -768 and -1440: people-fula, people-bassa, people-thin-alaba. Main changes only if a shared component does.

WHAT IS ON THE BOARDS TODAY — do NOT redraw: the hero plate (self-name and searched name, description, population and countries, « Voir la carte », trail); « D'où vient le nom ? » (self-name, how it is said, tags « Leur nom », « Origine débattue », « En peul », « Les pistes sur le sens »); « Les autres noms » (one card per name with tags « Donné de l'extérieur », « En français », « Où il a été écrit »); « Où vit ce peuple », « Peuples liés », « Langue », « Histoire » (the people's history, not a second telling of the name), « Noms de personnes rattachés à ce peuple », « Culture et société »; « Poursuivre »; « Sources ». The page has no sources-by-type block, no closing band, and no invitation to correct inside the page (only the « Signaler » and « Contribuer » buttons of the chapter bar and the footer link).

WHAT TO CHANGE
1. Add « Les sources parlent » after « Les autres noms », reusing the approved component from Main: the accounts of the name grouped by the seven source-diamond families in the fixed order, oral first, the precise kind printed beside each title. On a fiche it covers all the names of the people: the first name's group open, the others folded.
2. Add the closing band « Ce que nous ne savons pas encore » before « Poursuivre », reusing the approved component: silences deduced from the data, one per line; the « Notre conviction » sentence of the About page; the invitation to correct with « Signaler une erreur » and « Proposer une source »; the thesis line hidden.
3. Turn « Poursuivre » into « Poursuivre avec un autre nom », reusing the approved component: each target with a reason, the first sentence of the target fiche's summary. Remove any link whose target does not exist. « Langue : Fulfulde » has no fiche in the corpus (the language is only a text field of the Peul fiche): do not link it, and tell me.
4. Length. people-fula is about 10,455 px tall at 430 px (11 screens), people-bassa 8,179, people-thin-alaba 7,465. Report which chapters are open or folded today, and PROPOSE, without applying it, folding the long chapters (Histoire, Culture et société, Langue) behind a one-line summary. Keep the current state on the boards until I decide.
Do not touch the hero, « D'où vient le nom ? », « Les autres noms », the map or the chapter order above the added blocks.

REAL DATA FOR THE THREE BOARDS
- people-fula (rich): 8 names. Accounts per name: Fulɓe 10, Haalpulaar'en 4, Futankooɓe 1, Peul 4, Fula 8, Fulani 8, Fellata 8, Toucouleur 13. Source kinds across them: academic, intergovernmental, archive, press, encyclopedia, linguistic reference. No oral source recorded. Family: Atlantique. 14 countries.
- people-bassa (oral voice present): one name, 4 accounts: 2 oral tradition, 2 linguistic reference, 1 academic. The oral source is « How the Bassa Got Their Name » (Heath Vogel, 2013), the account carried by Abba Karnga, Liberia, titled « Comment les Bassa ont reçu leur nom ». Show it identified by carrier and place, first in its group, on equal footing with the written sources. Summary: « On ne sait pas avec certitude quand le nom a été écrit pour la première fois. Son origine est racontée dans un récit oral que nous présentons plus bas. » Family: Krou. Countries: Liberia, Côte d'Ivoire, Sierra Leone. Because an oral account exists, the closing band must not declare the silence « aucun récit transmis oralement ».
- people-thin-alaba (thin): two names, 3 accounts: Halaba 2 (archive, intergovernmental), Alaba 1 (archive). No oral voice. Summary: a name close to it appears in chants of the 15th century; « On ne sait pas avec certitude d'où vient ce nom ». Family: Couchitique. One country: Ethiopia. Its silences come from this data, including the missing oral account. A short sources block; the next step has one or two targets only.
Invent nothing beyond this. Where a value is missing, say so in your report.

ONE MORE STATE: the entry from a social post to a name the reader did not search (the PPL_ZARMA case). Report whether the current hero already repeats the promise of the link on the first screen; do not redesign it unprompted.

Do not: show a tier, a score or a « most reliable » label; redraw the three approved components; put the thesis anywhere but the closing band.

Deliver: the changed boards, labelled, in the canvas. After them, list in 5 lines every choice you made that I did not specify, so I can reject any of them. Then wait for my approval.
```

## After approval

Per `docs/design/mockup-first-workflow.md`, step 4: copy `project/*.dc.html`,
`canvas.json`, `ea-live.css` and `assets/` into `docs/design/mockups/site/`,
add an « Approved boards » section to `02-people.md` as brief 1 has, and update
the verbatim part of `ea-live.css` in the same commit if `src/styles/` is
touched. Only then does implementation start.
