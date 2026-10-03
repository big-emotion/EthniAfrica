import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DISCOVERY_PROVERB_IDS } from "@/lib/discoveries/entries";

import { findProverb, PROVERBS } from "../proverbs";
import { PROVERB_IMAGES } from "../proverbImages";

const entries = Object.entries(PROVERB_IMAGES);

describe("proverb photographs", () => {
  // @req REQ-157
  it("dresses only proverbs the bank holds", () => {
    expect(entries.filter(([id]) => !findProverb(id))).toEqual([]);
  });

  // A photo without a reachable file, a file page or a visible credit would
  // publish a picture nobody can trace.
  // @req REQ-157
  it("ships each photograph with its file, its file page, both alts and a credit that names its licence", () => {
    for (const [id, picture] of entries) {
      expect(existsSync(join(process.cwd(), "public", picture.src)), id).toBe(
        true
      );
      expect(picture.filePage, id).toMatch(/^https:\/\//);
      expect(picture.alt.fr.trim(), id).not.toBe("");
      expect(picture.alt.en.trim(), id).not.toBe("");
      expect(picture.credit, id).toMatch(/public domain|CC0|CC BY/i);
      if (picture.licence.startsWith("cc-by")) {
        expect(picture.licenceUrl, id).toMatch(/^https:\/\//);
      }
    }
  });

  // A proverb added to the bank without a photograph would silently fall back
  // to a typographic card on a dossier where every other one is dressed.
  // @req REQ-157
  it("gives every proverb in the bank a photograph", () => {
    expect(
      PROVERBS.filter(({ id }) => !PROVERB_IMAGES[id]).map(({ id }) => id)
    ).toEqual([]);
  });

  // @req REQ-157
  it("gives every proverb the Découvertes reader carries a photograph", () => {
    expect(DISCOVERY_PROVERB_IDS.filter((id) => !PROVERB_IMAGES[id])).toEqual(
      []
    );
  });
});
