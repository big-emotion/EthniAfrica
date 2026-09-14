# Message audit — 2026-09-13

**What this report asks:** does the project's core message reach the people who
see the productions? Views are not that question. A view says the feed showed
the video; it does not say the viewer understood that a border crosses a people,
or learned a people's own name.

**Where it sits:** this is a companion to the site audit, not a replacement.
Site traffic is `docs/audience/audit-2026-09-12.md`; the figures below only
update it where they bear on the message. It lives in a subdirectory on purpose:
the downstream skills read "the most recent file in `docs/audience/`", and a
message report filed beside the audits would shadow the site audit they need.

**The message measured against** — the doctrine as it stands in
`docs/design/gabarits-social/GABARITS-SOCIAL.md` §7 ter and on the About page
(`src/lib/i18n/copy/about.ts:148`, `:166`):

> Ce peuple n'a pas été divisé. C'est la carte qui a été dessinée par-dessus.

Starting from a people's name, the reader should see what survives the border,
what is older than it, where the people comes from and who it is linked to — and
leave toward the human, not toward the division. Whenever a people is named, the
autonym/exonym pair should be visible at once. The doctrine is being revised in
a separate session; this report measures the productions against the current
text and flags where the text itself is contested (finding 9).

## Method and its limits

| Source                         | Read how                                                                                                                         | Window                                    | What it could not give                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| YouTube Studio                 | Channel analytics + Shorts list, logged-in browser                                                                               | 28 days + lifetime per Short              | Per-Short retention: the advanced-mode table stalled on load twice                                                                         |
| TikTok Studio                  | Analytics overview + content tab + posts list                                                                                    | 7 days                                    | Per-post retention; the posts list virtualises rows and froze the page under script                                                        |
| Instagram                      | Account insights                                                                                                                 | 30 days                                   | Titles of the top posts: the content grid exposes numbers only                                                                             |
| Meta Business Suite (Facebook) | Insights overview                                                                                                                | 28 days                                   | Per-post watch time                                                                                                                        |
| Plausible                      | Unauthenticated JSON API, `detailed=true`                                                                                        | 30d window (effectively since 2026-09-04) | Anything before 09-04; search queries                                                                                                      |
| Productions                    | Every published `post.md`, deck and narration in the private library (`ETHNIAFRICA_SOCIAL_POSTS`, `ETHNIAFRICA_SOCIAL_PROJECTS`) | All 27 published                          | Scripts of the 8 earliest videos and one carousel deck were deleted on 2026-09-12; those were scored from their surviving hook and reframe |

Platform windows differ and posts are of very different ages — ten of them were
one day old at measurement. **No figure below compares two posts as if they had
had the same chance.** Rank within a platform and the presence or absence of a
signal are the evidence; totals are context.

## Reach: the message is shown to strangers, at scale

| Platform       | Window | Views | Viewers | Non-followers | Attention signal                                                                        |
| -------------- | ------ | ----- | ------- | ------------- | --------------------------------------------------------------------------------------- |
| YouTube Shorts | 28 d   | 6 100 | —       | —             | 47.3 % stayed to watch, 52.7 % swiped away; 94.4 % from the Shorts feed, 0.2 % external |
| TikTok         | 7 d    | 5 700 | —       | —             | 95.7 % from For You; 65 profile views                                                   |
| Facebook       | 28 d   | 5 600 | 4 770   | 99.3 %        | 1 900 three-second views (≈ 34 % of views); 11 h 13 watch time                          |
| Instagram      | 30 d   | 734   | 483     | 78.1 %        | 91.9 % of views on Reels                                                                |

Roughly **18 000 views in a month, almost entirely served by algorithmic feeds to
people who do not follow the account.** Every production is a first contact.
That changes what a production must do: it cannot lean on a recurring viewer who
already knows the frame. It has to state the frame each time, in the same words,
in the same place.

## Understanding: no measurable signal

| Signal that the message landed | YouTube                                        | TikTok       | Facebook                 | Instagram              |
| ------------------------------ | ---------------------------------------------- | ------------ | ------------------------ | ---------------------- |
| Comments                       | **0 on all 16 Shorts**                         | **1** in 7 d | **0**                    | —                      |
| Shares                         | not read                                       | 13 in 7 d    | 0 on the four posts read | —                      |
| Accounts that interacted       | —                                              | —            | 53 interactions          | **9 accounts**         |
| Profile visits                 | —                                              | 65           | 35 page visits           | 15                     |
| Link taps / visits to the site | 1 tagged visit (`traore-diop`, bounced in 2 s) | 0 attributed | 1 visitor                | 2 link taps, 1 visitor |

