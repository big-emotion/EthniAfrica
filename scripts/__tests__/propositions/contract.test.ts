// @req REQ-084
import { describe, expect, it } from "vitest";

import {
  PROPOSAL_LIMITS,
  TESTIMONY_TRANSMITTER_FORMULA,
  branchSlug,
  normalizeKey,
  parseProposals,
} from "../../propositions/contract";

const proposalComment = (header: string, ...fields: string[]) =>
  `<!-- proposal v1 ${header} -->\n${fields.join("\n")}`;

// @req REQ-084

describe("normalizeKey", () => {
  // @req REQ-084
  it("lowercases, strips accents, collapses whitespace and caps at 120 chars", () => {
    expect(normalizeKey("  Éwé   DU  Togo ")).toBe("ewe du togo");
    expect(normalizeKey("a".repeat(300))).toHaveLength(120);
  });
});

// @req REQ-084

describe("branchSlug", () => {
  // @req REQ-084
  it("only ever yields characters safe in a git branch name", () => {
    expect(branchSlug("ewe du togo")).toBe("ewe-du-togo");
    expect(branchSlug("x; rm -rf / $(id) `id` ../..")).toMatch(
      /^[a-z0-9]+(-[a-z0-9]+)*$/
    );
    expect(branchSlug("!!!")).toBe("nom");
  });
});

// @req REQ-084

describe("parseProposals", () => {
  // @req REQ-084
  it("reads a new-name proposal with its sources, one per line", () => {
    const [proposal] = parseProposals([
      proposalComment(
        "kind=new-name consent=false",
        "Details: Autre nom du peuple.",
        "Sources: https://example.org/a",
        "https://example.org/b",
        "Fiche: PPL_EWE",
        "Element: ",
        "Withdrawal: abc"
      ),
    ]);
    expect(proposal).toMatchObject({
      kind: "new-name",
      consent: false,
      details: "Autre nom du peuple.",
      sources: ["https://example.org/a", "https://example.org/b"],
      ficheId: "PPL_EWE",
    });
  });

  // @req REQ-084

  it("ignores comments that do not start with the proposal marker", () => {
    expect(
      parseProposals([
        "merci !\n<!-- proposal v1 kind=new-name consent=false -->\nSources: https://x.org",
        "Sources: https://x.org",
      ])
    ).toEqual([]);
  });

  // @req REQ-084

  it("refuses a testimony without consent and never trusts the typed transmitter", () => {
    const noConsent = proposalComment(
      "kind=testimony consent=false",
      "Details: d",
      "Sources: https://x.org",
      "Transmitter: ma grand-mere Awa",
      "Testimony: t"
    );
    const consented = noConsent.replace("consent=false", "consent=true");
    expect(parseProposals([noConsent])).toEqual([]);
    const [proposal] = parseProposals([consented]);
    expect(proposal.transmitter).toBe(TESTIMONY_TRANSMITTER_FORMULA);
    expect(proposal.testimony).toBe("t");
  });

  // @req REQ-084

  it("drops oversize fields and keeps at most five in-limit sources", () => {
    const tooLong = "d".repeat(PROPOSAL_LIMITS.details + 1);
    expect(
      parseProposals([
        proposalComment("kind=correction consent=false", `Details: ${tooLong}`),
      ])
    ).toEqual([]);

    const sources = [
      ...Array.from({ length: 7 }, (_, i) => `https://x.org/${i}`),
      "https://x.org/" + "l".repeat(PROPOSAL_LIMITS.sourceLength),
    ];
    const [proposal] = parseProposals([
      proposalComment(
        "kind=correction consent=false",
        "Details: ok",
        `Sources: ${sources.join("\n")}`
      ),
    ]);
    expect(proposal.sources).toHaveLength(PROPOSAL_LIMITS.sourceCount);
    expect(proposal.sources.every((s) => s.length <= 300)).toBe(true);
  });
});
