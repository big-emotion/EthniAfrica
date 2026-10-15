import { Fragment } from "react";

import { TileSourceMarker } from "@/components/search/timeline/TileSourceMarker";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameTimelineCopy } from "@/lib/i18n/copy/nameTimeline";
import { splitNamedText } from "@/lib/search/nameTimeline";
import type { Language } from "@/types/shared";

type Account = NameHistory["names"][number]["accounts"][number];

/**
 * The competing readings of a fiche's first name (brief 3, boards
 * language-lingala-*.dc.html): every account of a hypothesis group, side by
 * side from 768 px, numbered in the corpus's order and never ranked
 * (doctrine §1.1), each with its source diamond. The grammar is the
 * timeline's own (`search-state-competing`).
 */
// @req REQ-198
export function FicheNameReadings({
  history,
  language,
}: {
  history: NameHistory;
  language: Language;
}) {
  const copy = nameTimelineCopy[language];
  const [first] = history.names;
  if (!first) return null;
  const forms = history.names.map((name) => name.nameText);
  const groups = new Map<string, Account[]>();
  for (const account of first.accounts) {
    if (!account.hypothesisGroup) continue;
    groups.set(account.hypothesisGroup, [
      ...(groups.get(account.hypothesisGroup) ?? []),
      account,
    ]);
  }
  const competing = [...groups.entries()].filter(
    ([, accounts]) => accounts.length > 1
  );
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
