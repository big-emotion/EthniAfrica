# Brief 13 — One search, the same everywhere, and its page

Read [`README.md`](README.md), [`01-result-page-timeline.md`](01-result-page-timeline.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-18. Status: **scope and boards approved by the operator on
2026-10-18.** Prompt: [`claude-design-prompt-13.md`](claude-design-prompt-13.md).

This is **pass 4**, the first of three passes the operator approved on
2026-10-18 after the mobile review of the Atlas, result and search pages
(review artifact: <https://claude.ai/artifact/2J9oSfX5UDi9soxY8MokRU>). Pass 5
is [brief 14](14-atlas-names-page.md), pass 6 [brief 15](15-result-page-shorter.md).
It starts once the canvas is free: brief 6 must be approved and recorded first.

## Decisions the operator took on 2026-10-18

1. **One destination for a suggestion.** Choosing a suggested name opens the
   result page for that name, at its own address
   (`/fr/atlas/recherche/<nom>`) when it has one, `?q=` otherwise. It never
   opens the fiche directly. The fiche is one tap further, from the result page.
2. **The searched names of the week are public**, under the rules in part C.
3. **No figure of style** in any label (2026-10-17, see
   [`reader-facing-register.md`](../../../editorial/reader-facing-register.md)).

## Why

Measured on the production site at 430 px on 2026-10-17:

- **Three search entries, three labels.** The home asks « Quel nom
  cherchez-vous ? » with the placeholder « Ex. : Keïta, Lingala, Fulbe, Bénin ».
  The header icon opens a dialog titled « Recherche » with « Rechercher une
  famille, un peuple ou un pays... », which leaves out languages and names.
  The bare page `/fr/atlas/recherche` says « Cherchez un peuple, une langue, un
  pays, une famille linguistique ou un nom » with « Ex. Bafut, Fulfulde,
  Namibie, Keïta ».
- **Two behaviours.** A suggestion chosen in the header dialog opens the fiche
  (`SearchModalV2.tsx`, `router.push(ficheHrefFor(...))`); the same suggestion
  on the home opens the result page (`HomeHeroSearch.tsx`, `suggestionHref`).
- **The bare page is empty.** About 200 px of field and button, then the
  footer: no example, no help while typing.
- **No search form reaches the name's address.** All three submit to `?q=`.
  The address `/fr/atlas/recherche/<nom>`, rendered on the server and listed in
  the sitemap (ETNI-2044, REQ-200), is only reached from links inside a result
  page.
- **Readers grope.** The audit of 2026-10-13 counts 3.8 searches per searcher
  and 137 `search:submit` for 13 result clicks in a week.

## What the suggestions can show: real data

`/api/v2/search` is a full-text search, not a name list. Asked on 2026-10-18:

| Typed | What comes back first |
| --- | --- |
| `pe` | no people; countries (Botswana, Burkina Faso…) and family names (Pereira, Idris…) whose text matches |
| `peu` | peoples whose text says « peuple » (Ngbande, Taizi…); `nearNames` gives « Peul », « Pedi » |
| `peul` | Peul, Fulɓe du Maasina; `nearNames` gives « Pedi », « Papel » |

So the suggestion list on the boards is **the target behaviour**, not what the
API answers today. The names whose history the corpus tells start with `pe`
for five peoples, and each fiche's summary names the self-name:

| Typed name | Fiche | What its summary says |
| --- | --- | --- |
| Peul | PPL_FULA | « … un peuple qui se nomme lui-même Fulɓe, et Pullo pour une seule personne. » |
| Peuls du Macina | PPL_FULANI_MASSINA | « Le nom Fulɓe Maasina désigne les Fulɓe, ou Peuls, du Maasina… » |
| Pepel | PPL_PAPEL | « … qui se nomme lui-même Pepel. » (the fiche is filed « Papel ») |
| Pessy | PPL_KPELLE | one of the names of the Kpelle, « qui se nomme lui-même Kpelle » |
| Pedi | PPL_PEDI | « … qui se nomme lui-même Bapedi. » |

The implementation needs a name-prefix source. The name-address directory
(`getNameAddressSpellings`, `src/lib/search/nameAddress.ts`) already lists every
addressed spelling; the brief does not choose the back end, it only draws what
the reader sees.

**A gap to fix with it:** `Fulɓe` has no address (`/fr/atlas/recherche/Fulɓe`
and `/fulbe` both answer 404), while « fulbe » is searched three times in 28
days (demand journal 2026-10-18). `?q=fulbe` does answer. A suggestion for
`ful` must lead to the Fulɓe answer either way.

## A. One search component

**Boards:** `Main` gains the component in four states, at 430, 768 and 1440:
empty, typing with suggestions, typing with no suggestion, submitted.

1. **One label and one placeholder everywhere.** Label « Quel nom
   cherchez-vous ? » (a real question to the reader, not a figure).
   Placeholder « Un peuple, une langue, un pays, un nom de famille… ».
2. **Each suggestion line** shows the name, then the self-name when the fiche's
   summary names a different one, then the kind. Example lines for `pe`, in
   alphabetical order, from the table above:
   - **Pedi** · se nomme lui-même Bapedi · peuple
   - **Pepel** · nom que se donnent les Papel · peuple
   - **Pessy** · un nom des Kpelle · peuple
   - **Peul** · se nomme lui-même Fulɓe · peuple
   - **Peuls du Macina** · Fulɓe du Maasina · peuple
3. **Last line:** « Toutes les réponses pour « pe » », which submits.
4. **No suggestion:** the line « Aucun nom ne commence par « zzq ». Lancer la
   recherche quand même », which submits; the unknown-name page of brief 12
   follows.
5. The searched form stays in the field on the result page (unchanged).

## B. The header search on mobile

**Boards:** `Main`, the header at 430 with the search open.

Below 768 px the header icon opens the component **full screen**, the field
focused at the top, a close button « Fermer » on the right. Above 768 px it
stays a dialog. The title « Recherche » goes: the label of the component says
what the screen is for.

## C. The search page

**New boards:** `search-entry-430`, `search-entry-768`, `search-entry-1440`,
titled « Page de recherche (sans requête) », in the « 1 · Search » group and in
`canvas.json`. Surface: `/fr/atlas/recherche` with no query.

Top to bottom:

1. The component of part A, empty, focused.
2. « Essayez avec », the home's example chips, unchanged: Koroma, Four, Lamba,
   Guinée équatoriale. « Autres exemples » as on the home.
3. « Cherchés cette semaine », chips of names readers searched, each opening
   its result page. Board values, from the demand journal of 2026-10-18 (28
   days, `surface = serp`): **Peul, Lingala, Côte d'Ivoire, Bantou, Guinée**.
   Rules for the implementation, to write in the brief's approval record:
   - only a term that answers an entity of the corpus exactly (never a
     zero-result term, never a misspelling);
   - only a term searched by at least three visitors in the window, so a
     person's own name searched once never shows;
   - at most six chips, refreshed by the nightly demand pass;
   - nothing when no term qualifies: the block disappears.
4. The footer.

No hero band, no breadcrumb: the page is the search.

## Not to touch

Every result board (`search-peul`, `search-bassa`, `search-congo`,
`search-unknown`, the `search-state-*` boards), every fiche board, `about`,
`approach`. The home's search changes only by reusing the component of part A:
redraw `home` only where the component differs from today's.

## Acceptance (for the implementation, after approval)

- Given a reader on any page, when they open the search and choose a
  suggestion, then the result page for that name opens, at its address when it
  has one.
- Given the home, the header and `/fr/atlas/recherche`, when a reader looks at
  the search field, then the label and placeholder are the same on the three.
- Given a term searched by fewer than three visitors, when the nightly pass
  runs, then it never appears in « Cherchés cette semaine ».
- Given `ful`, when the suggestions show, then one of them leads to the Fulɓe
  answer.

## Approved boards (2026-10-18)

Recorded in `docs/design/mockups/site/`. The operator approved the boards on
2026-10-18 with one change: the placeholder is « Un peuple, une langue, un
pays… » everywhere the component appears. It fits at 430 px on the page and in
the full screen (253 px of text for 312 px of field); the label « Quel nom
cherchez-vous ? » already covers family names.

- `Main`, section « Composants · recherche unique (brief 13) »:
  - the component in four states, each at 430, 768 and 1440: empty; « pe »
    with the five suggestions of part A (target behaviour, the API does not
    answer them yet); « zzq » with « Aucun nom ne commence par « zzq ». Lancer
    la recherche quand même »; submitted, « peul » kept in the field;
  - the header search at 430, full screen, empty and with « pe »: the label
    line carries « Fermer » on the right, no title;
  - the header search at 768, a dialog with the same component.
- `search-entry` at 430, 768 and 1440 (new), « Page de recherche (sans
  requête) »: the component, empty and focused; « Essayez avec » with the
  home's examples (Shenouda, Siwi, Suri, Tchad) and « Autres exemples »;
  « Cherchés cette semaine » with Peul, Lingala, Côte d'Ivoire, Bantou,
  Guinée; footer B. No hero band, no breadcrumb.
- `ea-live.css` gains the `.ea-q-*` component, the sheet and dialog, and the
  `.ea-entry` page. New selectors only, tokens only.

Choices made while drawing, kept by the operator:

1. The component is the home's field: visible label, magnifier, « Rechercher »
   under the field at 430 and beside it from 768. The label is left-aligned
   everywhere; the focused field has an ocre border and the focus ring.
2. The suggestions open in a floating panel under the field, the first line
   highlighted for the keyboard: the name in bold, the note in soft text, the
   kind in small mono type on the right. « Toutes les réponses pour « pe » »
   is an underlined link; « Effacer » appears once something is typed.
3. Submitted: the searched form stays in the field, the list is closed.
4. The full screen and the 768 dialog have no dark overlay: no token exists for
   one. The dialog is 640 px wide at most, on the page's warm ground.
5. `search-entry` holds a centred 640 px column; the chips are left-aligned and
   wrap; the two leads are in semibold ink; the weekly chips are links in the
   examples' style; the header keeps its magnifier.

Measured at 430 px on a render without the Google fonts: header 61, component
152, « Essayez avec » 128, « Cherchés cette semaine » 128, margins 128 (536 px
of content), footer 1,415, page 2,012.

The home's examples are drawn from the approved home board. The brief's first
list (Koroma, Four, Lamba, Guinée équatoriale) was dropped: the Koroma fiche
was merged into `PAT_KOUROUMA` on 2026-10-16.
