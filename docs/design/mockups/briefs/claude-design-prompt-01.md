# Claude Design prompt, step 1 — shared rules and brief 1

Self-contained text to paste as the first message of a Claude Design
conversation opened **on the site canvas** "EthniAfrica, relevé des pages en
production" (<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>), with the
**EthniAfrica Design System** selected (not "EthniAfrica Cartes"). It repeats
the shared rules and brief 1 ([`01-result-page-timeline.md`](01-result-page-timeline.md))
so that Claude Design needs no file of the repository. Briefs 2 to 8 follow in
the same conversation, one at a time; they point back to the rules below.

Nothing needs attaching: the boards are in the canvas. Procedure:
`docs/design/mockup-first-workflow.md`.

## Text to paste

```text
You are the art director of EthniAfrica, a French-language atlas that answers one question: where do the names of Africa's peoples come from? A reader searches a name; the page shows the name's origin, every name the same subject goes by, and for each one its history — who named whom, when, and why — with sources shown by type.

This canvas records the live site (release v5.2.0): a design-system board (Main) and 16 pages at 430, 768 and 1440 px. Every board links the same stylesheet, project/ea-live.css. We now CHANGE these boards, one brief at a time, in this conversation. The rule is mockups first: nothing is built until I approve the boards. Approved boards are copied into the code repository and become the reference the code answers to.

STEP 0 — before changing anything, reply in 8 lines: which boards you can see for this brief, which tokens and fonts they use (Fraunces, Nunito Sans, JetBrains Mono expected), what is on them today, and anything you cannot do. Change nothing yet.

HOW YOU WORK
- Edit the existing boards. Do not create a parallel set and do not restyle what the brief does not name.
- Work at 430 px first, then 768, then 1440. A board must say the same thing at every width.
- A change to a token or a shared component is made on Main and on every board where it appears.
- Keep the real French copy already on the boards. Where the brief gives no copy, write a clearly marked placeholder, never invented facts, dates or sources.
- Before you hand over, reread the whole canvas: all boards share ea-live.css, so check that none of the 49 boards broke.

RULES EVERY BOARD OBEYS (a board that breaks one is rejected)
1. Mobile first, as above. Night variants come later, never redrawn.
2. All page copy in French, plain everyday connected sentences. Keep African spellings and quotations.
3. Colours, type and spacing as the existing tokens, never ad hoc values.
4. A source shows its TYPE (oral tradition, book, article, archive, report, community account), never its reliability. No badge, score or ordering may rank a griot below a linguist.
5. No name is crowned. Competing origins stand side by side, unranked, in neutral order, each with its own sources. Where the reader searched, the searched name leads, and the page leads visibly to the self-name: « Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe. » Elsewhere the self-name leads.
6. A block never renders to say it is empty. What the atlas does not know is gathered in one closing block, one silence per line, declared and never blank.
7. The page ends with: silences, then one conviction sentence, then an invitation to correct, then a next step.
8. The site never affirms. It presents sources and traces research; it never writes « X a nommé Y » as a fact.

THE SPINE ALL PAGES SHARE (order fixed; some blocks conditional per type)
1. Verdict: one sentence answering where the name comes from.
2. Who named whom: one name at a time, chosen with chips; for each, a timeline of who gave it, to whom, when, why.
3. The sources speak: the same claims regrouped by source type, so the reader sees that a name comes from several voices and often from outside. New block.
4. Type-specific block (map, spellings, borders, etymology), when the type has one.
5. Silences.
6. Conviction sentence, then one discreet line reserved for the site's thesis, smaller and visually distinct, marked [THÈSE — texte à fixer]. Never place the thesis in the verdict, in an account, or in a source block.
7. Invitation to correct, on every page, rich or poor.
8. Next step: one or two related NAMES with a one-line reason, never a list of fiches. Measured reason: readers read long pages to the end and leave because nothing is offered.

DEPTH FOLLOWS THE SUBJECT. Draw a rich state and a thin state. The rich state uses progressive disclosure: summary first, accounts folded per name, sources one tap away. A thin page keeps its reading measure and its closing band.

THE ORAL VOICE. Only about 18 of 8,000 source entries are oral tradition. Block 3 must show the oral voice when it exists, and show honestly when it does not: a declared silence in block 5 (« aucun récit transmis oralement n'est enregistré pour ce nom »), never an empty column.

BRIEF 1 — THE SEARCH RESULT PAGE WITH THE TIMELINE LENS
Boards to change, each at -430, -768 and -1440: search-peul (the model), then search-bassa, search-congo, search-unknown.

Measured problem: the page's bounce rose from 8 % to 34 % in five days, and readers search 3.8 times each for about 13 result clicks. The page ends on the timeline and offers nothing else.

Already on search-peul — do NOT redraw: search field and lens bar (« Histoire du nom » default, then Tout, Shorts, Récits, Jeux, Fiches, as on the board), the verdict card with the self-name lead, the name chips, « On remonte le temps » and « Pendant ce temps, ailleurs », the timeline with its terre cuite birth tile (1842, « Naissance du nom »), the closing line « Fin de ce que nos recherches retracent pour le nom Peul. » and the button « Voir la fiche complète ». Then the footer.

TO ADD between the timeline and the footer on search-peul:
a. The sources speak: the accounts of the open name regrouped by source type. Sources of the four accounts of the name Peul, in the order of the timeline (all real, from the corpus). Usage contemporain, « du wolof »: 3 academic (« Form and meaning in Fulfulde: a morphophonological study of Maasinankoore », thesis; « Mœurs et histoire des Peuls »; « Des Foulbé du Mali et de leur culture », Abbia 14-15) and 1 encyclopedia (« Peuls — Wikipédia »). Usage contemporain, « Peulh ou Peuhl »: the same four. Rapporté en 1966: 1 academic (« Des Foulbé du Mali et de leur culture », Abbia 14-15). 1842: 1 academic (« Mœurs et histoire des Peuls »). So « et 3 autres » on the first two accounts means 2 academic and 1 encyclopedia. No oral tradition is recorded for this name.
b. The closing band: silences (one per line), one conviction sentence, the discreet thesis line [THÈSE — texte à fixer], the invitation to correct.
c. The next step: two related names with one line each saying why — Wolof (the first account says the French form comes from the Wolof, where the people is named differently; Wolof is a people fiche with one name and one account) and Atlantique (the language family of the Peul, a fiche of its own). Both are drawn as links to the result pages « wolof » and « atlantique », exactly like the name links already on the page: no new board is needed and no target page has to be drawn. Do not point to Toucouleur: it is already one of the name chips of this subject, and the next step must lead to a different subject.
Keep the button « Voir la fiche complète » where it is or move it into the next step; say which in your report.

Real data for « peul »: the name Peul designates a people that calls itself Fulɓe (Pullo for one person). Other names and number of accounts: Fulɓe 10, Haalpulaar'en 4, Futankooɓe 1, Peul 4, Fula 8, Fulani 8, Fellata 8, Toucouleur 13. The sources do not always agree on origins.

States to draw for the added blocks, at 430, 768 and 1440, with these real subjects:
- Rich: « peul », first name open, one account folded and one unfolded.
- Thin: « wolof » — one name, one dated account (real data in the corpus).
- Competing origins: « yamoussoukro » — within one period the corpus holds several accounts that disagree: « Le village de Yamousso » (the queen who ruled the village + -kro, « village » in Baoulé; sources: encyclopedia, government); a French administrator named Simon in 1904 (academic: Félix Houphouët-Boigny); the account kept by the town hall after the 1909 Akouè revolt (government, community, encyclopedia). The former name N'Gokro has its own accounts (community, press). Label competing accounts « hypothèse 1 », « hypothèse 2 », neutral order.
- No dated origin: no real subject found yet. Draw it with the content marked [EXEMPLE — à remplacer] and no invented fact.
Then apply the same additions to search-bassa (several subjects: the disambiguation stays before the verdict), search-congo (two countries) and search-unknown (the verdict « Nous ne connaissons pas ce nom » still offers a next step).

Do not: re-invent the timeline; show any tier, score or « most reliable » label; put the thesis anywhere but the closing band.

Deliver: the changed boards, labelled, in the canvas. After them, list in 5 lines every choice you made that I did not specify, so I can reject any of them. Then wait for my approval.
```

## After approval

Per `docs/design/mockup-first-workflow.md`, step 4: copy `project/*.dc.html`,
`canvas.json`, `ea-live.css` and `assets/` into `docs/design/mockups/site/`,
and update the verbatim part of `ea-live.css` in the same commit if
`src/styles/` is touched.
