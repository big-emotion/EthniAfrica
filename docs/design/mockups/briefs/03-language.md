# Brief 3 — The language fiche

Read [`README.md`](README.md) first. Briefs 1 and 2 are approved and
implemented; this brief reuses their components instead of redrawing them (see
"Approved boards" in [`01-result-page-timeline.md`](01-result-page-timeline.md)
and [`02-people.md`](02-people.md)), including the fiche variant of « Les
sources parlent » on `Main`.

**Board to change** (at `-430`, `-768`, `-1440`): `language-lingala`.
`Main` changes only if a shared component does.

**Surface.** `/fr/atlas/langues/[slug]`, built by
`src/components/language/LanguageDetailViewV2.tsx`.

**Why.** 762 language URLs in the sitemap, 1.3 % visited in 30 days: the type
is almost invisible. Language names are the ones most often handed down from
outside and most often confused with the people who speak them, so this is
where "the name came from elsewhere" is easiest to show.

## What is on the board today (checked 2026-10-15)

`language-lingala`, in order, at 430 px (about 3,911 px tall, 4 screens):

1. Hero plate (« Langue », Lingala, trail) and the chapter bar.
2. **L'histoire des noms** — name chips: Bangala, Kinshasa, Lingala, Losengo,
   Mangala, Ngala.
3. **Identifiants** — ISO 639-3 `lin`, Glottocode `ling1263`, with a review chip
   (« Aucune relecture humaine enregistrée à ce jour »).
4. Famille linguistique (Bantou), Personnes qui parlent cette langue (Ngala
   (Bangala), Lingala (locuteurs)), Dialectes (four), Rôle véhiculaire,
   Vitalité.
5. **Poursuivre** — links: the family and two peoples.
6. Sources, with the list folded.

Four things the data and the rules show on this board, to report and to fix:

- **« Rôle véhiculaire » prints a raw value:** `regional_lingua_franca`. A
  reader sees an English code. The corpus field is a code, so the board must
  show a French label; propose one and mark it as a proposal.
- **« Vitalité » renders to say it is empty** (« Information manquante »). Rule
  6 of the README forbids a block that says it is empty: the silence moves into
  the closing band.
- **The two readings of the name's origin are not on the board.** The fiche
  holds a `whyProblematic` text and `originDebated: true`: a debate between
  two readings (below), shown nowhere on the board as text. The timeline of
  brief 1 is the place for the accounts; say whether the chips open one.
- **The chips list six names, the history holds three** (Lingala, Bangala,
  Mangala): Kinshasa, Losengo and Ngala come from `alternateNames` and have no
  account. Report it; do not invent accounts for them.

## What to change

1. **Add « Les sources parlent »** after the name history, using the fiche
   variant approved in brief 2 (accounts grouped by name first, then by the
   seven source-diamond families, oral first, only the first name open). Title
   it for a language (« Qui raconte les noms de cette langue ? »); propose the
   wording and mark it as a proposal.
2. **Add the closing band** « Ce que nous ne savons pas encore » before
   « Poursuivre »: silences deduced from the data (including the vitality and
   the missing oral account), the « Notre conviction » sentence of the About
   page, the invitation to correct with « Signaler une erreur » and « Proposer
   une source », the thesis line hidden.
3. **Turn « Poursuivre » into « Poursuivre avec un autre nom »**: each target
   with a reason, the first sentence of the target fiche's summary. Remove any
   target without a fiche.
4. **Show the two readings of the origin** as competing accounts side by side,
   « Hypothèse 1 » and « Hypothèse 2 » in neutral order, each with its sources,
   in the position the operator will validate from your proposal (state it in
   the report). The Hypothèse 1 / 2 grammar is the one drawn on
   `search-state-competing`.
5. Fix the two defects above (raw value, empty block) as stated.

Do not touch the hero, the identifiers, the dialects, the family, the chapter
order above the added blocks, or the sources list.

## Real data for the board

`lin` (`dataset/source/afrik/langues/lin.json`):

- The name *lingala* designates a language of the Congo basin that many
  speakers also call *mangala*. Earlier names: *Bangala*, and before it
  *bobangi* and *kibangi*. « Les sources ne s'accordent pas toujours sur leur
  origine ; nous les présentons plus bas. »
- Accounts per name: Lingala 11 (academic 9, archive 2, government 1), Bangala 4
  (academic 4, archive 1), Mangala 3 (academic 3). No oral source recorded.
  Periods seen: Lingala « Depuis 2006 », « 1904 », « 1902 »; Bangala
  « Aujourd'hui », « 1884-1885 », « Avant l'arrivée des Européens »; Mangala
  « Aujourd'hui », « Sens en bobangi », « Vers 1882 ».
