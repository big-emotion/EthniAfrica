// Illustrated scenes on the parchment card (narration v4 of « Zaïre »,
// boards S10 to S13 of https://claude.ai/artifact/5eUf5zVorYqaSky3ZebWoT,
// approved 27 October 2026): a moment of the story played off the map, on
// the idents' parchment, its gestures timed on the voice. The royal council
// raising its hands while the crown comes down on the king (S10); a buyer
// giving nzimbu shells and receiving a basket of goods (S11); the baptism at
// the Kongo court in 1491 (S12); ships going both ways between a Portuguese
// building and a Kongo house (S13).
//
// The hand is the drawings' (1.11.0 and 1.12.0): an ink line #23170d over a
// wash lit from the top left, rounded semi-realistic figures, a soft contact
// shadow; generic people with no face, never a portrait. A scene writes no
// word: its card may carry a date in figures or a studied word in its head,
// and its sources in the foot. Every part is an SVG group the page moves;
// this module gives the markup once and each part's state on a frame.
import { readFileSync } from "node:fs";
import { EASE } from "./series-motion.mjs";

const fail = (message) => {
  throw new Error(message);
};
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (k, frames, ease = EASE.move) => ease(clamp01(k / frames));

// Frames at 30 fps. A part enters as the drawings do (400 ms, rising 8 px),
// 90 ms after the one before it, as the week table's rows cascade (1.12.0).
export const SCENE = {
  box: { x: 60, y: 540, w: 960, h: 720 },
  enter: 12,
  rise: 8,
  apart: 3,
  // Hands rise in 400 ms, 60 ms apart; the crown comes down in 800 ms.
  hands: 12,
  handsApart: 2,
  crown: 24,
  // An arm reaches out in 300 ms; what it holds crosses in 700 ms.
  reach: 9,
  pass: 21,
  // The cross enters as a part; the vessel tips in 300 ms and three drops
  // fall in 500 ms each, 170 ms apart, and are gone: no loop.
  tilt: 9,
  drop: 15,
  dropApart: 5,
  // The ships cross in 2 s, eased.
  ships: 60,
};

// Each kind's gestures, the words the card names for them.
export const SCENE_KINDS = {
  conseil: ["hands", "crown"],
  nzimbu: ["give", "receive"],
  bapteme: ["cross", "water"],
  echanges: ["ships"],
};

const INK = "#23170d";
const SKINS = ["#5a3a22", "#6b4529", "#4a2f1c", "#7a5234"];
const n1 = (v) => +v.toFixed(1);

// A drawing of assets/Illustrations nested in a scene, its ids prefixed so
// two copies never share one.
const ILL = new URL("../design-system/assets/Illustrations/", import.meta.url);
function nested(kind, prefix, x, y, w) {
  const svg = readFileSync(new URL(`${kind}.svg`, ILL), "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/u)[1];
  const [, , vw, vh] = viewBox.split(/\s+/u).map(Number);
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/u, "")
    .replace(/<\/svg>\s*$/u, "")
    .replace(/<title>[^<]*<\/title>/u, "")
    .replaceAll(`${kind}-`, `${prefix}-`);
  return `<svg x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1((w * vh) / vw)}" viewBox="${viewBox}">${inner}</svg>`;
}

const shadow = (x, y, rx) =>
  `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(rx * 0.16)}" fill="${INK}" opacity="0.14"/>`;

