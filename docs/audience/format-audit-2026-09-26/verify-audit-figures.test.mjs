// Reproduces the audit's headline figures from publications.csv.
// Run: node --test docs/audience/format-audit-2026-09-26/
//
// Scope is deliberate: row identity and the arithmetic the report leans on.
// It does not judge interpretations, and a passing run does not make a claim
// true — it shows the number follows from the file, under the subset stated in
// each test name.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const csvPath = fileURLToPath(new URL("./publications.csv", import.meta.url));

// The file has quoted commas and doubled quotes but no embedded newlines.
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (line === "") continue;
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") {
        cells.push(cell);
        cell = "";
      } else cell += ch;
    }
    cells.push(cell);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ""]))
  );
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));

// A blank cell is missing data, never zero.
const num = (cell) => (cell === "" || cell == null ? null : Number(cell));
const withValue = (values) => values.filter((v) => v !== null);
const median = (values) => {
  const v = withValue(values).sort((a, b) => a - b);
  const mid = v.length / 2;
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[mid - 1] + v[mid]) / 2;
};
const sum = (values) => withValue(values).reduce((a, b) => a + b, 0);
const quantile = (values, p) => {
  const v = withValue(values).sort((a, b) => a - b);
  const k = (v.length - 1) * p;
  const lo = Math.floor(k);
  const hi = Math.min(lo + 1, v.length - 1);
  return v[lo] + (v[hi] - v[lo]) * (k - lo);
};
const pick = (where) =>
  rows.filter((r) => Object.entries(where).every(([k, v]) => r[k] === v));
const views = (rs) => rs.map((r) => num(r.views));
const perThousand = (rs, column) =>
  rs
    .filter((r) => num(r[column]) !== null && num(r.views))
    .map((r) => (num(r[column]) / num(r.views)) * 1000);
const atLeast100 = (rs) => rs.filter((r) => (num(r.views) ?? 0) >= 100);
const round = (x, digits = 1) => Number(x.toFixed(digits));

test("inventory: 252 rows, unique ids, no URL listed twice", () => {
  assert.equal(rows.length, 252);
  assert.equal(new Set(rows.map((r) => r.row_id)).size, 252);
  assert.equal(
    new Set(rows.map((r) => `${r.platform}/${r.publication_id}`)).size,
    252
  );
  const urls = rows.map((r) => r.url).filter(Boolean);
  assert.equal(urls.length, new Set(urls).size);
});

test("inventory: only 184 rows carry a permalink, so 68 rows cannot be shown distinct by URL", () => {
  assert.equal(rows.filter((r) => r.url).length, 184);
  const withoutUrl = rows.filter((r) => !r.url);
  assert.equal(withoutUrl.length, 68);
  assert.deepEqual(
    Object.fromEntries(
      ["facebook", "linkedin", "youtube"].map((p) => [
        p,
        withoutUrl.filter((r) => r.platform === p).length,
      ])
    ),
    { facebook: 39, linkedin: 22, youtube: 7 }
  );
});

test("inventory: row counts per platform and format as the report states", () => {
  const count = (where) => pick(where).length;
  assert.equal(count({ platform: "instagram" }), 36);
  assert.equal(count({ platform: "instagram", format_detail: "reel" }), 27);
  assert.equal(count({ platform: "instagram", format_detail: "carousel" }), 9);
  assert.equal(count({ platform: "facebook" }), 49);
  assert.equal(count({ platform: "instagram+facebook(combined)" }), 32);
  assert.equal(count({ platform: "tiktok" }), 65);
  assert.equal(count({ platform: "youtube" }), 38);
  assert.equal(count({ platform: "linkedin" }), 22);
  assert.equal(count({ platform: "x" }), 10);
  assert.equal(new Set(rows.map((r) => r.content_group_id)).size, 55);
});

test("combined Meta rows are flagged and never a single-platform measurement", () => {
  const combined = rows.filter((r) => r.platform.includes("+"));
  assert.equal(combined.length, 32);
  assert.ok(combined.every((r) => r.metrics_scope === "combined_IG+FB"));
  assert.ok(
    rows
      .filter((r) => !r.platform.includes("+"))
      .every((r) => r.metrics_scope === "single_platform")
  );
});

