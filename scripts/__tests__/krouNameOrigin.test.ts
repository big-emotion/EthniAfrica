import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const text = (
  JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_KROU/PPL_KROU_MACRO.json"
      ),
      "utf8"
    )
  ).content.appellations.originOfExonyms as string
).normalize("NFC");

describe("the origin of the name Krou", () => {
  // @req REQ-178
  it("names who holds the derivation from Klao instead of ranking it « la plus solide » with no one to rank", () => {
    expect(text).not.toMatch(/hypothèse la plus solide/);
    expect(text).toContain("Britannica de 1911");
  });

  // @req REQ-178
  it("keeps the derivation hedged, as its source does", () => {
    expect(text).toMatch(/dérive probablement/);
  });
});
