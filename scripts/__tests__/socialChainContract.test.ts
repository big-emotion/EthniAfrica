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
  REEL_TEMPLATE_CALLERS,
  REEL_TEMPLATE_CHECKER,
  REEL_TEMPLATE_REFERENCE,
  RENDER_SKILL,
  TITLE_RULE_CALLERS,
  TITLE_RULE_HEADING,
  TITLE_RULE_PHRASE,
  TITLE_RULE_REFERENCE,
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
  it("names the reel narration template, its checker and the steps that run it", () => {
    expect(REEL_TEMPLATE_CHECKER).toBe(
      "social/tools/narration/check-gabarit.mjs"
    );
    expect(REEL_TEMPLATE_REFERENCE).toBe(
      ".claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md"
    );
    expect(REEL_TEMPLATE_CALLERS).toEqual([
      "ethniafrica-structure",
      "ethniafrica-produire",
      "ethniafrica-message",
    ]);
  });

  // @req REQ-032
  it("flags a message audit that no longer requires the reel template", () => {
    // The message gate decides whether `produire` may turn a reel green. Read
    // with the old grid, a reel that follows the template scores 0 on criterion 1
    // (a patronyme has no line in the table) and only ever renders as a proof.
    const issues = checkSocialChainContract(projectRoot, {
      [MESSAGE_SKILL]: messageSkill(DOCTRINE_SOURCES.join(" ")),
    });

    expect(issues).toContainEqual({
      skill: MESSAGE_SKILL,
      detail: `does not run ${REEL_TEMPLATE_CHECKER}`,
    });
  });

  // @req REQ-032
  it("flags a step that stops running the reel template checker", () => {
    // A template nobody checks is a suggestion: the operator asked for reels
    // that carry the same structure every time, so both the step that writes
    // the narration and the step that renders it have to run the checker.
    const [structure] = REEL_TEMPLATE_CALLERS;
    const issues = checkSocialChainContract(projectRoot, {
      [structure]: `---\nname: ${structure}\n---\nWrites a narration. Calls ${MYTH_SKILL}. Follows ${FORMAT_RULE_REFERENCE} and ${TITLE_RULE_REFERENCE}.`,
    });

    expect(issues).toContainEqual({
      skill: structure,
      detail: `does not run ${REEL_TEMPLATE_CHECKER}`,
    });
  });

  // @req REQ-032
  it("flags a structure step that no longer points at the template it writes from", () => {
    const [structure] = REEL_TEMPLATE_CALLERS;
    const issues = checkSocialChainContract(projectRoot, {
      [structure]: `---\nname: ${structure}\n---\nRuns ${REEL_TEMPLATE_CHECKER}. Calls ${MYTH_SKILL}. Follows ${FORMAT_RULE_REFERENCE} and ${TITLE_RULE_REFERENCE}.`,
    });

    expect(issues).toContainEqual({
      skill: structure,
      detail: `does not point at ${REEL_TEMPLATE_REFERENCE}`,
    });
  });

  // @req REQ-032
  it("flags a project where the template reference or its checker is missing", () => {
    const issues = checkSocialChainContract(resolve(projectRoot, "docs"));

    expect(issues).toContainEqual({
      skill: REEL_TEMPLATE_REFERENCE,
      detail: "is missing",
    });
    expect(issues).toContainEqual({
      skill: REEL_TEMPLATE_CHECKER,
      detail: "is missing",
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
      // Spelled with the old name on purpose. The check is a substring search
      // inside §1 bis, and a bare "X" is one character: it would match any
      // capital X in the section and report a format assigned that nobody
      // wrote. The parenthesis is what makes this gate mean something.
      "X (Twitter)",
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

  // @req REQ-032
  it("names the thumbnail section, the title law and the steps that follow it", () => {
    expect(TITLE_RULE_HEADING).toBe("## 1 ter. La miniature");
    expect(TITLE_RULE_PHRASE).toBe("D'où vient le nom");
    expect(TITLE_RULE_REFERENCE).toBe("§1 ter");
    expect(TITLE_RULE_CALLERS).toEqual([
      "ethniafrica-idee",
      "ethniafrica-structure",
    ]);
  });

  // @req REQ-032
  it("flags a thumbnail section that no longer carries the reel title law", () => {
    // The law was written in an essay and in `idee` only. `structure` reads the
    // spec, so a title such as « Trois versions disent… » passed every step:
    // nothing the step reads said otherwise.
    const spec = [
      FORMAT_RULE_HEADING,
      FORMAT_RULE_NETWORKS.join(" · "),
      `${TITLE_RULE_HEADING}\n\nHuit mots au plus, et le dernier porte l'accent.`,
      "## 2. Couleurs\n\nD'où vient le nom, hors de la section.",
    ].join("\n\n");
    const issues = checkSocialChainContract(projectRoot, {
      [FORMAT_RULE_SOURCE]: spec,
    });

    expect(issues).toContainEqual({
      skill: FORMAT_RULE_SOURCE,
      detail: `the section ${TITLE_RULE_HEADING} does not carry the reel title law « ${TITLE_RULE_PHRASE} »`,
    });
  });

  // @req REQ-032
  it("flags a template spec that loses the thumbnail section", () => {
    const issues = checkSocialChainContract(projectRoot, {
      [FORMAT_RULE_SOURCE]: `${FORMAT_RULE_HEADING}\n\n${FORMAT_RULE_NETWORKS.join(" · ")}\n`,
    });

    expect(issues).toContainEqual({
      skill: FORMAT_RULE_SOURCE,
      detail: `does not carry the section ${TITLE_RULE_HEADING}`,
    });
  });

  // @req REQ-032
  it("flags a production step that no longer follows the thumbnail section", () => {
    const [firstCaller] = TITLE_RULE_CALLERS;
    const issues = checkSocialChainContract(projectRoot, {
      [firstCaller]: `---\nname: ${firstCaller}\n---\nCalls ethniafrica-mythe, follows ${FORMAT_RULE_REFERENCE}, titles a reel as it likes.`,
    });

    expect(issues).toContainEqual({
      skill: firstCaller,
      detail: `does not follow ${TITLE_RULE_REFERENCE} of GABARITS-SOCIAL.md`,
    });
  });
});
