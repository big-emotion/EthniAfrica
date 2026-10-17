import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readTraoreSocialStatus(): string {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "dataset/source/afrik/patronymes/PAT_TRAORE.json"),
      "utf8"
    )
  ).casteOrSocialFunction.value;
}

describe("PAT_TRAORE — the status the name carries", () => {
  // The paragraph is the first one a reader of the name meets. Opening on a
  // rebuttal (« Statut variable…, et non absence de statut ») answers an
  // objection the reader never made; the variation is the finding, so it
  // comes first.
  // @req REQ-178
  it("says in its first sentence that the status changes from one region to another", () => {
    const status = readTraoreSocialStatus();
    const [firstSentence] = status.split(/(?<=\.)\s/);

    expect(status).not.toMatch(/^Statut variable/);
    expect(firstSentence).toContain("Traoré");
    expect(firstSentence).toMatch(/d'une région à l'autre/);
  });

  // @req REQ-178
  it("keeps the three dictionary readings and the groups they belong to", () => {
    const status = readTraoreSocialStatus();

    expect(status).toContain("hɔrɔn");
    expect(status).toMatch(/tontigi chez les Bamana et les Maninka/);
    expect(status).toMatch(
      /nùmu \(forgeron\) chez les Kagoro et les Wassoulounké/
    );
  });
});