Across four networks, a month of productions produced **one comment**, and the
site received **three visitors** attributed to social networks against 34 from
LinkedIn and 34 from Google. The one recorded correction from a viewer (the
Sénégal etymology, caught by a subscriber) came through a channel none of these
dashboards count.

This is the central fact: **the productions are watched and not answered.** At
this volume a silence is weak evidence, but it is uniform across networks and
subjects. Nothing measured says the message was understood; nothing measured
says it was misunderstood either. The instrument does not exist yet (see Skill
gaps).

## Per production: views against message coherence

Views as read on 2026-09-13; blank means not captured. The coherence score is
out of 16, eight criteria scored 0/1/2: (a) carries the border message, (b)
starts from a people's name, (c) shows autonym vs exonym explicitly and early,
(d) says what survives, (e) gives origin and links, (f) ends toward the human,
(g) one idea only, (h) the loop it opens is closed.

| Production                            | Format           | Published | YouTube | TikTok                      | Facebook | Coherence /16 |
| ------------------------------------- | ---------------- | --------- | ------- | --------------------------- | -------- | ------------- |
| Ghana, an empire that was not there   | video            | 09-09     | 1 504   | 382                         |          | 8             |
| Mali, Keïta and Coulibaly (sanankuya) | video            | 09-12     | 1 276   | 40                          | 69       | 11            |
| Sénégal, « notre pirogue »            | video            | 09-09     | 1 220   |                             |          | 4             |
| Nigeria, Flora Shaw                   | video            | 09-05     | 942     |                             |          | 4             |
| Afrique                               | video / carousel | 09-05     | 782     | 390                         |          | 4             |
| Mami Wata                             | video            | 09-12     | 756     |                             |          | 10            |
| Lingala                               | video            | 09-05     | 694     |                             |          | 5             |
| Douala, a people before a city        | video            | 09-12     | 513     | 314                         |          | 11            |
| Nzebi, the keeper of the clans        | video            | 09-12     | 481     | 12                          | 301      | 8             |
| « Bantou » is not a people            | video            | 09-07     | 460     | 401 + 362                   |          | 11            |
| Cameroun, a shrimp                    | video            | 09-07     | 435     | 397                         |          | 5             |
| Vodun                                 | video            | 09-12     | 325     | 23                          | 223      | 9             |
| Corriger la carte (UN vote)           | video            | 09-07     | 156     | 387                         |          | 5             |
| Zombie                                | video            | 09-12     | 126     | 18                          | 6        | 8             |
| Channel presentation                  | video            | 09-05     | 38      |                             |          | —             |
| Krou, not from « crew »               | video            | 09-12     | 9       |                             |          | 13            |
| Peul / Fula / Fulani                  | carousel         | 09-11     |         | **1 700** (top TikTok post) |          | 9             |
| Akan, Agni / Anyi                     | carousel         | 09-11     |         |                             |          | **14**        |
| Dioula                                | carousel         | 09-11     |         |                             |          | 13            |
| Bantou 170 peuples                    | carousel         | 09-11     |         |                             |          | 12            |
| Noms de commerce                      | carousel         | 09-11     |         |                             |          | 11            |
| Noms refusés (Amériques)              | carousel         | 09-11     |         |                             |          | 11            |
| Amazigh                               | carousel         | 09-12     |         |                             |          | 10            |
| Alliances maliennes                   | carousel         | 09-11     |         |                             |          | 10            |
| Noms imposés                          | carousel         | 09-11     |         |                             |          | 9             |
| Noms de métier                        | carousel         | 09-11     |         |                             |          | 8             |
| Bénin                                 | carousel         | 09-11     |         |                             |          | 8             |
| Villes en -ville                      | carousel         | 09-11     |         |                             |          | 7             |

Instagram's five best posts by views (2 500, 2 400, 2 300, 1 100, 963) were all
published on 09-12; the dashboard did not expose which ones.

**Reach and coherence are unrelated in this set, and that is the point.** The
four most-viewed videos score 4–11; the two most coherent productions (Akan 14,
Krou 13) have no or almost no measured views. The feed rewards the flat
impossible assertion about a country name. It does not reward the message, and
nothing yet tells us whether the message was received when it was present.

