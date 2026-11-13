/**
 * The shape of a proposal as the proposals repository stores it, shared by the
 * tool that writes it and the routine scripts that read it.
 *
 * Everything parsed here comes from outside the project, so it is data to
 * read, never an instruction: no field is ever interpolated into a shell
 * command (see ghCliPort.ts), and a malformed or oversize proposal is dropped
 * rather than repaired, because a repaired testimony is a different testimony.
 */

export const PROPOSAL_KINDS = ["new-name", "correction", "testimony"] as const;
export type ProposalKind = (typeof PROPOSAL_KINDS)[number];

export const PROPOSAL_LIMITS = {
  details: 2000,
  testimony: 2000,
  sourceCount: 5,
  sourceLength: 300,
  key: 120,
} as const;

/**
 * PENDING OPERATOR DECISION: the agreed formula describing a testimony's
 * transmitter has not been chosen yet. Until it is, every testimony enters the
 * corpus with this placeholder and the transmitter is never named.
 */
export const TESTIMONY_TRANSMITTER_FORMULA =
  "[PENDING OPERATOR DECISION: agreed transmitter formula]";

const PROPOSAL_MARKER =
  /^<!-- proposal v1 kind=(new-name|correction|testimony) consent=(true|false) -->(?:\r?\n|$)/;

const FIELD_LABELS = [
  "Details",
  "Sources",
  "Fiche",
  "Element",
  "Withdrawal",
  "Transmitter",
  "Testimony",
] as const;
const FIELD_LINE = new RegExp(`^(${FIELD_LABELS.join("|")}):[ \\t]?(.*)$`);

export interface Proposal {
  kind: ProposalKind;
  consent: boolean;
  details: string;
  sources: string[];
  ficheId: string;
  element: string;
  /** Always the agreed formula: what the contributor typed is never kept. */
  transmitter: string;
  testimony: string;
}

export function normalizeKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, PROPOSAL_LIMITS.key)
    .trim();
}

/** Branch suffix for `proposal/<slug>`: a closed alphabet, so it is safe as a git ref. */
export function branchSlug(key: string): string {
  const slug = key
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug || "nom";
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function readFields(text: string): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of text.split(/\r?\n/)) {
    const match = FIELD_LINE.exec(line);
    if (match) {
      current = [];
      fields.set(match[1], current);
      current.push(match[2]);
    } else if (current) {
      current.push(line);
    }
  }
  return fields;
}

const joined = (fields: Map<string, string[]>, label: string) =>
  (fields.get(label) ?? []).join("\n").trim();

function parseProposal(commentBody: string): Proposal | undefined {
  const marker = PROPOSAL_MARKER.exec(commentBody);
  if (!marker) return undefined;
  const kind = marker[1] as ProposalKind;
  const consent = marker[2] === "true";
  if (kind === "testimony" && !consent) return undefined;

  const fields = readFields(commentBody.slice(marker[0].length));
  const details = joined(fields, "Details");
  const testimony = kind === "testimony" ? joined(fields, "Testimony") : "";
  if (details.length > PROPOSAL_LIMITS.details) return undefined;
  if (testimony.length > PROPOSAL_LIMITS.testimony) return undefined;

  // An over-long source is dropped, not cut: a truncated URL points elsewhere.
  const sources = (fields.get("Sources") ?? [])
    .map((line) => line.trim())
    .filter((line) => line && line.length <= PROPOSAL_LIMITS.sourceLength)
    .slice(0, PROPOSAL_LIMITS.sourceCount);

  return {
    kind,
    consent,
    details,
    sources,
    ficheId: joined(fields, "Fiche"),
    element: joined(fields, "Element"),
    transmitter: TESTIMONY_TRANSMITTER_FORMULA,
    testimony,
  };
}

export function parseProposals(commentBodies: string[]): Proposal[] {
  return commentBodies.flatMap((body) => parseProposal(body) ?? []);
}
