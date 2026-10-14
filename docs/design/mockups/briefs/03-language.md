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