// A standing figure, foot at (x, y), `h` tall: its robe with one border
// stripe, its head with no face, a head wrap for a woman. Its near arm is
// apart (`arm`), so it can rise or reach; `side` is the arm's side.
function person({ x, y, h, skin, cloth, wrap, side = 1, muted = false }) {
  const s = (v) => n1(v * h);
  const line = muted ? "none" : INK;
  const robe = `M${n1(x - 0.13 * h)},${n1(y - 0.7 * h)} C${n1(x - 0.2 * h)},${n1(y - 0.62 * h)} ${n1(x - 0.24 * h)},${n1(y - 0.2 * h)} ${n1(x - 0.22 * h)},${n1(y)} L${n1(x + 0.22 * h)},${n1(y)} C${n1(x + 0.24 * h)},${n1(y - 0.2 * h)} ${n1(x + 0.2 * h)},${n1(y - 0.62 * h)} ${n1(x + 0.13 * h)},${n1(y - 0.7 * h)} Q${n1(x)},${n1(y - 0.77 * h)} ${n1(x - 0.13 * h)},${n1(y - 0.7 * h)} Z`;
  const body = [
    shadow(x, y, 0.24 * h),
    `<path d="${robe}" fill="${cloth}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
    muted
      ? ""
      : `<path d="M${n1(x - 0.1 * h)},${n1(y - 0.64 * h)} C${n1(x - 0.16 * h)},${n1(y - 0.48 * h)} ${n1(x - 0.18 * h)},${n1(y - 0.24 * h)} ${n1(x - 0.16 * h)},${n1(y - 0.04 * h)}" fill="none" stroke="#fffaf0" stroke-opacity="0.25" stroke-width="${s(0.05)}" stroke-linecap="round"/>`,
    muted
      ? ""
      : `<path d="M${n1(x - 0.215 * h)},${n1(y - 0.07 * h)} L${n1(x + 0.215 * h)},${n1(y - 0.07 * h)}" stroke="${INK}" stroke-opacity="0.35" stroke-width="${s(0.025)}"/>`,
    `<circle cx="${n1(x)}" cy="${n1(y - 0.84 * h)}" r="${s(0.105)}" fill="${skin}" stroke="${line}" stroke-width="4"/>`,
    wrap
      ? `<path d="M${n1(x - 0.12 * h)},${n1(y - 0.86 * h)} C${n1(x - 0.14 * h)},${n1(y - 1.01 * h)} ${n1(x + 0.14 * h)},${n1(y - 1.01 * h)} ${n1(x + 0.12 * h)},${n1(y - 0.86 * h)} Q${n1(x)},${n1(y - 0.9 * h)} ${n1(x - 0.12 * h)},${n1(y - 0.86 * h)} Z" fill="${wrap}" stroke="${line}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${n1(x + 0.05 * side * h)}" cy="${n1(y - 0.98 * h)}" r="${s(0.035)}" fill="${wrap}" stroke="${line}" stroke-width="3"/>`
      : "",
  ].join("");
  const shoulder = [x + side * 0.14 * h, y - 0.66 * h];
  const hand = [x + side * 0.2 * h, y - 0.36 * h];
  const arm = `<path d="M${n1(shoulder[0])},${n1(shoulder[1])} L${n1(hand[0])},${n1(hand[1])}" stroke="${muted ? cloth : INK}" stroke-width="${n1(0.075 * h + 7)}" stroke-linecap="round"/><path d="M${n1(shoulder[0])},${n1(shoulder[1])} L${n1(hand[0])},${n1(hand[1])}" stroke="${muted ? cloth : skin}" stroke-width="${s(0.075)}" stroke-linecap="round"/>${muted ? "" : `<circle cx="${n1(hand[0])}" cy="${n1(hand[1])}" r="${s(0.045)}" fill="${skin}" stroke="${INK}" stroke-width="3"/>`}`;
  return { body, arm, shoulder, hand };
}

const part = (id, svg, extra = "") => `<g data-part="${id}"${extra}>${svg}</g>`;
const ground = (y) =>
  `<path d="M0,${y} C240,${y - 18} 720,${y - 18} 960,${y} L960,720 L0,720 Z" fill="#c9a86a" opacity="0.28"/>`;

// The parts of each scene: markup, and what each gesture moves. `enter` is
// the order parts come in on the scene's word.
function crown() {
  return `<g><path d="M-44,0 L-38,-40 L-20,-14 L0,-48 L20,-14 L38,-40 L44,0 Z" fill="#e8b96a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="-46" y="-4" width="92" height="16" rx="3" fill="#c99a3c" stroke="${INK}" stroke-width="4"/><path d="M-30,-24 L-26,-6" stroke="#fffaf0" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/></g>`;
}

const COUNCIL = [
  // The arc behind the king, then the front row.
  [90, 520, 160, false],
  [175, 470, 160, true],
  [260, 430, 160, false],
  [350, 410, 160, false],
  [610, 410, 160, true],
  [700, 430, 160, false],
  [785, 470, 160, false],
  [870, 520, 160, true],
  [150, 690, 190, false],
  [290, 690, 190, true],
  [670, 690, 190, false],
  [810, 690, 190, false],
];
const CLOTHS = ["#5d7a54", "#8b1e2b", "#c9a86a", "#3d4f7a", "#9a6a3a"];
const WRAPS = ["#e8b96a", "#c0581c", "#6cc3b5", "#e3876a"];
const KING_HEAD = [480, 382];

function conseilScene() {
  const members = COUNCIL.map(([x, y, h, woman], k) =>
    person({
      x,
      y,
      h,
      skin: SKINS[k % SKINS.length],
      cloth: CLOTHS[k % CLOTHS.length],
      wrap: woman ? WRAPS[k % WRAPS.length] : null,
      side: x < 480 ? 1 : -1,
    })
  );
  const memberPart = (m, k) =>
    part(
      `member-${k}`,
      m.body +
        part(
          `arm-${k}`,
          m.arm,
          ` data-origin="${n1(m.shoulder[0])},${n1(m.shoulder[1])}"`
        )
    );
  const king = [
    shadow(480, 612, 80),
    `<rect x="420" y="568" width="120" height="30" rx="6" fill="#7a4a24" stroke="${INK}" stroke-width="4"/>`,
    `<path d="M432,568 L528,568 L516,452 C506,430 454,430 444,452 Z" fill="#8b1e2b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M446,470 C440,500 438,530 440,560" fill="none" stroke="#fffaf0" stroke-opacity="0.25" stroke-width="8" stroke-linecap="round"/>`,
    `<path d="M444,470 L426,524 M516,470 L534,524" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M444,470 L426,524 M516,470 L534,524" stroke="#5a3a22" stroke-width="15" stroke-linecap="round"/>`,
    `<circle cx="${KING_HEAD[0]}" cy="${KING_HEAD[1] + 30}" r="30" fill="#5a3a22" stroke="${INK}" stroke-width="4"/>`,
    `<path d="M440,598 L440,612 M520,598 L520,612" stroke="${INK}" stroke-width="6"/>`,
  ].join("");
  return {
    markup: [
      ground(600),
      ...members.slice(0, 8).map((m, k) => memberPart(m, k)),
      part("king", king),
      ...members.slice(8).map((m, k) => memberPart(m, k + 8)),
      part(
        "crown",
        `<g transform="translate(${KING_HEAD[0]} ${KING_HEAD[1] + 2})">${crown()}</g>`
      ),
    ].join(""),
    enter: ["king", ...COUNCIL.map((_, k) => `member-${k}`)],
  };
}

const BUYER = { x: 250, y: 680, h: 440 };
const SELLER = { x: 710, y: 680, h: 440 };
function nzimbuScene() {
  const buyer = person({
    ...BUYER,
    skin: "#6b4529",
    cloth: "#c9a86a",
    wrap: "#e8b96a",
    side: 1,
  });
  const seller = person({
    ...SELLER,
    skin: "#4a2f1c",
    cloth: "#5d7a54",
    side: -1,
  });
  const basket = `<g><path d="M-60,-40 L60,-40 L48,40 L-48,40 Z" fill="#b8874a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M-54,-14 H54 M-50,12 H50" stroke="#8a6c3c" stroke-width="3"/><path d="M-60,-40 C-60,-92 60,-92 60,-40" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="-30" cy="-50" r="16" fill="#d9a64e" stroke="${INK}" stroke-width="3"/><circle cx="2" cy="-56" r="16" fill="#9fb84a" stroke="${INK}" stroke-width="3"/><circle cx="32" cy="-48" r="14" fill="#c0581c" stroke="${INK}" stroke-width="3"/></g>`;
  // A woven mat on the ground between them.
  const stall = `${shadow(480, 690, 120)}<path d="M380,690 L580,690 L560,648 L400,648 Z" fill="#d9c08a" stroke="${INK}" stroke-width="3"/><path d="M396,662 L566,662 M390,676 L572,676" stroke="#a8874f" stroke-width="3"/>`;
  return {
    markup: [
      ground(660),
      part("stall", stall),
      part(
        "buyer",
        buyer.body +
          part(
            "buyer-arm",
            buyer.arm,
            ` data-origin="${n1(buyer.shoulder[0])},${n1(buyer.shoulder[1])}"`
          )
      ),
      part(
        "seller",
        seller.body +
          part(
            "seller-arm",
            seller.arm,
            ` data-origin="${n1(seller.shoulder[0])},${n1(seller.shoulder[1])}"`
          )
      ),
      part(
        "basket",
        `<g transform="translate(${BASKET.from[0]} ${BASKET.from[1]})">${basket}</g>`
      ),
      part(
        "shells",
        nested(
          "nzimbu",
          "sc-nzimbu",
          SHELLS.from[0] - 45,
          SHELLS.from[1] - 52,
          90
        )
      ),
    ].join(""),
    enter: ["stall", "buyer", "seller", "basket", "shells"],
  };
}
// An arm reaches out by REACH degrees round its shoulder; the shells go
// from the buyer's reaching hand to the seller's, the basket from the
// seller's side to the buyer's.
const REACH = 60;
function reachedHand({ x, y, h }, side) {
  const [sx, sy] = [x + side * 0.14 * h, y - 0.66 * h];
  const [dx, dy] = [side * 0.06 * h, 0.3 * h];
  const a = (-side * REACH * Math.PI) / 180;
  return [
    n1(sx + dx * Math.cos(a) - dy * Math.sin(a)),
    n1(sy + dx * Math.sin(a) + dy * Math.cos(a)),
  ];
}
const SHELLS = { from: reachedHand(BUYER, 1), to: reachedHand(SELLER, -1) };
const BASKET = { from: [600, 640], to: [380, 620] };

const KING_B = { x: 400, y: 660, h: 400 };
const PRIEST = { x: 640, y: 660, h: 440 };
const VESSEL = [488, 271];
function baptemeScene() {
  const crowd = [
    [60, 560, 220],
    [140, 540, 240],
    [215, 590, 200],
    [790, 590, 200],
    [865, 540, 240],
    [930, 560, 220],
  ].map(
    ([x, y, h]) =>
      person({ x, y, h, skin: "#8a7f6c", cloth: "#8a7f6c", muted: true }).body
  );
  const king = person({
    ...KING_B,
    skin: "#5a3a22",
    cloth: "#8b1e2b",
    side: 1,
  });
  const priest = person({
    ...PRIEST,
    skin: "#e2c7a6",
    cloth: "#2a2421",
    side: -1,
  });
  // The priest's arm held out over the king's head, the vessel in hand.
  const priestArm = `<path d="M${n1(priest.shoulder[0])},${n1(priest.shoulder[1])} L${VESSEL[0]},${VESSEL[1]}" stroke="${INK}" stroke-width="40" stroke-linecap="round"/><path d="M${n1(priest.shoulder[0])},${n1(priest.shoulder[1])} L${VESSEL[0]},${VESSEL[1]}" stroke="#2a2421" stroke-width="33" stroke-linecap="round"/>`;
  const vessel = `<path d="M-30,-14 C-28,12 28,12 30,-14 Z" fill="#cfc4b2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle cx="18" cy="-4" r="10" fill="#e2c7a6" stroke="${INK}" stroke-width="3"/>`;
  const drop = (k) =>
    part(
      `drop-${k}`,
      `<path d="M0,-20 C-11,0 -13,13 0,16 C13,13 11,0 0,-20 Z" fill="#8fd8f2" stroke="#3f6f8f" stroke-width="3"/>`,
      ` opacity="0"`
    );
  const cross = `<path d="M520,40 V170 M478,80 H562" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M520,40 V170 M478,80 H562" stroke="#c99a3c" stroke-width="11" stroke-linecap="round"/>`;
  return {
    markup: [
      ground(650),
      part("crowd", crowd.join(""), ` opacity="0.55"`),
      part(
        "king",
        king.body +
          king.arm +
          `<g transform="translate(${KING_B.x} ${n1(KING_B.y - 0.92 * KING_B.h)}) scale(0.9)">${crown()}</g>`
      ),
      part("priest", priest.body + priestArm),
      part(
        "vessel",
        `<g transform="translate(${VESSEL[0]} ${VESSEL[1]})">${vessel}</g>`,
        ` data-origin="${VESSEL[0]},${VESSEL[1]}"`
      ),
      [0, 1, 2].map(drop).join(""),
      part("cross", cross),
    ].join(""),
    enter: ["crowd", "king", "priest", "vessel"],
  };
}
// The drops fall from the vessel's lip to the king's head.
const DROPS = { from: [470, 284], to: [420, 318] };

// Two quadratic lanes across the sea, one each way.
const LANES = {
  out: [
    [380, 290],
    [560, 330],
    [600, 470],
  ],
  back: [
    [600, 600],
    [440, 560],
    [360, 400],
  ],
};
const bezier = ([a, b, c], t) => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
];
function echangesScene() {
  const building = `${shadow(160, 282, 110)}<rect x="60" y="130" width="200" height="150" rx="10" fill="#e9e1d1" stroke="${INK}" stroke-width="4"/><path d="M60,130 L160,80 L260,130 Z" fill="#c0281c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="140" y="210" width="40" height="70" fill="#3a2a17"/><path d="M84,150 V260" stroke="#fffaf0" stroke-opacity="0.45" stroke-width="8"/><path d="M160,80 V30 L190,42 L160,54" fill="#c0281c" stroke="${INK}" stroke-width="3"/>`;
  const house = `${shadow(800, 662, 120)}<path d="M700,660 L700,550 C700,490 900,490 900,550 L900,660 Z" fill="#c9a86a" stroke="${INK}" stroke-width="4"/><path d="M680,560 L800,470 L920,560" fill="none" stroke="#7a4a24" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><rect x="780" y="590" width="40" height="70" fill="#3a2a17"/>`;
  const lane = ([a, b, c]) =>
    `<path d="M${a} Q${b} ${c}" fill="none" stroke="#3f6f8f" stroke-width="6" stroke-dasharray="3 16" stroke-linecap="round"/>`;
  const sea = `<path d="M0,700 C200,680 760,680 960,700" stroke="#8fd8f2" stroke-width="5" fill="none"/>`;
  // Each ship carries what goes its way: books and a priest to the Kongo,
  // ivory and cloth to Portugal. Drawn round (0, 0), under its keel.
  const shipA = `${nested("caravelle", "sc-shipA", -110, -170, 220)}${nested("livre", "sc-livreA", -116, -96, 80)}${person({ x: -44, y: -35, h: 72, skin: "#e2c7a6", cloth: "#2a2421" }).body}`;
  const shipB = `<g transform="scale(-1 1)">${nested("caravelle", "sc-shipB", -110, -170, 220)}</g>${nested("ivoire", "sc-ivoireB", 20, -136, 84)}${nested("tissu", "sc-tissuB", 14, -100, 84)}`;
  return {
    markup: [
      sea,
      part("lanes", lane(LANES.out) + lane(LANES.back)),
      part("portugal", building),
      part("kongo", house),
      part(
        "ship-out",
        `<g transform="translate(${LANES.out[0]})">${shipA}</g>`
      ),
      part(
        "ship-back",
        `<g transform="translate(${LANES.back[0]})">${shipB}</g>`
      ),
    ].join(""),
    enter: ["portugal", "kongo", "lanes", "ship-out", "ship-back"],
  };
}

