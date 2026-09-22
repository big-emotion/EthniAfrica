import { describe, expect, it } from "vitest";

import { violatesReaderRegister } from "@/lib/editorial/readerRegister";
import {
  rewriteAtlasSelfReference,
  rewriteAtlasSelfReferenceInRecord,
} from "../rewriteAtlasSelfReference";

/**
 * The corpus's own sentences, as they stand on 2026-09-22. The three most
 * frequent cover 1 686 of the 2 272 reader-facing fields that called the
 * project "the atlas".
 */
describe("rewriteAtlasSelfReference", () => {
  // @req REQ-143
  it("gives the three repeated silences a first-person subject", () => {
    expect(
      rewriteAtlasSelfReference(
        "L'atlas ne documente pas encore ce point pour ce nom : aucune source dédiée n'a été consultée à ce jour."
      )
    ).toBe(
      "Nous ne documentons pas encore ce point pour ce nom : aucune source dédiée n'a été consultée à ce jour."
    );
    expect(
      rewriteAtlasSelfReference(
        "Ce nom figure au relevé de couverture de l'atlas : il a été retenu comme nom à documenter, mais aucune source dédiée n'a encore été consultée."
      )
    ).toBe(
      "Ce nom figure à notre relevé de couverture : il a été retenu comme nom à documenter, mais aucune source dédiée n'a encore été consultée."
    );
    expect(
      rewriteAtlasSelfReference(
        "Le nom de clan ne détermine pas à lui seul le mode de transmission : l'atlas ne le documente pas encore pour ce nom."
      )
    ).toBe(
      "Le nom de clan ne détermine pas à lui seul le mode de transmission : nous ne le documentons pas encore pour ce nom."
    );
  });

  // @req REQ-143
  it("rewrites the English counterpart the same way", () => {
    expect(
      rewriteAtlasSelfReference(
        "The atlas does not yet document this point for this name: no dedicated source has been consulted to date."
      )
    ).toBe(
      "We do not yet document this point for this name: no dedicated source has been consulted to date."
    );
  });

  // @req REQ-143
  it("leaves real titles and the Atlas mountains alone", () => {
    for (const text of [
      "UNESCO, Atlas des langues en danger dans le monde",
      "Les Amazighs du Haut-Atlas",
    ]) {
      expect(rewriteAtlasSelfReference(text)).toBe(text);
    }
  });

  // @req REQ-143
  it("produces sentences the reader-facing register accepts", () => {
    const rewritten = rewriteAtlasSelfReference(
      "Les recherches n'ont établi aucune paire documentée dont les deux noms figurent dans l'atlas."
    );
    expect(violatesReaderRegister(rewritten)).toBe(false);
  });
});

describe("rewriteAtlasSelfReferenceInRecord", () => {
  // @req REQ-143
  it("edits the file as text, keeping its layout", () => {
    const raw =
      '{\n    "gaps": [\n        { "fieldPath": "origin", "reason": "L\'atlas ne documente pas encore ce point pour ce nom." }\n    ]\n}\n';
    expect(rewriteAtlasSelfReferenceInRecord(raw)).toBe(
      '{\n    "gaps": [\n        { "fieldPath": "origin", "reason": "Nous ne documentons pas encore ce point pour ce nom." }\n    ]\n}\n'
    );
  });

  // @req REQ-143
  it("returns an untouched record unchanged", () => {
    const raw = '{ "name": "Bété" }\n';
    expect(rewriteAtlasSelfReferenceInRecord(raw)).toBe(raw);
  });
});
