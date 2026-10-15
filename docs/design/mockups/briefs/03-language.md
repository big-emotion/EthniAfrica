# Brief 3 — The language fiche

Read [`README.md`](README.md) first.

**Board to change** (at `-430`, `-768`, `-1440`): `language-lingala`.

**Surface.** `/fr/atlas/langues/[slug]`, built by
`src/components/language/LanguageDetailViewV2.tsx`. The canvas holds one board for it.

**Why.** 762 language URLs in the sitemap, 1.3 % visited in 30 days: the type
is almost invisible. Language names are the ones most often handed down from
outside and most often confused with the people who speak them, so this is
where "the name came from elsewhere" is easiest to show.

## Subject: `lin` (lingala)

Real data (`langues/lin.json`): the name *lingala* designates a language of the
Congo basin that many speakers also call *mangala*. Earlier names: *Bangala*, and
before it *bobangi* and *kibangi*. Accounts: Lingala 11, Bangala 4, Mangala 3.
Source types present: academic, archive, government (no oral voice recorded).
The fiche also carries `whyProblematic`, `spellingAliases`, `alternateNames`,
`isoCode639_3`, `glottocode`.

Debated origin: two readings side by side (the `search-answer/Lingala.dc.html`
board already settles that two-reading layout; reuse its grammar). The
convergence of *bangala*, *bobangi* and *mangala* into *lingala* is **told inside
the tiles, not drawn** (timeline decision).

## Blocks, mobile 430 px

1. Verdict sentence, self-name lead (« mangala » when speakers use it).
2. Who named whom: Lingala / Bangala / Mangala chips; timeline.
3. The sources speak: academic, archive and government accounts side by side;
   the oral voice shown as a declared absence.
4. **Type-specific: the name and the speakers.** Speakers as a declared
   estimate in millions, never a sum of peoples (`Lingala` board decision);
   ISO code and Glottocode as small reference chips, not a headline.
5. **Why the name is a problem** — only if `whyProblematic` is filled.
6. Closing band, then next step: the peoples whose speech the language is
   (names), and the family name (*Bantou*).

## States to draw

Rich (`lin`), a language with a single name and no debate (thin), and a language
whose name is also a people's name (*Peul/Fulfulde* shape): the disambiguation
leads with a sentence saying a language and a people are different things, and
that the confusion is itself part of the name's history.

## Do not

- Present speaker counts as a precise figure when the fiche gives an estimate.
- Name the language after its people, or the reverse, without the sources
  saying so.

## Approved boards (2026-10-15)

Recorded in `docs/design/mockups/site/`. The implementation reproduces them.

- `language-lingala`, at 430, 768 and 1440, is the rich state and the shared
  name state at once. « L'histoire des noms » keeps its chips and gains the
  two readings of the name under them: « Hypothèse 1 · 1901-1902 » (Michael
  Meeuwis) and « Hypothèse 2 · Avant 1901, selon cette lecture » (Mpoke
  Mimpongo), in the grammar of `search-state-competing`, stacked at 430 and
  side by side from 768. « Les sources parlent » follows the chapter, in the
  fiche variant: « Qui raconte les noms de cette langue ? », 18 accounts of 3
  names, Lingala open. Under « Personnes qui parlent cette langue » a note
  says that a language and a people are different things. « Rôle
  véhiculaire » shows a French label; « Vitalité » is removed and its silence
  goes to the closing band. « Poursuivre avec un autre nom » offers Bantou
  and Lingala (locuteurs).
- `language-thin-havu` (new) is the thin state: one name, one account backed
  by two sources, no dialects chapter, a vitality label, four silences, and
  Bantou and Havu as next names.
- `Main` is unchanged; `ea-live.css` gains the readings grid and the note.

Decisions taken in review:

1. Proposed French labels, to confirm in the copy: « Langue commune à
   plusieurs régions » (`regional_lingua_franca`), « Pas employée comme
   langue commune entre groupes » (`non_vehicular`), « Vigoureuse »
   (EGIDS `Vigorous`). The boards mark them « [proposition de libellé] ».
2. The boards draw two readings; the corpus groups four accounts under the
   origin of the name lingala (the other two are explanations Mimpongo
   reports: Tshimpaka's, through Libinza, and one from mongálá, « bras de
   rivière »). Bangala also holds two competing accounts.
3. Kinshasa Lingala, Losengo and Ngala are alternate names with no account;
   none is invented.
4. Silences: no oral account, no trace of Lingala older than 1902, vitality
   not documented (Lingala); no oral account, undated origin, no source on
   the name Havu, dialects not documented (Havu). The Havu line on the name
   Havu comes from the summary text, not from a field, and needs one to be
   implemented.
5. The 34,000,000 speaker figure is not shown.

