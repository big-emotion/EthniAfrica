// The document card and the teaching cards of the series video (EthniAfrica
// Cartes 1.8.0, series.md « Document and teaching cards », handoff
// « Renderer integration of 1.8.0 »): the geometry of a page framed on its
// quoted passage, and the checks a card can fail before anything is timed.
// `documentFrame` is also sent to the page as source text (as flatProject
// is), so the engine and the drawing place the page with the same numbers.

// A page of text is framed so the quoted passage reads on a phone: 960 px
// wide, never past 1.5 frame pixels per source pixel, never under the scale
// that covers the frame; its centre on (540, 1000), the page clamped to the
// frame except that it may stop up to 400 px short of the top or the bottom,
// on the frame's dark ground (operator, decision 2). Outside a band of 48 px
// around the passage, fading over 90 px, the page is blurred by 7 px
// (decision 1). A web capture may add `pad` source pixels above the page in
// its own colour, so its headline reaches the clear zone (decision 3).
//
// When the page's edge stops the passage from centring and it would cross
// x 60 to 1020, the scale is reduced just enough to bring it inside, so the
// passage ends a little under 960 px wide (operator, 16 October 2026). The
// page keeps covering the frame's width and stops at most 400 px short of the
// top or the bottom; a passage that still cannot fit is left to check 1.
export function documentFrame(image) {
  // Self-contained: the page receives this function as source text.
  const doc = image.document;
  const pad = doc.pad ?? 0;
  const pageW = image.w;
  const pageH = image.h + pad;
  const [px, py, pw, ph] = doc.passage;
  const EDGE = 400;
  const cover = Math.max(1080 / pageW, 1920 / pageH);
  const frameAt = (scale) => {
    const width = pageW * scale;
    const height = pageH * scale;
    const cx = (px + pw / 2) * scale;
    const cy = (pad + py + ph / 2) * scale;
    const left = Math.min(0, Math.max(1080 - width, 540 - cx));
    const top = Math.min(EDGE, Math.max(1920 - height - EDGE, 1000 - cy));
    const edge = Math.max(0, top, 1920 - (top + height));
    const passage = {
      x: left + px * scale,
      y: top + (pad + py) * scale,
      w: pw * scale,
      h: ph * scale,
    };
    return {
      scale,
      cover,
      left,
      top,
      width,
      height,
      pad: pad * scale,
      edge,
      passage,
      // In frame pixels at zoom 1; the page's own coordinates are these minus
      // `top`. The zoom grows both around (540, 1000), so the band keeps
      // containing the passage.
      sharp: [passage.y - 48, passage.y + passage.h + 48],
      fade: 90,
      blur: 7,
    };
  };
  const fits = (f) =>
    f.passage.x >= 60 - 1e-6 && f.passage.x + f.passage.w <= 1020 + 1e-6;
  const preferred = Math.max(cover, Math.min(1.5, 960 / pw));
  const floor = Math.max(1080 / pageW, (1920 - 2 * EDGE) / pageH);
  let frame = frameAt(preferred);
  for (let s = preferred - 0.0005; !fits(frame) && s >= floor; s -= 0.0005) {
    const smaller = frameAt(s);
    if (fits(smaller)) frame = smaller;
  }
  return frame;
}

const fail = (message) => {
  throw new Error(message);
};
const round = (n) => Math.round(n);
const inside = ([x, y, w, h], [X, Y, W, H]) =>
  x >= X && y >= Y && x + w <= X + W && y + h <= Y + H;
const CLEAR = { x: [60, 1020], y: [700, 1300] };
// « capturée le 15 octobre 2026 »: the foot names the day of the capture.
const CAPTURE_DATE =
  /capturée le (1er|\d{1,2}) (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4}/u;

