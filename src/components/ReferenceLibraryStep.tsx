"use client";

import { useEffect, useState } from "react";
import { hasReferenceLibraryAccess } from "@/lib/auth/referenceLibraryAccess";
import { contributeCopy } from "@/lib/i18n/copy/contribute";
import type { Language } from "@/types/shared";
import { ReferenceLibraryFlow } from "./ReferenceLibraryFlow";
import { QueryProvider } from "@/components/QueryProvider";

type LibraryAccess = "pending" | "moderator" | "visitor";

export interface ReferenceLibraryStepProps {
  language?: Language;
}

/**
 * The reference library, for the moderators who may write to it, and a plain
 * notice for everyone else.
 *
 * Nothing renders while the answer is pending: showing the tool first would
 * hand a visitor controls that answer 403, and showing the notice first would
 * flash a refusal at the moderators the step exists for.
 */
// @req REQ-042
export function ReferenceLibraryStep({
  language = "fr",
}: ReferenceLibraryStepProps) {
  const [access, setAccess] = useState<LibraryAccess>("pending");

  useEffect(() => {
    let mounted = true;
    hasReferenceLibraryAccess().then(
      (allowed) => {
        if (mounted) setAccess(allowed ? "moderator" : "visitor");
      },
      () => {
        if (mounted) setAccess("visitor");
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  if (access === "pending") return null;
  if (access === "moderator") {
    return (
      <QueryProvider>
        <ReferenceLibraryFlow language={language} />
      </QueryProvider>
    );
  }

  const copy = contributeCopy[language].reference;
  return (
    <section
      data-reference-library-closed
      className="space-y-1 rounded-lg border p-4 min-[720px]:p-6 min-[800px]:p-8"
      aria-labelledby="reference-library-closed-title"
    >
      <h3
        id="reference-library-closed-title"
        className="text-afh-h3 font-semibold"
      >
        {copy.moderatorOnlyTitle}
      </h3>
      <p className="text-afh-small text-muted-foreground">
        {copy.moderatorOnly}
      </p>
    </section>
  );
}
