import { describe, expect, it } from "vitest";

import {
  SHAPE_GUARDED_PATHS,
  findDisclosures,
  findIdentifierShapes,
  parseDisclosureTerms,
} from "../lib/infraDisclosure";

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

// Terms only catch the values somebody thought to list. A file whose whole
// purpose is to describe the infrastructure is held to a stricter rule: no
// shape that addresses or locates a machine at all — which also holds on a fork
// or a Dependabot run, where the repository variable is absent.
describe("findIdentifierShapes", () => {
  // @req REQ-032
  it("reports an address, a five-digit port, a provider server name, a link and an e-mail", () => {
    const text = [
      "The application host answers on 198.51.100.4",
      "ssh -p 54321 deploy@host",
      "the machine vps-ab12cd34 runs the proxy",
      "see https://example.test/runbook",
      "write to ops@example.test",
    ].join("\n");

    expect(findIdentifierShapes(text)).toEqual([
      { line: 1, shape: "an IPv4 address" },
      { line: 2, shape: "a non-standard port number" },
      { line: 3, shape: "a provider-assigned server name" },
      { line: 4, shape: "a link" },
      { line: 5, shape: "an e-mail address" },
    ]);
  });

  // @req REQ-032
  it("leaves well-known ports, versions and prose alone", () => {
    const text = [
      "Traefik terminates TLS on 443 and Postgres listens on 5432",
      "Next.js 16 with @sentry/nextjs 10.53.1",
      "The Supabase host keeps its address in the operator's private notes",
    ].join("\n");

    expect(findIdentifierShapes(text)).toEqual([]);
  });

  // @req REQ-032
  it("names the infrastructure skill as a shape-guarded path", () => {
    expect(SHAPE_GUARDED_PATHS).toContain(
      ".claude/skills/ethniafrica-infra/SKILL.md"
    );
  });
});
