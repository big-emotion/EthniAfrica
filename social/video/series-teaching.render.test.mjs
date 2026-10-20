// @req REQ-186
// Teaching cards in motion and the parchment card (Cartes 1.12.0, handoff
// « Renderer integration of 1.12.0 », checks 1 to 7) drawn in the pinned
// Chromium, on the demonstration of fixtures/series-teaching.mjs: the idents'
// ground and its motion, Parchemin inks without outline, the week table's
// places and lit rows, the formula's moves, the drawings, the underlines, the
// subtitles on parchment, and every text in its band.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkSeriesLayout, loadSeriesVideo } from "./series.mjs";
import { renderSeriesFrames } from "./series-render.mjs";
import { teachingCardsDemo } from "./fixtures/series-teaching.mjs";

const root = mkdtempSync(join(tmpdir(), "series-teaching-render-"));
// @req REQ-186
test.after(() => rmSync(root, { recursive: true, force: true }));
const seq = loadSeriesVideo(teachingCardsDemo(join(root, "demo")), {
  dir: join(root, "demo"),
});
const at = (id) => seq.cards.findIndex((c) => c.id === id);
const WEEK = at("serie-nom-famille-02");
const FORMULA = at("serie-nom-famille-03");
const LAW = at("serie-nom-famille-06");
const late = (i) => seq.cardStarts[i + 1] - 12;
const boy = seq.cards[FORMULA].formulaPlan.lines[1];
const lawPlan = seq.cards[LAW].teachingPlan;

const FRAMES = {
  opener: 30,
  intoWeek: seq.cardStarts[WEEK] - 4,
  cascade: seq.cards[WEEK].teachingPlan.week.entry + 4,
  week: late(WEEK),
  intoFormula: seq.cardStarts[FORMULA] - 4,
  joined: boy.frames[2] + 14,
  joining: boy.frames[2] + 7,
  fallen: boy.frames[3] + 15,
  formula: late(FORMULA),
  pair: late(at("serie-nom-famille-04")),
  kwa: late(at("serie-nom-famille-05")),
  underlining: lawPlan.quote.marks[0] + 6,
  law: late(LAW),
};
let drawn;
// @req REQ-186
test.before(async () => {
  const out = await renderSeriesFrames(seq, Object.values(FRAMES), {
    diagnose: true,
  });
  drawn = Object.fromEntries(Object.keys(FRAMES).map((k, i) => [k, out[i]]));
});
const INK = "rgb(42, 30, 21)";
const near = (a, b, tolerance = 0.5) => Math.abs(a - b) <= tolerance;
const numbers = (t) => t.match(/-?[\d.]+(e-?\d+)?/g).map(Number);
const pa = (name, card) =>
  drawn[name].parchment.find((p) => p.id === seq.cards[card].id);

// Check 7: everything accepted holds, and every text keeps its band.
// @req REQ-186
test("1.12.0: every text of the parchment cards stays in its band, and only parchment paints a ground", () => {
  for (const [name, f] of Object.entries(drawn)) {
    assert.deepEqual(checkSeriesLayout(f.boxes, { demo: true }), [], name);
    assert.deepEqual(f.backgrounds, [], name);
  }
});

// Check 1.
// @req REQ-186
test("1.12.0: the grain and the glow are drawn at the offsets of the frame model", () => {
  for (const name of ["week", "intoFormula", "formula", "law"]) {
    for (const report of drawn[name].parchment) {
      const layer = drawn[name].state.layers.find(
        (l) => seq.cards[l.card].id === report.id
      );
      const [gx, gy] = numbers(report.ground.grain);
      assert.deepEqual([gx, gy], layer.ground.grain, name);
      const [lx, ly] = numbers(report.ground.glow);
      assert.ok(
        near(lx, layer.ground.glow[0], 1e-3) &&
          near(ly, layer.ground.glow[1], 1e-3),
        name
      );
    }
  }
});

// @req REQ-186
test("1.12.0: no text of a parchment card carries an outline or a second contour", () => {
  for (const name of ["week", "formula", "pair", "kwa", "law"])
    for (const report of drawn[name].parchment) {
      assert.ok(report.texts.length > 5, name);
      for (const t of report.texts) {
        assert.equal(t.stroke, "0px", `${name}: ${t.text}`);
        assert.equal(t.filter, "none", `${name}: ${t.text}`);
      }
    }
});

