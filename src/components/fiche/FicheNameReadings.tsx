import { Fragment } from "react";

import { TileSourceMarker } from "@/components/search/timeline/TileSourceMarker";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameTimelineCopy } from "@/lib/i18n/copy/nameTimeline";
import { splitNamedText } from "@/lib/search/nameTimeline";
import type { Language } from "@/types/shared";

type Account = NameHistory["names"][number]["accounts"][number];

type Name = NameHistory["names"][number];

/**
 * The hypothesis groups of a name that hold more than one account: the
 * competing readings of its origin, in the corpus's order.
 */
// @req REQ-198
export function competingReadings(name: Name): Array<[string, Account[]]> {
  const groups = new Map<string, Account[]>();
  for (const account of name.accounts) {
    if (!account.hypothesisGroup) continue;
    groups.set(account.hypothesisGroup, [
      ...(groups.get(account.hypothesisGroup) ?? []),
      account,
    ]);
  }
  return [...groups.entries()].filter(([, accounts]) => accounts.length > 1);
}

/**
 * The competing readings of a fiche's name (brief 3, boards
 * language-lingala-*.dc.html): every account of a hypothesis group, side by
 * side from 768 px, numbered in the corpus's order and never ranked
 * (doctrine §1.1), each with its source diamond. The grammar is the
 * timeline's own (`search-state-competing`). The first name by default; a
 * country fiche folds each name's readings under its row (brief 5).
 */
// @req REQ-198
export function FicheNameReadings({
  history,
  language,
  nameText,
}: {
  history: NameHistory;
  language: Language;
  nameText?: string;
}) {
  const copy = nameTimelineCopy[language];
  const first = nameText
    ? history.names.find((name) => name.nameText === nameText)
    : history.names[0];
  if (!first) return null;
  const forms = history.names.map((name) => name.nameText);
  const competing = competingReadings(first);
  if (competing.length === 0) return null;

  return (
    <>
      {competing.map(([group, accounts]) => (
        <div
          key={group}
          data-readings=""
          className="afh-tile mt-afh-2xl flex flex-col gap-afh-lg text-left"
        >
          <p className="afh-name-timeline-hypotheses">
            <Named
              text={copy.hypothesesHeading(first.nameText)}
              forms={[first.nameText]}
            />
          </p>
          <div className="grid grid-cols-1 gap-afh-2xl md:grid-cols-2">
            {accounts.map((account, index) => {
              const anchorId = `reading-${group}-${index}`
                .normalize("NFD")
                .replace(/[^\w-]+/g, "-");
              return (
                <div key={anchorId} className="afh-name-timeline-hypothesis">
                  <p className="afh-name-timeline-tag">
                    <span>{copy.hypothesis(index + 1)}</span>
                    <span> · {account.period.label}</span>
                  </p>
                  <p className="afh-name-timeline-statement">
                    <Named text={account.statement} forms={forms} />
                    {" "}
                    <TileSourceMarker
                      statement={account.statement}
                      sources={account.sources}
                      anchorId={anchorId}
                      language={language}
                      surface="fiche"
                    />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function Named({ text, forms }: { text: string; forms: string[] }) {
  return (
    <>
      {splitNamedText(text, forms).map((part, index) =>
        part.name ? (
          <em key={index}>{part.text}</em>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