test("every metric is a lifetime total, so no equal 7-day or 28-day window exists", () => {
  assert.ok(
    rows.every((r) => r.observation_window.startsWith("lifetime")),
    "an observation window other than lifetime would change every comparison"
  );
  const ages = rows.map((r) => Number(r.age_days_at_collection));
  assert.equal(Math.min(...ages), 1);
  assert.equal(Math.max(...ages), 21);
});

test("missing is not zero: blank cells outnumber zeros where the network hides a field", () => {
  const blank = (column) => rows.filter((r) => r[column] === "").length;
  assert.equal(blank("views"), 10); // LinkedIn image posts
  assert.equal(blank("reach"), 135);
  assert.equal(blank("saves"), 70);
  assert.equal(blank("followers_gained"), 40);
  assert.equal(blank("slide_count"), 245);
});

test("F1 Facebook reels: top three hold 88% of views; the rest have median 617", () => {
  const reels = pick({ platform: "facebook", format_detail: "reel" });
  assert.equal(reels.length, 35);
  const ranked = views(reels).sort((a, b) => b - a);
  assert.equal(sum(ranked.slice(0, 3)), 226825);
  assert.equal(sum(ranked), 257386);
  assert.equal(round((sum(ranked.slice(0, 3)) / sum(ranked)) * 100), 88.1);
  assert.equal(median(ranked), 709);
  assert.equal(median(ranked.slice(3)), 617);
  const top3 = reels
    .sort((a, b) => num(b.views) - num(a.views))
    .slice(0, 3)
    .map((r) => r.row_id);
  assert.deepEqual(top3, ["R051", "R034", "R055"]);
});

test("F1 TikTok: the Lingala carousel is 38% of all post views, whole-account median is 325", () => {
  const all = pick({ platform: "tiktok" });
  assert.equal(sum(views(all)), 66529);
  assert.equal(round((25544 / 66529) * 100), 38.4);
  assert.equal(median(views(all)), 325);
});

test("F1 YouTube Shorts: flattest distribution, top item 8% of views, median 532", () => {
  const shorts = pick({ platform: "youtube", format_detail: "Short" });
  assert.equal(shorts.length, 30);
  assert.equal(
    round((Math.max(...views(shorts)) / sum(views(shorts))) * 100),
    8.2
  );
  assert.equal(Math.round(median(views(shorts))), 532);
});

test("F2 Instagram: reels median 1,274 (n=27) against carousels 141 (n=9); 5-12 Sep cohort 2,043 (n=10) against 141 (n=8)", () => {
  const reels = pick({ platform: "instagram", format_detail: "reel" });
  const carousels = pick({ platform: "instagram", format_detail: "carousel" });
  assert.equal(median(views(reels)), 1274);
  assert.equal(median(views(carousels)), 141);
  const cohort = (rs) =>
    rs.filter(
      (r) =>
        r.published_date >= "2026-09-05" && r.published_date <= "2026-09-12"
    );
  assert.equal(cohort(reels).length, 10);
  assert.equal(median(views(cohort(reels))), 2043);
  assert.equal(cohort(carousels).length, 8);
});

test("F2 Instagram followers gained, posts with 100+ views: 1,451 over 26 reels, 1 over 6 carousels", () => {
  const followers = (format) => {
    const rs = atLeast100(
      pick({ platform: "instagram", format_detail: format })
    );
    return [rs.length, sum(rs.map((r) => num(r.followers_gained)))];
  };
  assert.deepEqual(followers("reel"), [26, 1451]);
  assert.deepEqual(followers("carousel"), [6, 1]);
});

test("F2 Instagram saves per 1,000 views: carousels are LOWER than reels on every cut, on tiny n", () => {
  const cut = (format, subset) =>
    median(
      perThousand(
        subset(pick({ platform: "instagram", format_detail: format })),
        "saves"
      )
    );
  // The report said carousels were "not lower". Its own figures, 7.1 (n=6)
  // against 10.7, point the other way, and so do the two other cuts below.
  assert.equal(round(cut("carousel", atLeast100)), 7.1);
  assert.equal(round(cut("reel", atLeast100)), 10.7);
  assert.ok(cut("carousel", atLeast100) < cut("reel", atLeast100));
  assert.equal(round(cut("carousel", (rs) => rs)), 4.4);
  assert.equal(round(cut("reel", (rs) => rs)), 11.4);
  const nCarousel = atLeast100(
    pick({ platform: "instagram", format_detail: "carousel" })
  ).length;
  assert.equal(nCarousel, 6, "six posts cannot support a ranking either way");
});

