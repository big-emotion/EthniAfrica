import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
 * Which format goes to which network. Decided by the operator on 2026-09-16
 * from the 2026-09-15 measurement: carousels drew 9 to 14 views on Facebook
 * while a reel drew 21 211 there, and TikTok's carousels outran its videos. The
 * table lives in the template spec alone; the production steps cite it rather
 * than copy it, because a copy drifts from its source.
 */
export const FORMAT_RULE_SOURCE =
  "docs/design/gabarits-social/GABARITS-SOCIAL.md";
export const FORMAT_RULE_HEADING = "## 1 bis. Un format par réseau";
export const FORMAT_RULE_REFERENCE = "§1 bis";
export const FORMAT_RULE_NETWORKS = [
  "TikTok",
  "Instagram",
  "Facebook",
  "YouTube",
  "LinkedIn",
  /**
   * Named with its old name in parentheses, and not as a bare "X".
   *
   * The check below is `section.includes(network)`. A one-letter needle finds
   * itself in any capital X the section happens to contain, so a bare "X" would
   * report a format assigned to a network nobody had written a line for — a
   * gate that passes on a coincidence is worse than no gate. It also spares a
   * reader the one ambiguous name in the set.
   */
  "X (Twitter)",
] as const;
export const FORMAT_RULE_CALLERS = [
  "ethniafrica-idee",
  "ethniafrica-structure",
] as const;

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
  FORMAT_RULE_SOURCE,
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

function specMarkdown(
  projectRoot: string,
  overrides: SkillMarkdownOverrides
): string | null {
  if (FORMAT_RULE_SOURCE in overrides) return overrides[FORMAT_RULE_SOURCE];

  const path = join(projectRoot, FORMAT_RULE_SOURCE);
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

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

  const chainSteps = new Map<string, string | null>();
  for (const caller of MYTH_CALLERS) {
    // The render step was already loaded above; loading it again would report
    // a broken frontmatter twice.
    const markdown =
      caller === RENDER_SKILL
        ? render
        : namedSkill(projectRoot, caller, overrides, issues);
    chainSteps.set(caller, markdown);
    if (markdown !== null && !markdown.includes(MYTH_SKILL)) {
      issues.push({ skill: caller, detail: `does not call ${MYTH_SKILL}` });
    }
  }

  const spec = specMarkdown(projectRoot, overrides);
  if (spec === null) {
    issues.push({ skill: FORMAT_RULE_SOURCE, detail: "is missing" });
  } else {
    const start = spec.indexOf(FORMAT_RULE_HEADING);
    if (start === -1) {
      issues.push({
        skill: FORMAT_RULE_SOURCE,
        detail: `does not carry the section ${FORMAT_RULE_HEADING}`,
      });
    } else {
      // Only the section itself counts: a network named elsewhere in the spec
      // has not been given a format.
      const end = spec.indexOf("\n## ", start + FORMAT_RULE_HEADING.length);
      const section = spec.slice(start, end === -1 ? undefined : end);
      for (const network of FORMAT_RULE_NETWORKS) {
        if (!section.includes(network)) {
          issues.push({
            skill: FORMAT_RULE_SOURCE,
            detail: `does not assign a format to ${network}`,
          });
        }
      }
    }
  }

  for (const caller of FORMAT_RULE_CALLERS) {
    const markdown = chainSteps.get(caller);
    if (markdown && !markdown.includes(FORMAT_RULE_REFERENCE)) {
      issues.push({
        skill: caller,
        detail: `does not follow ${FORMAT_RULE_REFERENCE} of GABARITS-SOCIAL.md`,
      });
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
