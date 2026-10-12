// Where the source picture sits on the 1080×1920 reel. Two gabarits, both
// measured on published reels:
// - band: the interview reels (Sankara, Mitchell, Mangope). A wide source in a
//   608 px band at y 336, credit and caption under it, boxes above it.
// - portrait: the « sauvage » reel (10 October 2026). A tall source nearly full
//   height, credit and a larger watermark under it, text over the picture.
export const WIDTH = 1080;
export const HEIGHT = 1920;

const LAYOUTS = {
  band: { name: "band", box: { x: 0, y: 336, w: 1080, h: 608 } },
  portrait: { name: "portrait", box: { x: 96, y: 96, w: 888, h: 1578 } },
};

export const layoutFor = (width, height) =>
  height > width ? LAYOUTS.portrait : LAYOUTS.band;

// H.264 in 4:2:0 needs even picture sizes.
const even = (v) => 2 * Math.round(v / 2);

export function sourceRect(layout, width, height) {
  const { box } = layout;
  const scale = Math.min(box.w / width, box.h / height);
  const w = even(width * scale);
  const h = even(height * scale);
  return {
    x: box.x + Math.round((box.w - w) / 2),
    y: box.y + Math.round((box.h - h) / 2),
    w,
    h,
  };
}

// Overlay positions are written as fractions of the source frame, so they
// survive any change of layout or source resolution.
export const toReelPoint = (rect, fx, fy) => ({
  x: Math.round(rect.x + fx * rect.w),
  y: Math.round(rect.y + fy * rect.h),
});
