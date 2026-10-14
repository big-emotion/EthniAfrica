# Brief 2 — The people fiche

Read [`README.md`](README.md) first.

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
