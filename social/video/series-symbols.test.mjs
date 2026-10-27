// @req REQ-186
// Cartes 1.16.0-proposition, symbols not words (series.md « 1.16.0 »): the
// symbol set in the map drawings' hand, the four new flags, a flag planted
// on its place and swapped for another, the word bubble that changes, and
// the universal map, on which only dates and the episode's studied words
// are written. Model only: the drawn frames are in
// series-symbols.acceptance.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSeriesVideo, seriesFrameState } from "./series.mjs";
import { ILLUSTRATIONS, checkSeriesMapCard } from "./series-map.mjs";
import { PLANTED, BUBBLE } from "./series-sequence.mjs";
import { FLAG_STATES } from "./series-turns.mjs";
import { FPS } from "./sequence.mjs";
import { zaireDemo } from "./fixtures/series-zaire.mjs";

const ASSETS = new URL("../design-system/assets/", import.meta.url);
const read = (path) => readFileSync(new URL(path, ASSETS), "utf8");

const dirs = [];
// @req REQ-186
test.after(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true }))
);
const load = (options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "series-symbols-"));
  dirs.push(dir);
  return loadSeriesVideo(zaireDemo(dir, options), { dir });
};
const seq = load();
const card = (s, id) => s.cards.findIndex((c) => c.id === id);
const FLAGS_CARD = card(seq, "zaire-drapeaux");
const WORD_CARD = card(seq, "zaire-mot");
const mapAt = (s, frame, i) =>
  seriesFrameState(s, frame).layers.find((l) => l.card === i)?.map;
const wordFrame = (s, i, unit) => {
  for (const c of s.chunks.filter((c) => c.card === i)) {
    const w = c.words.find((w) => w.text.replace(/[,.:]+$/u, "") === unit);
    if (w) return Math.round(w.start * FPS);
  }
  throw new Error(`no ${unit}`);
};
const editCard = (id, change) => ({
  deck: (deck) => {
    change(deck.cards.find((c) => c.id === id));
    return deck;
  },
});

const SYMBOLS = [
  "caravelle",
  "padrao",
  "fort",
  "roi",
  "seigneur",
  "conseil",
  "nzimbu",
  "or-barre",
  "tribut",
  "tissu",
  "ivoire",
  "parole",
  "parole-or",
  "registre",
  "theatre",
  "canne",
  "epices",
  "peuple",
  "traversee",
];

// @req REQ-186
test("the symbol set is drawn in the map drawings' hand and carries no label", () => {
  const readme = read("Illustrations/README.md");
  for (const kind of SYMBOLS) {
    assert.ok(Object.hasOwn(ILLUSTRATIONS, kind), kind);
    assert.equal(ILLUSTRATIONS[kind], null, `${kind} has no label`);
    const svg = read(`Illustrations/${kind}.svg`);
    assert.match(svg, /viewBox="0 -12 160 132"/u, kind);
    // The ink line, and a contact shadow under the foot at (80, 112).
    assert.match(svg, /stroke="#23170d"/u, kind);
    assert.match(svg, /<ellipse cx="8\d" cy="11\d"[^>]*filter=/u, kind);
    // Gradient and filter ids are prefixed, so drawings share a page.
    for (const [, id] of svg.matchAll(/ id="([^"]+)"/gu))
      assert.ok(id.startsWith(`${kind}-`), `${kind}: id ${id}`);
    assert.doesNotMatch(svg, /<text/u, `${kind}: no written word`);
    assert.match(readme, new RegExp(`\`${kind}\\.svg\``, "u"), kind);
  }
  // The series 1 drawings keep their label.
  assert.equal(ILLUSTRATIONS.or, "or");
});

