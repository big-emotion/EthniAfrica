# Brief 8 — The free-word fiche

Read [`README.md`](README.md) first.

**Boards to create** (new page, so three new boards): `word-race-430`,
`word-race-768`, `word-race-1440`. Add them to the canvas as a fifth
group, and add the page's entry to `canvas.json`. The nearest existing
board is `glossary`, which stays as it is.

**Surface.** The `mots` type (`dataset/source/afrik/mots/`, 2 fiches today).
**No page at all**: checked on 2026-10-14, the two fiches
(`WRD_RACE`, `WRD_KIRDI`) are served only by `/api/v2/words`; no route under
`src/app/[lang]/` renders them and production's sitemap lists none. This brief
draws a new page, not a redraw. The nearest existing surface is `/fr/glossaire`. Doctrine §2 names it "plus one free
type", for a word whose history explains Africa through its names without
fitting the six types: *racisme*, *nation*, *État*, *esclavage*.

**Why it carries weight.** The word « race » is the series' top Instagram post
(about 104–111K Meta views), and « sauvage » (196K views, 3,468 shares) wrapped a
translated clip in a sourced word history. The audit calls etymology around a
clip the strongest format measured so far. This is also the type where the
operator's thesis comes closest to the surface, so it is the type where the
"never affirm" rule is tested hardest.

## Subject: `WRD_RACE`

Real data: the word *race* means today groups of people one wanted to tell
apart by heredity; it first meant the family, the line; it came into French from
Italian. The sources do not agree on its origin. 12 accounts; source types:
academic, archive, intergovernmental, linguistic reference. Fiche fields:
`wordLanguage`, `definition`, `relatedSubjects`, `gaps`.

## Blocks, mobile 430 px

1. Verdict: the word's older meaning first, then today's. The page says plainly
   that the word is not African in origin.
2. Who named whom — here *who used the word for whom*: dates and speakers, one
   account at a time.
3. The sources speak.
4. **Type-specific: where the word went** — `relatedSubjects`, which today
   holds two real links: `FLG_MANDE` (in 1900 Maurice Delafosse ranks the
   Mandé-speaking peoples among the « familles nègres » and speaks of Dyoula
   « de race pure ») and `FLG_BANTU` (Lwanga-Lunyiigo and Vansina warn against
   confusing language, culture and race). Each is a quoted relation with its
   own link to the name.
5. Closing band. The conviction sentence here is allowed to be stronger than on
   other types; it still comes from the doctrine and is not a sourced claim.
6. Next step: *Mandé* and *Bantou*, the two names the fiche relates the word to.

## States to draw

Rich (`WRD_RACE`), a word with a single attested sense (thin), and the reader
arriving from the social clip (the board should echo the clip's question in its
first line).

## Do not

- Write "X is racist" or any verdict the sources do not carry: the page
  presents sources and traces research.
- Let this brief's boldness leak into the other seven.

## Approved boards (2026-10-19)

Recorded in `docs/design/mockups/site/`, new group « 5 · Mots » of
`canvas.json`. The brief is rewritten on branch
`feat/etni-2118-free-word-brief` (PR #1870); this section was written against
recette's copy and moves onto the rewritten brief if that PR lands first.
Every text comes from `dataset/source/afrik/mots/WRD_RACE.json`, and the names,
definitions and two relations of `WRD_KIRDI` and `WRD_TRIBU`, word for word,
except the plain lines named in the choices below. No page renders the word
fiches yet; `/api/v2/words` serves them.

The operator approved the boards on 2026-10-19 with these decisions:

1. The page takes the proposed route `/fr/atlas/mots/[slug]`, with the
   breadcrumb « Accueil › Parcourir › Mots › race ».
2. The timeline follows the fold of brief 15: open are the three most recent
   accounts (the two of 1980, in one tile, and 1900), the account of about
   1480 (« Origine la plus ancienne connue du mot race ») and the tile of the
   five hypotheses; three individual accounts fold: 1684 and about 1500
   behind « + Voir les 2 autres récits », and the Italian account before 1480
   (« Avant le mot race ») behind « + Voir l'autre récit ».
3. « Les sources du mot race » lists each source once, with its type and
   « Voir le récit » or « Voir les N récits » to the accounts it backs.
4. Mandé and Bantou are shown as relations recorded in the race fiche, without
   a source button: no source of the race fiche backs the Bantou link.
5. « Parcourir les mots » offers race, Kirdi and tribu as navigation, and
   shows the race and Kirdi links recorded in the tribu fiche as relations
   noted there.
6. `WRD_TRIBU` holds 27 accounts (22 for « tribu », 5 for « tribe »), not 35.
7. The line under the summary that repeated it is removed.

- `word-race` at 430, 768 and 1440 (new), top to bottom:
  - the header, the title « Le mot race », « Mot · français » and the
    breadcrumb, in the place fiche's title block;
  - « En bref »: the fiche's summary, current meaning first, then the first
    meaning, then the origin the sources disagree on;
  - the timeline of brief 15, its controls on one row, the twelve accounts
    with their sources buttons, folded as in decision 2; the hypotheses tile
    keeps the fiche's order and its own words on who retains or rejects an
    explanation (Liberman rejects ra's and retains haras);
  - « Familles de langues liées »: Mandé and Bantou with the fiche's two
    relations;
  - « Les sources du mot race »: six sources, fifteen links to accounts;
  - the closing band with the fiche's three gaps, in its fiche variant (no
    thesis line);
  - « Parcourir les mots », then footer B.
- `ea-live.css` gains the `.ea-word-related` and `.ea-words*` rules. New
  selectors only, tokens only. `Main`, the glossary board and every other
  board are unchanged.

Choices made while drawing, kept by the operator:

1. The hypotheses tile opens with « Cinq explications existent de l'origine
   du mot race, sans que l'une l'emporte. », on the model of the sentence
   approved for Yamoussoukro.
2. The page takes the result page's components (the timeline, the origin and
   « Avant le mot race » pills, the brief 15 sources list) under the place
   fiche's title block, without a search field, lens bar or « Voir aussi ».
3. The relations block is titled « Familles de langues liées » and opens with
   « La fiche du mot race relie ce mot à deux familles de langues. »
4. In « Parcourir les mots » the race card reads « Mot · cette page », is not
   a link and has a dashed border; « La fiche du mot tribu relie ce mot aux
   deux autres : » precedes the two relations of `WRD_TRIBU`.
5. The sources strip groups linguistic references and the academic article
   under « Livre ou étude » and the intergovernmental chapters under
   « Rapport public », as on the result page.

Measured at 430 px with the board fonts: header 61, title block 289,
« En bref » and timeline 2,294, related families 520, sources 1,095, closing
band 917, « Parcourir les mots » 856, footer 1,391; page 7,422 px (768:
5,299; 1440: 4,830).