// @req REQ-186
test("1.12.0: the band and the signature keep their 1.4.0 places, in Parchemin ink on parchment, cross-fading in the change", () => {
  const ink = (name) =>
    Object.fromEntries(drawn[name].inkings.map((i) => [i.id, i]));
  const on = ink("week");
  assert.equal(on["band-pa"].opacity, 1);
  assert.equal(on["vf-band"].opacity, 0);
  assert.equal(on["signature-pa"].opacity, 1);
  assert.equal(on.signature.opacity, 0);
  assert.equal(on["band-pa"].color, INK);
  assert.equal(on["band-pa"].stroke, "0px");
  assert.equal(on["signature-pa"].filter, "none");
  for (const id of ["band-pa", "signature-pa"])
    assert.ok(
      near(on[id].x, 60) &&
        near(
          on[id].y,
          on[id.replace("-pa", "") === "band" ? "vf-band" : "signature"].y
        ),
      id
    );
  assert.ok(near(on["band-pa"].y, 250, 1));
  assert.ok(near(on["signature-pa"].y, 1836, 1));
  const mid = ink("intoWeek");
  assert.ok(mid["band-pa"].opacity > 0 && mid["band-pa"].opacity < 1);
  assert.ok(near(mid["band-pa"].opacity + mid["vf-band"].opacity, 1, 1e-6));
  const photo = ink("opener");
  assert.equal(photo["vf-band"].opacity, 1);
  assert.equal(photo["band-pa"].opacity, 0);
});

// @req REQ-186
test("1.12.0: between two parchment cards one ground is drawn, the outgoing card's, on its unbroken clock", () => {
  const reports = drawn.intoFormula.parchment;
  assert.equal(reports.length, 2);
  const shown = reports.filter((r) => r.picture > 0);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, seq.cards[WEEK].id);
  assert.deepEqual(reports[0].ground, reports[1].ground);
});

// Check 2.
// @req REQ-186
test("1.12.0: the week table reads girl | day | boy, its rows between y 590 and 1262 under a one-line title", () => {
  const report = pa("week", WEEK);
  assert.equal(report.rows.length, 7);
  for (const row of report.rows) {
    assert.ok(row.y >= 590 - 0.5 && row.y + row.h <= 1262 + 0.5, `${row.y}`);
    const [girl, day, boy] = row.cells;
    assert.ok(near(girl.x + girl.w, 400, 4), `girl ends at ${girl.x + girl.w}`);
    assert.ok(near(boy.x, 680, 4), `boy starts at ${boy.x}`);
    assert.ok(
      near(day.x + day.w / 2, 540, 1),
      `day centred at ${day.x + day.w / 2}`
    );
  }
  assert.ok(report.head.h <= 46 + 90 + 1, `head ${report.head.h}`);
});

// @req REQ-186
test("1.12.0: two rows lit at most, the others at 40 %; the cascade drawn rising", () => {
  const report = pa("week", WEEK);
  const lit = report.rows.filter((r) => r.band > 0.99);
  assert.equal(lit.length, 2);
  for (const r of report.rows)
    assert.ok(near(r.opacity, r.band > 0.99 ? 1 : 0.4, 0.01), `${r.opacity}`);
  const cascade = pa("cascade", WEEK).rows;
  assert.ok(cascade[0].opacity > 0 && cascade[0].opacity < 1);
  assert.ok(cascade[0].y > 590, `${cascade[0].y}`);
  assert.equal(cascade[6].opacity, 0);
});

