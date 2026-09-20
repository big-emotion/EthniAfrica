import { logger } from "@/lib/api/logger";
import { legalHostCopy } from "@/lib/i18n/copy/legalHost";
import type { Language } from "@/types/shared";

/**
 * The host's identity is a legal obligation to publish and a fact this public
 * repository must not carry (`ethniafrica-infra`: a hosting provider is never
 * committed). It therefore arrives as plain configuration, read at request time
 * so a change of host is an environment edit, not a release.
 *
 * Absence degrades to a description of the host's role and is logged, never
 * thrown: a legal notice that answers 500 serves the reader worse than one that
 * names less, and the log is what tells the operator the notice is incomplete.
 */
// @req REQ-088
export function describeLegalHost(language: Language): string {
  const copy = legalHostCopy[language];
  const name = process.env.LEGAL_HOST_NAME?.trim();
  const address = process.env.LEGAL_HOST_ADDRESS?.trim();

  // An address with no name identifies nobody a reader could write to.
  if (!name) {
    logger.error(
      "LEGAL_HOST_NAME is not set: the legal notice names the host by role only"
    );
    return copy.roleOnly;
  }

  return `${copy.namedBy} ${address ? `${name}, ${address}` : name}`;
}
