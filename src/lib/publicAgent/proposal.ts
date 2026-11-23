import { createHash } from "node:crypto";

import { publicAgentCopy } from "@/lib/i18n/copy/publicAgent";

/**
 * PENDING OPERATOR DECISION. How the person who handed a family testimony
 * down is described is not decided yet. Until it is, every testimony carries
 * this one placeholder, so the formula is changed in one place and no
 * transmitter's name can reach the issue.
 */
// @req REQ-178
export const PENDING_TRANSMITTER_FORMULA =
  publicAgentCopy.fr.proposal.transmitterFormula;

// @req REQ-178
export type ProposalKind = "new-name" | "correction" | "testimony";

// @req REQ-178
export const PROPOSAL_LIMITS = {
  name: 120,
  details: 2000,
  testimony: 2000,
  sources: 5,
  source: 300,
  element: 200,
} as const;

// @req REQ-178
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * The issue title. Case and accent variants of a name must land on the same
 * issue, because the routine writes one fiche per name.
 */
// @req REQ-178
export function normalizedKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, PROPOSAL_LIMITS.name)
    .trimEnd();
}

/**
 * Free text goes into a line-oriented comment that a script parses: a line
 * break could forge a field, a comment marker could forge a proposal, and an
 * @mention would notify a stranger.
 */
function oneLine(text: string): string {
  return text
    .replace(/<!--|-->/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/@/g, "@​");
}

// @req REQ-178
export function buildIssueBody(typedName: string, key: string): string {
  return [
    "<!-- ethniafrica-proposal v1 -->",
    `Name: ${oneLine(typedName)}`,
    `Key: ${key}`,
  ].join("\n");
}

// @req REQ-178
export interface ProposalFields {
  kind: ProposalKind;
  consent: boolean;
  details: string;
  sources: string[];
  ficheId: string;
  element: string;
  withdrawalHash: string;
  testimony?: string;
}

// @req REQ-178
export function buildProposalComment(fields: ProposalFields): string {
  const lines = [
    `<!-- proposal v1 kind=${fields.kind} consent=${fields.consent} -->`,
    `Details: ${oneLine(fields.details)}`,
    `Sources: ${fields.sources.map(oneLine).join("\n")}`,
    `Fiche: ${oneLine(fields.ficheId)}`,
    `Element: ${oneLine(fields.element)}`,
    `Withdrawal: ${fields.withdrawalHash}`,
  ];
  if (fields.kind === "testimony") {
    lines.push(
      `Transmitter: ${PENDING_TRANSMITTER_FORMULA}`,
      `Testimony: ${oneLine(fields.testimony ?? "")}`
    );
  }
  return lines.join("\n");
}
