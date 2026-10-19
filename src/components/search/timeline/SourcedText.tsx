import { Fragment, type ReactNode } from "react";

import {
  splitAtLastWord,
  splitNamedText,
  type NamedTextPart,
} from "@/lib/search/nameTimeline";
import { normalizeFrenchSpacing } from "@/lib/prose/frenchSpacing";

function NamedParts({ parts }: { parts: readonly NamedTextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.name ? (
          <em key={index}>{normalizeFrenchSpacing(part.text)}</em>
        ) : (
          <Fragment key={index}>{normalizeFrenchSpacing(part.text)}</Fragment>
        )
      )}
    </>
  );
}

/** A sentence with the names it cites set in italics. */
// @req REQ-198
export function NamedText({
  text,
  forms,
}: {
  text: string;
  forms: readonly string[];
}) {
  return <NamedParts parts={splitNamedText(text, forms)} />;
}

/**
 * A passage ended by its sources button (brief 11 §3). The last word and the
 * button sit in one inline block, `afh-source-tail`, so they move to the next
 * line together; the no-break space keeps the gap between them.
 */
// @req REQ-194
// @req REQ-198
export function SourcedText({
  text,
  forms,
  children,
}: {
  text: string;
  forms: readonly string[];
  /** The sources button. */
  children: ReactNode;
}) {
  const [head, tail] = splitAtLastWord(splitNamedText(text, forms));
  return (
    <>
      <NamedParts parts={head} />
      <span className="afh-source-tail">
        <NamedParts parts={tail} />
        {" "}
        {children}
      </span>
    </>
  );
}
