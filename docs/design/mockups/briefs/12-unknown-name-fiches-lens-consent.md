# Brief 12 — The unknown name, the « Fiches » lens and the consent strip

Read [`README.md`](README.md), [`01-result-page-timeline.md`](01-result-page-timeline.md)
and [`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-17. Status: **proposed — awaiting operator review.**
Prompt: [`claude-design-prompt-12.md`](claude-design-prompt-12.md).

This is **pass 3** of the three board passes the operator approved on
2026-10-17. It starts once pass 2 ([brief 11](11-result-page-self-name-handoff.md))
is approved and recorded: the three parts below change `Main`, which the
earlier passes change too.

It covers three findings of the 2026-10-17 triage, one per part:

- **A. P08**, the unknown-name page: one invitation, in the verdict, and no
  empty shelf;
- **B. P12**, the « Fiches » lens: the fiches that answer to the name first,
  the related ones with their own line;
- **C. P09**, the consent strip: low on the screen, refusing as easy as
  accepting.

**Boards to change** (each at `-430`, `-768`, `-1440`): `search-unknown`
(part A); three new boards `search-state-fiches` (part B); `Main` (the fiche
cards of part B and the consent strip of part C).

**Not to touch:** `search-peul`, `search-bassa`, `search-congo` and the other
`search-state-*` boards, every fiche board, `home`, `about`, `approach`.

## A. The unknown-name page (P08)

**Surface.** `/fr/atlas/recherche?q=<a name we do not hold>`, state `unknown`.

### Why

On recette at 430 px on 2026-10-16, `?q=voundou` says it knows nothing, then
draws an empty video shelf (« Les vidéos », « Tout voir », « Pas encore de
short »), the card « Plusieurs noms peuvent coexister. », which speaks of
« ces noms » when the page shows none, and « Nous nous sommes trompés ? »,
when nothing was said. The only « Proposer une source » button sits at
y 1,119. Thirteen searched words found nothing over 28 days (demand journal of
2026-10-17), « voundou » among them. These readers came with a name of their
own; the page should ask them for it once, where they read first. No name in
our data is close to « voundou » (the best, « Voove », scores 0.17), so the
« Cherchiez-vous… ? » state has nothing to offer here.

### On the boards today (approved 2026-10-14, brief 1)

`search-unknown-430`, for the query « zzqxv », in order: the verdict
(« D'où vient ce nom », « zzqxv », « Nous ne connaissons pas ce nom. », the
admission paragraph); « Les vidéos », « Tout voir », « Pas encore de short »;
the band « Ce que nous ne savons pas encore » (one silence, the conviction,
the thesis line); the card « Plusieurs noms peuvent coexister. »; the card
« Nous nous sommes trompés ? » with « Proposer une source »; « Poursuivre avec
un autre nom » (Siwi, Tchad); « Aller plus loin ».

### What to change, at 430 first

1. **The verdict carries the invitation.** Keep the eyebrow, the name,
   « Nous ne connaissons pas ce nom. » and the admission word for word:
   « Ce n'est pas une réponse : c'est un aveu. Si ce nom est le vôtre, ou celui
   d'un peuple, d'une langue ou d'un lieu que vous connaissez, dites-le-nous.
   C'est comme ça que notre projet grandit. » Directly under it, the button
   « Proposer une source », drawn like the action of today's « Nous nous
   sommes trompés ? » card, 44 px, left-aligned. It is the page's one
   invitation to correct.
2. **Delete the empty shelf**: « Les vidéos », « Tout voir » and « Pas encore
   de short ». A page that admits it does not know the name does not draw an
   empty shelf. A page where a piece matches the reader's word keeps its shelf
   (that case has no board and is not drawn here).
3. **The band** keeps « Ce que nous ne savons pas encore », the conviction and
   the thesis line as they are. Its silence reads « Aucune source sur le nom
   zzqxv n'est enregistrée dans le projet. »: the board still says « dans
   l'atlas », and the site already says « dans le projet », as the register
   asks.
4. **Delete both cards**, « Plusieurs noms peuvent coexister. » and « Nous
   nous sommes trompés ? ».
5. **Keep** « Poursuivre avec un autre nom » with Siwi and Tchad and their
   reasons word for word (« Un peuple de l'oasis de Siwa, en Égypte, qui se
   nomme lui-même Isiwan. D'où vient ce nom ? » and « Un pays qui porte le nom
   d'un grand lac. Les sources ne s'accordent pas sur le sens premier du
   nom. »), then « Aller plus loin ».

At 768 and 1440: the same order, in the thin page's 720 px column.

### Do not

- Add near names: when the engine finds a close name, the page is already
  « Cherchiez-vous… ? »; « zzqxv » and « voundou » have none.
- Add a second invitation in the closing band, or a card in place of the two.
- Change the next names.

## B. The « Fiches » lens (P12)

**Surface.** The result page with the lens « Fiches » pressed, built by
`src/components/search/SearchFeed.tsx` and
`src/components/search/feed/FichesBlock.tsx`.

### Depends on

- **The filed name « Peul »** (the corpus fix of `PPL_FULA`), for the lens
  title « Fiches sur Peul ».
- **REQ-135 amended on Confluence** (wording below) before the « Autour de ce
  nom » group is drawn as final. Bell, Baloyi, Bwalya and Bailly reach « peul »
  only because they sound alike to the search (one phonetic key, « PL »). None
  of their fiches mentions the Peul. Under the note « Un contexte lié, pas le
  même nom. » they would state a link that the data does not hold, which the
  doctrine refuses (§1.1, « the site never affirms »).

### Why

No board draws this lens: `search-peul` shows only its button, « Fiches 114 ».
On recette the lens shows, in order: the title « Fiches sur Fula (Fulbe /
Peul) »; a heading « Découvrir » with « Pour aller au fond : chaque fiche, avec
toutes ses sources. »; a grid of cards in the search's order, each with an
eyebrow (« Peuple », « Nom »), the name, then « Fiche EthniAfrica », or
« 2 fiches » for a people filed in several fiches; then « Revenir à la
réponse ». The fiches that answer to the name are not set apart from the rest,
and « Fiche EthniAfrica » on every card tells the reader nothing about it.

### What to draw, 430 first

Three new boards, `search-state-fiches-430`, `-768`, `-1440`, titled « État :
onglet Fiches (« peul ») », copied from `search-peul` with « Fiches » pressed.
Add them to the « 1 · Search » group and to `canvas.json`.

1. The title « Fiches sur Peul ».
2. No « Découvrir » heading and no subtitle, as in the Shorts lens.
3. **« Sur ce nom · 1 »** first: the fiches of the subjects that answer to the
   name, in the search's order, unranked. The group card: eyebrow « Peuple »,
   the name « Fulbe (Peul / Fulani) », the line « 2 fiches », and the pills
   « Peul » and « Fulbe du Massina (Peuls du Massina / Macina) ». Check this
   card against recette before drawing; draw what recette shows and report
   any difference.
4. **« Autour de ce nom · N »**, then the note « Un contexte lié, pas le même
   nom. », the same heading and note as the Shorts lens. Each card shows its
   eyebrow, its name and **the fiche's own one line** in place of « Fiche
   EthniAfrica »: the line of the form that matches the card's name. Draw:
   - « Nom » · Bello · « Un nom personnel musulman des Haoussa, qu'une étude
     dit venu du peul. »;
   - one card whose fiche has no line: eyebrow and name only, never an empty
     line. Its name is an example and is marked as such.
     No card matched only by sound (Bell, Baloyi, Bwalya, Bailly). The real list
     and N come from the search; mark every other card you draw as an example.
5. « Revenir à la réponse », unchanged.

« Fiche EthniAfrica » disappears from this lens. At 768 the cards sit in two
columns, at 1440 in up to four, as today.

### States to draw

- Rich: « peul », as above.
- « Sur ce nom » alone: a name with no related fiche.
- « Autour de ce nom » alone: a widened search with no subject. Never « Sur ce
  nom · 0 ».
- A relation browse (« les peuples de la famille Krou »): no name was searched,
  so no grouping and no note.

### Limits

This part changes the lens only. The « Tout » shelf of the pages with no
answer (widened, typo, unknown, relation browse) keeps its cards as they are;
changing it needs its own board.

### To report, not to decide

The lens button counts 112 matches on recette while the page loads the first 20. An existing requirement test keeps the button's count equal to the total.

### Do not

- Rank the fiches inside « Sur ce nom », or add a badge.
- Show a tier or a score.
- Write a reason the fiche does not carry, or a generic line.

## C. The consent strip (P09)

**Surface.** `src/components/consent/ConsentBanner.tsx`, on every page, from
the reader's first scroll, tap or key (or after 15 s); its copy is in
`src/lib/i18n/copy/consent.ts`.

### Why

No board draws the banner; only the footer button « Gestion des cookies » that
reopens it is drawn. Measured on recette at 430 × 932: the banner is 362 px
tall, 39 % of the screen (45 % of the 812 px reference height). It has a
visible title, two sentences and a link, then three stacked full-width
buttons: « Accepter tout » filled in terracotta with white text, focused on
arrival; « Refuser » white with a border; « Personnaliser » as text. In the
« Personnaliser » panel, « Enregistrer mes préférences » is terracotta too.
Brand charter §5.4 says terracotta is not a button colour, and refusing must be
as easy as accepting. The first layer does not say that searched words appear
on a public dashboard, which the data policy states (`src/lib/legal-pages.ts`).

### What to draw

On `Main` only, a section « Bandeau de consentement »: frames at 430, 768 and
1440 px in two states (on arrival; « Personnaliser » open), plus one 430 × 812
frame of the arrival state over the first screen of `search-peul-430`, so the
operator judges the height against a real page. No page board changes: the
strip is site chrome.

**On arrival, 430 first:**

1. A strip fixed to the bottom edge of the screen, full width, parchment
   ground, a top border, 16 px gutter. No visible title; its accessible name
   stays « Gestion des cookies », the words of the footer button.
2. One short paragraph, 16 px, in the soft ink: « Avec votre accord, nous
   mesurons les visites, les pages lues et les mots cherchés. Ces mots sont
   affichés sur un tableau de bord public. Cette mesure ne dépose aucun
   cookie. » Each claim comes from the data policy: measurement starts only
   after consent, searched text is shown on a public dashboard, and the
   measurement sets no cookie.
3. One row of two buttons, 44 px: « Refuser », then « Accepter ». Same width,
   same outlined style, same ink, same weight. Neither is filled, neither uses
   terracotta or the accent, and neither has focus on arrival: the strip
   itself takes the focus, with no ring.
4. One row of two quiet controls, each 44 px tall: « Personnaliser » and the
   link « Politique de données ».

**Height budget**, which this copy can meet:

| Width             | Layout                                                     | Budget   | Arithmetic                                                   |
| ----------------- | ---------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| 430 (below 768)   | paragraph, then two rows of two controls                   | ≤ 240 px | 16 + 4 lines × 24 + 8 + 44 + 8 + 44 + 16 + 1 border = 233 px |
| 768 (768 to 1199) | paragraph, then one row of four controls                   | ≤ 160 px | 16 + 2 lines × 24 + 8 + 44 + 16 + 1 = 133 px                 |
| 1440 (from 1200)  | one row: paragraph on the left, four controls on the right | ≤ 120 px | 16 + 3 lines × 24 + 16 + 1 = 105 px                          |

The paragraph is 173 characters, about four lines at 16 px in 398 px. If the
board needs five lines, it picks one of: caption size (13 px, three lines,
about 194 px), shorter copy, or a larger budget, and says which. The board
reports its measured heights; the end-to-end test takes its thresholds from
them. The code switches layout at 768 px, so the 720 px test width keeps the
430 layout; four controls in one row are checked at 800 and 1200.

On 768 and 1440 the quiet controls sit on the left of the row, « Refuser »
and « Accepter » on the right, at equal width.

**« Personnaliser » open (all widths):** the panel opens above the button row.
It starts with today's text, unchanged: « Vos choix sont conservés dans le
stockage local de votre navigateur, et non dans un cookie. Les fonctions
essentielles sont toujours actives ; la mesure d'audience ne démarre que si
vous l'acceptez. » Then the three switches with their current labels and
descriptions (« Cookies essentiels », « Cookies analytiques », « Lecture de
vidéos tierces »), then « Enregistrer mes préférences » in the same outlined
style as « Refuser » and « Accepter », **not terracotta and not filled**. This
is the one state allowed to be tall.

The night variant is made by token substitution only.

### Found while drafting, left to the operator

The switch « Cookies analytiques » is described « Plausible — statistiques
anonymes de visite, sans cookie »: a switch named after cookies says it sets
none. Fixing it is a copy change inside an existing block, not part of this
board.

### Do not

- Use terracotta or the accent on any button.
- Make « Accepter » larger, first in focus or more contrasted than
  « Refuser ».
- Add an icon, an illustration or a cookie emoji.
- Add copy not given here.

## Proposed amendments (not applied)

`docs/design/search-result-charter.md` and brief 1 are not edited by this
brief; the operator approves these with the boards, and the requirements are
written on Confluence with `/ethniafrica-spec`.

**Charter §3 III**, the paragraph « The invitation to correct is on every
page, not only the poor ones. » Add at its end:

> On a page that admits it does not know the name, the invitation moves up
> into the verdict, where it is the page's one action (« Proposer une
> source »); the closing then holds the silence and the conviction.

**Charter §3 ter**, the exceptional states. Replace « a genuinely unknown query
opens on the verdict and closes with `owed` (`conviction` and `invitation`),
then `further`; » by:

> a genuinely unknown query opens on the verdict, which carries the invitation
> to correct, and closes with `owed` (`silences` and `conviction`), the next
> names, then `further`; it draws no shelf unless a piece matches the reader's
> word;

**Charter, « A word we hold a piece on »**, the sentence « The slot that says
« Pas encore de short » exists for a name nobody has told yet; ». Replace by:

> The slot that says « Pas encore de short » exists for a name nobody has told
> yet, except on a page that admits it does not know the name: that page draws
> no shelf at all, unless a piece matches the reader's word;

**Charter §3 ter, « The filters are dynamic. »** After « The shorts shelf
separates « Sur ce nom » (…) from « Autour de ce nom » (context). », add:

> The fiches filter separates the same way. « Sur ce nom » holds the fiches of
> the subjects that answer to the name, in the search's order. « Autour de ce
> nom », under the note « Un contexte lié, pas le même nom. », holds the other
> fiches found, each with its own one line and never a generic label; a fiche
> matched only by its sound is not listed there. A relation browse, where no
> name was searched, is not grouped.

**Brief 1, decision 2**, last sentence (« On the unknown-name page the existing
« Nous nous sommes trompés ? » card is the invitation. »): superseded by part
A; the invitation is the verdict's « Proposer une source » button.

**REQ-135**, today « an approximate input reaches the canonical name, including
declared transliteration variants ». Add an acceptance criterion:

> A family name that matches the query only by its sound is offered only when
> no name matches the query exactly or by its spelling. It is never listed
> beside an exact match.

Part C changes no charter: it applies brand charter §5.4 as written.

## Decisions for the operator

1. **Part A, the next names.** The boards keep Siwi and Tchad, as brief 1
   decision 3 approved them; the code shows Fulbe and Bénin today. The fix
   that brings the code back to Siwi and Tchad ships without a board.
2. **Part B, sound-alike names.** REQ-135 as amended above, or keep them and
   draw them under a note that does not claim a link.
3. **Part C, the size of the paragraph** (16 px in four lines, or caption size)
   and the label « Accepter » in place of « Accepter tout ».
4. **Not in this brief:** adding family names and languages to the near-name
   search (`afrik_search_leads`, REQ-125). It would give « tchikaya » →
   Tchicaya, but also misleading pairs (« bukasa » → Mukasa), and needs its own
   migration and decision.

## For the implementation (after approval)

- Part A: the plan of the unknown state becomes verdict then lenses, with the
  shelf only for a piece matched by the reader's word; the existing test of
  the unknown-name block order is rewritten first; the closing keeps its
  silence, its conviction and the next names (REQ-180, REQ-198).
- Part B: the grouping lives in the lens only; `FichesBlock` keeps its default
  heading when the grouped mode is off; the Bello card takes the line of the
  form « Bello »; a relation browse shows no grouping (REQ-180).
- Part C: the gate is an end-to-end comparison of the computed styles of
  « Refuser » and « Accepter », with the heights taken from the board; the
  dialog, not a button, has focus on arrival; every new test carries its own
  `@req` line (REQ-046, REQ-088).
