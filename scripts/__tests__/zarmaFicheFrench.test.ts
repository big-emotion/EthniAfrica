import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readZarma() {
  return JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_SONGHAY/PPL_ZARMA.json"
      ),
      "utf8"
    )
  );
}

// Source titles and notes quote the works as they are printed, so they are
// left out: only the fiche's own prose is held to French spelling.
function proseOutsideSources(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      proseOutsideSources(item, `${path}[${index}]`)
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      key === "sources" ? [] : proseOutsideSources(item, `${path}.${key}`)
    );
  }
  return [];
}

// Words the fiche printed without their accents. Each one is a real French
// word only once accented, so a match is always a spelling fault.
const UNACCENTED =
  /\b(regions?|majorite|Benin|siecles?|voltaique|heritage|Heritage|conquerants|eleveurs|paturages|rivalites?|deuxieme|apres|cotieres|malekite|meridional|Tillabery|Etats?|francaise|Francais|designation|derive|periode|ceremonies|independance|Independance|presidents|nigeriens?|nigerian|nigerianne|Societe|systeme|memoire|foret|Maitres|pretre|ecole|Conquete|Revolte|decrivant|etaient)\b/;

describe("PPL_ZARMA — the fiche reads in French", () => {
  // @req REQ-178
  it("prints its own prose with its accents", () => {
    const faults = proseOutsideSources(readZarma())
      .filter(([, text]) => UNACCENTED.test(text))
      .map(([path, text]) => `${path}: ${text.match(UNACCENTED)?.[0]}`);

    expect(faults).toEqual([]);
  });

  // Dosso is in Niger: « nigerian » is the adjective for Nigeria. The
  // unsourced sultanate paragraph that carried the slip left with premium
  // batch 08; the adjective must not come back.
  // @req REQ-178
  it("never calls Niger « nigerian »", () => {
    const prose = proseOutsideSources(readZarma())
      .map(([, text]) => text)
      .join("\n");

    expect(prose).not.toMatch(/nigerian/i);
  });

  // « ca. » cuts the lead sentence of a tile preview short (« fonde ca. »).
  // The founding date of Dosso it once carried had no source and was
  // removed with premium batch 08 rather than kept as an invented date.
  // @req REQ-178
  it("writes approximate dates in words rather than with « ca. »", () => {
    const prose = proseOutsideSources(readZarma())
      .map(([, text]) => text)
      .join("\n");

    expect(prose).not.toMatch(/\b[Cc]a\. ?\d/);
    expect(prose).not.toContain("fondé vers 1750");
  });

  // The sources read do not say what Zarma means; the line must not borrow
  // the sense of Zarmaganda, a name built on Zarma, as if it explained it.
  // @req REQ-178
  it("gives the self-name a short line that does not explain it by itself", () => {
    const [selfName] = readZarma().nameHistory.names;

    expect(selfName.nameText).toBe("Zarma");
    expect(selfName.shortLine).not.toMatch(/veut dire|Zarmaganda/);
    expect(selfName.shortLine).toMatch(/dans sa langue/);
  });
});
