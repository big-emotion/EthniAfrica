// @req REQ-084
import { describe, expect, it } from "vitest";

import { isRipe, type IssueSnapshot } from "../../propositions/ripeness";

const comment = (sources: string) =>
  `<!-- proposal v1 kind=new-name consent=false -->\nDetails: d\nSources: ${sources}`;

const issue = (overrides: Partial<IssueSnapshot> = {}): IssueSnapshot => ({
  number: 7,
  title: "ewe",
  state: "open",
  labels: ["proposition", "kind:new-name"],
  comments: [comment("https://example.org/a")],
  ...overrides,
});

// @req REQ-084

describe("isRipe", () => {
  // @req REQ-084
  it("accepts an open, unprocessed issue with a sourced proposal", () => {
    expect(isRipe(issue(), [])).toBe(true);
  });

  // @req REQ-084

  it.each([
    ["closed", { state: "closed" as const }],
    ["not labelled proposition", { labels: ["kind:new-name"] }],
    ["already has a PR", { labels: ["proposition", "pr-open"] }],
    ["already processed", { labels: ["proposition", "processed"] }],
    ["without any comment", { comments: [] }],
    ["with a proposal that cites nothing", { comments: [comment("")] }],
  ])("rejects an issue that is %s", (_label, overrides) => {
    expect(isRipe(issue(overrides), [])).toBe(false);
  });

  // @req REQ-084

  it("rejects a name whose branch already has an open PR", () => {
    expect(isRipe(issue(), ["proposal/ewe"])).toBe(false);
    expect(isRipe(issue(), ["proposal/other"])).toBe(true);
  });
});
