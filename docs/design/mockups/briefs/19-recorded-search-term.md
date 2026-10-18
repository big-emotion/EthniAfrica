# Brief 19 — A recorded spelling answers the search

Status: **approved by the operator on 2026-10-18** for ETNI-2110. The approved boards are the implementation reference for this state.

## Decision and scope

ETNI-2110 records option 1: when a fiche records the searched spelling, the result page shows the fiche and where the spelling appears. The ticket settles three defaults:

1. Count name and clan lists and fiche prose; do not count source notes.
2. Show every fiche that records the spelling at the same level.
3. Treat a recorded spelling as an exact answer, so it does not produce a « Cherchiez-vous… ? » lead.

PR #1835 is merged into `recette`. The boards use « sanoh » as the searched form and show two equal results: Sanou records it as a spelling, while the Kuranko fiche includes it among its clans. The source note in the Sanou fiche is not shown or used to establish the match. Sanogo is not offered as a lead.

## Boards

The proposed boards are `search-state-recorded-430.dc.html`, `search-state-recorded-768.dc.html` and `search-state-recorded-1440.dc.html`, in group 1 beside the other search states.

- **430 px:** one column, with the search field, short answer and two vertically stacked fiche cards.
- **768 px:** the same reading order, with the two equal fiche cards side by side when they fit.
- **1440 px:** a centered result column and two equal cards in one row. Neither fiche receives a lead treatment or a higher position.

The searched spelling is highlighted inside each sentence. The sentence for Kuranko follows the fiche wording. The sentence for Sanou reflects the sourced spelling that ETNI-2110 adds to the fiche; the source note itself does not count.

## Copy proposed for the page

- Heading: « sanoh »
- Answer: « Deux fiches donnent cette écriture. »
- Sanou: « La fiche Sanou donne aussi l’écriture « Sanoh ». »
- Kuranko: « Les clans Kagbo, Sanoh, Kaloko et Koroma jouent également des rôles importants. »

The operator approved these words and layouts on 2026-10-18. The approval is also recorded in `docs/design/mockups/site/README.md`.
