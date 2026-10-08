import Link from "next/link";

import {
  ANSWER_ACCENT_CLASS,
  ANSWER_BLOCK,
  ANSWER_SUBHEADING,
} from "@/components/search/answer/answerStyle";
import type { AnswerKind } from "@/lib/search/answer";
import { cn } from "@/lib/utils";

export interface NameChoice {
  kind: AnswerKind;
  /** What the card leads to, in a word (« Famille de langues »). */
  eyebrow: string;
  label: string;
  href: string;
}

export interface NameChoicesProps {
  title: string;
  choices: readonly NameChoice[];
}

/**
 * « What are you looking for? »: a name that is two things at once (a family
 * of languages and the peoples who speak them) is offered as ways in, not as
 * two full answers. Each card takes the accent of what it leads to — an
 * object of another kind that says so (brand charter §5.2) — and none is
 * larger than another. A single way in is no choice, so nothing is drawn.
 * @req REQ-178
 */
export function NameChoices({ title, choices }: NameChoicesProps) {
  if (choices.length < 2) return null;

  return (
    <section
      className={cn(ANSWER_BLOCK, "flex flex-col gap-afh-md")}
      data-answer-block="choices"
    >
      <h2 className={ANSWER_SUBHEADING}>{title}</h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-afh-md p-0">
        {choices.map((choice) => (
          <li key={choice.href} className="flex">
            <Link
              href={choice.href}
              className={cn(
                ANSWER_ACCENT_CLASS[choice.kind],
                "flex min-h-11 w-full flex-col gap-afh-sm rounded-afh-xl border border-afh-border bg-afh-surface p-afh-xl text-afh-text no-underline focus-visible:outline-none focus-visible:shadow-[var(--afh-ring-focus)]"
              )}
            >
              <span className="text-afh-eyebrow font-bold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[0.1em] text-[color:var(--accent-ink)]">
                {choice.eyebrow}
              </span>
              <strong className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] [overflow-wrap:anywhere]">
                {choice.label}
              </strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
