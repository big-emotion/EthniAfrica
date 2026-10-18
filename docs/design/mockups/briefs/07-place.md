# Brief 7 — The place fiche

Read [`README.md`](README.md), `docs/design/mockups/site/README.md` and
`docs/design/mockup-first-workflow.md` first. Brief 15 is recorded; this pass
comes after it. Work on the three `place-yamoussoukro` boards, one width at a
time: 430 px, then 768 px, then 1440 px. Do not change the glossary or other
page boards.

## Surface and data

The surface is `/fr/atlas/lieux/[slug]`. Five place fiches exist:
`LOC_AFRIQUE`, `LOC_DALOA`, `LOC_GAGNOA`, `LOC_SAHARA` and
`LOC_YAMOUSSOUKRO`. This pass uses only the Yamoussoukro fiche. The board is a
reference for that real page, not a generic place template.

Use `dataset/source/afrik/lieux/LOC_YAMOUSSOUKRO.json` as the source of truth.
Keep its wording, dates, attribution and uncertainty. Do not add claims from
memory or from another page. In particular:

- The current name is Yamoussoukro; the earlier name is N'Gokro.
- The fiche reports different accounts for the village's founding and for the
  later name change. Keep the reported dates as alternatives: 1848 or the
  1860s for the founding; 1904 or 1909–1910 for the change.
- Show the two accounts about the change side by side as « Hypothèse 1 » and
  « Hypothèse 2 », in a neutral order. Do not present either as settled.
- Keep the account that relates Yamousso to the name and the baoulé ending
  « -kro » with its stated sources. Keep the separate family account about
  Yaha M'so and « mousso » attributed and uncertain.
- Keep the gap about the absence of a dated colonial document and the 1918
  civil-status register that remains to be consulted.
- The place is linked to Côte d'Ivoire and to the Baoulé; the fiche describes
  the village as akouè, a fraction of the Baoulé, according to family and
  chiefly accounts.
- The fiche has nine top-level sources. Their source types include academic
  work, community accounts, an encyclopedia, government and press. Show the
  source type; never show the internal source tier.

## What is on the boards today

Audit the three recorded boards before drawing. At 430 px the current page has
the site header, the title « Yamoussoukro », its place and country line, a
breadcrumb, « En bref », the name-history link, a short history of Yamoussoukro
and N'Gokro, « Pays et peuples liés », a closing band, a folded « Sources »
chapter and footer A. The board already includes the Baoulé relation and the
place's two naming periods. Report any difference you find at 768 and 1440 px
instead of assuming those boards match.

## What to change

Keep the page about the place's names and their history. Reuse the approved
components from `Main` and the recorded boards:

1. Keep the place name, country line, breadcrumb and « En bref ».
2. Present Yamoussoukro and N'Gokro in the existing name-history component.
   Put the two name-change accounts side by side as « Hypothèse 1 » and
   « Hypothèse 2 », each with its own source links and attribution. Preserve
   the uncertainty in the dates and in the accounts. Do not add a winner,
   confidence ranking or unsupported historical map.
3. Keep the existing country and linked-people block and its locator map. The
   map locates Yamoussoukro; it is not a historical map or decoration.
4. Reuse the approved closing band « Ce que nous ne savons pas encore » for
   the gaps in the fiche. Do not render an empty chapter.
5. Reuse the approved link to the name's story from brief 10, with a plain
   label, and the approved « Poursuivre avec un autre nom » component. Use only
   related names that the project can support; do not invent a destination to
   fill the space.
6. Reuse the approved sources block, titled « Les sources du nom Yamoussoukro »
   with one plain sentence below it. Group accounts by the name first, then by
   source type. Include the community accounts on equal visual footing with
   other source types.
7. Use footer B from `Main` and the approved story link and fold components.

At 430 px, check the reading order and text wrapping first. Then adapt the same
content to 768 and 1440 px; do not omit a claim or uncertainty at wider sizes.
Use the site's existing tokens and components.

## Length proposal

Measure the current and proposed 430 px board. If a section can be shortened or
folded without removing a distinction, propose the change and the estimated
height saved. Do not apply a length cut without the operator's decision.

## Step 0 and approval

Before changing anything, report in six lines: the blocks currently present
on each of the three boards; where the two name-change accounts appear; whether
the current source block groups accounts by name and source type; whether the
closing band, story link, next-name component and footer B are present; which
content disagrees with the source fiche; and any choice that needs the
operator. Change nothing in this step. Then wait for the operator's decisions.

After receiving those decisions, draw and label the three boards, 430 px first.
List in five lines any remaining choices you made. Wait for the operator's
approval before recording the boards in the repository. Keep the glossary
board untouched.
