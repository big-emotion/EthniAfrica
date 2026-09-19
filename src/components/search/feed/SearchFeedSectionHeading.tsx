import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SearchFeedSectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  id?: string;
  className?: string;
}

/** A feed section's single named heading, optional explanation and action. */
// @req REQ-180
export function SearchFeedSectionHeading({
  title,
  subtitle,
  action,
  id,
  className,
}: SearchFeedSectionHeadingProps) {
  return (
    <header className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-baseline justify-between gap-afh-lg">
        <h2
          id={id}
          className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] text-afh-text"
        >
          {title}
        </h2>
        {action ? <div className="-my-[9px] shrink-0">{action}</div> : null}
      </div>
      {subtitle ? (
        <p className="mt-afh-xs text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
