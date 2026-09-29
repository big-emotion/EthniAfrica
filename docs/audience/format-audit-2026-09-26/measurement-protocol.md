# Measurement protocol for future observations

Companion to the [audit](README.md) and the
[exploratory comparison plan](validation-plan.md). It says how a number must
be taken for it to be comparable with another one. It proposes a method; it
does not post, schedule or boost anything, and it adds no service: an
observation is a reading taken by a person at a stated time and written down.

## Why the audit's numbers cannot be reused as baselines

Every figure in the audit is a **lifetime total read on 2026-09-26, at ages of
1 to 21 days**. A count read 7 days after publication is not comparable with a
median of totals that mixes a 1-day-old post and a 21-day-old one. Historical
lifetime medians stay **descriptive**: they say what our first three weeks
looked like. They are not the "usual result" that a new post is measured
against, and no new 7-day count is divided by them.

A valid baseline is built forward: the 7-day observations of the last posts of
the **same platform and the same format**, once at least ten exist. Until
then a comparison is made only inside a pair (below) or not at all.

## What is observed

An **observation** refers to one **publication occurrence**: one posting, on one
account, on one date, or an explicit unpublished planned one. It is a
timestamped reading of that occurrence's metrics. Fields:

| Field                             | Meaning                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `occurrence_ref`                  | The occurrence's identifier in the catalogue (owned by the catalogue, not by this protocol)                |
| `published_at`                    | Timestamp of publication with time zone; the analytics tool's own timestamp if the two differ, with a note |
| `observed_at`                     | Timestamp of the reading, with time zone                                                                   |
| `age_hours`                       | `observed_at` minus `published_at`, in hours, computed, never typed                                        |
| `window`                          | `7d`, `28d` or `other`, assigned by the rule below                                                         |
| `window_met`                      | True only when `age_hours` falls inside the tolerance                                                      |
| `metric`, `value`, `status`       | One row per metric: value, and the status defined under "Missing is not zero"                              |
| `metric_label_as_shown`           | The label the tool displays, copied, so a renamed metric is visible later                                  |
| `paid_status`, `paid_checked_at`  | See "Paid, organic or unknown"                                                                             |
| `scope`                           | `single_platform` or `combined_meta`; a combined row stays combined                                        |
| `followers_at_publication`        | Followers of that account on the day, when the tool shows it                                               |
| `comments_total`, `comments_read` | See "Comments"                                                                                             |

A record that does not carry these fields is a note, not an observation.

## Windows

- **7-day observation:** read between 156 and 180 hours after `published_at`
  (7 days ± 12 hours). **28-day observation:** between 648 and 696 hours.
  Outside the tolerance the reading is kept with `window: other` and
  `window_met: false`, and is left out of any window comparison.
- The tools show **lifetime totals at the moment of reading**. A "7-day
  observation" is therefore a lifetime total read at hour 168, not a
  platform-computed 7-day figure. If a tool offers its own fixed window,
  record it as a different metric with its label; do not mix the two.
- **Read pairs together.** The two halves of a comparison are read within
  the same hour of each other's age, or one is read twice (at its own hour 168).
  A pair read on different days is not a pair.
- Account-level Meta figures are 28-day rolling and are not post windows.

## Metric definitions

Record the tool's own definition and never convert between them. From the
audit's collection (not re-verified since):

| Platform  | "Views" as read                                                            | Known ambiguity                                                     |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Instagram | Meta "Views": plays including replays                                      | The counting unit for a carousel is not documented                  |
| Facebook  | Meta "Views": plays including replays                                      | Same; a Reels-tab count can differ from Business Suite for one item |
| TikTok    | Video or photo-post views; reach and follower split hidden below 100 views | Photo completion and video completion are not comparable            |
| YouTube   | Shorts: a view starts on play or swipe-in                                  | Community image posts expose different metrics                      |
| LinkedIn  | Video views only; image posts have none                                    | Impressions are a different metric                                  |
| X         | Views                                                                      | Post analytics were not read in the audit                           |

Two derived metrics are allowed, both as ratios of the same platform's own
numbers: saves per 1,000 views and follows per 1,000 views. A denominator of
fewer than 100 views is reported as a count, not a ratio.

## Missing is not zero

Every metric has a `status`:

- `observed`: the tool shows a number, including a non-zero one.
- `zero_shown`: the tool shows 0 or "no saves".
- `hidden`: the tool withholds it (TikTok below 100 views, Meta on a combined
  row). Not a zero and not a small number.
- `not_read`: nobody looked. Not a zero.
- `not_applicable`: the metric does not exist for this format (LinkedIn views on
  an image post).

A blank cell is never a zero and is never averaged. The audit file has 135
blank reach cells, 70 blank saves and 40 blank follower cells; each of those is a
statement about reading, not about the audience.

