import type { ReactNode } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import type { Language } from "@/types/shared";

interface SearchFeedFrameProps {
  children: ReactNode;
  language: Language;
}

/**
 * The stable page frame around every answered search-feed state.
 *
 * `PageLayout` supplies the outer page shell and this root supplies the inner
 * search-page shell. The two applications are intentional: together they
 * produce the 24 px content inset measured on the 430 px reference board.
 */
// @req REQ-180
export function SearchFeedFrame({ children, language }: SearchFeedFrameProps) {
  return (
    <PageLayout language={language} hideHeader hideTrail flushTop wide>
      <div className="bg-afh-bg pt-afh-6xl">
        <div
          data-feed-root=""
          className="afh-shell afh-accent-ocre min-w-0 w-full max-w-full overflow-x-clip bg-afh-bg subpixel-antialiased"
        >
          {children}
        </div>
      </div>
    </PageLayout>
  );
}
