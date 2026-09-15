import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CORPUS_SOURCE_DIR,
  DOCTRINE_SOURCES,
  FORMAT_RULE_CALLERS,
  FORMAT_RULE_HEADING,
  FORMAT_RULE_NETWORKS,
  FORMAT_RULE_REFERENCE,
  FORMAT_RULE_SOURCE,
  HELPER_SKILL,
  MESSAGE_SKILL,
  MYTH_CALLERS,
  MYTH_SKILL,
  PIPELINE_STATE_TOOL,
  RENDER_SKILL,
  checkSocialChainContract,
} from "../lib/socialChainContract";

const projectRoot = resolve(import.meta.dirname, "../..");

const messageSkill = (body: string) =>
  `---\nname: ${MESSAGE_SKILL}\n---\n${body}`;

describe("social chain contract", () => {
  // @req REQ-032
  it("reports no issue on the repository's own skills", () => {
    expect(checkSocialChainContract(projectRoot)).toEqual([]);
  });

  // @req REQ-032
  it("names the message gate, the render step and the helper", () => {
    expect(MESSAGE_SKILL).toBe("ethniafrica-message");
    expect(RENDER_SKILL).toBe("ethniafrica-produire");
    expect(HELPER_SKILL).toBe("ethniafrica-reseaux-help");
    expect(DOCTRINE_SOURCES).toEqual([
      "docs/editorial/purpose-doctrine.md",
      "src/lib/i18n/copy/about.ts",
      "docs/design/gabarits-social/GABARITS-SOCIAL.md",
    ]);
  });

  // @req REQ-032
  it("flags a message audit that stops reading one of the doctrine sources", () => {
    // A grid written from memory drifts from the doctrine the site publishes;
    // that is how « Berlin a tracé » reached five networks.
    const issues = checkSocialChainContract(projectRoot, {
      [MESSAGE_SKILL]: messageSkill(
        `Reads ${DOCTRINE_SOURCES[0]} and ${DOCTRINE_SOURCES[2]}.`
      ),
    });

    expect(issues).toContainEqual({
      skill: MESSAGE_SKILL,
      detail: `does not read the doctrine from ${DOCTRINE_SOURCES[1]}`,
    });
  });

  // @req REQ-032
  it("flags a render step that no longer gates on the message audit", () => {
    // The render step is where the operator launches production. A gate that
    // lives only in the message skill is a gate nobody passes through.
    const issues = checkSocialChainContract(projectRoot, {
      [RENDER_SKILL]: `---\nname: ${RENDER_SKILL}\n---\nRenders, always, in proof when the four gates fail.`,
    });

    expect(issues).toContainEqual({
      skill: RENDER_SKILL,
      detail: `does not gate the render on ${MESSAGE_SKILL}`,
    });
  });

  // @req REQ-032
  it("flags a helper that answers « où j'en suis » without the pipeline state", () => {
    const issues = checkSocialChainContract(projectRoot, {
      [HELPER_SKILL]: `---\nname: ${HELPER_SKILL}\n---\nTells the operator where things stand.`,
    });

    expect(issues).toContainEqual({
      skill: HELPER_SKILL,
      detail: `does not read the pipeline state from ${PIPELINE_STATE_TOOL}`,
    });
  });

  // @req REQ-032
  it("names the myth check and every production step that calls it", () => {
    expect(MYTH_SKILL).toBe("ethniafrica-mythe");
    expect(MYTH_CALLERS).toEqual([
      "ethniafrica-idee",
      "ethniafrica-structure",
      "ethniafrica-produire",
    ]);
  });

  // @req REQ-032
  it("flags a production step that no longer calls the myth check", () => {
    // The check is only worth something if the chain passes through it: a
    // subject whose correction was never sourced reaches the render otherwise.
    const [idee] = MYTH_CALLERS;
    const issues = checkSocialChainContract(projectRoot, {
      [idee]: `---\nname: ${idee}\n---\nWrites a subject report.`,
    });

    expect(issues).toContainEqual({
      skill: idee,
      detail: `does not call ${MYTH_SKILL}`,
    });
  });

  // @req REQ-032
  it("flags a myth check that stops opening the fiche it corrects from", () => {
    // A correction checked against memory is how a myth gets replaced by
    // another one — the Côte d'Ivoire draft credited Bouët-Willaumez with a name
    // Portuguese navigators used four centuries before him.
    const issues = checkSocialChainContract(projectRoot, {
      [MYTH_SKILL]: `---\nname: ${MYTH_SKILL}\n---\nChecks myths.`,
    });

    expect(issues).toContainEqual({
      skill: MYTH_SKILL,
      detail: `does not source the correction from ${CORPUS_SOURCE_DIR}`,
    });
  });

  // @req REQ-032
  it("flags a skill whose frontmatter name drifts from its directory", () => {
    const issues = checkSocialChainContract(projectRoot, {
      [MESSAGE_SKILL]: `---\nname: renamed-by-accident\n---\n${DOCTRINE_SOURCES.join(" ")}`,
    });

    expect(issues).toContainEqual({
      skill: MESSAGE_SKILL,
      detail: `frontmatter name is "renamed-by-accident", expected ${JSON.stringify(MESSAGE_SKILL)}`,
    });
  });

  // @req REQ-032
  it("flags a skill whose SKILL.md has gone missing", () => {
    const issues = checkSocialChainContract(resolve(projectRoot, "docs"));

    expect(issues).toContainEqual({
      skill: MESSAGE_SKILL,
      detail: "SKILL.md is missing",
    });
    expect(issues).toContainEqual({
      skill: HELPER_SKILL,
      detail: "SKILL.md is missing",
    });
  });

  // @req REQ-032
  it("flags a template spec that loses the per-network format table", () => {
    // Decided 2026-09-16 on the 2026-09-15 measurement: each network receives
    // the format that works there. Without the table, a production step falls
    // back to one cut sent everywhere — the carousels that drew 9 to 14 views
    // on Facebook.
    const issues = checkSocialChainContract(projectRoot, {
      [FORMAT_RULE_SOURCE]: "# Gabarits\n\n## 1. Formats\n",
    });

    expect(issues).toContainEqual({
      skill: FORMAT_RULE_SOURCE,
      detail: `does not carry the section ${FORMAT_RULE_HEADING}`,
    });
  });

  // @req REQ-032
  it("flags a format table that leaves a network without a format", () => {
    expect(FORMAT_RULE_NETWORKS).toEqual([
      "TikTok",
      "Instagram",
      "Facebook",
      "YouTube",
      "LinkedIn",
    ]);
    const withoutLinkedIn = FORMAT_RULE_NETWORKS.filter(
      (network) => network !== "LinkedIn"
    ).join(" · ");
    const issues = checkSocialChainContract(projectRoot, {
      [FORMAT_RULE_SOURCE]: `${FORMAT_RULE_HEADING}\n\n${withoutLinkedIn}\n\n## 2. Couleurs\n\nLinkedIn`,
    });

    expect(issues).toContainEqual({
      skill: FORMAT_RULE_SOURCE,
      detail: "does not assign a format to LinkedIn",
    });
  });

  // @req REQ-032
  it("flags a production step that no longer follows the format table", () => {
    const [firstCaller] = FORMAT_RULE_CALLERS;
    const issues = checkSocialChainContract(projectRoot, {
      [firstCaller]: `---\nname: ${firstCaller}\n---\nCalls ethniafrica-mythe, picks a format by taste.`,
    });

    expect(issues).toContainEqual({
      skill: firstCaller,
      detail: `does not follow ${FORMAT_RULE_REFERENCE} of GABARITS-SOCIAL.md`,
    });
  });
});
