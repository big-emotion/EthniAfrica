// @req REQ-084
import { describe, expect, it } from "vitest";

import { listRipe } from "../../propositions/listRipe";
import { fakeGithub } from "./fakes";

const proposal = (src: string) =>
  `<!-- proposal v1 kind=new-name consent=false -->\nDetails: d\nSources: ${src}`;

const issue = (number: number, title: string, labels = ["proposition"]) => ({
  number,
  title,
  body: "",
  labels,
});

// @req REQ-084

describe("listRipe", () => {
  // @req REQ-084
  it("returns ripe issues with parsed proposals, capped by the limit", () => {
    const { port } = fakeGithub(
      [issue(1, "Ewe"), issue(2, "Fon"), issue(3, "Akan")],
      {
        1: [proposal("https://a.org")],
        2: [proposal("https://b.org")],
        3: [proposal("https://c.org")],
      }
    );
    const ripe = listRipe(port, { limit: 2 });
    expect(ripe.map((r) => r.number)).toEqual([1, 2]);
    expect(ripe[0]).toMatchObject({
      key: "ewe",
      slug: "ewe",
      proposals: [{ kind: "new-name", sources: ["https://a.org"] }],
    });
  });

  // @req REQ-084

  it("skips unsourced issues, processed ones and names with an open PR", () => {
    const { port } = fakeGithub(
      [
        issue(1, "Ewe"),
        issue(2, "Fon", ["proposition", "processed"]),
        issue(3, "Akan"),
        issue(4, "Wolof"),
      ],
      {
        1: [proposal("https://a.org")],
        2: [proposal("https://b.org")],
        3: [proposal("")],
        4: [proposal("https://d.org")],
      },
      ["proposal/wolof"]
    );
    expect(listRipe(port, { limit: 10 }).map((r) => r.number)).toEqual([1]);
  });
});
