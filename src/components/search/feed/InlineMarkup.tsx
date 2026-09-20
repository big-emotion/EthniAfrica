import { Fragment, type ReactNode } from "react";

const REVIEWED_INLINE_MARKUP =
  /<(strong|em|sup)>(.*?)<\/\1>|<span style="font-weight: 400; color: [^"]+;">(.*?)<\/span>/g;

function reviewedNode(
  tag: string | undefined,
  content: string,
  key: number
): ReactNode {
  if (tag === "strong") return <strong key={key}>{content}</strong>;
  if (tag === "em") return <em key={key}>{content}</em>;
  if (tag === "sup") {
    // The boards keep the browser's default superscript (font-size: smaller,
    // normal line height); Tailwind's reset would shrink it to 75% and zero its
    // line height, which changes the line box around an ordinal.
    return (
      <sup
        key={key}
        className="[font-size:smaller] [line-height:normal] [position:static] [vertical-align:super]"
      >
        {content}
      </sup>
    );
  }
  return (
    <span key={key} className="font-normal text-afh-text-soft">
      {content}
    </span>
  );
}

/**
 * Renders only the small inline emphasis vocabulary used by reviewed feed
 * copy. Every other tag remains inert text; no HTML is injected into the DOM.
 */
// @req REQ-180
export function InlineMarkup({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(REVIEWED_INLINE_MARKUP)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    nodes.push(reviewedNode(match[1], match[2] ?? match[3] ?? "", index));
    cursor = index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <Fragment>{nodes}</Fragment>;
}
