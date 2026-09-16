"use client";

import { useEffect, useState } from "react";

import type { FlagAuditEntry } from "@/api/v2/services/auditLog";
import { AuditTimeline } from "@/components/admin/AuditTimeline";
import { RemediationPanel } from "@/components/admin/RemediationPanel";
import { readRemediation } from "@/components/admin/remediation";
import { moderationConsoleCopy } from "@/lib/i18n/copy/moderationConsole";
import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageRoute,
  getPeopleRoute,
  getSourceRoute,
} from "@/lib/routing";
import { createBrowserSupabaseClient } from "@/lib/supabase/auth-client";
import type { Language } from "@/types/shared";

/**
 * One report, opened.
 *
 * The queue gave a moderator a slug, a status and a date; a decision was taken
 * without seeing what had been decided before, and the audit entries written
 * since migration 022 were displayed nowhere in the product. This is the
 * surface that reads them.
 *
 * The trail is fetched when the panel opens rather than with the page: the
 * queue serves up to a hundred rows, and reading a hundred registers to show
 * none of them would cost a moderator the screen.
 */

export interface CaseFileReport {
  id: string;
  public_slug?: string;
  target_type?: string | null;
  target_id?: string | null;
  target_field_path?: string | null;
  counter_source_url?: string | null;
  counter_source_citation?: string | null;
  /**
   * The remediation columns, in whichever spelling the queue hands over. They
   * arrive with their own migration, so they are read defensively and their
   * absence renders as "not tracked" rather than taking the panel down.
   */
  remediationState?: string | null;
  remediation_state?: string | null;
  remediationPublishedAt?: string | null;
  remediation_published_at?: string | null;
  remediationSummary?: string | null;
  remediation_summary?: string | null;
  revisionDraftId?: string | null;
  revision_draft_id?: string | null;
}

export interface CaseFileProps {
  language: Language;
  report: CaseFileReport;
}

/**
 * The entity types that have a fiche a moderator can open. A report on a
 * section, an assertion or an entity the atlas does not hold yet has no
 * destination, and a dead link is worse than none.
 */
const FICHE_ROUTES: Record<string, (language: Language, id: string) => string> =
  {
    people: getPeopleRoute,
    country: getCountryRoute,
    language_family: getFamilyRoute,
    language: getLanguageRoute,
    source: getSourceRoute,
  };

type TrailState = "loading" | "ready" | "unreadable";

// @req REQ-041
// @req REQ-042
export function CaseFile({ language, report }: CaseFileProps) {
  const copy = moderationConsoleCopy[language].caseFile;
  const [entries, setEntries] = useState<FlagAuditEntry[]>([]);
  const [state, setState] = useState<TrailState>("loading");

  useEffect(() => {
    let abandoned = false;

    async function readTrail() {
      try {
        const {
          data: { session },
        } = await createBrowserSupabaseClient().auth.getSession();

        const response = await fetch(`/api/v2/flags/${report.id}/audit`, {
          headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        });
        const json = await response.json();

        if (abandoned) return;
        if (!response.ok || !json?.data?.entries) {
          setState("unreadable");
          return;
        }
        setEntries(json.data.entries);
        setState("ready");
      } catch {
        // A register that could not be read is not a register with nothing in
        // it, and the timeline says which of the two this is.
        if (!abandoned) setState("unreadable");
      }
    }

    void readTrail();
    return () => {
      abandoned = true;
    };
  }, [report.id]);

  const remediation = readRemediation(report);
  const ficheRoute =
    report.target_type && report.target_id
      ? FICHE_ROUTES[report.target_type]?.(language, report.target_id)
      : undefined;

  /**
   * The publication is pending until the corpus says otherwise. A remediation
   * nobody has tracked is pending too — silence about a correction is not the
   * same claim as a correction that was not needed.
   */
  const publicationPending =
    remediation.state !== "published" && remediation.state !== "not_applicable";

  return (
    <div className="rounded-afh-lg border border-afh-border p-afh-lg">
      <section>
        <h3 className="text-afh-small font-medium">{copy.targetHeading}</h3>
        {report.target_type && report.target_id ? (
          <dl className="mt-afh-md flex flex-col gap-1 text-afh-caption min-[480px]:grid min-[480px]:grid-cols-[auto_1fr] min-[480px]:gap-x-afh-md">
            <dt className="text-afh-text-soft">{copy.entityType}</dt>
            <dd>{report.target_type}</dd>
            <dt className="text-afh-text-soft">{copy.entityId}</dt>
            <dd className="font-mono">{report.target_id}</dd>
            {report.target_field_path && (
              <>
                <dt className="text-afh-text-soft">{copy.fieldPath}</dt>
                <dd className="font-mono">{report.target_field_path}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="mt-afh-md text-afh-caption text-afh-text-soft">
            {copy.noTarget}
          </p>
        )}
        {ficheRoute && (
          <p className="mt-afh-md text-afh-caption">
            <a className="underline underline-offset-2" href={ficheRoute}>
              {copy.openFiche}
            </a>
          </p>
        )}
      </section>

      <section className="mt-afh-lg">
        <h3 className="text-afh-small font-medium">
          {copy.counterSourceHeading}
        </h3>
        {report.counter_source_url || report.counter_source_citation ? (
          <div className="mt-afh-md flex flex-col gap-1 text-afh-caption">
            {report.counter_source_citation && (
              <p>{report.counter_source_citation}</p>
            )}
            {report.counter_source_url && (
              <a
                className="break-all underline underline-offset-2"
                href={report.counter_source_url}
                rel="noreferrer nofollow"
                target="_blank"
              >
                {report.counter_source_url}
              </a>
            )}
          </div>
        ) : (
          <p className="mt-afh-md text-afh-caption text-afh-text-soft">
            {copy.noCounterSource}
          </p>
        )}
      </section>

      <section className="mt-afh-lg">
        <h3 className="text-afh-small font-medium">
          {moderationConsoleCopy[language].trail.heading}
        </h3>
        <AuditTimeline
          language={language}
          entries={entries}
          state={state}
          {...(publicationPending && state === "ready"
            ? { pendingEvent: "publication" as const }
            : {})}
        />
      </section>

      <section className="mt-afh-lg">
        <h3 className="text-afh-small font-medium">{copy.noteHeading}</h3>
        <p className="mt-afh-md text-afh-caption text-afh-text-soft">
          {copy.notePublished}
        </p>
      </section>

      <div className="mt-afh-lg">
        <RemediationPanel language={language} remediation={remediation} />
      </div>
    </div>
  );
}