// Check 3.
// @req REQ-186
test("1.12.0: joined pieces touch and stay centred; a fallen part ends 104 px lower at 55 % and 30 %; nothing leaves x 60 to 1020", () => {
  const piece = (name, key) =>
    pa(name, FORMULA).pieces[1].find((p) => p.key === key);
  const k = piece("joined", "K|Kwa");
  const y = piece("joined", "y|ya");
  assert.ok(near(k.x + k.w, y.x), `gap ${y.x - (k.x + k.w)}`);
  assert.ok(
    near((k.x + y.x + y.w) / 2, 540),
    `centre ${(k.x + y.x + y.w) / 2}`
  );
  assert.equal(piece("joined", "op0"), undefined);
  const plus = piece("joining", "op0");
  assert.ok(plus === undefined || plus.opacity < 1);
  const fallen = piece("fallen", "K|Kwa");
  assert.ok(
    near(fallen.y + fallen.h / 2 - (k.y + k.h / 2), 104),
    `drop ${fallen.y + fallen.h / 2 - (k.y + k.h / 2)}`
  );
  assert.ok(near(fallen.x + fallen.w / 2, k.x + k.w / 2), "under where it was");
  assert.ok(near(fallen.scale, 0.55, 1e-6) && near(fallen.opacity, 0.3, 1e-6));
  // The last state holds: Yao centred, Kwa where it fell.
  const yao = piece("formula", "y|Yao");
  assert.ok(near(yao.x + yao.w / 2, 540));
  assert.deepEqual(piece("formula", "K|Kwa"), fallen);
  const aya = pa("formula", FORMULA).pieces[0];
  assert.deepEqual(
    aya.map((p) => p.key),
    ["A|A", "ya|ya"]
  );
  for (const name of ["joining", "joined", "fallen", "formula"])
    for (const line of pa(name, FORMULA).pieces)
      for (const p of line)
        assert.ok(
          p.x >= 60 - 0.5 && p.x + p.w <= 1020 + 0.5,
          `${name} ${p.key}`
        );
});

// Check 4.
// @req REQ-186
test("1.12.0: drawings are drawn whole, no text overlaps them, and the attribution ends at y 1296", () => {
  for (const name of ["pair", "kwa"]) {
    const report = drawn[name].parchment[0];
    const texts = drawn[name].boxes.filter(
      (b) =>
        !String(b.id).endsWith(".svg") && b.kind !== "band" && b.kind !== "tape"
    );
    for (const d of report.drawings) {
      assert.ok(d.complete);
      assert.equal(d.opacity, 1);
      for (const t of texts)
        assert.ok(
          !(
            t.x < d.x + d.w &&
            d.x < t.x + t.w &&
            t.y < d.y + d.h &&
            d.y < t.y + t.h
          ),
          `${name}: ${t.id} overlaps a drawing`
        );
    }
    assert.ok(near(report.attribution.y + report.attribution.h, 1296, 1));
  }
  assert.deepEqual(
    drawn.pair.parchment[0].drawings.map((d) => Math.round(d.w)),
    [470, 470]
  );
  assert.deepEqual(
    drawn.kwa.parchment[0].drawings.map((d) => Math.round(d.w)),
    [560]
  );
});

// Check 5.
// @req REQ-186
test("1.12.0: the underline lies under its words within 2 px; the text card stays between the head and y 1300", () => {
  const [mark] = pa("law", LAW).marks;
  const { words, underline } = mark;
  assert.ok(
    near(underline.x, words.x, 2) &&
      near(underline.x + underline.w, words.x + words.w, 2),
    JSON.stringify(mark)
  );
  assert.ok(
    underline.y >= words.y + words.h - 12 &&
      underline.y + underline.h <= words.y + words.h + 4,
    JSON.stringify(mark)
  );
  const half = pa("underlining", LAW).marks[0].underline;
  assert.ok(half.w > 0 && half.w < underline.w);
  const report = pa("law", LAW);
  const bottom = report.head.y + report.head.h;
  for (const b of drawn.law.boxes.filter((b) => b.kind === "parchment"))
    assert.ok(b.y >= bottom && b.y + b.h <= 1300, `${b.id} at ${b.y}`);
});

// Check 6.
// @req REQ-186
test("1.12.0: subtitles on parchment in ink without outline, the lit word on an accent box; elsewhere unchanged", () => {
  const on = drawn.week.subtitleInk;
  assert.equal(on.color, INK);
  assert.equal(on.stroke, "0px");
  assert.equal(on.filter, "none");
  assert.deepEqual(on.lit, {
    background: "rgb(127, 82, 18)",
    color: "rgb(255, 250, 240)",
  });
  const off = drawn.opener.subtitleInk;
  assert.equal(off.stroke, "9px");
  assert.notEqual(off.filter, "none");
});