// Checks 1, 2 and 4: the framing, the marks and the foot.
export function checkDocumentCard(card) {
  const id = card.id;
  const { image } = card;
  const doc = image.document;
  if (!(image.w > 0 && image.h > 0))
    fail(`Card ${id}: a document card gives its page's size, image.w and h`);
  if (!Array.isArray(doc.passage) || doc.passage.length !== 4)
    fail(`Card ${id}: image.document.passage is [x, y, w, h]`);
  if (typeof doc.say !== "string" || !doc.say)
    fail(`Card ${id}: image.document.say names the word of the underline`);
  const f = documentFrame(image);
  const p = f.passage;
  if (
    f.scale > 1.5 ||
    p.x < CLEAR.x[0] - 0.5 ||
    p.x + p.w > CLEAR.x[1] + 0.5 ||
    p.y < CLEAR.y[0] - 0.5 ||
    p.y + p.h > CLEAR.y[1] + 0.5
  )
    fail(
      `Card ${id}: Passage hors de l'image dégagée : x ${round(p.x)} à ${round(p.x + p.w)}, y ${round(p.y)} à ${round(p.y + p.h)}, échelle ${f.scale.toFixed(2)}, bord ${round(f.edge)} px`
    );
  for (const mark of doc.marks ?? [])
    if (!inside(mark, doc.passage))
      fail(`Card ${id}: Repère hors du passage : [${mark.join(", ")}]`);
  if (!card.source) fail(`Card ${id}: Une carte document porte sa source`);
  if (card.credit)
    fail(
      `Card ${id}: Une carte document n'a pas de ligne de crédit : la source nomme le document et qui l'a numérisé`
    );
  const capture = doc.pad !== undefined || card.sourceLabel === "Capture";
  if (capture && card.sourceLabel !== "Capture")
    fail(
      `Card ${id}: Une capture web se lit « Capture : » ; set sourceLabel « Capture »`
    );
  if (capture && !CAPTURE_DATE.test(card.source))
    fail(
      `Card ${id}: La capture ne dit pas sa date (« capturée le 15 octobre 2026 »)`
    );
}

// Check 6, on the strings: « = » only when the parts before it, a dropped
// part aside, spell the result after it; « → » when the form changes.
const OPERATORS = ["+", "=", "→"];
const letters = (text) =>
  text
    .replace(/\*/g, "")
    .replace(/[^\p{L}]/gu, "")
    .toLowerCase();
export function checkFormula(card) {
  const id = card.id;
  const steps = card.formula.steps;
  if (!Array.isArray(steps) || !steps.length)
    fail(`Card ${id}: a formula has steps`);
  for (const step of steps) {
    if (typeof step.say !== "string" || !step.say)
      fail(`Card ${id}: each step of the formula names its word, say`);
    for (const row of step.rows) {
      const parts = row.parts;
      parts.forEach((part) => {
        if (part.role === "op" && !OPERATORS.includes(part.text))
          fail(
            `Card ${id}: un opérateur de formule est « + », « = » ou « → » (« ${part.text} »)`
          );
      });
      parts.forEach((part, k) => {
        if (part.role !== "op" || part.text !== "=") return;
        const before = parts.slice(0, k);
        const start = before.findLastIndex(
          (p) => p.role === "op" && p.text !== "+"
        );
        const terms = before.slice(start + 1).filter((p) => p.role !== "op");
        const end = parts.findIndex((p, j) => j > k && p.role === "op");
        const result = parts
          .slice(k + 1, end < 0 ? undefined : end)
          .filter((p) => p.role !== "op");
        const sum = terms
          .filter((p) => p.role !== "dropped")
          .map((p) => letters(p.text))
          .join("");
        const total = result.map((p) => letters(p.text)).join("");
        if (sum !== total)
          fail(
            `Card ${id}: « = » entre des parties qui ne font pas le résultat : ${terms.map((p) => p.text.replace(/\*/g, "")).join(" + ")} ≠ ${result.map((p) => p.text.replace(/\*/g, "")).join("")} ; use « → »`
          );
      });
    }
  }
}

// Check 7: two columns, two to three rows.
export function checkSideBySide(card) {
  const id = card.id;
  const { heads, rows } = card.sbs;
  if (heads?.length !== 2 || rows?.some((r) => r.length !== 2))
    fail(`Card ${id}: une carte côte à côte a deux colonnes`);
  if (!(rows.length >= 2 && rows.length <= 3))
    fail(`Card ${id}: une carte côte à côte a deux à trois lignes`);
}

// The week table's reading: its names and day words (the design counts the
// 28 names and 14 day words of the full week, about 10 s at 21 a second).
export const weekCharacters = (week) =>
  week.rows
    .flatMap(([, a, b]) => [...a, ...b])
    .reduce((n, t) => n + [...t].length, 0);
