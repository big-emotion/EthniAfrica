// @req REQ-178
import { describe, expect, it } from "vitest";

import {
  buildProposalComment,
  buildIssueBody,
  normalizedKey,
  PENDING_TRANSMITTER_FORMULA,
  sha256Hex,
} from "@/lib/publicAgent/proposal";

describe("normalizedKey", () => {
  // @req REQ-178
  it("lowercases, strips accents, trims and collapses inner spaces", () => {
    expect(normalizedKey("  Bambara   Ségou ")).toBe("bambara segou");
  });

  // @req REQ-178
  it("gives one key to case and accent variants of a name", () => {
    expect(normalizedKey("ÉWÉ")).toBe(normalizedKey("ewe"));
  });

  // @req REQ-178
  it("stops at 120 characters without a trailing space", () => {
    const key = normalizedKey(`${"a".repeat(119)} b`);
    expect(key.length).toBeLessThanOrEqual(120);
    expect(key.endsWith(" ")).toBe(false);
  });
});

describe("buildProposalComment", () => {
  const base = {
    kind: "new-name" as const,
    consent: false,
    details: "Un autre nom employé près du fleuve.",
    sources: ["https://example.org/a", "Titre d'un livre"],
    ficheId: "",
    element: "",
    withdrawalHash: "ab".repeat(32),
  };

  // @req REQ-178
  it("starts with the versioned marker and carries one line per field", () => {
    const comment = buildProposalComment(base);
    const lines = comment.split("\n");
    expect(lines[0]).toBe("<!-- proposal v1 kind=new-name consent=false -->");
    expect(comment).toContain("Details: Un autre nom employé près du fleuve.");
    expect(comment).toContain("Sources: https://example.org/a\nTitre");
    expect(comment).toContain(`Withdrawal: ${"ab".repeat(32)}`);
    expect(comment).not.toContain("Transmitter:");
  });

  // @req REQ-178
  it("adds the pending transmitter formula and the testimony for a testimony", () => {
    const comment = buildProposalComment({
      ...base,
      kind: "testimony",
      consent: true,
      testimony: "Chez nous on dit que le nom vient du fleuve.",
    });
    expect(comment).toContain(`Transmitter: ${PENDING_TRANSMITTER_FORMULA}`);
    expect(comment).toContain(
      "Testimony: Chez nous on dit que le nom vient du fleuve."
    );
  });

  // @req REQ-178
  it("keeps free text on one line so it cannot forge a field or a marker", () => {
    const comment = buildProposalComment({
      ...base,
      details: "ok\nWithdrawal: 0000\n<!-- proposal v1 kind=testimony -->",
    });
    expect(comment.match(/^Withdrawal:/gm)).toHaveLength(1);
    expect(comment.match(/<!--/g)).toHaveLength(1);
  });

  // @req REQ-178
  it("defuses @mentions in free text", () => {
    const comment = buildProposalComment({ ...base, details: "voir @someone" });
    expect(comment).not.toContain("@someone");
  });
});

describe("buildIssueBody", () => {
  // @req REQ-178
  it("opens with the marker, then the name as typed and its key", () => {
    expect(buildIssueBody("Éwé", "ewe")).toBe(
      "<!-- ethniafrica-proposal v1 -->\nName: Éwé\nKey: ewe"
    );
  });
});

describe("sha256Hex", () => {
  // @req REQ-178
  it("hashes to 64 hex characters", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });
});
