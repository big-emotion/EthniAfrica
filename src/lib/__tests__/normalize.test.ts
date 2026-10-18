/**
 * The comparison fold (REQ-135, ETNI-2093): one key for what the reader types
 * and for every stored form, the same key `afrik_name_key` gives in the
 * database (migration 109). The fold only compares; nothing folded is shown.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { normalizeString } from "@/lib/normalize";

/**
 * The letters NFD does not split that the fold maps, capitals alike. ɖ and ɨ
 * are here because `extensions.unaccent` already folds them in the database:
 * without them the two layers would disagree on Biɖawijeːt and Bɨfɨɨ.
 */
const LETTER_TABLE: Record<string, string> = {
  ɓ: "b",
  Ɓ: "b",
  ɗ: "d",
  Ɗ: "d",
  ɛ: "e",
  Ɛ: "e",
  ɔ: "o",
  Ɔ: "o",
  ŋ: "n",
  Ŋ: "n",
  ʋ: "v",
  Ʋ: "v",
  ƴ: "y",
  Ƴ: "y",
  ɖ: "d",
  Ɖ: "d",
  ɨ: "i",
  Ɨ: "i",
  ʿ: "",
  ʾ: "",
};

/** Letters the fold keeps on purpose, in both layers: they name a sound. */
const KEPT = new Set(["ǀ", "ǁ", "ǂ", "ǃ", "ɣ", "Ɣ", "ː"]);

const AFRIK = join(process.cwd(), "dataset/source/afrik");

function jsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith(".json") ? [full] : [];
  });
}

function historyNameTexts(): string[] {
  return jsonFiles(AFRIK).flatMap((file) => {
    const fiche = JSON.parse(readFileSync(file, "utf8")) as {
      nameHistory?: { names?: Array<{ nameText?: unknown }> };
    };
    const names = fiche?.nameHistory?.names;
    return Array.isArray(names)
      ? names
          .map((name) => name?.nameText)
          .filter((text): text is string => typeof text === "string")
      : [];
  });
}

describe("normalizeString — the comparison fold", () => {
  // @req REQ-135
  it.each([
    ["Fulɓe", "fulbe"],
    ["FULƁE", "fulbe"],
    ["Thuɔŋjäŋ", "thuonjan"],
    ["Al-ʿarabiyya al-fuṣḥā", "al-arabiyya al-fusha"],
    ["Biɖawijeːt", "bidawijeːt"],
    ["ǂHoan", "ǂhoan"],
    ["Tamaziɣt", "tamaziɣt"],
  ])("folds « %s » to %j", (form, key) => {
    expect(normalizeString(form)).toBe(key);
  });

  // @req REQ-135
  it("maps each letter of the table, and drops ʿ and ʾ", () => {
    for (const [letter, folded] of Object.entries(LETTER_TABLE)) {
      expect({ letter, key: normalizeString(`a${letter}a`) }).toEqual({
        letter,
        key: `a${folded}a`,
      });
    }
  });

  // @req REQ-135
  it("gives a form typed without its letters the key of the written form", () => {
    expect(normalizeString("Fulbe")).toBe(normalizeString("Fulɓe"));
    expect(normalizeString("Weemeebo")).toBe(normalizeString("Wɛɛmɛɛbo"));
    expect(normalizeString("Thuonjan")).toBe(normalizeString("Thuɔŋjäŋ"));
    expect(normalizeString("Al-arabiyya al-fusha")).toBe(
      normalizeString("Al-ʿarabiyya al-fuṣḥā")
    );
  });

  // @req REQ-135
  it("still folds accents and case, and keeps apostrophes", () => {
    expect(normalizeString("Côte d'Ivoire")).toBe("cote d'ivoire");
    expect(normalizeString("Khoïsan")).toBe("khoisan");
    expect(normalizeString(undefined)).toBe("");
    expect(normalizeString(null)).toBe("");
  });

  // @req REQ-135
  it("leaves no letter of a corpus history name outside the table or the kept list", () => {
    const names = historyNameTexts();
    const unknown = new Map<string, string>();
    for (const text of names) {
      const bare = text.normalize("NFD").replace(/\p{M}/gu, "");
      for (const character of bare) {
        if (/[\u0000-\u007f]/.test(character)) continue;
        if (character in LETTER_TABLE || KEPT.has(character)) continue;
        unknown.set(character, text);
      }
    }

    expect(names.length).toBeGreaterThan(2000);
    expect(Object.fromEntries(unknown)).toEqual({});
  });

  // @req REQ-135
  it("leaves, after folding, only the kept letters outside ASCII on corpus history names", () => {
    const left = new Set<string>();
    for (const text of historyNameTexts()) {
      for (const character of normalizeString(text)) {
        if (!/[\u0000-\u007f]/.test(character)) left.add(character);
      }
    }

    expect([...left].filter((character) => !KEPT.has(character))).toEqual([]);
  });
});
