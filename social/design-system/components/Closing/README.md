The closing card ends every carousel, in a series or not, centred: the project's signature line, one sentence of invitation, the site pill and the centred signature (1.6.0-proposition, accepted on 15 October 2026).

**The line** is a constant of the renderer, never a card field: « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. », in Fraunces 600 56/64, three lines broken after each comma, its top at y 760 on every closing card. The kicker, the folio and the recap, when there are any, sit above it.

**Provide:** `type: "closing"`, `body` (one sentence: « Cherchez [nom] sur EthniAfrica, lien en profil. », or what the site page holds, two lines at most), `cta: {domain: "ethniafrica.com"}`, `credit` (two lines at most), `image`. No `title`: a title on a closing card is refused. After a dated sequence, `recap: [{date, name, kind}]` draws the path of the name, today on the left.

**Do:** put a series' fixed closing on the card before, as its title; promise only what the destination page actually holds; keep the recap to the dated cards that came before.

**Don't:** add a slogan or the motto « L'Afrique à travers ses noms » (both retired in 1.6.0); invent a link in bio; repeat the whole story; add a second call to action.

Boards: `cloture-160-*` (Lecture). Rules: Series, « The signature line »; Handoff, « Renderer integration of 1.6.0 ».
**Accepted in 1.10.0 (19 October 2026):** the line becomes « L’importance de connaître nos noms. » on two lines, same face and place (top at y 760), followed by the fixed invitation « Vous pouvez continuer la recherche sur EthniAfrica, lien en profil. » on two lines; a closing card's own `body` is no longer printed (it goes on the last content card); the alternative text ends with both sentences. Boards: `cloture-1100-*` (Lecture). Rules: Series, « The closing (1.10.0) »; Handoff, « Renderer integration of 1.10.0 ».

**New words, 27 October 2026 (operator's decision):** the line becomes « EthniAfrica : l’importance de » / « connaître nos noms. », same face and place, and the invitation « Vous pouvez continuer la recherche » / « sur EthniAfrica et vous abonner » / « pour découvrir de nouvelles publications. », now on three lines; the third comes out of the gap above the credit. The voice says the invitation first; the card keeps the line above it. Rules: Series, « New words, 27 October 2026 ».
