import {
  type SkillContractIssue,
  type SkillMarkdownOverrides,
  skillMarkdown,
} from "./audienceSkillContract";
import { parseSkillName } from "./skillParity";

/**
 * The message gate. It scores a production or a page against the doctrine the
 * site publishes, and it exists because the 2026-09-13 message audit found the
 * doctrine carried by two productions in twenty-seven while every one of them
 * passed the four render gates.
 */
export const MESSAGE_SKILL = "ethniafrica-message";

/**
 * Where the operator launches production, so where the gate has to sit. A gate
 * that lives only in its own skill is a gate nobody passes through.
 */
export const RENDER_SKILL = "ethniafrica-produire";

/** « Où j'en suis » for the social chain. */
export const HELPER_SKILL = "ethniafrica-reseaux-help";

/**
 * The three places the doctrine is written. The message skill must open all
 * three on every run: the verbatim exchange and its corrections, the reader
 * facing declaration, and the templates that turn it into cards. A grid written
 * from memory drifts from them, which is how « Berlin a tracé » and « mille ans »
 * as a dated fact reached five networks.
 */
export const DOCTRINE_SOURCES = [
  "docs/editorial/purpose-doctrine.md",
  "src/lib/i18n/copy/about.ts",
  "docs/design/gabarits-social/GABARITS-SOCIAL.md",
] as const;

/**
 * The myth check. It asks whether a subject undoes a belief its audience
 * actually holds, and whether the correction is sourced — because a correction
 * written from memory replaces one myth with another.
 */
export const MYTH_SKILL = "ethniafrica-mythe";

/**
 * Every step that makes content calls it, not only the render: the subject is
 * cheapest to kill at `idee`, and the cards can drift from the verified
 * correction between `structure` and `produire`.
 */
export const MYTH_CALLERS = [
  "ethniafrica-idee",
  "ethniafrica-structure",
  RENDER_SKILL,
] as const;

/** Where a correction is sourced from: the fiche, not the draft's own claim. */
export const CORPUS_SOURCE_DIR = "dataset/source/afrik/";

/**
 * The state every « où j'en suis » answer must come from. The helper reads what
 * the post.md headers say, never what a previous conversation remembered.
 */
export const PIPELINE_STATE_TOOL = "social/tools/etat-pipeline/";

function namedSkill(
  projectRoot: string,
  skill: string,
  overrides: SkillMarkdownOverrides,
  issues: SkillContractIssue[]
): string | null {
  const markdown = skillMarkdown(projectRoot, skill, overrides);
  if (markdown === null) {
    issues.push({ skill, detail: "SKILL.md is missing" });
    return null;
  }

  const declaredName = parseSkillName(markdown);
  if (declaredName !== skill) {
    issues.push({
      skill,
      detail: `frontmatter name is ${JSON.stringify(declaredName)}, expected ${JSON.stringify(skill)}`,
    });
  }
  return markdown;
}

export function checkSocialChainContract(
  projectRoot: string,
  overrides: SkillMarkdownOverrides = {}
): SkillContractIssue[] {
  const issues: SkillContractIssue[] = [];

  const message = namedSkill(projectRoot, MESSAGE_SKILL, overrides, issues);
  if (message !== null) {
    for (const source of DOCTRINE_SOURCES) {
      if (!message.includes(source)) {
        issues.push({
          skill: MESSAGE_SKILL,
          detail: `does not read the doctrine from ${source}`,
        });
      }
    }
  }

  const render = namedSkill(projectRoot, RENDER_SKILL, overrides, issues);
  if (render !== null && !render.includes(MESSAGE_SKILL)) {
    issues.push({
      skill: RENDER_SKILL,
      detail: `does not gate the render on ${MESSAGE_SKILL}`,
    });
  }

  const myth = namedSkill(projectRoot, MYTH_SKILL, overrides, issues);
  if (myth !== null && !myth.includes(CORPUS_SOURCE_DIR)) {
    issues.push({
      skill: MYTH_SKILL,
      detail: `does not source the correction from ${CORPUS_SOURCE_DIR}`,
    });
  }

  for (const caller of MYTH_CALLERS) {
    // The render step was already loaded above; loading it again would report
    // a broken frontmatter twice.
    const markdown =
      caller === RENDER_SKILL
        ? render
        : namedSkill(projectRoot, caller, overrides, issues);
    if (markdown !== null && !markdown.includes(MYTH_SKILL)) {
      issues.push({ skill: caller, detail: `does not call ${MYTH_SKILL}` });
    }
  }

  const helper = namedSkill(projectRoot, HELPER_SKILL, overrides, issues);
  if (helper !== null && !helper.includes(PIPELINE_STATE_TOOL)) {
    issues.push({
      skill: HELPER_SKILL,
      detail: `does not read the pipeline state from ${PIPELINE_STATE_TOOL}`,
    });
  }

  return issues;
}
