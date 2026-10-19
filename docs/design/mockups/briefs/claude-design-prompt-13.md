# Claude Design prompt, step 13 — brief 13, one search and its page (pass 4)

Text to paste in the **same Claude Design conversation** as the earlier briefs,
on the site canvas (<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>), with
the EthniAfrica Design System selected. It starts brief 13
([`13-search-entry.md`](13-search-entry.md)). Procedure:
`docs/design/mockup-first-workflow.md`.

Do not send it before brief 6 is approved and recorded: one brief at a time
on the canvas.

## Text to paste

```text
We start brief 13: one search component, the same on every page, the header search full screen on mobile, and a page for the search itself. Briefs 1 to 6 and 9 to 12 are approved: do not touch the result boards (search-peul, search-bassa, search-congo, search-unknown, search-state-*), any fiche board, about or approach. Same rules as before: mockups first, 430 px then 768 then 1440, real French copy drawn word for word, existing tokens only, a source shows its type and never a tier, no name is crowned, the site never affirms, and no figure of style in any label (operator rule, 17 October). Work in the same canvas.

The full brief is in the public repository, branch recette: docs/design/mockups/briefs/13-search-entry.md. Read it before drawing.

STEP 0 — before changing anything, reply in 8 lines: where Main draws a search field today and in how many variants; whether home-430 shows suggestions under its field; whether any board draws the header search open; which chip style the home uses for « Essayez avec »; whether Main has a full-screen sheet at 430. Change nothing yet.

PART A — THE COMPONENT, on Main, four states at 430, 768, 1440: empty; typing « pe » with suggestions; typing « zzq » with none; submitted.
1. Label « Quel nom cherchez-vous ? ». Placeholder « Un peuple, une langue, un pays, un nom de famille… ».
2. Suggestions for « pe », alphabetical, each line the name in bold, then a plain note, then the kind:
   Pedi · se nomme lui-même Bapedi · peuple
   Pepel · nom que se donnent les Papel · peuple
   Pessy · un nom des Kpelle · peuple
   Peul · se nomme lui-même Fulɓe · peuple
   Peuls du Macina · Fulɓe du Maasina · peuple
   Last line: « Toutes les réponses pour « pe » ».
3. No suggestion: « Aucun nom ne commence par « zzq ». Lancer la recherche quand même ».
These five lines are the target behaviour; the search API does not answer them yet. Invent no other name.

PART B — THE HEADER SEARCH, on Main, at 430: the header icon opens the component full screen, field focused at the top, « Fermer » on the right, no title. At 768 and 1440 it stays a dialog.

PART C — THE SEARCH PAGE. New boards search-entry-430, -768, -1440, titled « Page de recherche (sans requête) », in the « 1 · Search » group and in canvas.json. Top to bottom: the component, empty and focused; « Essayez avec » with Shenouda, Siwi, Suri, Tchad and « Autres exemples », as on the home board (changed after step 0, see the brief); « Cherchés cette semaine » with chips Peul, Lingala, Côte d'Ivoire, Bantou, Guinée; the footer (state B). No hero band, no breadcrumb.

Do not: redraw the result boards, add a suggestion that opens a fiche directly, show a count of searches, or put a figure of style in a label.

Deliver: the changed Main and the three new boards, labelled. Then measure search-entry-430 block by block. Then list in 5 lines every choice you made that I did not specify. Then wait for my approval.
```
