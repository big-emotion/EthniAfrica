import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const text = (
  JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_GUR/PPL_FRAFRA.json"
      ),
      "utf8"
    )
  ).content.appellations.originOfExonyms as string
).normalize("NFC");

describe("the origin of the name Frafra", () => {
  // @req REQ-178
  it("gives the explanation as an explanation, with the page that holds it, not as the established origin", () => {
    expect(text).not.toMatch(/est un terme colonial, corruption/);
    expect(text).toContain("101 Last Tribes");
    expect(text).toMatch(/auraient entendue/);
  });

  // @req REQ-178
  it("keeps the two actors its source separates: missionaries in one account, the British in a variant", () => {
    expect(text).not.toContain("missionnaires chrétiens et administrateurs");
    expect(text).toContain("Britanniques");
    expect(text).toContain("missionnaires chrétiens");
  });

  // @req REQ-178
  it("keeps the other version and the self-name it already gave", () => {
    expect(text).toContain("furra furra");
    expect(text).toContain("Farefare");
  });
});