// @req REQ-186
test("four flags join the flag drawings, each with the state the voice names", () => {
  const readme = read("Flags/README.md");
  for (const [id, state] of [
    ["zar", "Zaïre"],
    ["cod", "Congo"],
    ["fra", "France"],
    ["bra", "Brésil"],
  ]) {
    assert.equal(FLAG_STATES[id], state);
    const svg = read(`Flags/${id}.svg`);
    assert.match(svg, /viewBox="0 0 300 200"/u, id);
    assert.match(readme, new RegExp(`\`${id}\\.svg\``, "u"), id);
  }
  assert.match(readme, /dessin d'après la description officielle/u);
});

// @req REQ-186
test("a planted flag is a drawing with a flag, never both a flag and a kind", () => {
  const base = {
    id: "c",
    type: "map",
    map: { sequence: "s", view: { lon: 0, lat: 0, radius: 2000 }, areas: [] },
  };
  const withDrawing = (d) => ({
    ...base,
    map: { ...base.map, drawings: [d] },
  });
  checkSeriesMapCard(withDrawing({ flag: "zar", at: [0, 0], say: "Zaïre" }));
  checkSeriesMapCard(
    withDrawing({
      flag: "zar",
      at: [0, 0],
      say: "Zaïre",
      swap: { flag: "cod", say: "1997" },
    })
  );
  assert.throws(
    () =>
      checkSeriesMapCard(
        withDrawing({ kind: "roi", flag: "zar", at: [0, 0], say: "Zaïre" })
      ),
    /un dessin ou un drapeau/u
  );
  assert.throws(
    () => checkSeriesMapCard(withDrawing({ flag: "pt", at: [0, 0], say: "x" })),
    /pas de drapeau « pt »/u
  );
  assert.throws(
    () =>
      checkSeriesMapCard(
        withDrawing({
          flag: "zar",
          at: [0, 0],
          say: "x",
          swap: { flag: "cod" },
        })
      ),
    /swap/u
  );
  assert.throws(
    () =>
      checkSeriesMapCard(withDrawing({ kind: "parole", at: [0, 0], say: "x" })),
    /bulle porte le mot étudié/u
  );
});

// @req REQ-186
test("the flag plants on its word, then folds while the next one rises", () => {
  const cp = seq.mapSequence.cards[FLAGS_CARD];
  const [flag] = cp.drawings;
  const plant = wordFrame(seq, FLAGS_CARD, "Zaïre");
  const swap = wordFrame(seq, FLAGS_CARD, "1997");
  assert.equal(flag.kind, "flag");
  assert.equal(flag.start, plant);
  assert.equal(flag.swap.start, swap);
  const at = (f) => mapAt(seq, f, FLAGS_CARD).marks.drawings[0];
  // Before its word nothing; the pole pops, the cloth unrolls from the hoist.
  assert.equal(mapAt(seq, plant - 1, FLAGS_CARD).marks.drawings.length, 0);
  assert.equal(at(plant + PLANTED.unrollFrom).cloth, 0);
  const done = plant + PLANTED.unrollFrom + PLANTED.unroll;
  assert.equal(at(done).flag, "zar");
  assert.equal(at(done).cloth, 1);
  assert.equal(at(done).pole, 1);
  // On « 1997 » the Zaïre flag folds back to the hoist...
  const folding = at(swap + PLANTED.fold / 2);
  assert.equal(folding.flag, "zar");
  assert.ok(folding.cloth > 0 && folding.cloth < 1);
  // ...then the DR Congo flag rises up the pole.
  const rising = at(swap + PLANTED.fold + PLANTED.rise / 2);
  assert.equal(rising.flag, "cod");
  assert.ok(rising.hoist > 0 && rising.hoist < 1);
  const risen = at(swap + PLANTED.fold + PLANTED.rise);
  assert.deepEqual([risen.flag, risen.hoist, risen.cloth], ["cod", 1, 1]);
  // Planted flags write nothing: no text but the two dates on this map.
  const texts = mapAt(seq, done, FLAGS_CARD).texts.filter((t) => t.opacity > 0);
  assert.deepEqual(
    texts.map((t) => t.text),
    ["1971"]
  );
});

// @req REQ-186
test("a planted flag stays in the map band and counts among the three drawings", () => {
  for (
    let f = seq.cardStarts[FLAGS_CARD];
    f < seq.cardStarts[WORD_CARD];
    f += 3
  ) {
    const map = mapAt(seq, f, FLAGS_CARD);
    for (const d of map?.marks.drawings ?? []) {
      assert.ok(d.box.x >= 60 && d.box.x + d.box.w <= 1020, `frame ${f}`);
      assert.ok(d.box.y >= 724 && d.box.y + d.box.h <= 1296, `frame ${f}`);
    }
  }
  assert.throws(
    () =>
      load(
        editCard("zaire-drapeaux", (c) =>
          c.map.drawings.push(
            { flag: "zar", at: [20, -1], say: "Zaïre" },
            { flag: "zar", at: [26, -1], say: "Zaïre" },
            { flag: "zar", at: [22, -5], say: "Zaïre" }
          )
        )
      ),
    /4 dessins : trois au plus/u
  );
});

// @req REQ-186
test("a planted flag follows the flag rule: the voice names its state", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-drapeaux", (c) => (c.map.drawings[0].swap.flag = "bra"))
      ),
    /Drapeau d'un État que la voix ne nomme pas \(« Brésil »\)/u
  );
});