test("F2 the swahili pair is the only same-day Instagram pair of different formats (226 v 6,926, 31x)", () => {
  const key = (r) => `${r.content_group_id}|${r.published_date}`;
  const byKey = new Map();
  for (const r of pick({ platform: "instagram" })) {
    byKey.set(key(r), [...(byKey.get(key(r)) ?? []), r]);
  }
  const pairs = [...byKey.values()].filter(
    (g) => new Set(g.map((r) => r.format_detail)).size > 1
  );
  assert.equal(pairs.length, 1);
  const [carousel, reel] = pairs[0].sort((a) =>
    a.format_detail === "carousel" ? -1 : 1
  );
  assert.deepEqual([num(carousel.views), num(reel.views)], [226, 6926]);
  assert.equal(round(6926 / 226, 0), 31);
});

test("F3 TikTok: medians 354 (n=33) against 302.5 (n=32); quartiles by linear interpolation", () => {
  const carousels = views(
    pick({ platform: "tiktok", format_detail: "photo_carousel" })
  );
  const videos = views(pick({ platform: "tiktok", format_detail: "video" }));
  assert.equal(median(carousels), 354);
  assert.equal(median(videos), 302.5);
  assert.deepEqual(
    [
      Math.round(quantile(carousels, 0.25)),
      Math.round(quantile(carousels, 0.75)),
    ],
    [133, 718]
  );
  assert.deepEqual(
    [Math.round(quantile(videos, 0.25)), Math.round(quantile(videos, 0.75))],
    [101, 414]
  );
});

test("F3 TikTok: the five posts above 2,000 views are photo carousels; best video 1,358", () => {
  const ranked = pick({ platform: "tiktok" }).sort(
    (a, b) => num(b.views) - num(a.views)
  );
  assert.deepEqual(
    ranked.slice(0, 5).map((r) => r.format_detail),
    Array(5).fill("photo_carousel")
  );
  assert.ok(ranked.slice(0, 5).every((r) => num(r.views) > 2000));
  assert.equal(
    Math.max(...views(pick({ platform: "tiktok", format_detail: "video" }))),
    1358
  );
});

test("F3 TikTok saves and shares per 1,000 views reproduce only on posts with 100+ views", () => {
  const cut = (format, column) =>
    round(
      median(
        perThousand(
          atLeast100(pick({ platform: "tiktok", format_detail: format })),
          column
        )
      )
    );
  assert.deepEqual(
    [cut("photo_carousel", "saves"), cut("video", "saves")],
    [10.8, 9.9]
  );
  assert.deepEqual(
    [cut("photo_carousel", "shares"), cut("video", "shares")],
    [2.8, 3.6]
  );
});

test("F3 TikTok followers gained, posts with 100+ views: 353 on 55.8K views (30) against 95 on 10.3K (25)", () => {
  const total = (format) => {
    const rs = atLeast100(pick({ platform: "tiktok", format_detail: format }));
    return [
      rs.length,
      sum(rs.map((r) => num(r.followers_gained))),
      Math.round(sum(views(rs)) / 100) / 10,
    ];
  };
  assert.deepEqual(total("photo_carousel"), [30, 353, 55.8]);
  assert.deepEqual(total("video"), [25, 95, 10.3]);
});

test("F3 recent TikTok carousels (21-25 Sep, n=6) have median 98.5; the report's 'earlier cohorts at 401-403' is one cut only", () => {
  const carousels = pick({
    platform: "tiktok",
    format_detail: "photo_carousel",
  });
  const between = (from, to) =>
    carousels.filter((r) => r.published_date >= from && r.published_date <= to);
  assert.equal(between("2026-09-21", "2026-09-25").length, 6);
  assert.equal(median(views(between("2026-09-21", "2026-09-25"))), 98.5);
  // 403 holds for 7-12 Sep. Every other cut lands elsewhere (177 for 16-17 Sep),
  // and the recent posts are also 1-5 days old against 9-19: age is not removed.
  assert.equal(median(views(between("2026-09-07", "2026-09-12"))), 403);
  assert.equal(median(views(between("2026-09-16", "2026-09-17"))), 177);
});

test("F4 Facebook: reels median 709 (n=35) against multi-photo 11 (n=11), published 11-14 Sep, 3-30 views", () => {
  const photos = pick({ platform: "facebook", actual_format: "carousel" });
  assert.equal(photos.length, 11);
  assert.equal(median(views(photos)), 11);
  assert.deepEqual(
    [Math.min(...views(photos)), Math.max(...views(photos))],
    [3, 30]
  );
  assert.ok(
    photos.every(
      (r) =>
        r.published_date >= "2026-09-11" && r.published_date <= "2026-09-14"
    )
  );
});

