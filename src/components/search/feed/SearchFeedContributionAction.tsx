"use client";

import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  FlagTarget,
  type FlagTargetProps,
} from "@/components/flags/FlagTarget";
import type { FlagFormTarget, FlagKind } from "@/components/flags/FlagForm";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface SearchFeedContributionActionProps {
  language: Language;
  target: FlagFormTarget;
  label: string;
  variant?: ButtonProps["variant"];
  className?: string;
  preferredKind?: Extract<FlagKind, "contribution" | "correction-proposal">;
}

function meaningfulTarget(target: FlagFormTarget): FlagFormTarget | null {
  const type = target.type.trim();
  const id = target.id.trim();
  return type && id ? { ...target, type, id } : null;
}

/** A feed contribution always opens the reporting flow with an explicit target. */
// @req REQ-180
export function SearchFeedContributionAction({
  language,
  target,
  label,
  variant = "accent",
  className,
  preferredKind = "contribution",
}: SearchFeedContributionActionProps) {
  const resolvedTarget = meaningfulTarget(target);
  if (!resolvedTarget) return null;

  const renderTrigger: FlagTargetProps["renderTrigger"] = (open) => (
    <Button
      type="button"
      variant={variant}
      className={cn("min-h-11 text-afh-small", className)}
      onClick={open}
      data-flag-kind={preferredKind}
    >
      {label}
    </Button>
  );

  return (
    <FlagTarget
      language={language}
      target={resolvedTarget}
      preferredKind={preferredKind}
      renderTrigger={renderTrigger}
    />
  );
}
