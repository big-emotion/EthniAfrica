// @req REQ-084
import { describe, expect, it } from "vitest";

import { ghCliPort } from "../../propositions/ghCliPort";
import { fakeRunner } from "./fakes";

// @req REQ-084

describe("ghCliPort", () => {
  // @req REQ-084
  it("passes hostile text as a single argument element, never through a shell", () => {
    const hostile = '"; rm -rf / ; echo $(whoami) `id`';
    const { run, calls } = fakeRunner();
    const port = ghCliPort(run, "owner/props");

    port.commentOnIssue(7, hostile);
    port.addLabel(7, "pr-open");
    port.openPullRequest({
      head: "proposal/x",
      base: "recette",
      title: hostile,
      body: hostile,
    });

    expect(calls.every((c) => c.file === "gh")).toBe(true);
    expect(calls[0].args).toContain(`--body=${hostile}`);
    expect(calls[0].args).toContain("--repo=owner/props");
    expect(calls[1].args).toContain("--add-label=pr-open");
    const pr = calls[2].args;
    expect(pr).toContain(`--title=${hostile}`);
    expect(pr).not.toContain("--repo=owner/props");
  });

  // @req REQ-084

  it("reads issues, comments and open PR branches from gh json", () => {
    const { run } = fakeRunner([
      {
        match: (c) => c.args[0] === "issue" && c.args[1] === "list",
        result: {
          stdout: JSON.stringify([
            {
              number: 3,
              title: "Ewe",
              body: "b",
              labels: [{ name: "proposition" }],
            },
          ]),
        },
      },
      {
        match: (c) => c.args[0] === "issue" && c.args[1] === "view",
        result: { stdout: JSON.stringify({ comments: [{ body: "c1" }] }) },
      },
      {
        match: (c) => c.args[0] === "pr" && c.args[1] === "list",
        result: { stdout: JSON.stringify([{ headRefName: "proposal/ewe" }]) },
      },
    ]);
    const port = ghCliPort(run, "owner/props");
    expect(port.listOpenIssues()).toEqual([
      { number: 3, title: "Ewe", body: "b", labels: ["proposition"] },
    ]);
    expect(port.listComments(3)).toEqual(["c1"]);
    expect(port.listOpenPullBranches()).toEqual(["proposal/ewe"]);
  });

  // @req REQ-084

  it("throws with the command's error when gh fails", () => {
    const { run } = fakeRunner([
      { match: () => true, result: { status: 1, stderr: "boom" } },
    ]);
    expect(() => ghCliPort(run, "o/p").listOpenIssues()).toThrow(/boom/);
  });
});
