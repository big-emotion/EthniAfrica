import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/api/logger";
import { graphConfigured, sendViaGraph } from "@/lib/email/graph";
import type { Language } from "@/types/shared";
import { getCountryRoute, getFamilyRoute, getPeopleRoute } from "@/lib/routing";
import { getStaticPageRoute } from "@/lib/routing";
import { resolveSiteUrl } from "@/lib/siteUrl";

const FR: Language = "fr";

export type FlagResolutionStatus = "accepted" | "rejected" | "duplicate";

export interface FlagResolutionInput {
  public_slug: string;
  status: FlagResolutionStatus;
  moderator_notes: string | null;
  target_type: string | null;
  target_id: string | null;
}

/**
 * Whoever the decision is owed to.
 *
 * It used to be a contributor, with an id, because an address could only come
 * from an account. An accountless reporter who verified their address is owed
 * the same message and has no id at all — so the recipient is the address, and
 * nothing else.
 */
export interface FlagResolutionRecipient {
  email: string;
  language?: Language;
}

function flagPageUrl(publicSlug: string, language: Language = FR): string {
  return `${resolveSiteUrl()}${getStaticPageRoute(language, "reports")}/${publicSlug}`;
}

/**
 * Only the three entity types a flag can target and that have a fiche route
 * resolve to a link — `fiche_section`, `assertion`, `source` and `general`
 * describe something narrower than a single fiche, so the email omits the
 * line rather than link to the wrong page.
 */
function ficheUrl(
  targetType: string | null,
  targetId: string | null,
  language: Language = FR
): string | null {
  if (!targetType || !targetId) return null;
  switch (targetType) {
    case "people":
      return `${resolveSiteUrl()}${getPeopleRoute(language, targetId)}`;
    case "country":
      return `${resolveSiteUrl()}${getCountryRoute(language, targetId)}`;
    case "language_family":
      return `${resolveSiteUrl()}${getFamilyRoute(language, targetId)}`;
    default:
      return null;
  }
}

interface EmailContent {
  subject: string;
  text: string;
}

function buildEmailContent(flag: FlagResolutionInput): EmailContent {
  const flagLink = flagPageUrl(flag.public_slug);
  const notes = flag.moderator_notes?.trim() || null;

  if (flag.status === "accepted") {
    const fiche = ficheUrl(flag.target_type, flag.target_id);
    return {
      subject: `Votre signalement ${flag.public_slug} a été accepté`,
      text: [
        `Votre signalement ${flag.public_slug} a été accepté.`,
        notes ? `Notes du modérateur : ${notes}` : null,
        `Voir votre signalement : ${flagLink}`,
        fiche ? `Voir la fiche mise à jour : ${fiche}` : null,
      ]
        .filter((line): line is string => line !== null)
        .join("\n\n"),
    };
  }

  if (flag.status === "rejected") {
    return {
      subject: `Votre signalement ${flag.public_slug} a été examiné`,
      text: [
        `Votre signalement ${flag.public_slug} a été examiné.`,
        notes ? `Notes du modérateur : ${notes}` : null,
        `Voir votre signalement : ${flagLink}`,
      ]
        .filter((line): line is string => line !== null)
        .join("\n\n"),
    };
  }

  // duplicate — the schema carries no dedicated "duplicate of" reference, so
  // the original flag it points to travels the same way the moderator
  // records it everywhere else in this flow: in moderator_notes.
  return {
    subject: `Votre signalement ${flag.public_slug} — doublon détecté`,
    text: [
      `Votre signalement ${flag.public_slug} a été identifié comme un doublon d'un signalement déjà traité.`,
      notes ? `Signalement d'origine : ${notes}` : null,
      `Voir votre signalement : ${flagLink}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n\n"),
  };
}

const sendNotification = (to: string, content: EmailContent) =>
  sendViaGraph({ to, subject: content.subject, text: content.text });

/**
 * Notify a contributor that their flag reached a terminal decision.
 *
 * Best-effort by design (ETNI-73): the flag's state transition already
 * committed by the time this runs, and nothing here may roll it back, so
 * every failure path logs and reports to Sentry rather than throwing.
 *
 * Microsoft Graph is the only transport this repo can actually drive —
 * Supabase Auth's admin API sends its own fixed auth templates (magic link,
 * invite…), not arbitrary content, so there is no generic "Supabase SMTP"
 * call to fall back to. Unconfigured, this logs and skips rather than
 * fabricating a send.
 */
// @req REQ-015
export async function sendFlagResolutionEmail(
  flag: FlagResolutionInput,
  recipient: FlagResolutionRecipient | null
): Promise<void> {
  try {
    if (!recipient) {
      // Nobody to write to: the report was never attributed, the contributor
      // was erased (Story 4.4), or the reader left no address — or left one
      // and never proved it, which is the same thing as far as writing goes.
      return;
    }

    if (!graphConfigured()) {
      logger.warn(
        "Flag resolution email not sent: no email transport configured",
        { flagSlug: flag.public_slug, status: flag.status }
      );
      return;
    }

    const content = buildEmailContent(flag);
    const sent = await sendNotification(recipient.email, content);
    if (sent) {
      logger.info("Flag resolution email sent", {
        flagSlug: flag.public_slug,
        status: flag.status,
      });
    }
  } catch (error) {
    logger.error("Unexpected error sending flag resolution email", error, {
      flagSlug: flag.public_slug,
    });
    Sentry.captureException(error);
  }
}
