import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";

const repo = new URL("../../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, repo), "utf8");
const AGENTS = [
  "ethniafrica-production",
  "ethniafrica-video-planner",
  "ethniafrica-video-executor",
];
const HANDOFFS = ".claude/skills/ethniafrica-production/references/handoffs.md";

// @req REQ-187
test("both agent runtimes define the same three roles and point at one handoff table", () => {
  const table = read(HANDOFFS);
  for (const name of AGENTS) {
    const claude = read(`.claude/agents/${name}.md`);
    const codex = read(`.codex/agents/${name}.toml`);
    assert.ok(claude.includes(HANDOFFS), `${name}: Claude definition`);
    assert.ok(codex.includes(HANDOFFS), `${name}: Codex definition`);
    assert.ok(
      table.includes(`(\`${name}\`)`),
      `${name} missing from the table`
    );
  }
  assert.ok(existsSync(new URL(HANDOFFS, repo)));
});

// @req REQ-187
test("the production skill links the handoff table, so the parity gate can see it", () => {
  assert.match(
    read(".claude/skills/ethniafrica-production/SKILL.md"),
    /references\/handoffs\.md/
  );
});
