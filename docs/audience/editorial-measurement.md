# Measuring whether the editorial voice helps readers

Baseline: [audience audit — 2026-09-30](audit-2026-09-30.md).
Use with [editorial personas](../editorial/audience-personas.md) and the
[register](../editorial/reader-facing-register.md). This protocol defines the next
measurements; it does not configure tracking, publish a questionnaire or schedule
an automation.

## Questions before counters

1. Can a newcomer explain the main point without confusing the competing accounts?
2. Can the reader identify what is known, reported, disputed or still unknown?
3. Can the reader find the sources and continue investigating?
4. Can a reader contribute a situated account without needing academic credentials?

Reach tells us who may encounter a piece. Retention tells us about attention.
Shares and saves tell us about actions, not necessarily approval, trust or learning.
None of these establishes a historical claim or the value of a source.

## Measurement dictionary

| Question / surface                | Metric and denominator                                                                 | Available baseline                                                             | Reading and limit                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Site discovery                    | Visitors, visits, pageviews; each retained separately                                  | 365 visitors, 439 visits, 1,621 pageviews, Aug 31–Sep 29                       | Consented activity only; unique visitors are not a cross-platform headcount                                        |
| Site attention                    | Bounce, time on page, scroll, by page and device                                       | 26% site bounce; 303 mobile visitors                                           | A completed answer can end a visit; bounce alone does not establish dissatisfaction                                |
| Search usefulness                 | `search:submit` and `search:result_click`, counts and visitors for the same window     | 292 submits/106 visitors; 108 result clicks/62 visitors                        | Do not call 108/292 or 62/106 a successful-search rate without a matched search/session cohort                     |
| Source consultation               | Visitors with a source click / visitors shown those source links, same page and window | Not measured specifically: `fiche:source_click` is declared but has no emitter | 24 generic outbound events/15 visitors cannot be relabelled as source clicks                                       |
| Continued exploration             | `fiche:related_click` events and visitors; exposure denominator if available           | 12 events/11 visitors                                                          | Current API percentage uses all site visitors, not visitors eligible to click a related fiche                      |
| Contribution                      | Opens, submits, accepted contributions; matched cohort for completion                  | `report:open`: 1 event/1 visitor; no submit row returned                       | No row is missing evidence, not automatically zero; inspect registration and collection before interpreting        |
| YouTube discovery                 | Views, estimated viewers and feed share, separate                                      | 20,694 channel views; ~6.9K monthly viewers; Shorts feed 91.7%                 | Monthly audience is estimated and still processing; never add it to another network's reach                        |
| YouTube attention                 | Stayed-to-watch as defined by Studio; average view duration and percentage per video   | Shorts stayed-to-watch 56.0%; Mande 1:24 / 69.6%                               | Stayed-to-watch is not automatically a three-second retention metric; compare like formats and ages                |
| TikTok discovery and action       | Post views, viewer count, profile views, shares, comments                              | 82.5K views, 655 shares, 264 comments on the selected 28-day overview          | Rounded counts; the viewer tab resets to seven days, so its population is different                                |
| Meta attention                    | Per-post average play time; native three-second view count                             | Facebook Mande: 29 s average, 55,480 three-second views                        | Do not divide three-second views by all account views and call it a hook rate; use the eligible native denominator |
| Instagram/Facebook useful actions | Saves and shares per 1,000 native views = actions / views × 1,000                      | IG Keïta/Coulibaly: 229 saves, 386 shares, 16,351 views                        | This is actions per view, not percent of people; cross-post combined counters stay separate                        |
| Social-to-site path               | Native link clicks plus site visitors by source/campaign/content, each separately      | IG 40, Facebook 17, YouTube 1 site visitors; 4 campaign rows                   | Missing referrers, consent, time windows and repeat visits prevent direct click-to-visitor equality                |
| LinkedIn                          | Company impressions/clicks separately from personal-profile data                       | Company 599 impressions, Aug 29–Sep 27                                         | Personal total mixes subjects; only identified EthniAfrica posts support project conclusions                       |
| X                                 | Per-post views with publication and collection dates                                   | Three thread heads: 24, 18, 17 views                                           | Public post counts, not unique audience or retention                                                               |
| Understanding                     | Bounded comment coding and voluntary comprehension checks                              | 12 visible TikTok top-level comments reviewed                                  | A convenience sample, not all comments or the silent audience; disagreement is not automatically misunderstanding  |

## Comment review that does not mistake disagreement for failure

For each reviewed piece, record the sampling rule, date, number read and whether
replies were included. Read recent as well as prominent comments where practical;
report what the interface made visible. Use several labels when needed:

- Restates the point accurately, including uncertainty.
- Asks for clarification or a source.
- Offers a situated usage or alternative account.
- Disputes the interpretation or factual claim.
- Appears to misread the piece (state why, tentatively).
- General reaction, thanks or emoji: no comprehension conclusion.

Report the raw numbers and short anonymised paraphrases. Do not turn a person's
name or residence into an identity label. Verify historical suggestions separately;
comments do not become facts because they receive likes. A constructive correction
can indicate successful participation even when it disproves the draft.

## A manageable comparison of clearer writing

Start with three forthcoming comparable pieces and report observations at the
same age (for example 7 days, then 28 days). This is an exploratory proposal, not
a publishing quota or an automatic schedule. Preserve the facts, qualification
and sources while clarifying the opening and wording. Record what changed, the
platform, format, length, subject and distribution; never republish a false claim
as an experimental control.

Before release, ask voluntary readers to explain the point and locate its support.
Record how many can do so and what confused the others. Afterwards read comments
and native attention metrics alongside this feedback. Compare against relevant
previous pieces, state sample sizes and use medians rather than a viral winner.
Different subjects or dates prevent a causal claim about wording. A rise in views
without clearer understanding is not success against the editorial objective.

## Collection and attribution

- Pin explicit dates for site queries. On this run `30d` ended September 28;
  the explicit August 31–September 29 query includes the last complete calendar day.
  Record the dates returned, timezone where shown, and processing lag.
- Keep platform windows, account totals, post totals, follower demographics and
  viewer demographics distinct. Store missing metrics as unavailable, never zero.
- Keep native labels and rounding. Do not sum views across networks or deduplicate
  people without evidence. Percentages of breakdown visitors need not sum to 100.
- Tag actual destination links using existing `utm_source`, `utm_medium`,
  `utm_campaign` and `utm_content` conventions. Resolve the campaign from the
  publication/ledger, not its mutable title. A generic `bio` campaign cannot
  identify the post that prompted the visit.
- `fiche:source_click` instrumentation and goal registration need a separate,
  test-first implementation if commissioned. Preserve consent and avoid private
  information in analytics; the dashboard is public. Do not create new tracking
  merely to fill a persona table.
- Review mobile first, then tablet, then desktop. Small desktop/tablet samples
  make precise conclusions fragile. A duration gap suggests investigation, not
  proof of a layout defect.

A weekly editorial review can use a small fixed sample of recent posts; a monthly
report can refresh the personas. These are recommendations only; no recurring job
has been created.
