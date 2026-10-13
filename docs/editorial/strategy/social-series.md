# Social series — the fixed frame

Decided with the operator on 2026-10-13, from the audience audit of the same day
(`docs/audience/audit-2026-10-13.md`). This is the structure every social
publication slot is filled from. It fixes **which series exist, when they run,
and how every episode of a series is built**; it does not list future subjects.
Episodes are chosen run by run by `/ethniafrica-content-strategist`, which states
the comparable numbers for each proposal, and produced through
`/ethniafrica-social-production`.

Why a fixed frame: the operator asked for something regular and organised, and
the measurements support fewer, better pieces. Meta counted 78 pieces published
in the week to 10-10 while Facebook's daily views fell under 4K and TikTok lost
31.6% in seven days. Volume is not proven to be the cause; it is the one lever
not yet tried. Reader-facing lines below are French, as published.

## The series

| #   | Series                                                         | Slot                     | Fixed question                                    | Fixed closing                                                                                                       |
| --- | -------------------------------------------------------------- | ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | « D'où vient le nom de mon pays ? »                            | Monday                   | « Qui a choisi ce nom ? »                         | Season finale: « Un nom change-t-il l'identité d'un peuple ? »                                                      |
| 2   | « Le nom qu'on leur a donné »                                  | Wednesday                | « Comment s'appellent-ils eux-mêmes ? »           | « Et chez vous, comment dit-on ? »                                                                                  |
| 3   | « Mon nom, mon histoire »                                      | Friday                   | « D'où vient ton nom ? »                          | The next episode is picked from the names readers give in the comments                                              |
| 4   | « Les mots qu'on nous a collés »                               | Every other week         | « D'où vient ce mot qu'on dit sur l'Afrique ? »   | The word people use for themselves                                                                                  |
| 5   | « Un peuple, plusieurs pays »                                  | Once a month (test)      | « Pourquoi le même peuple a-t-il deux noms ? »    | « La ligne a été tracée par-dessus des gens qui étaient déjà là. »                                                  |
| 6   | « L'Afrique n'est pas un tout »                                | One season of 6 episodes | « Qui a fait de l'Afrique un seul bloc ? »        | Episode 6, signed « nous pensons » : « L'Afrique n'est pas un seul peuple. Elle peut choisir d'être un seul camp. » |
| 7   | « Ce que les villes racontent »                                | Later                    | « Pourquoi cette ville s'appelle-t-elle ainsi ? » | Renamed cities (Léopoldville → Kinshasa, Salisbury → Harare)                                                        |
| —   | Long form (names as a country's DNA, outside and inside views) | Kept aside               | —                                                 | Site dossiers and LinkedIn                                                                                          |

Series 2 covers languages as well as peoples. « Le savais-tu ? », the quiz and
the animated map are formats any series may use, not series.

## How an episode is built

One script per episode, in fixed beats, so the carousel and the video come from
the same text and the video costs the cards plus the voice.

| Series | Beats                                                                                                                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | The name and the question · what it may mean · who gave it, and when · the earlier name or the inhabitants' name · the other readings · the closing line                                                                     |
| 2      | The name everyone knows · who gave it (neighbour, trader, coloniser, linguist) · the name they give themselves · why the gap · many have adopted the given name today; that was not always so · the question to readers      |
| 3      | The name · where it is carried · what it tells · its forms from country to country · « Et ton nom, d'où vient-il ? »                                                                                                         |
| 4      | The word as it is heard · its language and first meaning · how it reached Africa and who used it · what it was used to say · the word people use for themselves                                                              |
| 5      | The people on the map · its name on each side of the border · who drew the line, and when · what the line changed · the closing line                                                                                         |
| 6      | Africa (who named the continent) · Soudan, « le pays des Noirs » · Touareg, Yoruba, Zoulou: three language families · « Afrique noire », « subsaharienne » · Éthiopie and Guinée as names for all of Africa · the conclusion |
| 7      | As series 1                                                                                                                                                                                                                  |

**"The other readings" replaces "what we do not know yet"** (operator,
2026-10-13). Episodes are researched as far as the sources go and prepared ahead
of their slot; the episode presents the reading it retains and says plainly that
others exist, attributed, never ranked by origin (`docs/productions/README.md`,
"Never an assertion"). A claim resting only on a machine-written synthesis is
researched before it is scripted (for example `PAT_KOFI`, `PAT_KWAME` and
`PAT_KONE` on 2026-10-13).

## Formats per episode

- **A video every episode.** Reels are the better-observed way to reach new
  people on Instagram and Facebook (98.6% of Instagram views were reels, audit
  of 2026-10-13); Shorts on YouTube.
- **A carousel only when the episode takes apart an attested received idea**,
  the rule the name-series ledger already applies. On TikTok carousels earn
  reach of their own (« Lingala » 39K, « Jula » 14K, « Yamoussoukro » 963 as of
  2026-10-13), so a carousel, when there is one, goes there first.
- Visual: the accepted card system in `social/design-system/`, plus one band
  carrying the series name and the episode number. No separate design per
  series.

## Channels

| Channel             | Role for the series                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Instagram, Facebook | Every episode, reel; Instagram story with link sticker and question sticker                                                                    |
| TikTok              | Every episode; carousel first when one exists                                                                                                  |
| YouTube             | Every episode as a Short                                                                                                                       |
| LinkedIn            | **Paused for the series** (no visitor sent in four weeks). Becomes the professional channel: looking for investors and contributors, long form |
| X                   | **Stopped** (no post since 2026-09-16; the operator is considering deleting the account)                                                       |

## Leading readers to the site

Network reach is not reaching the site: 448K Instagram views in 30 days, 5
consented visitors from all networks in the last week, 0 link clicks on the
biggest posts. The one link that converts is the profile link (105 taps in 30
days).

- **Every caption ends with the same sentence, no link block, no hashtag wall:**
  « Cherchez [nom] sur EthniAfrica, lien en profil. »
- **The profile link stays fixed** on the search page; the episode-specific link
  goes in the **Instagram story link sticker**, the only place where a link is
  one tap away and changes with every episode:
  `https://ethniafrica.com/fr/atlas/recherche?q=<nom>&utm_source=instagram&utm_medium=story&utm_campaign=<series>-<episode>`.
- **Every post is filed and carries a campaign code** `<series>-<episode>`
  (`pays-14`, `nom-recu-03`, `nom-famille-06`, `mots-02`, `frontieres-01`,
  `afrique-tout-01`, `villes-01`), so each series can be credited with the
  readers it sends.
- **Landing pages are fixed before a series sends readers to them** (handoff to
  `/ethniafrica-experience-optimizer`): the result-page timeline emits no click
  event; `/fr/atlas/pays/CIV`, `FLG_MANDE`, the `PAT_*` template and `PPL_ZARMA`
  are dead ends or bounce-throughs. Series 7 waits for place fiches: the site
  has 3 place pages in its sitemap and none was visited.

## Editorial positions recorded with this frame

- **Afrique**: the episode presents one hypothesis and says explicitly that
  there are several (an Afri people near Carthage, Phoenician, Latin and Greek
  readings).
- **Borders**: the Berlin conference set the rules of the partition; the lines
  were drawn by treaties between European powers, mostly 1885–1914; in 1964
  African states chose to keep them.
- **Unity** (series 6) is a signed position, written « nous pensons que… »,
  never presented as a sourced fact. Any figure on Africa's resources enriching
  other countries carries its source.
- **Third-party clips**: the operator clears the rights for each clip before
  publication.