const SCENES = {
  conseil: conseilScene,
  nzimbu: nzimbuScene,
  bapteme: baptemeScene,
  echanges: echangesScene,
};
const ALWAYS_HIDDEN = new Set(["crown", "cross", "drop-0", "drop-1", "drop-2"]);

/** The scene's SVG, 960 × 720, each moving part a `data-part` group. */
export function sceneMarkup(kind) {
  const { markup } = SCENES[kind]();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCENE.box.w} ${SCENE.box.h}" width="${SCENE.box.w}" height="${SCENE.box.h}" stroke-linejoin="round">${markup}</svg>`;
}

// Checked when the cards load: a scene is a parchment card's whole content,
// with its gestures named; its head writes a date in figures or a studied
// word, nothing else.
const FIGURES_ONLY = /^[\d\s\p{Pd}/.,]+$/u;
export function checkSceneCard(card, studied) {
  const scene = card.scene;
  if (scene === undefined) return;
  const what = `Card ${card.id}`;
  if (card.ground !== "parchment")
    fail(
      `${what}: une scène illustrée se joue sur le parchemin (ground: "parchment")`
    );
  if (!Object.hasOwn(SCENE_KINDS, scene.kind))
    fail(
      `${what}: pas de scène « ${scene.kind} » (${Object.keys(SCENE_KINDS).join(", ")})`
    );
  if (typeof scene.say !== "string" || !scene.say)
    fail(`${what}: la scène entre sur un mot (say)`);
  const beats = Object.keys(scene.beats ?? {}).sort();
  if (beats.join() !== [...SCENE_KINDS[scene.kind]].sort().join())
    fail(
      `${what}: la scène ${scene.kind} nomme le mot de chaque geste (${SCENE_KINDS[scene.kind].join(", ")})`
    );
  for (const k of [
    "week",
    "formula",
    "drawings",
    "quote",
    "words",
    "attribution",
  ])
    if (card[k] !== undefined)
      fail(`${what}: une scène occupe toute la carte, sans ${k}`);
  if (card.dateLabel !== undefined)
    fail(`${what}: une scène n'écrit qu'une date ou un mot étudié (dateLabel)`);
  if (card.date !== undefined) {
    const text = String(card.date).trim();
    const allowed =
      FIGURES_ONLY.test(text) ||
      (studied ?? []).some(
        (w) =>
          w.normalize("NFC").toLocaleLowerCase("fr") ===
          text.normalize("NFC").toLocaleLowerCase("fr")
      );
    if (!allowed)
      fail(
        `${what}: une scène porte une date en chiffres ou un mot étudié, pas « ${card.date} »`
      );
  }
}

