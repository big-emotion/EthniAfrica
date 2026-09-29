# Carousel or reel? What our first three weeks of publications show

Format audit of every EthniAfrica publication on Instagram, Facebook, TikTok,
YouTube, LinkedIn and X. Collected on **2026-09-26**, read-only.

| Deliverable                                            | File                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| A. Executive report                                    | this file                                                        |
| B. Publication-level dataset (252 inventory rows)      | [`publications.csv`](publications.csv)                           |
| C. Carousel-versus-reel decision matrix                | [`decision-matrix.md`](decision-matrix.md)                       |
| D. Adaptation shortlist (7 candidates)                 | [`adaptation-shortlist.md`](adaptation-shortlist.md)             |
| E. Exploratory comparison plan (4 comparisons)         | [`validation-plan.md`](validation-plan.md)                       |
| F. Measurement protocol for future observations        | [`measurement-protocol.md`](measurement-protocol.md)             |
| G. Reconciliation candidates (evidence for the ledger) | [`reconciliation-candidates.md`](reconciliation-candidates.md)   |
| H. Arithmetic check (`node --test <file>`)             | [`verify-audit-figures.test.mjs`](verify-audit-figures.test.mjs) |

> **Revised 2026-09-29 (version 2).** The first version merged on 2026-09-26
> (#1371). This revision reproduced every figure from `publications.csv`,
> corrected the statements the data did not support, and relabelled findings as
> observed, hypothesis or unknown. **No platform was re-read for it**: every
> figure is still the 2026-09-26 collection, and no platform fact was freshly
> verified. What changed is listed in [section 7](#7-what-version-2-changed).
> Historical lifetime figures stay descriptive; they are not baselines for a
> 7-day count.

## 1. Coverage and what it can and cannot support

- **Period:** every account was created on or about 2026-09-05, so the whole
  history is 21 days (2026-09-05 to 2026-09-26). Nothing is excluded by date.
- **Sources:** Meta Business Suite (Facebook Page and Instagram), TikTok Studio,
  YouTube Studio, LinkedIn admin analytics (company page) and profile activity,
  X profile pages, plus the production ledger (`docs/productions/`, 138 entries)
  and the private library ledger as seed lists. Every ledger entry was checked
  against what is live; the ledger was never trusted for a format.
- **Rows:** 252 publications. Instagram 36 (27 reels, 9 carousels), Facebook 49
  (35 reels, 11 multi-photo posts, 3 other), Instagram+Facebook cross-posts 32
  (21 carousels, 6 reels, 5 single photos, one combined row each), TikTok 65 (32
  videos, 33 photo carousels), YouTube 38 (30 Shorts, 1 standard video, 7
  community image posts), LinkedIn 22 (20 on the company page: 14 videos and 6
  image posts; 2 personal-profile items), X 10 (3 video thread heads, 7 text
  replies). These are 55 content groups, against 50 campaigns in the ledger.
- **What a row is.** A row is an inventory record of one item as one surface
  listed it, not a certified unique publication occurrence. Ids are unique and
  no URL appears twice, but only 184 rows carry a permalink; 68 do not (39
  Facebook, 22 LinkedIn, 7 YouTube community posts). Each of the 32 combined
  Instagram+Facebook rows is one Business Suite line for a cross-post and is
  not a measurement of either network. For two of them (R016 and R104) a
  Facebook-only row shares the subject, the date and the opening words, so a
  double count cannot be excluded from the file; see
  [`reconciliation-candidates.md`](reconciliation-candidates.md). "252
  publications" therefore means 252 listed items, of which a live check has to
  settle how many are distinct occurrences.
- **Windows:** all metrics are **lifetime totals at collection**, at ages from
  1 to 21 days. No equal 7-day or 28-day window could be reconstructed, so
  every comparison below states the age or cohort it rests on. Account-level
  Meta figures are 28-day.
- **Traffic to the site** was not measured here (Plausible is out of scope, see
  the `audit-2026-09-*.md` reports). Post-level link clicks are almost empty:
  Facebook recorded 7 link clicks in 28 days, Instagram 0.

**What this sample cannot do.** Three weeks, accounts growing from zero
(Facebook +7.4K followers in 28 days), one operator's editorial choices and
one very fast-moving audience. Any format effect is mixed with subject,
publication date, follower count on that day, duration and hook. Where a claim
survives only on one publication, it says so.

## 2. Findings

Confidence: **high** = large gap, consistent across rows, robust to removing
the top publication; **moderate** = consistent but small or partly confounded
sample; **low** = suggestive only.

### F1. Results are extremely concentrated; winners are not the typical case

- **Facebook reels** (n=35, single-platform rows): the three largest,
  R034, R051 and R055 in the CSV, total **226,825 of 257,386 views (88%)**. The
  median of the other 32 is **617 views**; the median of all 35 is 709.
- **TikTok:** the Lingala photo carousel alone holds **25,544 of the account's
  66,529 post views (38%)**. The median TikTok post has ~300 views.
- **YouTube Shorts** are the flattest distribution: top publication 8% of views,
  median 532 (n=30).
- **Implication:** rank formats by median and by how often a format produces
  outliers, never by its best post. Confidence: high (arithmetic).

### F2. Instagram: reels reached far more people than carousels in this sample

- Median views: **reels 1,274 (n=27) vs carousels 141 (n=9)**. Inside the same
  publication cohort (5–12 Sep) reels are 2,043 (n=10) against 141 (n=8).
- Followers gained (Meta's per-post attribution), posts with 100+ views:
  reels **1,451** across 26 posts; carousels **1** across 6. Median per 1,000
  views: 15.2 against 0.
- Only one same-day pair on the same platform exists: swahili reel
  [6,926](https://www.instagram.com/reel/DdiqtPTqFik/) views against its
  carousel [226](https://www.instagram.com/p/Ddjig2QCNOf/), 30×.
- **Limits:** Meta does not document what one "view" counts on a carousel
  (slide impressions would inflate it, viewer counts would not); carousels were
  posted on Sep 11–21 only; the 21 cross-posted carousels cannot be separated
  from Facebook (see F5).
- **Saves per 1,000 views point the other way from version 1.** Median 7.1 for
  carousels (n=6, posts with 100+ views) against 10.7 for reels (n=26); over
  all posts 4.4 (n=9) against 11.4 (n=27); pooled 12.2 against 14.5. Carousels
  are lower on all three cuts, but six posts cannot rank either format, so the
  supportable statement is "no evidence that Instagram carousels were saved
  more per view", not "saved as much".
- **Confidence:** moderate-high that reels out-reach carousels _on our
  Instagram account today_ (nine native carousels, eight of them posted on 11
  and 12 Sep); low on why.

### F3. TikTok: no visible gap between medians, and the extreme tail is carousels

- Median views: carousels **354 (n=33)** against videos **302.5 (n=32)**;
  interquartile ranges 133–718 and 101–414 (linear interpolation). The middles
  overlap almost entirely. With this sample that is an absence of visible
  difference, **not evidence of no format effect**: a real effect of a
  meaningful size could sit inside those ranges.
- All five posts above 2,000 views are photo carousels: Lingala 25,544
  ([link](https://www.tiktok.com/@ethniafrica/photo/7685962182923767062)),
  Dioula 11,716
  ([link](https://www.tiktok.com/@ethniafrica/photo/7684693876015418627)),
  Agni 3,834, Daloa 2,733, Fulbe 2,131. The best video has 1,358
  ([Bouët-Willaumez](https://www.tiktok.com/@ethniafrica/video/7685531757302549782)).
- Same-week matched pairs on TikTok point both ways. Five subjects have both
  formats on the same day (Bantou 7 Sep, three on 21 Sep, frontières 25 Sep);
  they were posted by one account to one audience, so each pair may interfere
  with itself (a first post can prime or crowd out the second) and none was
  order-balanced. On 21 Sep three videos beat their carousels by 2.9–4.7×
  (ethnie 286 v 61, Ghana 318 v 111, swahili 275 v 86);
  Fulbe's carousel beat its video 4.6× (2,131 v 465); Keïta/Coulibaly and
  Bantou were ties; on 25 Sep the two frontières carousels (273, 389) beat the
  2:13 video (34, retention stopped at 0:02) by 8–11×. Pairs where the video is
  the 5 Sep first-day post (24 views on a brand-new account) were dropped.
- Per 1,000 views the medians of saves (10.8 v 9.9) and shares (2.8 v 3.6) are
  similar (posts with 100+ views only: 30 carousels, 25 videos; over all posts
  the figures are 11.0 v 9.0 and 2.8 v 3.0). Followers gained, posts with 100+ views: carousels 353 on 55.8K
  views (30 posts); videos 95 on 10.3K (25 posts). Per 1,000 views the median is
  5.2 for carousels and 8.8 for videos.
- Recent carousels (21–25 Sep, n=6) have a median of 98.5 views. The
  comparison figure of "401–403 for earlier cohorts" reproduces only for the
  7–12 Sep posts (403, n=15); the 16–17 Sep posts have 177 (n=9). The recent
  posts are also 1–5 days old, against 9–19: age, subject mix or a real fall
  since the earlier batches are not separable yet.
- **Same subject, same format, 63× apart.** The Lingala subject has two TikTok
  photo carousels: 403 views (7 Sep, hook "a-t-il été inventé par des…") and
  25,544 (16 Sep, a different hook and framing). The ledger files the first as
  a video. Subject and format were held constant and reach still differed by
  63×, so hook, framing, timing, audience size and chance all compete with any
  subject or format explanation of the largest result.
- **Confidence:** moderate that there is no visible median gap (n=33 v 32,
  overlapping ranges, uneven cohorts); low on the tail (two posts carry it,
  both drew disputes, see F7).

### F4. Facebook: the reel/multi-photo gap is huge, but its cause is unknown

- Median views: reels **709 (n=35)** vs multi-photo posts **11 (n=11)**. The
  11 multi-photo posts were published on 11–14 Sep and drew 3 to 30 views each.
- Do not read this as "Facebook does not distribute carousels": the sample is
  eleven posts from the first ten days of a page that then went from ~0 to
  7.5K followers on reels. It is a statement about our own posts.
- The audience is not the Instagram audience: Facebook followers are 92% men,
  49% in Côte d'Ivoire, 12% Guinea, 8% Mali; Instagram followers are 78% men,
  49% in France. Subject and audience fit is a live explanation (F5).
- **Confidence:** high on the gap, none on the mechanism.

### F5. The same video travelled very differently across networks

Views of the same short video, single-platform rows, with the multiple of that
network's own median for reels (raw counts are not comparable across networks:
each counts a "view" differently and each audience is a different size).

| Subject (video)         | TikTok       | YouTube            | Instagram          | Facebook          |
| ----------------------- | ------------ | ------------------ | ------------------ | ----------------- |
| Mandé "peuple" (16 Sep) | -            | 1,632 (3.1×)       | 3,640 (2.9×)       | **87,807** (124×) |
| Bouët-Willaumez         | 1,358 (4.5×) | 321 (0.6×)         | 5,375 (4.2×)       | **61,054** (86×)  |
| Keïta / Coulibaly       | 178 (0.6×)   | 1,406 (2.6×)       | **16,084** (12.6×) | 301 (0.4×)        |
| Swahili                 | 275 (0.9×)   | 248 (0.5×)         | **6,926** (5.4×)   | 200 / 411 (0.6×)  |
| Vodun                   | 101 (0.3×)   | 492 (0.9×)         | **4,665** (3.7×)   | 436 (0.6×)        |
| Mali (25 Sep)           | 328 (1.1×)   | 5 (standard video) | 74 (0.1×)          | **2,361** (3.3×)  |
| Krou                    | 1,309 (4.3×) | 169 (0.3×)         | 5,069 (4.0×)       | 2,747 (3.9×)      |

- No network leads consistently. Recounted from the file (single-platform
  video rows on TikTok, YouTube, Instagram and Facebook, grouped by
  `content_group_id`): 32 subjects have a video on two or more of them. For the
  23 that have both an Instagram and a Facebook reel (highest reel per
  network), 13 land on opposite sides of their own network's median (Keïta
  12.6× / 0.4×; Mali 0.1× / 3.3×), and the relative winner is Instagram 10
  times and Facebook 13 times. Version 1 said 30, 22, 12, 10 and 12; a
  difference of one or two is what a different grouping rule produces, and 124
  subject assignments are inferred from caption text, so quote these counts as
  approximate.
- The three Facebook outliers are all history/politics of Mali, Côte d'Ivoire
  or the Dioula word, matching that audience's countries. **Plausible, not
  tested:** subject × audience fit explains more than the format.
- **Instagram and Facebook rows are never added.** A Business Suite row for a
  cross-post is one combined row; the one case checked (1,810 views on the
  "Pourquoi ignorer nos noms" reel) equals Instagram's own count while the
  Facebook Reels tab showed 951. A combined row is neither the sum nor a split.
  That also means a Facebook-tab number and a combined row can describe the
  same cross-posted item; whether the Facebook-only rows include any
  cross-posted reel is not recorded (39 have no permalink to check).
- **Confidence:** high that results differ by network; low on why.

### F6. Length: no clean effect on reach; YouTube shows shorter retaining better

- TikTok video medians by length: ≤45 s 316 (n=10), 46–90 s 275 (n=11), >90 s
  306 (n=11). Flat.
- YouTube Shorts: ≤45 s 752 (n=8), 46–90 s 492 (n=11), >90 s 493 (n=11); average
  percentage viewed 70%, 63%, 51%. The shortest Shorts are also the oldest
  (5–9 Sep), so age contributes.
- Instagram peaks at 46–90 s (2,635, n=10) but this is the same cohort as the
  Keïta and vodun outliers.
- The long `frontières` video (2:13) lost most viewers at 0:02 on TikTok
  (34 views, one day old) while the same cut held 51% average viewing on
  YouTube. Opening, not length, is the suspect; one post.
- **Confidence:** moderate that there is no strong length penalty; low
  otherwise.

### F7. The pieces that spread most also drew the most disagreement

Comments read on the leaders (no handles kept):

- **Lingala photo carousel, TikTok (91 comments, 20 read):** dominated by
  pushback. Some read the hook as a claim that "the Belgians invented Lingala",
  though the slides argue otherwise; others offer counter-sources (boloki rather
  than bobangi, an early Italian phrase) and a Kingala/Bangala identity
  contribution; light appreciation and praise for the music. The account replied
  clarifying that it does not say a language was invented.
- **Dioula photo carousel, TikTok (23 comments):** disputes that "jula" meant
  merchant, competing origin claims (Wangara, Soninke, Hausa).
- **La carte cachée 05/06, Facebook reel, 78K views, 414 comments, 843 reactions**
  ([link](https://www.facebook.com/reel/1097621012922282)): mostly identity
  friction and mockery on the top threads (32, 20, 77 and 25 replies), one
  question worth answering (which country carries the Bété name?). The account
  pinned a reply thanking readers "including the most heated". 6 of 120
  top-level comments read.
- **Swahili reel, Instagram (20 comments):** dispute over "Arabic", with
  alternative etymologies offered.
- **Mandé reel, YouTube:** the one comment read accuses the video of lying and
  asserts that Mandé is a people and region.
- **Agni carousel, TikTok (8 comments):** the only leader with pride and
  requests (Adjoukrou content, parallel spellings).
- **Sample boundaries.** The threads were chosen because the posts led, and
  only a part of each was read (20 of 91 on the Lingala carousel; 6 of 120
  top-level comments on the Facebook reel; the 97 Mandé and 80 Bouët comments
  on Facebook unread). No thread of a low-reach post was read for comparison.
  The observations describe those readings, not the audience.
- **Implication (observed):** high distribution is not evidence of accuracy or
  approval. **Hypothesis:** a hook read as a claim travels farther and is
  misread more; this rests on top posts only (selection on the outcome) and
  needs the low-reach threads for contrast. Requests and corrections in these
  threads are leads for sourced follow-ups, never rulings, and none is
  selected here because it would draw more attention.
  **Confidence:** low to moderate (six publications read, partially).

### F8. What reading, comparing and revisiting versus listening implies

- **Observed:** no format shows a clearly larger saves-per-view. TikTok
  carousels 10.8 against videos 9.9 per 1,000 (posts with 100+ views); on
  Instagram carousels are lower (7.1, n=6, against 10.7) on too few posts to
  rank. Saves are not a carousel-only behaviour here: three Instagram reels
  were saved by 2–4% of their viewers (Bouët-Willaumez 4.2%, swahili 3.2%,
  Keïta 2.4%).
- **Hypothesis:** the TikTok carousels that broke out are comparisons, lists or
  reading tasks (two spellings of Agni, the word Dioula and its meanings, the
  four names of the Fulbe), while the strongest videos are narrated
  chronologies (Bouët-Willaumez, Krou, Keïta). This is confounded with subject,
  date and hook, and the file has no column coding the narrative structure of
  a piece, so the grouping is a reading, not a measurement.
- **Correction to version 1, which said no chronology exists as a carousel.**
  The Daloa carousel (TikTok 2,733 views, cross-post 525) is a dated
  chronology (1906, 1907, 1911, 1912) in the shortlist's own words, and the
  report also filed it as a "portrait". A chronology carousel therefore exists
  and is our fourth-largest TikTok result. Whether other carousels (Krio's
  "four waves", Bouët's 1842 to 1893 sequence if adapted) are chronologies is
  unknown until pieces are coded from their cards. The comparison that is
  actually missing is a same-day, same-network chronology in both formats.
- **Unknown:** whether a timeline reads better as slides or as a timed reel.

## 3. Answers to the nine questions

1. **Best carousels:** TikTok — Lingala 25,544, Dioula 11,716, Agni 3,834,
   Daloa 2,733, Fulbe 2,131. Instagram — Dioula 764, swahili 226 (with n=9 and
   a low reach). Facebook — none above 30 views (multi-photo). YouTube
   community image posts — 5–21 views. LinkedIn: no document carousel exists.
2. **Best videos:** Facebook Mandé 87,807, Dioula card reel 77,964,
   Bouët-Willaumez 61,054; Instagram Keïta 16,084, swahili 6,926, Bouët 5,375;
   YouTube Mandé 1,632, Ghana 1,518, Keïta 1,406; TikTok Bouët 1,358, Krou 1,309.
3. **Networks disagree:** F5 table.
4. **Subject, angle, format, opening, length, distribution:** subject × network
   is the strongest visible signal; format matters on Instagram (reels ahead),
   and not in the TikTok median; length shows no clean effect; opening is
   suggestive (F6); distribution conditions are **unknown**: no paid, boost,
   collaboration or promotion status was verified for any row. Business Suite
   shows a "Boost" button on any boostable post, so its presence says nothing
   about whether the 78K reel was boosted, and the absence of a boost label is
   not a finding of organic reach (the paid tab was never opened).
5. **Reading vs listening:** F8.
6. **Carousels worth a video:** [adaptation shortlist](adaptation-shortlist.md),
   candidates 1 (a video edition of the same angle), 2 and 3, after their
   source review.
7. **Videos worth a carousel:** candidates 4 and 5, after their source review.
8. **Both formats justified:** when the two jobs differ (a hook that spreads
   and a reference that can be checked and revisited), or when readers are
   disputing a claim and the sources should be inspectable. See the
   [decision matrix](decision-matrix.md). A published edition does not close a
   subject or an angle: adapting, deepening and republishing stay open, and
   nothing here requires a second format.
9. **Unanswered:** see section 5.

## 4. What is observed, hypothesised and unknown

"Observed" means the number follows from the file (see
[`verify-audit-figures.test.mjs`](verify-audit-figures.test.mjs)) for our own
posts in these 21 days. It is a description of a sample, never a rule.

| Status     | Statement                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Observed   | Distribution is extremely concentrated (F1). The same video landed very differently on different networks (F5). Instagram reels out-reached Instagram carousels (n=27 v 9; F2). TikTok medians overlap (F3). Lingala's largest carousel is a carousel; the same subject and format also drew 403 views. Facebook multi-photo posts drew 3 to 30 views (n=11, 11–14 Sep). |
| Hypothesis | Subject × audience explains more than format on Facebook. A hook read as a claim travels farther and is misread more (F7, top posts only). Comparison and list subjects suit carousels and chronologies suit video (F8; not coded, and Daloa is a chronology carousel).                                                                                                  |
| Unknown    | Any causal effect of format. Whether TikTok's recent carousel dip is age, subject mix or a real change. Whether a text-on-image reel behaves like a carousel or a video. Site traffic by format. Whether any row was boosted, promoted or collaborated on. How many of the 252 rows are distinct occurrences. Whether "no visible TikTok gap" hides a real effect.       |

## 5. Data quality and reconciliation

Full detail per row is in `publications.csv` (`dq_notes`,
`ledger_format_matches_live`). Headlines:

- **Ledger vs live, formats:** TikTok `7682860953662262550` is filed as a video
  in `langue/001-lingala.json` and is a **photo carousel** (403 views). It is
  one of two Lingala carousels on TikTok (the other, 25,544 views, is filed
  correctly). YouTube has 7 community image posts and 1 standard video ("Mali",
  3:07) where the ledger holds 2 carousels and none. LinkedIn has no document
  carousel: the ledger's 2 carousels correspond to image posts only, and every
  live LinkedIn post is on the company page. The two Instagram `/p/` URLs filed
  as videos are Reels (ledger right).
- **Live but not in the ledger:** on TikTok six posts (intro, the two pinned
  9-second videos, the 25 Sep frontières video and two carousels); on YouTube
  the frontières Short and the brand intro clip; on Facebook and Instagram most
  posts of 5–16 Sep; the six _La carte cachée_ reels (one verified as 05/06,
  the rest inferred from six captionless reels on 17 Sep); on X three threads
  of 16 Sep. **In the ledger but not live:** all six X entries.
- **Dates:** the ledger is off on at least four entries (the Lingala and Guinée
  TikTok carousels by one day, the introduction on LinkedIn by one day, and a
  YouTube Nigeria Short dated 9 Sep that Studio lists on 5 Sep).
- **Publication dates are not all exact.** YouTube community posts (R214–R220)
  give a relative age ("11 days ago"), so their dates are approximate, and
  LinkedIn's admin table may show a creation date. A 7-day window cannot be
  reconstructed for these rows even in principle.
- **Missing data, not zeros:** TikTok has no reach or follower split (hidden
  below 100 views); Meta cannot split cross-posted rows; carousel slide counts,
  LinkedIn watch time and X post analytics were not read; Facebook permalinks
  exist for 10 of 49 rows; hooks are truncated to 45 characters on Meta.
- **Paid, organic or unknown.** The `distribution` column reads "organic" on
  239 rows, but the file records no check of paid status behind any of them:
  117 say "no boost label seen; paid tab not opened" and 122 say a bare
  "organic" with no stated basis. Read every one as **unknown**. Traffic-source
  figures such as "97% For You" describe where views came from, not whether
  they were paid.
- **Subject grouping** for 124 rows is inferred from caption text rather than a
  ledger URL (column `group_method`); treat those groupings as a first pass.
  Five of the six captionless Facebook "Votre reel" rows are grouped by
  inference, which is why the 78K reel's subject rests on the one verified row.
- **Narrative structure is not coded.** `typologie` holds the subject class
  (word, people, country…), not whether a piece is a chronology, comparison or
  portrait; any statement about structure is a reading of titles.
- **Comments** were read for about ten publications, not the best/weakest
  three on every network. The Facebook Mandé (97 comments) and Bouët (80)
  threads are unread.
- **Everything is lifetime, at ages 1–21 days**; nothing here is an equal
  observation window.

## 6. Method notes

- A "view" is each platform's own (definitions in `views_definition`). The
  cross-format ratio `views_vs_platform_format_median` divides by the median of
  the same platform and format, never across platforms.
- `core_interactions_per_1000_views` = (likes + comments + shares) per 1,000
  views of the same platform's definition. Saves are reported separately
  because YouTube, Facebook reactions and LinkedIn do not expose them alike.
- Raw comment text and commenter names were kept out of this repository.

## 7. What version 2 changed

Version 2 (2026-09-29) re-derived every figure from `publications.csv` and did
not collect anything new. Each correction below is reproducible with
`node --test docs/audience/format-audit-2026-09-26/verify-audit-figures.test.mjs`
unless it concerns interpretation.

| Version 1 said                                                                  | Version 2 says                                                                                                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Instagram saves per 1,000 views "were not lower on carousels" (7.1 v 10.7)      | They were lower on all three cuts (7.1 v 10.7; 4.4 v 11.4; pooled 12.2 v 14.5), on six to nine posts. Supportable: no evidence carousels were saved more.          |
| No chronology was ever published as a carousel                                  | The Daloa carousel is a dated chronology (shortlist item 3) and was also called a portrait. The missing test is a same-day, same-network pair.                     |
| TikTok has "no format effect" in the middle                                     | The medians overlap. That is an absence of visible difference on 33 v 32 posts, not evidence of no effect.                                                         |
| Boost button on the 78K reel "suggests it was not boosted"; no boost label seen | Paid status is unknown for every row. A button is not evidence; a missing label is not a finding.                                                                  |
| 252 "publications"                                                              | 252 inventory rows: 184 with a permalink, 68 without, 32 combined Meta rows, two candidate double counts. Occurrence count unknown.                                |
| "Thirty subjects", 22 pairs, 12 opposite, winners 10 and 12                     | 32, 23, 13, 10 and 13 under a stated rule; quote as approximate.                                                                                                   |
| Earlier TikTok carousel cohorts at "401–403"                                    | 403 holds for 7–12 Sep only; 16–17 Sep is 177. The recent posts are also younger.                                                                                  |
| Saves and shares per 1,000 on TikTok (10.8 v 9.9; 2.8 v 3.6)                    | Reproduces only on posts with 100+ views (30 and 25). Over all posts: 11.0 v 9.0 and 2.8 v 3.0.                                                                    |
| Three videos beat their carousels "by 3–5×" on 21 Sep                           | 2.9–4.7×; five same-day pairs exist and none was order-balanced.                                                                                                   |
| High distribution "is often the sign of a hook read as a claim"                 | A hypothesis from selected top posts with partial comment reads; the low-reach threads were not read.                                                              |
| (not stated)                                                                    | Lingala's two TikTok carousels: 403 and 25,544 views, same subject and format, different hooks. Subject and format do not explain the largest result on their own. |

The decision matrix, the shortlist and the comparison plan were revised in the
same change; each opens with its own list of corrections. Nothing in this
audit is a rule, and none of it restates a review policy: which checks a piece
needs depends on the claims and media it actually contains, under the policy
the production chain publishes.