// @req REQ-186
test("the facts of the flags' plan are marked by the flags and the dates", () => {
  const facts = seq.silent.filter((f) => f.card === "zaire-drapeaux");
  assert.equal(facts.length, 3);
  for (const f of facts)
    assert.ok(f.pass, `${f.say}: ${f.coverage} ${f.delay}`);
  const word = seq.silent.filter((f) => f.card === "zaire-mot");
  assert.equal(word.length, 4);
  for (const f of word) assert.ok(f.pass, `${f.say}: ${f.coverage} ${f.delay}`);
});

// @req REQ-186
test("the word bubble carries the studied word and becomes the other one", () => {
  const nzadi = wordFrame(seq, WORD_CARD, "disent");
  const zaire = wordFrame(seq, WORD_CARD, "Zaïre");
  const bubble = (f) =>
    mapAt(seq, f, WORD_CARD).marks.drawings.find((d) => d.kind === "parole");
  assert.equal(bubble(nzadi + 12).word, "nzadi");
  assert.equal(bubble(nzadi + 12).gold, 0);
  const before = bubble(zaire);
  const after = bubble(zaire + BUBBLE.glide);
  assert.equal(after.word, "Zaïre");
  assert.equal(after.gold, 1);
  // It glides towards the ship, then stays (the continuous push aside).
  assert.ok(after.x < before.x - 40);
  const later = bubble(zaire + BUBBLE.glide + 6);
  assert.ok(Math.hypot(later.x - after.x, later.y - after.y) < 1);
  // The written word counts among the texts on the map, as a word.
  const texts = mapAt(seq, zaire + BUBBLE.glide, WORD_CARD).texts;
  const word = texts.find((t) => t.text === "Zaïre");
  assert.ok(word && word.word);
  // The symbols write nothing under them.
  assert.ok(!texts.some((t) => t.kind === "label"));
});

// @req REQ-186
test("universal map: a name is written only when it is a studied word", () => {
  assert.throws(
    () =>
      load(
        editCard("zaire-drapeaux", (c) =>
          c.map.words.push({
            text: "Congo",
            kind: "name",
            at: [22, -4],
            say: "Congo",
          })
        )
      ),
    /Carte universelle .*« Congo ».*symbole/u
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-mot", (c) => (c.map.drawings[0].label = "roi du Kongo"))
      ),
    /Carte universelle .*« roi du Kongo »/u
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-drapeaux", (c) => (c.map.areas[0].label = "country"))
      ),
    /Carte universelle .*« République démocratique du Congo »/u
  );
  assert.throws(
    () =>
      load(
        editCard("zaire-mot", (c) => (c.map.drawings[2].morph.word = "Congo"))
      ),
    /bulle porte le mot étudié.*« Congo »/u
  );
  // A studied word, a date and a century are written.
  load(
    editCard("zaire-mot", (c) =>
      c.map.drawings.splice(0, 1, {
        kind: "roi",
        at: [15.4, -5.0],
        say: "Kongo",
        label: "1482",
      })
    )
  );
  load(
    editCard("zaire-drapeaux", (c) =>
      c.map.words.push({
        text: "Zaïre",
        kind: "name",
        at: [22, -5],
        say: "Zaïre",
      })
    )
  );
});

// @req REQ-186
test("universal map: areas and places are not named, the series 1 drawings lose their label", () => {
  const edited = load(
    editCard("zaire-mot", (c) => {
      c.map.places = [
        { name: "Mbanza Kongo", at: [14.25, -6.27], say: "Kongo" },
      ];
      c.map.drawings[1] = { kind: "or", at: [10.6, -5.0], say: "Portugais" };
    })
  );
  const i = card(edited, "zaire-mot");
  const f = wordFrame(edited, i, "Portugais") + 20;
  const map = mapAt(edited, f, i);
  assert.equal(map.marks.places.length, 1);
  assert.deepEqual(
    map.texts.filter((t) => t.opacity > 0).map((t) => t.text),
    []
  );
});

// @req REQ-186
test("without studied words a map keeps the accepted 1.14.0 writing", () => {
  const plain = load({
    edit: (input) => delete input.studiedWords,
    deck: (deck) => {
      const c = deck.cards.find((x) => x.id === "zaire-mot");
      c.map.drawings.splice(2, 1);
      c.map.facts.splice(2, 2);
      c.map.words = [
        {
          text: "Mbanza Kongo",
          kind: "name",
          at: [14.25, -6.27],
          say: "Kongo",
        },
      ];
      return deck;
    },
  });
  const i = card(plain, "zaire-mot");
  const f = wordFrame(plain, i, "Portugais") + 20;
  const texts = mapAt(plain, f, i).texts.filter((t) => t.opacity > 0);
  assert.ok(texts.some((t) => t.text === "Mbanza Kongo"));
  assert.throws(
    () =>
      load({
        edit: (input) => (input.studiedWords = ["nzadi", ""]),
      }),
    /studiedWords/u
  );
});
