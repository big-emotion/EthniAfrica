/**
 * The public agent's one write: a proposal becomes a comment on a GitHub
 * issue in a private repository, one issue per name. Nothing is stored on
 * our side and nothing about the caller is sent.
 *
 * Redaction of person names and residence places is not attempted. A
 * heuristic would miss names and wrongly cut the origin places a story
 * rightly names; the control is the human review of every issue and the
 * agent being told not to write them (see the runbook).
 */
import { randomBytes } from "node:crypto";

import { z } from "zod";

import { logger } from "@/lib/api/logger";
import { publicAgentCopy } from "@/lib/i18n/copy/publicAgent";
import { takeDailyAllowance } from "@/lib/publicAgent/dailyCap";
import {
  createGithubIssuesPort,
  type IssuePort,
} from "@/lib/publicAgent/githubIssues";
import {
  buildIssueBody,
  buildProposalComment,
  normalizedKey,
  PROPOSAL_LIMITS,
  sha256Hex,
  type ProposalKind,
} from "@/lib/publicAgent/proposal";

const copy = publicAgentCopy.fr;

const KIND_OF_TYPE: Record<string, ProposalKind> = {
  nouveau_nom: "new-name",
  correction: "correction",
  temoignage: "testimony",
};

const DEFAULT_DAILY_CAP = 10;
const PROPOSAL_LABEL = "proposition";
const FICHE_ID = /^[A-Za-z0-9_.-]{1,64}$/;

const argsSchema = z.object({
  nom: z.string().trim().min(1),
  type: z.enum(["nouveau_nom", "correction", "temoignage"]),
  details: z.string().trim().min(1),
  sources: z.array(z.string()).optional(),
  fiche: z.string().trim().regex(FICHE_ID).optional(),
  element: z.string().optional(),
  consentement: z.boolean().optional(),
  temoignage: z.string().optional(),
});

// @req REQ-178
export interface ProposalCaller {
  /** The API key id the proxy vouches for, or null for an anonymous call. */
  apiKeyId: string | null;
}

// @req REQ-178
export type ProposalOutcome =
  | { status: "invalid"; message: string }
  | { status: "refused"; message: string }
  | { status: "failed" }
  | { status: "received"; message: string; withdrawalCode: string };

function githubConfig() {
  const repo = process.env.GITHUB_PROPOSALS_REPO;
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  if (!repo || !appId || !privateKey || !installationId) return null;
  return { repo, appId, privateKey, installationId };
}

/** The kill switch: off by setting, and off by default when GitHub is not configured. */
// @req REQ-178
export function proposalsEnabled(): boolean {
  return (
    process.env.PUBLIC_AGENT_PROPOSALS !== "off" && githubConfig() !== null
  );
}

function dailyCap(): number {
  const declared = parseInt(
    process.env.PUBLIC_AGENT_PROPOSALS_DAILY_CAP ?? "",
    10
  );
  return Number.isFinite(declared) && declared > 0
    ? declared
    : DEFAULT_DAILY_CAP;
}

function tooLong(text: string | undefined, max: number): boolean {
  return (text?.length ?? 0) > max;
}

function refusalOf(
  args: z.infer<typeof argsSchema>,
  kind: ProposalKind
): string | null {
  const l = PROPOSAL_LIMITS;
  if (tooLong(args.nom, l.name)) return copy.proposal.tooLong("nom", l.name);
  if (tooLong(args.details, l.details)) {
    return copy.proposal.tooLong("details", l.details);
  }
  if (tooLong(args.temoignage, l.testimony)) {
    return copy.proposal.tooLong("temoignage", l.testimony);
  }
  if (tooLong(args.element, l.element)) {
    return copy.proposal.tooLong("element", l.element);
  }
  if ((args.sources?.length ?? 0) > l.sources) {
    return copy.proposal.tooManySources(l.sources);
  }
  if (args.sources?.some((source) => tooLong(source, l.source))) {
    return copy.proposal.tooLong("sources", l.source);
  }
  if (kind === "testimony") {
    if (args.consentement !== true) return copy.proposal.testimonyNeedsConsent;
    if (!args.temoignage?.trim()) return copy.proposal.testimonyNeedsText;
  }
  return null;
}

// @req REQ-178
export async function proposeName(
  rawArgs: unknown,
  caller: ProposalCaller
): Promise<ProposalOutcome> {
  const config = githubConfig();
  if (!proposalsEnabled() || !config) {
    return { status: "refused", message: copy.proposal.unavailable };
  }
  const parsed = argsSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return { status: "invalid", message: "nom, type and details are required" };
  }
  const args = parsed.data;
  const kind = KIND_OF_TYPE[args.type];
  const refusal = refusalOf(args, kind);
  if (refusal) return { status: "refused", message: refusal };

  const key = normalizedKey(args.nom);
  const kindLabel = `kind:${kind}`;
  const withdrawalCode = randomBytes(12).toString("hex");
  const comment = buildProposalComment({
    kind,
    consent: args.consentement === true,
    details: args.details,
    sources: (args.sources ?? []).filter((source) => source.trim()),
    ficheId: args.fiche ?? "",
    element: args.element ?? "",
    withdrawalHash: sha256Hex(withdrawalCode),
    testimony: args.temoignage,
  });

  try {
    const issues: IssuePort = createGithubIssuesPort(config);
    const existing = await issues.findIssue({
      title: key,
      label: PROPOSAL_LABEL,
    });
    let issueNumber: number;
    if (existing) {
      issueNumber = existing.number;
      if (!existing.labels.includes(kindLabel)) {
        await issues.addLabels(issueNumber, [kindLabel]);
      }
    } else {
      if (!(await takeDailyAllowance(caller.apiKeyId, dailyCap()))) {
        return { status: "refused", message: copy.proposal.dailyCap };
      }
      ({ number: issueNumber } = await issues.createIssue({
        title: key,
        body: buildIssueBody(args.nom, key),
        labels: [PROPOSAL_LABEL, kindLabel],
      }));
    }
    await issues.addComment(issueNumber, comment);
  } catch (error) {
    // Logged without the proposal: the failure's message names the call, the
    // text of a proposal never enters it.
    logger.error("public agent: proposal failed", error);
    return { status: "failed" };
  }
  return {
    status: "received",
    message: copy.proposal.received(withdrawalCode),
    withdrawalCode,
  };
}
