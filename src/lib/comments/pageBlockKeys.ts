import { buildBlockKey, type BlockSection } from "@/lib/comments/blockKey";

/** `GET /api/v2/comments` refuses more; see `MAX_BLOCK_KEYS` in its handler. */
const MAX_KEYS = 30;

/**
 * The sections a subject's passages are filed under on the result page. The
 * names, the appellations and the timeline all write `naming`: they show the
 * same data, the subject's names, so one thread follows them wherever they
 * are drawn, as the fiche's `naming` chapter will (ARCH-032).
 */
const SUBJECT_SECTIONS: readonly BlockSection[] = [
  "what",
  "origin",
  "naming",
  "where",
  "sources",
];

/**
 * Every block key a result page may draw a footer on, so the page reads its
 * comments in one request. The verdict key comes first: on an unknown name
 * it is the only block, and the cap must never drop it.
 */
// @req REQ-212
export function pageBlockKeys(
  subjects: ReadonlyArray<{ type: string; id: string }>,
  queryId: string
): string[] {
  const keys = [
    buildBlockKey({ subject: "search-query", id: queryId, section: "verdict" }),
    ...subjects.flatMap((subject) =>
      SUBJECT_SECTIONS.map((section) =>
        buildBlockKey({ subject: subject.type, id: subject.id, section })
      )
    ),
  ].filter((key): key is string => key !== null);
  return [...new Set(keys)].slice(0, MAX_KEYS);
}
