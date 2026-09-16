import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { parseSkillName } from "./skillParity";

/**
 * Three skills split the audience loop: one measures, two act on the
 * measurement. The handoff between them is a dated Markdown report on disk,
 * not a conversation — a consumer invoked weeks later reads the same evidence
 * the producer wrote, and neither side depends on a context window that has
 * since been summarised away.
 *
 * That indirection is what this contract guards. A consumer edited until it no
 * longer opens the report still reads as a plausible skill and still runs; it
 * just silently reverts to guessing, which is the failure the whole
 * architecture exists to prevent.
 */
export const AUDIENCE_REPORT_DIR = "docs/audience";

/**
 * The producer, which this repository holds again.
 *
 * It left for the private workspace on 2026-09-10, on the rule that a public
 * repository carries no production skills, and came back on 2026-09-11 when that
 * rule was reversed: an engine and a chain nobody can read the history of are an
 * engine and a chain nobody can repair. What did *not* come back is the output —
 * renders, per-subject cards and sources stay in the library, addressed by
 * `ETHNIAFRICA_SOCIAL_PROJECTS`.
 *
 * So the contract can check the whole handoff again, producer included, rather
 * than half of it.
 */
export const AUDIENCE_PRODUCER = "ethniafrica-audience-audit";

/**
 * Both consumers are back in this repository too. `ethniafrica-content-strategist`
 * decides what ships; `ethniafrica-experience-optimizer` acts on the site's own
 * pages. Each must still open the dated report rather than guess — a consumer
 * edited until it no longer reads the report keeps running and silently reverts
 * to taste.
 */
export const AUDIENCE_CONSUMERS = [
  "ethniafrica-content-strategist",
  "ethniafrica-experience-optimizer",
] as const;

/**
 * The networks the productions go out on, as the operator reads them in their
 * studios. The message travels there before it reaches the site: the 2026-09-13
 * message audit counted ~18 000 views a month on them against three site
 * visitors from them, so a producer that reads Plausible alone measures the
 * smallest surface the message reaches.
 *
 * X joined on 2026-09-16. It is the one network here whose own dashboard cannot
 * be read: account analytics sit behind X Premium, and the audit is expected to
 * read the view count printed under each post instead. A skill that sends the
 * operator to a paywall reports nothing and looks like it tried.
 *
 * Each name is matched as a substring of the skill, so "X" alone would find
 * itself in any capital X the file contains — see {@link FORMAT_RULE_NETWORKS}
 * in `socialChainContract.ts`, which carries the same spelling for the same
 * reason.
 */
export const AUDIENCE_NETWORKS = [
  "YouTube",
  "TikTok",
  "Instagram",
  "Facebook",
  "X (Twitter)",
] as const;

/**
 * The strategist plans on every network the productions go out on, LinkedIn
 * included, and reads all of them on every run. On 2026-09-15 a run skipped
 * three networks because the audit had read them the day before, and planned
 * without a Facebook reel at 21 211 views in fourteen hours; the operator ruled
 * that collection is never optional. The rule sentence is what keeps a later
 * edit from softening "every run" back into "when stale".
 */
export const STRATEGIST = "ethniafrica-content-strategist";
export const STRATEGIST_NETWORKS = [
  "YouTube",
  "LinkedIn",
  "Instagram",
  "TikTok",
  "Facebook",
  "X (Twitter)",
] as const;
/**
 * The sentence, not the count, is what the checker looks for — so the number in
 * it has to be maintained by hand, and that is deliberate. A rule that read
 * "collects every network" would survive a network being dropped from the list
 * without a word changing anywhere; spelling the count forces the skill and this
 * file to be edited in the same commit, which is the only moment anyone rereads
 * both.
 */
export const STRATEGIST_COLLECTION_RULE =
  "collects all six networks on every run";

export interface SkillContractIssue {
  skill: string;
  detail: string;
}

/** Overrides let a test supply skill markdown without writing a broken skill to disk. */
export type SkillMarkdownOverrides = Record<string, string>;

export function skillMarkdown(
  projectRoot: string,
  skill: string,
  overrides: SkillMarkdownOverrides
): string | null {
  if (skill in overrides) return overrides[skill];

  const path = join(projectRoot, ".claude/skills", skill, "SKILL.md");
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

export function checkAudienceSkillContract(
  projectRoot: string,
  overrides: SkillMarkdownOverrides = {}
): SkillContractIssue[] {
  const issues: SkillContractIssue[] = [];

  const producer = skillMarkdown(projectRoot, AUDIENCE_PRODUCER, overrides);
  if (producer === null) {
    issues.push({ skill: AUDIENCE_PRODUCER, detail: "SKILL.md is missing" });
  } else {
    const declaredName = parseSkillName(producer);
    if (declaredName !== AUDIENCE_PRODUCER) {
      issues.push({
        skill: AUDIENCE_PRODUCER,
        detail: `frontmatter name is ${JSON.stringify(declaredName)}, expected ${JSON.stringify(AUDIENCE_PRODUCER)}`,
      });
    }

    if (!producer.includes(`${AUDIENCE_REPORT_DIR}/`)) {
      issues.push({
        skill: AUDIENCE_PRODUCER,
        detail: `does not write the audit report to ${AUDIENCE_REPORT_DIR}/`,
      });
    }

    for (const network of AUDIENCE_NETWORKS) {
      if (!producer.includes(network)) {
        issues.push({
          skill: AUDIENCE_PRODUCER,
          detail: `does not collect per-post metrics from ${network}`,
        });
      }
    }

    // Without the campaign breakdown a post and the visits it sent never meet,
    // and "the videos do not convert" cannot be told from "nobody measured".
    if (!producer.includes("utm_campaign")) {
      issues.push({
        skill: AUDIENCE_PRODUCER,
        detail: "does not tie a post to its site visits through utm_campaign",
      });
    }
  }

  for (const skill of AUDIENCE_CONSUMERS) {
    const markdown = skillMarkdown(projectRoot, skill, overrides);

    if (markdown === null) {
      issues.push({ skill, detail: "SKILL.md is missing" });
      continue;
    }

    const declaredName = parseSkillName(markdown);
    if (declaredName !== skill) {
      issues.push({
        skill,
        detail: `frontmatter name is ${JSON.stringify(declaredName)}, expected ${JSON.stringify(skill)}`,
      });
    }

    if (!markdown.includes(`${AUDIENCE_REPORT_DIR}/`)) {
      issues.push({
        skill,
        detail: `does not read the audit report from ${AUDIENCE_REPORT_DIR}/`,
      });
    }

    if (!markdown.includes(AUDIENCE_PRODUCER)) {
      issues.push({
        skill,
        detail: `does not name its producer skill ${AUDIENCE_PRODUCER}`,
      });
    }

    if (skill === STRATEGIST) {
      for (const network of STRATEGIST_NETWORKS) {
        if (!markdown.includes(network)) {
          issues.push({ skill, detail: `does not collect ${network} metrics` });
        }
      }
      if (!markdown.includes(STRATEGIST_COLLECTION_RULE)) {
        issues.push({
          skill,
          detail: `does not state the rule: ${STRATEGIST_COLLECTION_RULE}`,
        });
      }
    }
  }

  return issues;
}
