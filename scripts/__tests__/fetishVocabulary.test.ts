import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const CORPUS = resolve(process.cwd(), "dataset/source/afrik");
const FETISH = /f[ée]tich/i;
const SKIPPED_KEYS = new Set([
  "title",
  "notes",
  "url",
  "source",
  "sources",
  "_meta",
]);

/**
 * « Fétiche » is a missionary and colonial word. The guide keeps it in one
 * place only: as a gloss of a term of the people's own language, which the
 * same field names. A fiche that uses it to describe a people from outside
 * says « objet rituel », « talisman », « officiant » instead.
 *
 * Each fiche allowed to keep the word is paired with the local term its field
 * must carry. A new use elsewhere fails here, and the decision is made then.
 */
const ALLOWED: Record<string, RegExp> = {
  "famille_linguistique/FLG_CREOLE.json": /zumbi/i,
  "patronymes/PAT_DIARRA.json": /j[àa]ra/i,
  "peuples/FLG_BANTU/PPL_KONGO.json": /zumbi/i,
  "peuples/FLG_BANTU/PPL_TEKE.json": /bilongo|nkisi/i,
  "peuples/FLG_KWA/PPL_AGNI.json": /komian/i,
  "peuples/FLG_KWA/PPL_ANYI.json": /komian/i,
  "peuples/FLG_KWA/PPL_FANTE.json": /komfo/i,
  "peuples/FLG_NIGERCONGO/PPL_KABYE.json": /tchodjo/i,
  "peuples/FLG_NIGERCONGO/PPL_SOLONGO.json": /kisi/i,
  "peuples/FLG_NIGERCONGO/PPL_TABWA.json": /bapule/i,
  "peuples/FLG_NIGERCONGO/PPL_TEKE_NORD.json": /nkisi/i,
  "peuples/FLG_NIGERCONGO/PPL_VILI.json": /nkisi/i,
};

function corpusFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    if (entry === "archive" || entry === "logs") return [];
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return corpusFiles(path);
    return path.endsWith(".json") ? [path] : [];
  });
}

function fieldsUsingTheWord(node: unknown, found: string[] = []): string[] {
  if (typeof node === "string") {
    if (FETISH.test(node)) found.push(node);
  } else if (Array.isArray(node)) {
    node.forEach((item) => fieldsUsingTheWord(item, found));
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (!SKIPPED_KEYS.has(key)) fieldsUsingTheWord(value, found);
    }
  }
  return found;
}

const usage = corpusFiles(CORPUS).flatMap((file) => {
  const relative = file.slice(CORPUS.length + 1);
  const fields = fieldsUsingTheWord(JSON.parse(readFileSync(file, "utf8")));
  return fields.length ? [{ relative, fields }] : [];
});

describe("the word « fétiche » in the fiches", () => {
  // @req REQ-143
  it("appears only in the fiches that gloss a local term with it", () => {
    const outside = usage
      .map((entry) => entry.relative)
      .filter((relative) => !(relative in ALLOWED));
    expect(outside).toEqual([]);
  });

  // @req REQ-143
  it("always stands in a field that names the local term it glosses", () => {
    const orphans: string[] = [];
    for (const { relative, fields } of usage) {
      const marker = ALLOWED[relative];
      if (!marker) continue;
      for (const field of fields) {
        if (!marker.test(field))
          orphans.push(`${relative}: ${field.slice(0, 80)}`);
      }
    }
    expect(orphans).toEqual([]);
  });

  // @req REQ-143
  it("is not used as an adjective for a people's materials (« fétichistes »)", () => {
    const text = JSON.stringify(usage);
    expect(text).not.toMatch(/f[ée]tichiste/i);
  });
});
