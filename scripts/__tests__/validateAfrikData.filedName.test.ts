import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { checkPeopleFiledNameLanguage } from "../validateAfrikData";

const CORPUS_ROOT = resolve(process.cwd(), "dataset/source/afrik");

const SELF_NAME = {
  nameText: "Fulɓe",
  selfGiven: true,
  usedIn: ["ful"],
  accounts: [],
};

function formUsedIn(nameText: string, usedIn: string[]) {
  return { nameText, selfGiven: false, usedIn, accounts: [] };
}

describe("checkPeopleFiledNameLanguage", () => {
  let root: string;

  function writePeople(nameMain: string, names: unknown[]) {
    const fullPath = join(root, "peuples/FLG_ATLANTIQUE/PPL_TEST.json");
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(
      fullPath,
      JSON.stringify({ id: "PPL_TEST", nameMain, nameHistory: { names } })
    );
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "afrik-filed-name-"));
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // The French atlas files a people under the name a French reader knows.
  // Every label that reads nameMain — the result-page title, the fiche link,
  // the breadcrumb, the country lists — then prints that name, so an
  // English-literature form filed in its place is shown on every surface.
  // @req REQ-178
  it("passes on the corpus in git", () => {
    expect(checkPeopleFiledNameLanguage(CORPUS_ROOT)).toEqual({
      ok: true,
      errors: [],
      warnings: [],
    });
  });

  // @req REQ-178
  it("rejects a fiche filed under an English form while it records a French one", () => {
    writePeople("Fula (Fulbe / Peul)", [
      SELF_NAME,
      formUsedIn("Peul", ["fra"]),
      formUsedIn("Fula", ["eng", "man", "por"]),
    ]);

    const { ok, errors } = checkPeopleFiledNameLanguage(root);

    expect(ok).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("PPL_TEST");
    expect(errors[0]).toContain("Fula");
    expect(errors[0]).toContain("Peul");
  });

  // @req REQ-178
  it("accepts the same fiche filed under its French form", () => {
    writePeople("Peul", [
      SELF_NAME,
      formUsedIn("Peul", ["fra"]),
      formUsedIn("Fula", ["eng", "man", "por"]),
    ]);

    expect(checkPeopleFiledNameLanguage(root).ok).toBe(true);
  });

  // No French form recorded means there is nothing better to file it under.
  // @req REQ-178
  it("accepts a fiche whose only recorded forms are English", () => {
    writePeople("Arbore", [formUsedIn("Arbore", ["eng"])]);

    expect(checkPeopleFiledNameLanguage(root).ok).toBe(true);
  });

  // @req REQ-178
  it("accepts a fiche filed under the name the people gives itself", () => {
    writePeople("Fulɓe", [
      SELF_NAME,
      formUsedIn("Peul", ["fra"]),
      formUsedIn("Fula", ["eng"]),
    ]);

    expect(checkPeopleFiledNameLanguage(root).ok).toBe(true);
  });
});
