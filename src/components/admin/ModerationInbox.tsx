import { InboxThreadPanel } from "@/components/admin/InboxThreadPanel";
import { QueueRow } from "@/components/admin/ModerationQueue";
import type { ModerationInbox as Inbox } from "@/api/v2/services/moderationInbox";
import { moderationConsoleCopy } from "@/lib/i18n/copy/moderationConsole";
import type { Language } from "@/types/shared";

export interface ModerationInboxProps {
  language: Language;
  inbox: Inbox;
}

/**
 * The console's default view (REQ-214): fiche, then block, then thread, in
 * the order `listModerationInbox` decided. Each thread is the flat queue's row
 * — same status moves, same case file — with the discussion slotted inside.
 */
// @req REQ-214
export function ModerationInbox({ language, inbox }: ModerationInboxProps) {
  const copy = moderationConsoleCopy[language].inbox;

  if (inbox.fiches.length === 0) {
    return <p className="text-afh-small text-afh-text-soft">{copy.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-afh-xl" data-testid="moderation-inbox">
      {inbox.truncated && (
        <p className="text-afh-small text-afh-text-soft">{copy.truncated}</p>
      )}

      {inbox.fiches.map((fiche) => {
        const isGeneral = fiche.entity_type == null;
        const ficheKey = isGeneral
          ? "general"
          : `${fiche.entity_type}:${fiche.entity_id}`;
        return (
          <section className="flex flex-col gap-afh-lg" key={ficheKey}>
            <header>
              <h2 className="text-afh-h3">
                {isGeneral
                  ? copy.generalGroup
                  : `${copy.entityTypes[fiche.entity_type] ?? fiche.entity_type} · ${fiche.entity_id}`}
              </h2>
              <p className="text-afh-caption text-afh-text-soft">
                {copy.openCount(fiche.open_count)}
              </p>
            </header>

            {fiche.blocks.map((block) => (
              <div
                className="flex flex-col gap-afh-md"
                key={block.block_key ?? "fiche"}
              >
                {!isGeneral && (
                  <h3 className="text-afh-body font-semibold">
                    {block.section
                      ? (copy.sections[block.section] ?? block.section)
                      : copy.wholeFiche}
                  </h3>
                )}
                <ul className="flex flex-col gap-afh-lg">
                  {block.threads.map((thread) => (
                    <QueueRow
                      key={thread.id}
                      language={language}
                      report={thread}
                    >
                      <InboxThreadPanel language={language} thread={thread} />
                    </QueueRow>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
