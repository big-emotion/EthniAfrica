The closing card ends every carousel, in a series or not, centred: the project's signature line, one sentence of invitation, the site pill and the centred signature (1.6.0-proposition, accepted on 15 October 2026).

**The line** is a constant of the renderer, never a card field: « Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes. », in Fraunces 600 56/64, three lines broken after each comma, its top at y 760 on every closing card. The kicker, the folio and the recap, when there are any, sit above it.

**Provide:** `type: "closing"`, `body` (one sentence: « Cherchez [nom] sur EthniAfrica, lien en profil. », or what the site page holds, two lines at most), `cta: {domain: "ethniafrica.com"}`, `credit` (two lines at most), `image`. No `title`: a title on a closing card is refused. After a dated sequence, `recap: [{date, name, kind}]` draws the path of the name, today on the left.

**Do:** put a series' fixed closing on the card before, as its title; promise only what the destination page actually holds; keep the recap to the dated cards that came before.

**Don't:** add a slogan or the motto « L'Afrique à travers ses noms » (both retired in 1.6.0); invent a link in bio; repeat the whole story; add a second call to action.

Boards: `cloture-160-*` (Lecture). Rules: Series, « The signature line »; Handoff, « Renderer integration of 1.6.0 ».
