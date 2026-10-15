# Brief 2 — The people fiche

Read [`README.md`](README.md) first.

**Boards to change** (each at `-430`, `-768`, `-1440`): `people-fula`,
`people-bassa`, `people-thin-alaba`. The boards record today's page: hero
plate and « Voir la carte » first, « D'où vient le nom ? » below it. At 430 px
`people-fula` is about 10,455 px tall (11 screens).

**Surface.** `/fr/atlas/peuples/[slug]`, built by
`src/components/people/PeopleDetailViewV2.tsx`. Today's chapter order: answer
(« D'où vient le nom ? »), other names, distribution map, related peoples,
language, history, names, culture, amend band, sources.

**Why.** 755 people fiches, 19.5 % visited in 30 days, so entry quality matters
more than depth. Measured problems: `PPL_ZARMA` (6 of 7 enter, leave after a
third of the page, exit 100 %), `PPL_MUCUVAL` (long reading, exit 80 %), `PPL_BETE`
(exit 86 %). The current page tells name origin twice (the answer card and a
separate « Histoire » chronology); the new page tells it once, in the spine.

## Subjects

- **Rich: `PPL_FULA`** — see brief 1 for the data. 144 KB of JSON; 81 KB of name
  history. The board must show how eight names fold, not eight open sections.
- **Oral voice present: `PPL_BASSA`** — one of 12 people fiches typed
  `oral_tradition`. Show the oral account in "The sources speak" on equal
  footing with the written ones, identified by carrier and place when the
  fiche gives them. (Bassa already has a search board; the fiche has none.)
- **Thin: a people known by one name** — the `Ekpeye` pattern.

## Blocks, mobile 430 px

1. Hero plate: self-name large, the pronunciation if the fiche has one, the
   verdict.
2. Who named whom — the people's names, self-name first.
3. The sources speak.
4. **Where they live** — the map. It stays, but below the history, collapsed to
   one tap on mobile (the globe is heavy at 430 px).
5. Language and family: one line each, each a link to a *name* (the language
   name, the family name).
6. Culture and society — kept short, behind a fold; the doctrine lets these in
   only "to tell the history of the name".
7. Closing band (silences, conviction, thesis slot, invitation).
8. Next step: neighbouring peoples whose names are linked by the sources
   (`FicheTileChapter` data), shown as names with a reason.

## States to draw

Rich (`PPL_FULA`), oral present (`PPL_BASSA`), thin, a people split across
borders (fragmentation shown as a sentence, not a chapter), and the entry from
a social post where the reader lands on a name they did not search (the
`PPL_ZARMA` case): the first screen must repeat the promise of the link.

## Do not

- Open with the map. The page opens on the name.
- Show « Peuples liés » as a grid of cards ending the page; it becomes the
  next step.

## Approved boards (2026-10-15)

Recorded in `docs/design/mockups/site/`. The implementation reproduces them.

- `people-fula`, `people-bassa` and `people-thin-alaba`, each at 430, 768 and
  1440, gain the three components approved in brief 1. « Les sources parlent »
  follows « Les autres noms ». The closing band comes after « Compléter cette
  page », without the thesis line. « Poursuivre avec un autre nom » replaces
  « Poursuivre ». The hero, « D'où vient le nom ? », « Les autres noms », the
  map and the chapter order above the new blocks are unchanged.
- `Main` gains the fiche variant of « Les sources parlent ».

Decisions taken in review:

1. On a fiche with several names, « Les sources parlent » is titled « Qui
   raconte les noms de ce peuple ? » and groups the accounts by name first
   (the self-name marked « Leur nom »), then by the seven source-diamond
   families. Only the first name is open, with its first family and first
   account. A fiche with one name keeps the brief 1 form.
2. An oral account is named by its carrier and place, then by who wrote it
   down: « Comment les Bassa ont reçu leur nom », told by Abba Karnga,
   Liberia, reported by Heath Vogel in 2013.
3. Silences come from the corpus. Bassa declares no missing oral account.
   Alaba adds « Les sources que nous avons lues n'expliquent pas l'origine du
   nom Halaba », taken from its own account.
4. Next-step targets: Atlantique and Ba (`people-fula`), Krou and Libéria
   (`people-bassa`), Couchitique alone (`people-thin-alaba`). Each reason is
   the first sentence of the target's summary. Removed because the target has
   no fiche: the languages Fulfulde, Bassa and Halaba-K'abeena; Gbedee has a
   fiche without a summary and is left out. The family-name card is named Ba,
   the name of its fiche, not Bah.
5. Left open for the operator: « Compléter cette page » and the closing band's
   invitation now follow each other; folding Langue, Histoire and Culture et
   société behind a one-line summary (about 2,300 to 2,500 px saved at 430 px)
   was proposed, not applied; the hero does not repeat the promise of a social
   link (`PPL_ZARMA`); the Fula hero says 12 countries where the brief counted
   14.

