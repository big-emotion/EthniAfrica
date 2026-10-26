// @req REQ-186
// The series video (Cartes 1.4.0, full screen) as a schedule: the cover, the
// 300 ms card changes, every card voiced once, the length and the « série »
// ending, on the series 1 demonstration script, and the band check of every
// text box. No browser is needed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkSeriesLayout,
  loadSeriesVideo,
  seriesFrameState,
  seriesFrameCount,
} from "./series.mjs";
import { seriesDemo } from "./fixtures/series-pays.mjs";

const dirs = [];
function demo(options) {
  const dir = mkdtempSync(join(tmpdir(), "series-video-"));
  dirs.push(dir);
  return loadSeriesVideo(seriesDemo(dir, options), { dir });
}
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);

const FPS = 30;
const states = (seq) =>
  Array.from({ length: seriesFrameCount(seq) }, (_, f) =>
    seriesFrameState(seq, f)
  );

// @req REQ-186
test("frame 0 is the cover: the opener alone, with its band, and no subtitle", () => {
  const seq = demo();
  const cover = seriesFrameState(seq, 0);
  assert.deepEqual(cover.layers, [
    { card: 0, opacity: 1, zoom: 1, zoomEnd: cover.layers[0].zoomEnd, text: 1 },
  ]);
  assert.equal(seq.cards[0].type, "opener");
  assert.deepEqual(seq.band, { id: "pays", episode: 1 });
  assert.equal(cover.subtitle, null);
});

// @req REQ-186
// The 1.3.0 script was written for 35 to 45 s; since 1.6.0 the voice also
// says the signature line on the closing card, about 4.4 s more.
test("the demonstration script lasts 35 to 45 s, plus the spoken signature line", () => {
  const seconds = seriesFrameCount(demo()) / FPS;
  assert.ok(seconds >= 35 && seconds <= 50, `${seconds} s`);
});

// @req REQ-186
test("each card change is one 300 ms cross-fade and nothing else moves", () => {
  const seq = demo();
  const all = states(seq);
  const fades = [];
  all.forEach((s, f) => {
    assert.ok(
      s.layers.length <= 2,
      `frame ${f} draws ${s.layers.length} cards`
    );
    if (s.layers.length === 2) fades.push(f);
  });
  // Six changes between seven cards, each 9 frames of mixing (0 → 1 over
  // 300 ms: opacity 1/9 … 8/9, then the new card alone).
  const runs = [];
  for (const f of fades)
    if (runs.length && runs.at(-1).at(-1) === f - 1) runs.at(-1).push(f);
    else runs.push([f]);
  assert.equal(runs.length, seq.cards.length - 1);
  runs.forEach((run, k) => {
    assert.equal(run.length, 8, `change ${k + 1} mixes ${run.length} frames`);
    run.forEach((f, j) => {
      const [under, over] = all[f].layers;
      assert.equal(under.card, k);
      assert.equal(under.opacity, 1);
      assert.equal(over.card, k + 1);
      assert.ok(Math.abs(over.opacity - (j + 1) / 9) < 1e-9);
      // The heads swap inside the change (operator, 14 October 2026): the
      // outgoing text leaves in the first 150 ms, the incoming text enters
      // in the last 150 ms, while the images cross-fade over all 300 ms.
      const p = (j + 1) / 9;
      assert.ok(Math.abs(under.text - Math.max(0, 1 - 2 * p)) < 1e-9);
      assert.ok(Math.abs(over.text - Math.max(0, 2 * p - 1)) < 1e-9);
      assert.ok(under.text === 0 || over.text === 0, `frame ${f}`);
    });
    assert.deepEqual(
      all[run.at(-1) + 1].layers.map((l) => [l.card, l.opacity]),
      [[k + 1, 1]]
    );
  });
});

// @req REQ-186
// 1.13.0 (decision 3): the photograph pushes in 6 % every 10 s, the maps'
// push, in place of 1.4.0's 100 to 104 % over the card.
test("the photograph pushes in 6 % every 10 s while its card is on screen", () => {
  const seq = demo();
  const zooms = new Map();
  states(seq).forEach((s) =>
    s.layers.forEach((l) =>
      zooms.set(l.card, [...(zooms.get(l.card) ?? []), [l.zoom, l.zoomEnd]])
    )
  );
  for (const [card, pairs] of zooms) {
    const list = pairs.map(([z]) => z);
    assert.equal(list[0], 1, `card ${card} starts at 100 %`);
    if (card < seq.cards.length - 1)
      assert.ok(
        Math.abs(list.at(-1) - pairs.at(-1)[1]) < 1e-9,
        `card ${card} ends at its zoomEnd`
      );
    list.forEach((z, i) => assert.ok(i === 0 || z >= list[i - 1]));
  }
});