// How long each gesture takes, from its word.
const GESTURE = {
  hands: SCENE.hands + 11 * SCENE.handsApart,
  crown: SCENE.crown,
  give: SCENE.reach + SCENE.pass,
  receive: SCENE.pass,
  cross: SCENE.enter,
  water: SCENE.tilt + 2 * SCENE.dropApart + SCENE.drop,
  ships: SCENE.ships,
};

/**
 * After the schedule: the frame of the scene's entry and of each gesture;
 * every gesture ends while its card is still on screen (`end`).
 */
export function planScene(card, said, end = Infinity) {
  const scene = card.scene;
  const enter = said(scene.say);
  const beats = Object.fromEntries(
    Object.entries(scene.beats).map(([name, word]) => {
      const frame = said(word);
      if (frame < enter)
        fail(
          `Card ${card.id}: le geste ${name} (« ${word} ») vient avant l'entrée de la scène (« ${scene.say} »)`
        );
      if (frame + GESTURE[name] > end)
        fail(
          `Card ${card.id}: le geste ${name} (« ${word} ») n'a pas le temps de finir avant la fin de la carte (${frame + GESTURE[name] - end} images de trop)`
        );
      return [name, frame];
    })
  );
  return { kind: scene.kind, enter, beats, parts: SCENES[scene.kind]().enter };
}

