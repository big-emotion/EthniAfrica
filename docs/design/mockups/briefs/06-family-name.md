# Brief 6 — The family-name fiche (patronyme)

Read [`README.md`](README.md) first.

**Surface.** `/fr/atlas/noms/[slug]`. **No fiche mockup exists** (`search-answer/Camara.dc.html`
is the result-page answer for a patronyme, not the fiche).

**Why.** 794 patronymes, 625 in the sitemap, 10 % visited. The type with the
widest reach (a reader searches *their own* name) and the worst early exits:
`PAT_TRAORE` (left before half the page), `PAT_DIALLO` (a third of the page,
exit 83 %). 169 names are deliberately `noindex` because their sources are too
weak; that is policy, and the page must handle a weakly sourced name without
shame.

## Subject: `PAT_TRAORE`

Real data: *Traoré* is a clan name, a *jamu*, carried by Bambara and Malinké
families; in Bambara and Malinké it is said *Tarawele*; *Traoré* is the French
spelling and *Traore* and *Taraore* also exist. Accounts: Traoré 11, Tarawele 3.
Fiche fields: `spellings`, `transmissionMode`, `designatedSocialUnit`, `origin`,
`peoples`, `countries`, `alliances`, `casteOrSocialFunction`, `bearers`,
`homonyms`, `gaps`. Source types: academic, archive, intergovernmental,
linguistic reference. The Traoré/Diop campaign (`traore-diop`) already points
here.

Oral voice present: `PAT_NGONGE`, `PAT_FFUMBE`, `PAT_KOLLO` carry
`oral_tradition`. Draw one of them.

## Blocks, mobile 430 px

1. Verdict: what kind of name (a clan name, not a surname in the French sense).
2. Who named whom: *Traoré* / *Tarawele*: the spelling is itself a history (a
   colonial administrator's transcription).
3. The sources speak, including the oral voice.
4. **Type-specific: spellings and bearers** — spellings as chips with their
   countries; the peoples that carry the name; the alliances. `PAT_TRAORE`
   records *sanankuya* alliances with `PAT_DIARRA`, `PAT_DIOP` and `PAT_KONE`
   (and others), each with its sources. No bearer counts as a figure unless the
   fiche has one; say that figures are missing (`Camara` board decision).
5. **Type-specific: shared names** — `homonyms` (empty for `PAT_TRAORE`, so
   this block is conditional and must be drawn on another name): the same
   sound in another people, never merged.
6. Closing band. For a name with weak sources, the closing band says so first.
7. Next step: the allied names (*Diarra*, *Diop*, *Koné*), with the alliance as
   the reason.

## States to draw

Rich (`PAT_TRAORE`), oral present (`PAT_NGONGE`), thin (one account, source too
weak: the `noindex` shape, without alarm), and a name searched under a wrong
spelling (the redirect sentence).

## Do not

- Imply that bearing the name proves a descent.
- Show a map of "where the name comes from" as a dot; the fiche holds countries
  and peoples, not points.