// @req REQ-186
test("every card is voiced once, while it is on screen alone", () => {
  const seq = demo();
  const voiced = seq.chunks.map((c) => c.card);
  assert.deepEqual(
    [...new Set(voiced)],
    seq.cards.map((_, i) => i)
  );
  for (const chunk of seq.chunks) {
    const s = seriesFrameState(seq, chunk.appear);
    assert.deepEqual(
      s.layers.map((l) => [l.card, l.opacity]),
      [[chunk.card, 1]]
    );
  }
});

// The operator's words, decided on 19 October 2026 (Cartes 1.10.0), as the
// voice says them: one chunk per printed line. Spelled out on purpose: the
// test holds the engine's constants to the decision.
const CLOSING_CHUNKS = [
  "L’importance de",
  "connaître nos noms.",
  "Vous pouvez continuer la recherche",
  "sur EthniAfrica, lien en profil.",
];
const withClosing = (texts) => (beats) => {
  beats.at(-1).chunks = texts.map((text) => ({ text, duration: 2 }));
  return beats;
};

// @req REQ-186
test("1.10.0: the closing card says the closing line and the invitation, one chunk per printed line", () => {
  const seq = demo();
  const last = seq.cards.length - 1;
  const closing = seq.chunks.filter((c) => c.card === last);
  assert.deepEqual(
    closing.map((c) => c.text.replace(/\s/gu, " ")),
    CLOSING_CHUNKS
  );
  assert.ok(closing.every((c) => c.hidden && !c.lines.length));
});

// @req REQ-186
test("1.10.0: the voice's ' and ’ are one letter, and spaces are normalised", () => {
  const seq = demo({
    script: withClosing([
      "L'importance de",
      "connaître  nos noms.",
      "Vous pouvez continuer la\u00a0recherche",
      "sur EthniAfrica, lien en profil.",
    ]),
  });
  assert.equal(seq.cards.at(-1).type, "closing");
});

// @req REQ-186
test("1.10.0: a closing card whose chunks are not the four printed lines is refused", () => {
  for (const texts of [
    [
      "Connaître nos noms,",
      "décoloniser leur emploi,",
      "nous nommer nous-mêmes.",
      "Cherchez Burkina Faso sur EthniAfrica,",
      "lien en profil.",
    ],
    ["L’importance de connaître nos noms.", ...CLOSING_CHUNKS.slice(2)],
    CLOSING_CHUNKS.slice(0, 3),
    [...CLOSING_CHUNKS, "lien en profil."],
    [
      ...CLOSING_CHUNKS.slice(0, 2),
      "Vous pouvez continuer la recherche sur EthniAfrica,",
      "lien en profil.",
    ],
    ["L’importance de", "connaître vos noms.", ...CLOSING_CHUNKS.slice(2)],
  ])
    assert.throws(
      () => demo({ script: withClosing(texts) }),
      /La fin n'est pas dite mot pour mot : « L’importance de \/ connaître nos noms\. \/ Vous pouvez continuer la recherche \/ sur EthniAfrica, lien en profil\. »/
    );
});

// An invitation without « lien en profil » (operator, 26 October 2026, on
// « Zaïre comme prénom et nom de famille »: « invitation sans lien en
// profil »), for a piece whose answer page is not yet online. The sequence
// asks for it with `ending.profileLink: false`; the words stay the fixed
// invitation's, only the profile link is dropped.
const WITHOUT_PROFILE_LINK = [
  ...CLOSING_CHUNKS.slice(0, 3),
  "sur EthniAfrica.",
];
const noProfileLink = (input) => {
  input.ending = { ...input.ending, profileLink: false };
};

// @req REQ-186
test("an ending without the profile link is said and printed without « lien en profil »", () => {
  const seq = demo({
    edit: noProfileLink,
    script: withClosing(WITHOUT_PROFILE_LINK),
  });
  const last = seq.cards.length - 1;
  assert.deepEqual(seq.cards[last].invitationLines, [
    "Vous pouvez continuer la recherche",
    "sur EthniAfrica.",
  ]);
  assert.ok(seq.chunks.filter((c) => c.card === last).every((c) => c.hidden));
});

// @req REQ-186
test("an ending without the profile link refuses a voice that still says it", () => {
  assert.throws(
    () => demo({ edit: noProfileLink }),
    /La fin n'est pas dite mot pour mot : « L’importance de \/ connaître nos noms\. \/ Vous pouvez continuer la recherche \/ sur EthniAfrica\. »/
  );
});

// @req REQ-186
test("the default ending keeps « lien en profil », said and printed by the cards' own lines", () => {
  const seq = demo();
  assert.equal(seq.cards.at(-1).invitationLines, undefined);
  assert.throws(
    () => demo({ script: withClosing(WITHOUT_PROFILE_LINK) }),
    /sur EthniAfrica, lien en profil\. »/
  );
});