## Findings

1. **About 18 000 views in a month, 99 % served to non-followers on Facebook and 78 % on Instagram**: every production is a first contact, so the frame has to be restated in every piece.
2. **One comment across four networks in a month, and three site visitors from social against 68 from LinkedIn and Google**: the productions are watched and not answered, and no instrument measures understanding.
3. **The border message is nearly absent from what is published**: of 27 productions, only Akan (14/16) and Dioula (13/16) show a border crossing a people; the shared closing card carrying it was removed from Akan, Amazigh and Nzebi.
4. **11 of 27 productions name no people at all** (a country, a city, the map projection, a word, a divinity), and they include the four most-viewed videos — the channel is learning to be an etymology channel.
5. **The autonym/exonym pair has no fixed slot**: card 2 on the 09-11 carousels, card 5 on Peul, never on a card for Duala (captions only), and a pair that is not autonym/exonym at all on Dioula (trade vs people) and Amazigh (singular vs plural). A reader who meets the brand five times meets five layouts.
6. **The same idea carries at least seven wordings**: « vrai nom » (13 uses, also a content category), « se disent » (18), « le nom qu'ils se donnent » (7), « leur nom à eux » (4), « auto-désignation » (5, LinkedIn), « autonyme » (3), « appellation propre » (2); « étiquette » stands in for exonym 19 times; one people is spelled Duala, Duàlá and Douala.
7. **Endings lean toward the wound**: « rapport de force », « Aucun ne leur a demandé », « posé par-dessus », « les occupants ». The doctrine's own table says « Ce qui est resté », not « Ce qui a été pris ». The endings that match it are Bantou 170, Vodun, Sanankuya, Akan and the Amériques carousel.
8. **The most-viewed TikTok post is a people-name carousel (Peul, 1 700 views)**, yet it shows the autonym Fulbe only on card 5 of 6 and ends on a grievance: the one piece where the subject is right loses the structure.
9. **The doctrine's own dates are contested inside the library**: the Dioula closing card and the About page say « Berlin, 1884 » and « les noms sont mille ans plus vieux », while the Akan `post.md` records both as wrong (Berlin set rules for claiming territory and drew no line; « mille ans » cannot be dated). That contradiction is live on five networks. The doctrine session should settle it before any new closing card ships.
10. **Publication state is unreliable**: all ten productions dated 09-12 carry a « Publié » header on five networks, while three bodies say otherwise (Akan « NON PUBLIABLE », Zombie « NE PAS PUBLIER », Vodun « à trancher »), and Zombie and Sawa still show « crédit / licence à compléter ».
11. **Only one social link in four carries UTM parameters** (Vodun on Facebook); the others point at bare fiche URLs, so the 09-09 link-builder is not yet used by the publishing step.
12. **The site's message pages are not reached**: `/fr/about` 1 visitor in 30 days, `/fr/dossiers/nommer` 2, `/fr/atlas/appellations` 1, while peuple fiches take 82 visitors. The home hero reads « Une question sur l'Afrique ? » and does not carry the message. The fiche's first screen is where the message is actually met.
13. **TikTok search already asks for the border subject**: the queries reaching the account are « la carte du monde au nations unis », « afrique nouvelle carte du monde » and « nouvelle carte du monde vote » — the map is a demand the corpus can answer with peoples, not only with a projection.

## Diagnosis — where the message leaks

Read with the attention doctrine's leak audit (`attention-architect`,
`references/doctrine.md` §10), applied to the message rather than to the view
count. Attention leaks forward, so only the first failing beat is named.

**The hooks work; the reframe carries the wrong idea.** The measured winners all
open a strong loop (the flat impossible assertion: Ghana, Sénégal, Nigeria) and
close it properly. But their reframe sentence — the one viewers quote — is about
a country name: « Ce n'est pas une erreur de géographie. C'est une
revendication. » The doctrine gives the project exactly one reframe to repeat,
and it is almost never the reframe used:

> Ce peuple n'a pas été divisé. C'est la carte qui a été dessinée par-dessus.

Mechanism, in plain terms: a viewer remembers the sentence that resolves the
surprise, not the facts around it. If ten videos resolve ten surprises with ten
different meanings, the brand stands for « facts about names ». If they resolve
into the same meaning, repetition turns it into the brand.