- The two readings (`whyProblematic`, verbatim in substance): **(1) Meeuwis.**
  Europeans arriving on the Congo river in 1881-1882 learned Bobangi, the
  riverside trade language, imperfectly and simplified it a great deal. That
  speech was carried in 1884-1885 to Bangala Station, a State post, and received
  the name « Bangala ». In 1901-1902 the Scheut missionaries at Nouvelle-Anvers
  renamed it « Lingala », a name that no source before 1902 mentions; in several
  Bantu languages of the region the prefix *ba-* names peoples, not languages.
  **(2) Mimpongo (2024).** He disputes that the name is a missionary creation:
  *Lingála* and *Mangála* are short forms of Bobangi expressions meaning « la
  langue des marchés », so a name of Bobangi origin. « Les deux lectures
  s'appuient sur des sources différentes et ne sont pas départagées ici. » They
  diverge on how old *Mangala* and *Lingala* are as names of the language. The
  name *Bangala* was first given by Europeans to the inhabitants of the Mankanza
  region, then to their post and their speech, according to both authors; it
  remains in use in the north-east for a local variety.
- Family: Bantou (`FLG_BANTU`). People listed in the fiche: Lingala (locuteurs)
  (`PPL_LINGALA`); the board also lists Ngala (Bangala) (`PPL_NGALA`).
- Speakers: Congo (RDC) 34,000,000, « langue maternelle et langue commune
  d'échange confondues », a figure from the project's own earlier compilation
  that no source read could back. If shown, it is a declared estimate with that
  caveat, never a headline figure. Vitality: absent from the data. Vehicular
  role: `regional_lingua_franca`.
- Next-step targets with a fiche and a summary: `FLG_BANTU` (« Le nom bantou
  désigne une famille de langues d'Afrique centrale, orientale et australe, et
  non un peuple. »), `PPL_LINGALA` (« Le nom Lingala désigne ici l'ensemble des
  gens qui parlent le lingala, … Ce n'est pas le nom d'un peuple au sens
  strict. »), `PPL_NGALA` (« Le nom Ngala, ou Bangala, désigne des peuples
  riverains du fleuve Congo, autour de Mankanza, … »).

## States to draw (430 first, then 768 and 1440)

- `language-lingala` rich: the added blocks, the first name open, the two
  readings side by side.
- **A language and a people sharing a name:** `lin` with `PPL_LINGALA`, whose
  own summary says it is not a people in the strict sense. Draw the sentence
  saying a language and a people are different things, and that the confusion
  is part of the name's history; no new board, an annotated state of
  `language-lingala`.
- **Thin:** `hav` (Havu, kihavu): one name, *Kihavu*, one account (Glottolog,
  a linguistic reference, and an academic atlas); family Bantou, people Havu;
  vitality *Vigorous* (EGIDS, 2025); vehicular role the raw value
  `non_vehicular`; no debated origin, no dialects. Its summary ends on a real
  silence: « Nous n'avons pas trouvé de source qui explique le nom Havu, ni sa
  plus ancienne trace. » Draw it as a state of `language-lingala`: a short
  sources block, that silence declared in the closing band, a next step with
  one or two targets.

## Do not

- Present a speaker count as a precise figure.
- Name the language after its people, or the reverse, without the sources
  saying so.
- Crown one of the two readings or order them by authority.
- Show a tier, a score or a « most reliable » label on any source.
- Redraw the approved components: reuse them from `Main`.
- Put the thesis anywhere but the closing band.

## Approved boards (2026-10-15)

The sections above are the brief as given; where they differ from the sections
below (for example the number of readings shown, or `language-thin-havu` as a
board of its own rather than a state), the sections below are what was approved
and implemented, and win.

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

## Implementation (2026-10-15)

Operator decisions taken after approval, drawn on the boards before the code:

1. The page shows every account of a competing group: `language-lingala`
   now draws four readings (Hypothèse 1 to 4), in the corpus's order.
2. The proposed labels are kept and the « proposition » marks removed. Two
   more codes of the model get a label in the same voice: « Langue commune
   entre groupes » (`vehicular`) and « Langue nationale ou officielle »
   (`national_official`). EGIDS statuses are said in French.
3. A language fiche may declare `content.gaps` (`field`, `reason`), the
   shape the place model already uses. Each reason is printed as a silence;
   `hav.json` declares the one on the name Havu.
4. With a nameHistory, an empty « Vitalité » or « Dialectes » chapter is not
   drawn: its silence goes to the closing band. A fiche without a
   nameHistory keeps its chapters and their missing markers.
5. `language-thin-havu` records the « Autres noms attestés » chapter (Havu)
   the live page already draws for it.

