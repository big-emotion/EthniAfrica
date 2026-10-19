/**
 * Where a long fiche chapter folds (brief 10 §2, REQ-153 as amended on
 * 2026-10-17).
 *
 * A chapter is long from three tiles: the operator's threshold of 2026-10-17.
 * It counts tiles rather than pixels on purpose: a height cannot be tested in
 * happy-dom, which lays nothing out, and a count gives the same answer on a
 * phone and on a desktop.
 */
const LONG_CHAPTER_TILES = 3;

export interface ChapterFold<T> {
  /** What stays in view: the first tile of a long chapter, else every tile. */
  shown: T[];
  /** What the one control hides, in reading order. Empty: no control. */
  folded: T[];
}

// @req REQ-153
export function foldAfterFirst<T>(items: readonly T[]): ChapterFold<T> {
  return items.length >= LONG_CHAPTER_TILES
    ? { shown: items.slice(0, 1), folded: items.slice(1) }
    : { shown: [...items], folded: [] };
}
