import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const fiche = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "dataset/source/afrik/pays/UGA.json"),
    "utf8"
  )
);
const origin = `${fiche.etymology} ${fiche.nameOriginActor}`.normalize("NFC");
const history = fiche.content.historicalNames;
const sourceTitles: string[] = fiche.content.sources.map(
  (s: { title: string }) => s.title
);

describe("the origin of the name Ouganda", () => {
  // @req REQ-178
  it("gives Uganda as the Swahili form of Buganda, not an English form", () => {
    expect(origin).not.toMatch(/forme anglaise/);
    expect(origin).toMatch(/swahili/);
    expect(origin).toContain("Buganda");
  });

  // @req REQ-178
  it("does not date the name to independence: the protectorate already bore it", () => {
    expect(origin).not.toMatch(/officialisé lors de l'indépendance/);
    expect(history.contemporary).not.toMatch(/proclamation de la République/);
    expect(history.contemporary).toContain("sous le nom d'Uganda");
  });

  // @req REQ-178
  it("says the meaning of ganda is not known rather than inventing one", () => {
    expect(origin).toMatch(/ganda/);
    expect(origin).toMatch(/pas de sens connu|origine .* incertaine/);
  });

  // @req REQ-178
  it("cites the documents the explanation rests on", () => {
    expect(sourceTitles).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Uganda Independence Act 1962"),
        expect.stringContaining(
          "Journal of the Discovery of the Source of the Nile"
        ),
      ])
    );
  });
});
