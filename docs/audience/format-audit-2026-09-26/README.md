# Carousel or reel? What our first three weeks of publications show

Format audit of every EthniAfrica publication on Instagram, Facebook, TikTok,
YouTube, LinkedIn and X. Collected on **2026-09-26**, read-only.

| Deliverable                                | File                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| A. Executive report                        | this file                                            |
| B. Publication-level dataset (252 rows)    | [`publications.csv`](publications.csv)               |
| C. Carousel-versus-reel decision matrix    | [`decision-matrix.md`](decision-matrix.md)           |
| D. Adaptation shortlist (7 items)          | [`adaptation-shortlist.md`](adaptation-shortlist.md) |
| E. Validation plan (4 matched experiments) | [`validation-plan.md`](validation-plan.md)           |

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
  from Facebook (see F5). Saves per 1,000 views were not lower on carousels
  (7.1, n=6, against 10.7 for reels): the reference use is small in volume but
  not absent per viewer.
- **Confidence:** moderate-high that reels out-reach carousels _on our
  Instagram account today_; low on why.

### F3. TikTok: no format effect in the middle, but the extreme tail is carousels

- Median views: carousels **354 (n=33)** against videos **302 (n=32)**;
  interquartile ranges 133–718 and 101–412. No meaningful difference.
- All five posts above 2,000 views are photo carousels: Lingala 25,544
  ([link](https://www.tiktok.com/@ethniafrica/photo/7685962182923767062)),
  Dioula 11,716
  ([link](https://www.tiktok.com/@ethniafrica/photo/7684693876015418627)),
  Agni 3,834, Daloa 2,733, Fulbe 2,131. The best video has 1,358
  ([Bouët-Willaumez](https://www.tiktok.com/@ethniafrica/video/7685531757302549782)).
- Same-week matched pairs on TikTok point both ways: on 21 Sep three videos beat
  their carousels by 3–5× (ethnie 286 v 61, Ghana 318 v 111, swahili 275 v 86);
  Fulbe's carousel beat its video 4.6× (2,131 v 465); Keïta/Coulibaly and
  Bantou were ties; on 25 Sep the two frontières carousels (273, 389) beat the
  2:13 video (34, retention stopped at 0:02) by 8–11×. Pairs where the video is
  the 5 Sep first-day post (24 views on a brand-new account) were dropped.
- Per 1,000 views the medians of saves (10.8 v 9.9) and shares (2.8 v 3.6) are
  similar. Followers gained, posts with 100+ views: carousels 353 on 55.8K
  views (30 posts); videos 95 on 10.3K (25 posts). Per 1,000 views the median is
  5.2 for carousels and 8.8 for videos.
- Recent carousels (21–25 Sep, n=6) have a median of 98 views against 401–403
  for earlier cohorts: either age, or a real fall since the Sep 11–17 batches.
  Not separable yet.
- **Confidence:** high that there is no visible median gap; low on the tail
  (two posts carry it, both drew disputes, see F7).

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

- No network leads consistently. Thirty subjects have a video on two or more
  networks. For the 22 that have both an Instagram and a Facebook reel, 12 land
  on opposite sides of their own network's median (Keïta 12.6× / 0.4×;
  Mali 0.1× / 3.3×), and the relative winner is Instagram 10 times and
  Facebook 12 times.
- The three Facebook outliers are all history/politics of Mali, Côte d'Ivoire
  or the Dioula word, matching that audience's countries. **Plausible, not
  tested:** subject × audience fit explains more than the format.
- **Instagram and Facebook rows are never added.** A Business Suite row for a
  cross-post is one combined row; the one case checked (1,810 views on the
  "Pourquoi ignorer nos noms" reel) equals Instagram's own count while the
  Facebook Reels tab showed 951. A combined row is neither the sum nor a split.
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
- **Implication:** high distribution is not evidence of accuracy or approval;
  it is often the sign of a hook read as a claim. Requests and corrections in
  these threads are leads for sourced follow-ups, never rulings.
  **Confidence:** moderate (six publications read, two networks per post).

### F8. What reading, comparing and revisiting versus listening implies

- **Established:** carousels do not show a larger saves-per-view than reels
  (TikTok 10.8 vs 9.9 per 1,000; Instagram 7.1, n=6, vs 10.7). Saves are not a
  carousel-only behaviour here: three Instagram reels were saved by 2–4% of
  their viewers (Bouët-Willaumez 4.2%, swahili 3.2%, Keïta 2.4%).
- **Plausible:** the TikTok carousels that broke out are comparisons, lists or
  reading tasks (two spellings of Agni, the word Dioula and its meanings, the
  four names of the Fulbe, a portrait of Daloa), while the strongest videos are
  narrated chronologies (Bouët-Willaumez, Krou, Keïta). Untested: this is
  confounded with subject, and no chronology was published as a carousel or
  comparison as a video.
- **Untested:** whether a timeline reads better as slides or as a timed reel.

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
   suggestive (F6); distribution conditions are only partly known (no boost
   label seen in Business Suite; the paid tab was not opened; the 78K reel's
   page shows a "Boost" button, which suggests it was not boosted).
5. **Reading vs listening:** F8.
6. **Carousels worth a video:** [adaptation shortlist](adaptation-shortlist.md),
   items 1 (as a republished video), 2 and 3.
7. **Videos worth a carousel:** items 4 and 5.
8. **Both formats justified:** when the two jobs differ (a hook that spreads
   and a reference that can be checked and revisited), or when readers are
   disputing a claim and the sources should be inspectable. See the
   [decision matrix](decision-matrix.md). Not justified merely because a
   subject worked.
9. **Unanswered:** see section 5.

## 4. What is established, plausible and untested

| Status      | Statement                                                                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Established | Distribution is extremely concentrated (F1). Networks disagree on the same content (F5). IG reels out-reach IG carousels in our sample (F2). TikTok medians show no format gap (F3). Lingala's carousel is a carousel and is our largest single result. |
| Plausible   | Subject × audience explains more than format on Facebook. Hooks read as claims travel farther and are misread more (F7). Comparison/list subjects suit carousels; chronologies suit video (F8).                                                         |
| Untested    | Any causal effect of format. Whether TikTok's recent carousel dip is age or a real change. Whether a text-on-image reel behaves like a carousel or a video. Site traffic by format.                                                                     |

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
- **Missing data, not zeros:** TikTok has no reach or follower split (hidden
  below 100 views); Meta cannot split cross-posted rows; carousel slide counts,
  LinkedIn watch time and X post analytics were not read; Facebook permalinks
  exist for 10 of 49 rows; hooks are truncated to 45 characters on Meta.
- **Subject grouping** for 124 rows is inferred from caption text rather than a
  ledger URL (column `group_method`); treat those groupings as a first pass.
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
