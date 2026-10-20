import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { checkSingleNameAppellations } from "../validateAfrikData";

const CORPUS_ROOT = resolve(process.cwd(), "dataset/source/afrik");

describe("checkSingleNameAppellations", () => {
  let root: string;

  function writePeople(appellations: Record<string, unknown>) {
    const fullPath = join(root, "peuples/FLG_TEST/PPL_TEST.json");
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(
      fullPath,
      JSON.stringify({
        id: "PPL_TEST",
        content: { appellations },
      })
    );
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "afrik-packed-names-"));
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // @req REQ-178
  it("accepts the current corpus appellation fields", () => {
    expect(checkSingleNameAppellations(CORPUS_ROOT)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  // @req REQ-178
  it("reports fiche, field, array index, and rejected value", () => {
    writePeople({
      selfAppellation: "Wolof / Peul",
      exonyms: ["Wolof, Peul"],
      spellingAliases: ["Wolof / Ouolof"],
    });

    const { ok, errors } = checkSingleNameAppellations(root);

    expect(ok).toBe(false);
    expect(errors).toHaveLength(3);
    expect(errors[0]).toContain("PPL_TEST");
    expect(errors[0]).toContain("content.appellations.selfAppellation");
    expect(errors[0]).toContain("Wolof / Peul");
    expect(errors[1]).toContain("content.appellations.exonyms[0]");
    expect(errors[1]).toContain("Wolof, Peul");
    expect(errors[2]).toContain("content.appellations.spellingAliases[0]");
    expect(errors[2]).toContain("Wolof / Ouolof");
  });

  // @req REQ-178
  it("allows a single trailing gloss on exonyms and spelling aliases", () => {
    writePeople({
      selfAppellation: "Wolof",
      exonyms: ["Dyaranke (terme ancien)"],
      spellingAliases: ["Mankagne (graphie signalée dans la source)"],
    });

    expect(checkSingleNameAppellations(root).ok).toBe(true);
  });
});
