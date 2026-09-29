/**
 * The audit's dataset is the live evidence the reconciliation reads. It is a
 * CSV with quoted commas, quoted quotes and a combined Meta platform label, so
 * the reader is held to those shapes on a synthetic file.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { liveRowsFromCsv } from "./audit-rows.mjs";

const HEADER =
  "row_id,platform,url,published_date,content_group_id,group_method,actual_format,hook_or_caption_start";

// @req REQ-187
test("quoted commas, quotes and line breaks stay inside their cell", () => {
  const csv = `${HEADER}\nR1,tiktok,https://www.tiktok.com/@c/video/1,2026-09-05,g,ledger-url,short_video,"Le ""lingala"", pas vraiment\nsuite"\nR2,tiktok,,2026-09-06,h,text-rule,carousel,x\n`;
  const rows = liveRowsFromCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].rowId, "R1");
  assert.equal(rows[0].group, "g");
  assert.equal(rows[1].rowId, "R2");
});

// @req REQ-187
test("a combined Instagram and Facebook row is one Instagram-side row marked combined", () => {
  const csv = `${HEADER}\nR2,instagram+facebook(combined),https://www.instagram.com/p/AB/,2026-09-11,g,text-rule,carousel,x\n`;
  const [row] = liveRowsFromCsv(csv);
  assert.equal(row.network, "instagram");
  assert.equal(row.scope, "meta-combined");
});

// @req REQ-187
test("an empty url is null, never an empty string that could match another", () => {
  const csv = `${HEADER}\nR3,facebook,,2026-09-12,g,text-rule,short_video,x\n`;
  assert.equal(liveRowsFromCsv(csv)[0].url, null);
});

// @req REQ-187
test("the audit's format vocabulary maps onto the registry's, and unclear stays unknown", () => {
  const formats = [
    "short_video",
    "carousel",
    "photo_carousel",
    "image_post(single/multi unverified)",
    "single_photo",
  ];
  const csv = `${HEADER}\n${formats
    .map((format, i) => `R${i},tiktok,,2026-09-12,g,ledger-url,"${format}",x`)
    .join("\n")}\n`;
  assert.deepEqual(
    liveRowsFromCsv(csv).map((row) => row.format),
    ["video", "carrousel", "carrousel", null, null]
  );
});