## Paid, organic or unknown

`paid_status` is one of `organic_verified`, `paid_verified`,
`collaboration_verified`, `unknown`. **`unknown` is the default and the audit's
answer for every row.**

- A status is verified only after opening the surface that shows it (the paid or
  ads tab, the promotion page) at `paid_checked_at`, with a one-line note of
  what was seen.
- A visible "Boost" button says the post can be boosted, not that it was. The
  absence of a boost label is not a finding.
- A traffic-source share such as "For You" says where views came from, not
  whether they were paid.
- Paid or collaboration posts are analysed separately from `organic_verified`,
  and `unknown` posts are not silently pooled with either.

## Comments

Comments carry a claim about our sources and an audience's reaction; they are
sampled deliberately and written down as counts.

- Record `comments_total` (the tool's count) and `comments_read`.
- Sampling rule, fixed in advance: read all top-level comments when there are
  50 or fewer. Above 50, read the 20 the tool ranks first, the 20 newest, and 20
  drawn at random with the seed written down; replies are read only for
  threads that a top-level comment makes a claim about. Record which sort order
  the tool used.
- **Read the low-reach comparison half as well as the leader.** Threads read
  only on posts that led select on the outcome, and cannot show why they led.
- Code each read comment as `appreciation`, `request`, `correction`, `dispute`,
  `misreading` or `other`, one code per comment, by one reader who writes down
  the date. Report "k of n read", never "the comments".
- **Keep raw text and identifiers out of the repository.** Store counts in the
  observation and the raw thread in the private library. A request or a
  correction is a lead for a sourced follow-up, never a ruling.

## Within-platform comparisons

Compare inside one platform, because views, audiences and definitions differ
between networks.

- **Unit: a pair.** One subject, one angle, one source text, both formats, one
  platform, published natively. No cross-post, no boost, no collaboration, no
  link from one half to the other.
- **Predeclare, before publishing, in one written line:** the objective
  (discovery, attention, reference value, growth or traffic), the **one primary
  metric** for it at the 7-day window, and how pairs will be summarised. Every
  other metric is exploratory and is labelled so.
- **Report every pair.** Give each pair's two values and the ratio, the count of
  pairs in each direction, and the range. A median of four ratios is a
  description, not a result.
- **Uncertainty comes first.** With _k_ pairs all in one direction, the smallest
  two-sided sign-test p-value is 2 × 0.5^_k_: 0.125 for four pairs, 0.063 for five,
  0.031 for six. A design of four or five pairs cannot reach conventional
  significance whatever it shows. It is exploratory and is described as such.
- **Never write "no effect" from a small sample.** Write "no difference
  detected in _k_ pairs; ratios ranged from _a_ to _b_, and a difference of that
  size could not be excluded".
- **These are not causal A/B tests.** The two halves reach an overlapping
  audience, and subject, hook, hour and follower count move together with
  format. Say "in these pairs", never "format X causes".

### Interference and order

Two halves published the same day share the audience, the account's momentum
and the follower count, and a second post can be primed or crowded by the
first. The audit's five same-day TikTok pairs were not order-balanced, so
their direction may reflect order.

- Record `published_at` for each half, the order, and the interval.
- **Counterbalance the order.** Use an even number of pairs and put the reel
  first in half and the carousel first in the other half. An odd count, or
  three pairs, cannot be balanced; add or drop one.
- Keep the interval fixed across pairs and write it down before the first
  pair. The audit's plan of 3 to 4 hours is a guess; whether it is enough to
  remove interference is unknown and is itself not tested here.
- Vary the hour of day across pairs too, or fix it; do not let the same
  format always take the same slot.
- An alternative is separated posts (24 to 48 hours apart) with the same
  balancing. It removes some interference and adds day effects. Choose one
  design per comparison and state it.
- Do not run two comparisons on one subject, or start one on a subject whose
  earlier edition is still being read.

## Handling what cannot be measured

- A combined Instagram+Facebook observation is recorded as `combined_meta` and
  is never split, added to, or compared with a single-platform value. Publishing
  natively on each network avoids creating one.
- Site traffic is measured through the campaign tag in the analytics tool, per
  consented sessions only; that number is a floor of unknown depth, not the
  audience.
- Slide counts, durations and hook wording are recorded at publication, because
  they cannot be recovered afterwards (the audit file has 245 blank slide counts).

## What this protocol does not settle

It does not choose subjects, formats or dates, and it does not decide when an
observation is worth a decision. It does not verify any platform behaviour: the
metric table above is from the audit's collection of 2026-09-26 and has not been
re-read. Where a platform's counting rule matters to a comparison, check it on
that day and write down what the tool says.