test("F6 length buckets: TikTok 316/275/306, YouTube Shorts 752/492/493, Instagram reels peak at 2,635 for 46-90 s", () => {
  const bucket = (seconds) =>
    seconds <= 45 ? "<=45" : seconds <= 90 ? "46-90" : ">90";
  const byLength = (where) => {
    const groups = {};
    for (const r of pick(where).filter((x) => x.duration_s !== "")) {
      (groups[bucket(Number(r.duration_s))] ??= []).push(num(r.views));
    }
    return Object.fromEntries(
      Object.entries(groups).map(([k, v]) => [
        k,
        [Math.round(median(v)), v.length],
      ])
    );
  };
  assert.deepEqual(byLength({ platform: "tiktok", format_detail: "video" }), {
    "<=45": [316, 10],
    "46-90": [275, 11],
    ">90": [306, 11],
  });
  assert.deepEqual(byLength({ platform: "youtube", format_detail: "Short" }), {
    "<=45": [752, 8],
    "46-90": [492, 11],
    ">90": [493, 11],
  });
  assert.equal(
    byLength({ platform: "instagram", format_detail: "reel" })["46-90"][0],
    2635
  );
});

test("format mix by subject: 20 of 55 groups have a carousel and no video, so a carousel is not only ever a companion", () => {
  const formats = new Map();
  for (const r of rows) {
    const set = formats.get(r.content_group_id) ?? new Set();
    set.add(r.actual_format);
    formats.set(r.content_group_id, set);
  }
  const has = (set, f) => set.has(f);
  const groups = [...formats.values()];
  assert.equal(groups.length, 55);
  assert.equal(
    groups.filter((s) => has(s, "carousel") && !has(s, "short_video")).length,
    20
  );
  assert.equal(
    groups.filter((s) => has(s, "carousel") && has(s, "short_video")).length,
    14
  );
  assert.equal(
    groups.filter((s) => has(s, "short_video") && !has(s, "carousel")).length,
    21
  );
});

test("Lingala: one subject, one format, two TikTok carousels 63x apart, so subject alone does not explain reach", () => {
  const lingala = pick({
    platform: "tiktok",
    content_group_id: "lingala-invente-par-les-belges",
    format_detail: "photo_carousel",
  });
  assert.deepEqual(
    views(lingala).sort((a, b) => a - b),
    [403, 25544]
  );
  assert.equal(round(25544 / 403, 0), 63);
  assert.notEqual(
    lingala[0].hook_or_caption_start,
    lingala[1].hook_or_caption_start,
    "the two carousels carry different hooks"
  );
});

test("same-day TikTok pairs of different formats: five subjects, direction differs by subject", () => {
  const key = (r) => `${r.content_group_id}|${r.published_date}`;
  const byKey = new Map();
  for (const r of pick({ platform: "tiktok" })) {
    byKey.set(key(r), [...(byKey.get(key(r)) ?? []), r]);
  }
  const pairs = [...byKey.values()].filter(
    (g) => new Set(g.map((r) => r.format_detail)).size > 1
  );
  assert.deepEqual(pairs.map((g) => g[0].content_group_id).sort(), [
    "bantou-mot-de-linguiste-allemand",
    "ethnie-d-ou-vient-le-mot",
    "frontieres-appartenance",
    "ghana-qui-a-choisi-le-nom",
    "swahili-le-nom-de-la-cote",
  ]);
});

test("possible double count: two combined IG+FB rows share subject, date and caption start with a Facebook-only row", () => {
  const facebook = pick({ platform: "facebook" });
  const overlaps = rows
    .filter((r) => r.platform.includes("+"))
    .filter((c) =>
      facebook.some(
        (f) =>
          f.published_date === c.published_date &&
          f.hook_or_caption_start.slice(0, 25) ===
            c.hook_or_caption_start.slice(0, 25)
      )
    )
    .map((c) => c.row_id);
  // Different declared formats (carousel/photo against reel), so they may be
  // distinct objects. 39 Facebook rows have no permalink, so it cannot be
  // settled from the file: the candidates are listed for a live check.
  assert.deepEqual(overlaps, ["R016", "R104"]);
});
