import { describe, expect, it } from "vitest";

import { findDisclosures, parseDisclosureTerms } from "../lib/infraDisclosure";

// The fixture terms are invented on purpose. The real ones live in a GitHub
// Actions variable, because listing them in this public repository would
// publish exactly what the gate exists to keep out.
const TERMS = parseDisclosureTerms(
  "Acme-Cloud, 203.0.113.77\n2222\n\n  Springfield "
);

describe("parseDisclosureTerms", () => {
  // @req REQ-032
  it("reads a comma or newline separated list and drops blanks", () => {
    expect(TERMS).toEqual([
      "Acme-Cloud",
      "203.0.113.77",
      "2222",
      "Springfield",
    ]);
  });

  // @req REQ-032
  it("configures nothing from an unset variable", () => {
    expect(parseDisclosureTerms(undefined)).toEqual([]);
  });
});

describe("findDisclosures", () => {
  // @req REQ-032
  it("reports each configured term with its line, whatever its case", () => {
    const text = [
      "intro",
      "Deploys to the acme-cloud host",
      "ssh -p 2222 deploy@203.0.113.77",
    ].join("\n");

    expect(findDisclosures(text, TERMS)).toEqual([
      { line: 2, term: "Acme-Cloud" },
      { line: 3, term: "203.0.113.77" },
      { line: 3, term: "2222" },
    ]);
  });

  // @req REQ-032
  it("ignores a term buried inside a longer token such as a hash or a number", () => {
    const text = "sha512-xAcme-Cloudz, port 12222, host 203.0.113.770";

    expect(findDisclosures(text, TERMS)).toEqual([]);
  });

  // @req REQ-032
  it("reports nothing when no term is configured", () => {
    expect(findDisclosures("Deploys to the acme-cloud host", [])).toEqual([]);
  });
});