**The name block cannot become a signal until it has a place.** A recurring
visual only teaches when it is predictable: same slot, same order (the name they
give themselves first, the name they were given second), same words. Today the
slot moves (finding 5) and the words change (finding 6), so each viewer — a
first-time viewer, per finding 1 — has to decode it from scratch.

**The debt is paid to the wrong place.** The closing line sends viewers to a
fiche, untagged (finding 11), whose first screen is the one surface nobody has
checked against the promise the video made. The only tagged click bounced in two
seconds (`PAT_TRAORE`, audit-2026-09-12 finding 8).

## Skill gaps

What the ask needs against what the skills do today.

| Need                                         | Covered by                                                                                                        | Gap                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Site traffic, pages, sources, devices        | `ethniafrica-audience-audit` (Plausible API)                                                                      | Does not break traffic down by `utm_campaign` / `utm_content`, so a post cannot be tied to what its visitors did                    |
| Per-post social metrics                      | `ethniafrica-content-strategist` names the metrics to rank (hook rate, view duration, saves, shares, link clicks) | Nothing collects or dates them; no file stores them; this report had to read four studios by hand                                   |
| Comments, understanding, recall              | nobody                                                                                                            | No skill reads comments or classifies them (understood / misunderstood / contested / question)                                      |
| Script and carousel text against the message | `attention-architect` checks the beat structure; `ethniafrica-structure` enforces the closing card                | Nothing scores a production against §7 ter: approved wording, agent reversal, name-block slot, ending toward the human              |
| Consistency across productions and the site  | nobody                                                                                                            | Nothing compares the vision line, the name block and the vocabulary across videos, carousels, captions and the site's first screens |
| Evidence ledger                              | `attention-architect` `references/evidence.md`, strategist `published-state.md`                                   | Hand-edited, view counts only, last measured 2026-09-07                                                                             |

Collection traps met during this run, for whoever automates it:

- YouTube Studio's advanced-mode table (per-Short retention) stalled on load in
  the browser twice; the Shorts list and the channel content tab read cleanly.
- TikTok Studio's posts list renders only visible rows and froze under an
  in-page script; `analytics/content` reads cleanly but lists the top five only.
- Instagram's content-insights grid exposes view counts without titles.
- Meta Business Suite's overview reads cleanly and lists recent posts with their
  captions, views and interactions.

## Handoffs

### For /ethniafrica-content-strategist

- **Do not scale the etymology-of-a-country series on its view counts.** Finding 4. It wins the feed and teaches the brand something else. Weight the next subjects toward peoples crossed by a border — the backlog already holds them (Peul in twelve countries, Wolof, Hausa, Kongo, Malinké, Yoruba, Touareg) — and measure them against the same feed.
- **The map is already a search demand on TikTok.** Finding 13. Answer it with the people-level version of the map subject, not a second projection video.
- **Every publication goes out with link-builder links.** Finding 11. Until it does, no post can be tied to a visit.
- **Fix the publication record before planning from it.** Finding 10.

### For /ethniafrica-structure and /attention-architect

- **One reframe, repeated.** Diagnosis. Unless the doctrine session changes it, every production about a people closes its loop through the §7 ter sentence or its agent reversal.
- **One slot and one wording for the name pair.** Findings 5 and 6. Proposed, pending the operator's decision: the pair on card 2 / by second 5, autonym first, one fixed phrase for it in reader copy.
- **End on what survives.** Finding 7, with the doctrine table as the test.
- **No closing card with « Berlin a tracé » or « mille ans » until the doctrine session rules.** Finding 9.

### For /ethniafrica-experience-optimizer

- **Check the first screen of the fiches the productions link to, at 430 px, against the video's promise.** Diagnosis and finding 12. Start with `PPL_FON`, `PPL_NZEBI`, `PPL_KONGO`, `PAT_KEITA`, `PAT_TRAORE`: does the autonym/exonym heading answer the question the video opened, before any scroll?
- **The home hero does not carry the message.** Finding 12. A design question for `/afrik-art-director`, not a copy patch.

## Next run

Re-measure on or after **2026-10-13**, when the 09-11 and 09-12 productions have
a month behind them and the site audit has its first full 30-day window
(2026-10-04). Before then, only the comment count and the tagged-visit count can
move enough to mean anything.
