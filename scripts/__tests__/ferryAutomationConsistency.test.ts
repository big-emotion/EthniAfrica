import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Ferry couples three hand-maintained files that no gate compared: the router
// matches a dispatched `to_status` against `trigger_column` case-insensitively,
// and a status spelled differently in the Jira setup doc is a *silent* no-op
// ("dispatch maps to no agent", exit green). The doc drifted to "In Development"
// and "Ready to Merge" while the board says READY FOR DEV and TO MERGE.

const readRepoFile = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

const normaliseStatus = (status: string): string => status.trim().toLowerCase();

const triggerColumns = (): Set<string> =>
  new Set(
    [
      ...readRepoFile("ferry.config.yaml").matchAll(
        /trigger_column:\s*(.+)$/gm
      ),
    ].map((match) => normaliseStatus(match[1]))
  );

const statusesInSetupDoc = (): Set<string> =>
  new Set(
    readRepoFile("ferry-jira-automation-setup.md")
      .split("\n")
      .filter((line) => line.includes("To status:"))
      .flatMap((line) => [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]))
      .map(normaliseStatus)
  );

interface BetaRuleExport {
  rules: { trigger: { value: { toStatus: { value: string }[] } } }[];
}

const statusesInBetaRules = (): Set<string> => {
  const exported = JSON.parse(
    readRepoFile("ferry-jira-automation-rules.beta.json")
  ) as BetaRuleExport;
  return new Set(
    exported.rules.flatMap((rule) =>
      rule.trigger.value.toStatus.map((status) => normaliseStatus(status.value))
    )
  );
};

const ferryWorkflows = (): { name: string; source: string }[] =>
  readdirSync(resolve(process.cwd(), ".github/workflows"))
    .filter((name) => /^ferry-.*\.ya?ml$/.test(name))
    .map((name) => ({
      name,
      source: readRepoFile(`.github/workflows/${name}`),
    }));

describe("Ferry automation consistency", () => {
  // @req REQ-085
  it("names in the Jira setup doc exactly the statuses ferry.config.yaml triggers on", () => {
    expect([...statusesInSetupDoc()].sort()).toEqual(
      [...triggerColumns()].sort()
    );
  });

  // @req REQ-085
  it("only triggers the beta rule export on statuses ferry.config.yaml maps to an agent", () => {
    const columns = triggerColumns();
    const unmapped = [...statusesInBetaRules()].filter(
      (status) => !columns.has(status)
    );
    expect(unmapped).toEqual([]);
  });

  // @req REQ-085
  it("declares the same Ferry version string as the pinned action tag", () => {
    const workflows = ferryWorkflows();
    const pinnedTags = new Set(
      workflows.flatMap(({ source }) =>
        [
          ...source.matchAll(
            /uses:\s*big-emotion\/ferry\/\S+@[0-9a-f]{40}\s*#\s*(v\d+\.\d+\.\d+)/g
          ),
        ].map((match) => match[1])
      )
    );
    expect(pinnedTags.size).toBe(1);
    const [pinnedTag] = [...pinnedTags];

    const declaredVersions = workflows.flatMap(({ name, source }) =>
      [
        ...source.matchAll(
          /^\s*(?:ferry_version|FERRY_REF):\s*(v\d+\.\d+\.\d+)/gm
        ),
      ].map((match) => ({ workflow: name, version: match[1] }))
    );
    expect(declaredVersions.length).toBeGreaterThan(0);
    expect(
      declaredVersions.filter(({ version }) => version !== pinnedTag)
    ).toEqual([]);
  });
});
