import Link from "next/link";

import {
  ANSWER_ACCENT_CLASS,
  ANSWER_TEXT_BUTTON,
} from "@/components/search/answer/answerStyle";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { AnswerKind } from "@/lib/search/answer";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface PeopleLinkProps {
  count: number;
  href: string;
  kind: AnswerKind;
  language?: Language;
}

/**
 * « See the N peoples »: the way from a family's answer to the peoples it
 * counts. N is the data's, never the copy's. A 44 px target on its own line.
 * @req REQ-178
 */
export function PeopleLink({
  count,
  href,
  kind,
  language = "fr",
}: PeopleLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        ANSWER_ACCENT_CLASS[kind],
        ANSWER_TEXT_BUTTON,
        "no-underline"
      )}
      data-answer-people-link=""
    >
      {searchAnswerCopy[language].where.seePeoples(count)}
    </Link>
  );
}
