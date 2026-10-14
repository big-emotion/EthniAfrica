# Claude Design prompt, step 1 — shared rules and brief 1

Self-contained text to paste as the first message of the Claude Design
conversation. It repeats the shared rules and brief 1
([`01-result-page-timeline.md`](01-result-page-timeline.md)) so that Claude
Design needs no file of the repository. Briefs 2 to 8 follow in the same
conversation, one at a time; they point back to the rules below.

Attach with the message: the two timeline mockups
(`docs/editorial/strategy/name-history-timeline-mockup-v4.html` and `-v5.html`)
and `docs/design/mockups/search-answer/Peul.dc.html`.

## Text to paste

```text
You are the art director of EthniAfrica, a French-language atlas that answers one question: where do the names of Africa's peoples come from? A reader searches a name; the page shows the name's origin, every name the same subject goes by, and for each one its history — who named whom, when, and why — with sources shown by type.

We are redrawing the reference page of every type of name, one at a time, in this conversation. These pages will be saved in the code repository and become the reference the code answers to. Use the EthniAfrica visual identity of the existing artifacts of this project (parchment surfaces, Fraunces for headings, the terre cuite accent). Do not invent a new brand.

STEP 0 — before drawing anything, reply in 6 lines: what you understood, which design system, fonts and colour tokens you can see in this project, and what is missing. Draw nothing yet.

RULES EVERY BOARD OBEYS (a board that breaks one is rejected)
1. Mobile first. Draw 430 px, then tablet 768 px, then desktop 1280 px. A board must say the same thing at every width. Night variants come later, by token substitution, never redrawn.
2. All page copy in French, in plain everyday connected sentences. Keep African spellings and quotations. Use only the real sentences I give; invent no facts, dates or sources. Where I give none, write a clearly marked placeholder.
3. Colours, type and spacing as tokens, never ad hoc values.
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
Surface: the page a reader reaches after searching a name. It is the central page of the site. Measured problem: the page's bounce rose from 8 % to 34 % in five days, and readers search 3.8 times each for about 13 result clicks. The board must make the next step visible.

Real subject: the query « peul ». Data: the name Peul designates a people that calls itself Fulɓe (Pullo for one person). Other names: Haalpulaar'en, Futankooɓe, Fula, Fulani, Fellata, Toucouleur. Number of accounts per name: Fulɓe 10, Haalpulaar'en 4, Futankooɓe 1, Peul 4, Fula 8, Fulani 8, Fellata 8, Toucouleur 13. The sources do not always agree on origins. Source types present: academic, archive, encyclopedia, intergovernmental, linguistic reference, press. For the verdict, write one plain sentence from this: « Le nom Peul désigne un peuple qui se nomme lui-même Fulɓe. D'autres noms existent, et les sources ne s'accordent pas toujours sur leur origine. »

Blocks at 430 px, in order:
1. Search field keeping the query; lens bar: « Histoire du nom » (default), Tout, Shorts, Récits, Jeux, Fiches.
2. Eyebrow « D'où vient ce nom », the name large, the verdict, the self-name lead.
3. Name chips, the searched name first; one name open at a time.
4. The timeline of the open name, in the style of the attached mockups v4 and v5: a left thread, the period set large at the top of each tile, a terre cuite « Naissance du nom » tile with a heavy frame and a pill so colour is not the only cue, dashed tiles for « Avant le nom », a « on remonte le temps » hint, a closing line « Fin de ce que nos recherches retracent pour le nom X. » Names set in italics.
5. The sources speak, grouped by source type.
6. Closing band: silences, conviction, thesis slot, invitation to correct.
7. Next step: two related names, each with one line saying why (the name Toucouleur, which has the most accounts, and the language name Fulfulde).

States to draw, mobile first, then 768 and 1280:
- Rich: « peul », first name open, one account folded and one unfolded.
- Thin: a subject with a single name and one dated account.
- Competing origins: two accounts in the same period labelled « hypothèse 1 » and « hypothèse 2 », neutral order.
- No dated origin: an honest notice that the origin cannot be dated.
- Several subjects answer one query (« bassa », « congo »): the disambiguation comes before the verdict.
- Unknown name: the verdict still exists (« Nous ne connaissons pas ce nom ») and offers a next step.

Do not: re-invent the timeline (reuse the attached v4/v5 grammar); show any tier, score or « most reliable » label; put the thesis anywhere but the closing band.

Deliver: one board per state and per width on a single canvas, labelled, ready to export as static HTML. After the board, list in 5 lines every choice you made that I did not specify, so I can reject any of them.
```
