# Brief 20 — The answer card in Claude and ChatGPT, and the install page

Status: **approved by the operator on 2026-10-23.** The boards are the
implementation reference for the public agent's answer card and its install
page.

## Why

EthniAfrica becomes reachable from Claude and ChatGPT through one remote MCP
server. A reader who asks an assistant where a name comes from gets an answer
card drawn by EthniAfrica inside the conversation (MCP Apps), with a complete
text version beside it for hosts that cannot draw the card. The plan, the
decisions and the open questions are in the agent plan document
(<https://claude.ai/artifact/Usi96ymsmNrTQBQiHKt29p>).

The first proposal drew a new card layout. The operator rejected it on
2026-10-23: the card must read like the search result page and its timeline.
The approved card is therefore the result page's own components
(`ea-live.css`), placed in a chat column, with a few additions listed below.

## What the card reuses from the result page

In order: the « D'où vient le nom » tile (title and summary), the name chips
with the searched form first, the timeline « Du plus récent au plus ancien »
with its legend, source diamonds and the fold after three accounts (brief 15),
« Voir la fiche complète », « Les sources du nom X » by source type (never a
tier), « Ce que nous ne savons pas encore » with the correction box, and
« Poursuivre avec un autre nom ». The states reuse the verdict of
`search-unknown` and the « Cherchiez-vous… ? » choice of `search-state-typo`.

## What the card adds

- **Two markers** in the title tile, worded for a reader: where the name
  comes from (« Nom de l'intérieur », « Nom venu d'ailleurs », « Venu
  d'ailleurs, puis repris ») and what the sources say (« Établi »,
  « Discuté », « Rapporté »). The word stays in ink; the status colour rides
  the outline and the dot, as on `.afh-name-badge`. A marker describes a
  name, never a person. The second marker is a computed rule at first; a
  dedicated field may replace it later.
- **« Ce qu'on croit souvent »**, one tile between the name chips and the
  timeline, for the gap between a common belief and what the sources show.
- **Buttons instead of links** for « Proposer une correction », « Partager un
  récit familial » and the « Poursuivre » cards: inside the assistant they
  send a follow-up or call the proposal tool rather than open a page.
  « Voir la fiche complète » stays a link to the site.
- **A closing line**: « EthniAfrica propose une lecture des noms. Elle peut
  se tromper, et vous pouvez aider à la corriger. »
- **A family-story consent card** listing what is sent and what is not, with
  « Oui, partager » and « Non merci », then a confirmation card carrying a
  withdrawal code. The person who passed the story on is described by an
  agreed formula, still to be fixed (`[formule convenue]` on the board).

The chat column around the card is deliberately neutral, with no Claude or
ChatGPT branding. Only the card is EthniAfrica's.

## Boards

Group « 6 · Agent EthniAfrica dans Claude et ChatGPT ».

| Board | What it shows |
| --- | --- |
| `agent-card-traore-390` | Family name, the timeline and sources copied from `search-state-long-traore` |
| `agent-card-civ-390` | Country, « Venu d'ailleurs, puis repris » |
| `agent-card-baoule-390` | People, « Discuté », a founding story in several versions |
| `agent-card-bantu-390` | Language family, a linguist's name taken for a people |
| `agent-card-daloa-390` | Place with a short fiche, an invitation to propose the local name |
| `agent-card-tribu-390` | Word, « Nom venu d'ailleurs » |
| `agent-card-traore-720` | The same card in a wide chat column |
| `agent-card-traore-dark-390` | The same card under `.dark` |
| `agent-card-state-unknown-390` | A word with no fiche (« sauvage »): the assistant's own answer is said to be unreviewed |
| `agent-card-state-typo-390` | A near spelling (« Bawlé » → Baoulé) |
| `agent-card-state-multi-390` | One name, two fiches (« Bambara »: people or language) |
| `agent-card-state-loading-390` | Loading |
| `agent-card-state-consent-390` | Family-story consent, then the withdrawal code |
| `agent-install-430`, `-768`, `-1440` | The install page: address to copy, steps for Claude and ChatGPT, the Claude desktop extension, questions to try, what the reader gets, their data |

The card styles live in `agent-card.css` and the install page styles in
`agent-install.css`, beside `ea-live.css`. In the widget the card carries the
same token values inline, because the host's sandbox cannot load the site's
stylesheet.

## Copy still to settle before implementation

- The agreed formula describing a family story's transmitter.
- The public MCP address shown on the install page (`https://ethniafrica.com/mcp`
  on the board).

The timelines of the Côte d'Ivoire, Baoulé, bantou, Daloa and tribu cards were
built from each fiche's accounts; their order is close to, not identical with,
what `src/lib/search/nameTimeline.ts` computes. The code's order wins.