const entering = (plan, frame, k) => {
  const p = ramp(frame - plan.enter - k * SCENE.apart, SCENE.enter, EASE.enter);
  return { opacity: p, x: 0, y: SCENE.rise * (1 - p), rotate: 0 };
};
const still = (opacity = 1) => ({ opacity, x: 0, y: 0, rotate: 0 });

/** Each part's state on `frame`: opacity, offset and rotation round its origin. */
export function sceneAt(plan, frame) {
  const parts = {};
  plan.parts.forEach((id, k) => (parts[id] = entering(plan, frame, k)));
  const at = (beat) => frame - plan.beats[beat];
  if (plan.kind === "conseil") {
    COUNCIL.forEach(([x], k) => {
      const p = ramp(at("hands") - k * SCENE.handsApart, SCENE.hands);
      parts[`arm-${k}`] = { ...still(), rotate: (x < 480 ? -1 : 1) * 150 * p };
    });
    const c = ramp(at("crown"), SCENE.crown);
    parts.crown = {
      opacity: ramp(at("crown"), 6, EASE.enter),
      x: 0,
      y: -260 * (1 - c),
      rotate: 0,
    };
  }
  if (plan.kind === "nzimbu") {
    const reach = ramp(at("give"), SCENE.reach);
    parts["buyer-arm"] = { ...still(), rotate: -REACH * reach };
    parts["seller-arm"] = { ...still(), rotate: REACH * reach };
    const give = ramp(at("give") - SCENE.reach, SCENE.pass);
    parts.shells = {
      ...parts.shells,
      x: (SHELLS.to[0] - SHELLS.from[0]) * give,
      y: parts.shells.y + (SHELLS.to[1] - SHELLS.from[1]) * give,
    };
    const take = ramp(at("receive"), SCENE.pass);
    // The basket is lifted on its way across, an arc, not a slide.
    parts.basket = {
      ...parts.basket,
      x: (BASKET.to[0] - BASKET.from[0]) * take,
      y:
        parts.basket.y +
        (BASKET.to[1] - BASKET.from[1]) * take -
        80 * Math.sin(Math.PI * take),
    };
  }
  if (plan.kind === "bapteme") {
    const cross = ramp(at("cross"), SCENE.enter, EASE.enter);
    parts.cross = {
      opacity: cross,
      x: 0,
      y: SCENE.rise * (1 - cross),
      rotate: 0,
    };
    parts.vessel = {
      ...parts.vessel,
      rotate: -28 * ramp(at("water"), SCENE.tilt),
    };
    for (let k = 0; k < 3; k++) {
      const s = at("water") - SCENE.tilt - k * SCENE.dropApart;
      const t = clamp01(s / SCENE.drop);
      const fall = EASE.enter(t);
      parts[`drop-${k}`] = {
        // In over its first 60 ms, out over its last 100 ms: gone on the head.
        opacity: s < 0 || t >= 1 ? 0 : Math.min(1, s / 2, (SCENE.drop - s) / 3),
        x: DROPS.from[0] + (DROPS.to[0] - DROPS.from[0]) * fall,
        y: DROPS.from[1] + (DROPS.to[1] - DROPS.from[1]) * fall,
        rotate: 0,
      };
    }
  }
  if (plan.kind === "echanges") {
    const t = ramp(at("ships"), SCENE.ships);
    for (const [id, lane] of [
      ["ship-out", LANES.out],
      ["ship-back", LANES.back],
    ]) {
      const [x, y] = bezier(lane, t);
      parts[id] = {
        ...parts[id],
        x: x - lane[0][0],
        y: parts[id].y + y - lane[0][1],
      };
    }
  }
  for (const id of ALWAYS_HIDDEN) parts[id] ??= still(0);
  // No negative zero in the states: a part at rest reads 0.
  for (const p of Object.values(parts))
    for (const k of ["x", "y", "rotate"]) p[k] += 0;
  return parts;
}
