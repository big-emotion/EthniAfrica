---
title: "Name-history timeline: the default lens of the search result page"
status: "decided — operator, 2026-10-08"
related:
  - docs/editorial/doctrine.md
  - docs/editorial/strategy/name-history-timeline-mockup-v4.html
  - docs/editorial/strategy/name-history-timeline-mockup-v5.html
---

# Name-history timeline (decided 2026-10-08)

The outcome of a forge session in which the operator pressure-tested the idea.
The general rules it produced are now in [`doctrine.md` §1.1](../doctrine.md).
This file keeps what is specific to the timeline: what was decided, what was
rejected and why, and what has to happen before it can ship.

Layout reference: [mockup v4](name-history-timeline-mockup-v4.html). Birth-tile
palette: [mockup v5](name-history-timeline-mockup-v5.html), terre cuite.

## Decided

- **Content before form.** The fiches are enriched with name history before
  the timeline ships.
- **The timeline is the default lens** of the search feed (`FeedLensId` in
  `src/lib/search/searchLenses.ts`), for every query, with no per-subject
  fallback. Tout, Shorts, Récits, Jeux and Fiches stay as secondary lenses.
- **Release gate: a priority core.** The most searched names (Plausible),
  plus the operator's own examples: Peul, lingala, Mali, Côte d'Ivoire,
  Traoré, Coulibaly, Gagnoa, Daloa. Every other subject shows a minimal
  timeline: the header with its names, and no dated tiles.
  The list, with the evidence behind each subject, is in
  [`name-history-priority-core.md`](name-history-priority-core.md).
- **Every model carries name history.** People, language, language family,
  country, family name, place, and the free word type.
- **One common model**, generalised from `LOC_YAMOUSSOUKRO`:
  - `summary`, the short text under the searched name;
  - `names[]`, current and former names;
  - `accounts[]`, one tile each, carrying:
    - `period`: `from`/`to` years, fuzzy ranges allowed, plus a label for the reader;
    - `statement`, which starts with the name;
    - `sources[]`, typed;
    - optional `actors[]`: context, never attribution;
    - `birth`: the earliest origin known to the project;
    - `before`: an account of what existed before the name.

  Type-specific fields (kinship for a family name, borders for a country)
  stay alongside it.

- **It lives inside each fiche**, as a `nameHistory` block with exactly the
  same shape in every model, validated by one shared schema. A separate
  file per subject (`noms/`) was weighed and set aside: the fiches already
  hold name content (769 people `originOfExonyms`, 54 country etymologies),
  and two files per subject would let two versions of a name's origin drift
  apart, on a site whose promise is to show every hypothesis in one place.
  `nameHistory` replaces those fields as each subject is enriched, and the
  12 `noms/` files fold into their fiches.

- **Competing origins** of one name in one period are tiles in the same
  group, labelled "hypothèse 1, 2, 3", in a neutral order.
- **Convergence is told, not drawn.** Bangala, bobangi and mangala feeding
  into lingala are told inside the tiles. Older names are tiles inside the
  history of a current name.
- **The summary** opens with « Le nom X », names the self-name, says whether
  there are several names and contested origins, and says they are shown
  below.
- **Layout (v4).** It reuses `FicheChronologyChapter`:
  - one name at a time, chosen with chips, the searched name first;
  - a left thread coloured by regime, with dots and stacked tiles, the period
    set large at the top of each tile;
  - the birth tile in terre cuite (`#fbe9dc` / `#8a3d1c`), with a heavy frame
    and a « Naissance du nom » pill, so colour is not the only cue;
  - a dashed thread and dashed tiles for « Avant le nom » (dash contrast
    ≥ 3:1);
  - a « ↓ on remonte le temps » hint, and the « Pendant ce temps, ailleurs »
    anchors behind a button;
  - an honest notice when a name has no dated origin;
  - the closing line « Fin de ce que nos recherches retracent pour le nom X. »
- **"Elsewhere" anchors.** A fixed list of 20 to 30 sourced events outside
  Africa, chosen from French and Belgian school history, with English or US
  history only sparingly.
- **Source labels for the reader**, one per `source_kind`. `ai_generated`
  reads « Synthèse à vérifier ». The public API keeps the tier as data and
  drops its French labels.

## Rejected

- **One column per name.** Unreadable at 430 px.
- **A single timeline mixing every name.** Too dense.
- **A lineage graph for names that converge.** Too costly to render; the
  convergence is told instead.
- **Rolling out one category first.** It would make the default lens depend
  on the subject.
- **Vertical period labels and alternating cream bands.** Visually
  disruptive.
- **A dark birth tile.** Poor accessibility.
- **Showing the tier to readers.** It ranks oral tradition below the
  linguist.
- **Removing the tier from the data model.** A second rewrite with no gain
  for the reader.

## Before it can ship

- **Coverage.** Only 13 subjects carry `names[]` history, out of about
  1,700. `periodLabel` is free text that cannot be sorted.
- **AI-generated sources.** 1,343 source entries are `ai_generated`, the
  largest kind in the corpus. Enrichment replaces them first. A CI ratchet
  and a verification queue reviewed by a person stop new ones from coming in.
- **Single-origin etymologies.** Existing etymologies that assert a single
  origin (Cameroun from « Rio dos Camarões ») are rewritten as hypotheses.
- **Missing name types.** `modele-nom.json` `entityType` gains language,
  family, country and word.

## Open, outside this decision

- **The writing voice.** The tone and rhythm of tile sentences hurt earlier
  versions and need a dedicated pass.
- **How sources are shown.** The exact icon, or the selection-to-sources
  interaction, is still to be designed.
- **The minimal timeline.** It must be checked at 430 px so that it does not
  read as a void.