// @req REQ-186
test("profileLink accepts only false, and not with the end card that prints the link", () => {
  assert.throws(
    () =>
      demo({
        edit: (input) => {
          input.ending = { profileLink: "non" };
        },
      }),
    /ending\.profileLink/
  );
  assert.throws(
    () =>
      demo({
        edit: (input) => {
          noProfileLink(input);
          input.idents = { outro: "anything" };
        },
        script: withClosing(WITHOUT_PROFILE_LINK),
      }),
    /ending\.profileLink/
  );
});

// @req REQ-186
test("1.6.0: the subtitle band stays empty for the whole ending", () => {
  const seq = demo();
  const last = seq.cards.length - 1;
  let ending = 0;
  for (const state of states(seq)) {
    const alone = state.layers.length === 1 && state.layers[0].card === last;
    if (!alone) continue;
    ending++;
    assert.equal(state.subtitle, null);
  }
  assert.ok(ending > 75, `the ending lasts ${ending} frames`);
});

// @req REQ-186
test("the closing card holds until the voice ends plus 0.5 s, 2.5 s at least", () => {
  const seq = demo();
  const closingIn = seq.cardStarts.at(-1);
  const count = seriesFrameCount(seq);
  assert.equal(
    count,
    Math.max(closingIn + 75, Math.ceil((seq.voice.duration + 0.5) * FPS - 1e-9))
  );
});

// @req REQ-186
test("1.10.0: an ending input that still gives search, general or pageOnline loads and warns", () => {
  const plain = demo();
  assert.deepEqual(plain.ending, {});
  assert.ok(!plain.warnings.some((w) => /search|general|pageOnline/.test(w)));
  for (const ending of [
    { search: "Burkina Faso", pageOnline: true },
    { general: true },
    { pageOnline: false },
  ]) {
    const seq = demo({ edit: (input) => (input.ending = ending) });
    assert.deepEqual(seq.ending, {});
    assert.ok(
      seq.warnings.some((w) =>
        /L'entrée de fin ne prend plus que next/.test(w)
      ),
      JSON.stringify(seq.warnings)
    );
  }
  const none = demo({ edit: (input) => delete input.ending });
  assert.deepEqual(none.ending, {});
});

// The length and reading-speed warnings; the series 1 demonstration has no
// signed card, so it also carries the 1.7.0 « Aucune carte signée » warning.
const timing = (seq) => seq.warnings.filter((w) => !/carte signée/.test(w));

// @req REQ-186
test("a subtitle chunk may read up to 21 characters a second; faster is refused", () => {
  // Each chunk is timed at `cps` characters a second of its own text, so the
  // reading rate is set directly rather than inferred from a voice.
  const paced = (cps) =>
    demo({
      script: (beats) =>
        beats.map((b) => ({
          ...b,
          chunks: b.chunks.map((c) => ({
            ...c,
            duration: Math.max(1, [...c.text].length / cps + 0.2),
          })),
        })),
    });
  assert.doesNotThrow(() => paced(20));
  assert.throws(() => paced(26), /faster than 21 characters a second/);
});

// @req REQ-186
test("the length is a recommendation of 35 to 75 s: a longer video loads with a warning", () => {
  const stretched = (factor) =>
    demo({
      script: (beats) =>
        beats.map((b) => ({
          ...b,
          chunks: b.chunks.map((c) => ({
            ...c,
            duration: c.duration * factor,
          })),
        })),
    });
  assert.deepEqual(timing(stretched(1.3)), []);
  // Past 75 s but under 90 s, where a video becomes long and needs chapters.
  const long = stretched(1.9);
  const seconds = seriesFrameCount(long) / FPS;
  assert.ok(seconds > 75 && seconds < 90, `${seconds} s`);
  assert.equal(timing(long).length, 1);
  assert.match(timing(long)[0], /recommended length is 35 to 75 s/);
});

// The first content chunk is read at `cps` characters a second; the others
// keep the design's timing.
const readAt = (cps) =>
  demo({
    script: (beats) =>
      beats.map((b, i) =>
        i !== 1
          ? b
          : {
              ...b,
              chunks: b.chunks.map((c, k) =>
                k ? c : { ...c, duration: [...c.text].length / cps }
              ),
            }
      ),
  });

// @req REQ-186
test("17 characters a second is recommended: a chunk read up to 21 loads with a warning", () => {
  assert.deepEqual(timing(readAt(15)), []);
  const fast = readAt(18.5);
  assert.equal(timing(fast).length, 1);
  assert.match(
    timing(fast)[0],
    /faster than the recommended 17 characters a second/
  );
});

// @req REQ-186
test("a chunk read faster than 21 characters a second is refused", () => {
  assert.throws(() => readAt(22), /faster than 21 characters a second/);
});

