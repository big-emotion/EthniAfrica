import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CORPUS_AGGREGATE_REVALIDATE_SECONDS,
  PUBLIC_FLAGS_REVALIDATE_SECONDS,
} from "@/api/v2/services/corpusCache";
import { CORPUS_CACHE_CONTROL } from "@/api/v2/utils/corpusRoute";

/**
 * How long a response may be served stale is a promise to the reader, and it
 * used to be made separately in every route and page that cached anything.
 *
 * `export const revalidate` cannot import its value: Next reads segment config
 * statically at build time and requires a literal. So those literals stay, and
 * this suite is what ties each one to the named window it must agree with.
 */

const APP_DIR = join(process.cwd(), "src", "app");
const TEST_PATH = /(^|\/)__tests__\/|\.(test|spec)\.tsx?$/;
const REVALIDATE_LITERAL = /^export const revalidate = (\d+);$/m;

function appSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) appSources(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out.filter((file) => !TEST_PATH.test(relative(APP_DIR, file)));
}

describe("cache freshness", () => {
  // @req REQ-084
  it("serves corpus responses and recomputes corpus aggregates on the same hour", () => {
    expect(CORPUS_CACHE_CONTROL).toBe(
      `s-maxage=${CORPUS_AGGREGATE_REVALIDATE_SECONDS}`
    );
  });

  // @req REQ-110
  it("holds every page-level revalidate literal to its named window", () => {
    const windows = appSources(APP_DIR).flatMap((file) => {
      const match = readFileSync(file, "utf8").match(REVALIDATE_LITERAL);
      const seconds = match ? Number(match[1]) : 0;
      return seconds > 0 ? [{ file: relative(APP_DIR, file), seconds }] : [];
    });

    expect(windows.length).toBeGreaterThan(0);
    for (const { file, seconds } of windows) {
      const expected = file.startsWith(join("[lang]", "signalements"))
        ? PUBLIC_FLAGS_REVALIDATE_SECONDS
        : CORPUS_AGGREGATE_REVALIDATE_SECONDS;
      expect({ file, seconds }).toEqual({ file, seconds: expected });
    }
  });

  // @req REQ-084
  it("states no Cache-Control lifetime as a literal inside a route", () => {
    const literals = appSources(APP_DIR).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          // JSDoc and @swagger blocks describe the header; only code sets it.
          !/^\s*(\*|\/\/)/.test(line) && /["'`][^"'`]*max-?age=/.test(line)
            ? [`${relative(APP_DIR, file)}:${index + 1}`]
            : []
        )
    );

    expect(literals).toEqual([]);
  });
});