// @req REQ-186
test("an opener first, a closing card last, and one series for every card", () => {
  assert.throws(
    () => demo({ edit: (input) => input.beats.reverse() }),
    /opener/
  );
  assert.throws(
    () =>
      demo({
        edit: (input) => (input.beats[1].card = "serie-nom-famille-02"),
      }),
    /one series/
  );
});

// @req REQ-186
test("a subtitle line may be 900 px wide, as in Vidéo carte 0.4.0", () => {
  // 872 px: refused by layout B's 840 px column, accepted in full screen.
  assert.doesNotThrow(() =>
    demo({
      script: (beats) => {
        beats[1].chunks[0].text = "MMMM MMMM MMMM MMMM";
        return beats;
      },
    })
  );
});

// @req REQ-186
test("every text sits in its band, between x 60 and 1020", () => {
  const box = (kind, x, y, w, h, extra) => ({
    id: kind,
    kind,
    x,
    y,
    w,
    h,
    ...extra,
  });
  const ok = [
    box("tape", 700, 178, 320, 48),
    box("band", 60, 250, 600, 40),
    box("head", 60, 318, 960, 382),
    box("ending", 60, 318, 960, 500),
    box("pill", 300, 700, 480, 76),
    box("subtitle", 140, 1316, 800, 68),
    box("key", 60, 1652, 600, 32),
    box("source", 60, 1720, 900, 30),
    box("credit", 60, 1756, 960, 30),
    box("signature", 60, 1836, 240, 48),
    box("ending-credit", 90, 1760, 900, 56),
    box("signature", 400, 1828, 280, 56),
    box("slot", 120, 760, 840, 480),
    // 1.4.1: a map card's foot may start at 1600, so its subject ends there.
    box("map-subject", 300, 724, 400, 876),
  ];
  assert.deepEqual(checkSeriesLayout(ok), []);
  const one = (b) => checkSeriesLayout([b]);
  assert.match(
    one(box("band", 40, 250, 600, 40)).join(),
    /x 40 to 640 leaves x 60 to 1020/
  );
  assert.match(
    one(box("head", 60, 318, 960, 400)).join(),
    /leaves its band, y 318 to 700/
  );
  assert.match(one(box("ending", 60, 318, 960, 520)).join(), /y 318 to 820/);
  assert.match(one(box("subtitle", 60, 1316, 940, 68)).join(), /over 900/);
  assert.match(
    one(box("subtitle", 140, 1300, 800, 68)).join(),
    /y 1316 to 1452/
  );
  assert.match(one(box("source", 60, 1600, 900, 30)).join(), /y 1652 to 1786/);
  assert.match(
    one(box("signature", 60, 1800, 240, 48)).join(),
    /y 1828 to 1884/
  );
  assert.match(
    one(box("map-subject", 300, 385, 400, 450)).join(),
    /Le sujet de la carte passe sous la tête/
  );
  assert.match(one(box("unknown", 60, 300, 10, 10)).join(), /unknown kind/);
});

// @req REQ-186
test("an atlas card in a series video is refused: carousel only (1.4.1)", () => {
  assert.throws(
    () =>
      demo({
        script: (beats) =>
          beats.map((b, i) =>
            i === 1 ? { ...b, card: "serie-atlas-1880" } : b
          ),
      }),
    /Carte d'atlas : carrousel seulement/
  );
});

// @req REQ-186
test("an image enlarged past 1.5 is refused, except in a demonstration", () => {
  const image = {
    id: "serie-pays-01",
    kind: "image",
    x: 0,
    y: 0,
    w: 1080,
    h: 1920,
    scale: 3.35,
  };
  assert.match(
    checkSeriesLayout([image]).join(),
    /Image trop petite pour la vidéo/
  );
  assert.deepEqual(checkSeriesLayout([image], { demo: true }), []);
  assert.deepEqual(checkSeriesLayout([{ ...image, scale: 1.5 }]), []);
});

// @req REQ-186
test("the figure head keeps « plus de » clear of the number's digits and outline", () => {
  // Anton 176 on a 156 px line overflows its box by about 10 px at the top,
  // and its outline adds 13 px: « plus de » needs 24 px of clearance above
  // the number's line box, or the digits cover it (operator, 21 October 2026).
  const fig = (kind, y, h) => ({ id: kind, kind, x: 60, y, w: 500, h });
  assert.match(
    checkSeriesLayout([
      fig("figure-pre", 318, 42),
      fig("figure-number", 360, 156),
    ]).join(),
    /« plus de » touche le chiffre/
  );
  assert.deepEqual(
    checkSeriesLayout([
      fig("figure-pre", 318, 42),
      fig("figure-number", 384, 156),
    ]),
    []
  );
});
