import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";
import { FicheSection } from "@/components/fiche/FicheSection";
import { FieldProvenanceMarker } from "@/components/fiche/FieldProvenanceMarker";
import {
  readGaps,
  readOrigin,
  type OriginAccount,
} from "@/lib/patronymes/content";
import { resolveChapter } from "@/lib/fieldProvenance";
import { getTranslation } from "@/lib/translations";
import type { Language } from "@/types/shared";

type PatronymeCopy = ReturnType<typeof getTranslation>["patronymes"];

/**
 * What the record says about who carried an oral account and how it was
 * collected, and nothing it does not say. A carrier the record does not state
 * is said to be unstated rather than left out, so the silence is visible; a
 * griot is named only where the record names one.
 */
function OralProvenance({
  account,
  t,
}: {
  account: OriginAccount;
  t: PatronymeCopy;
}) {
  const carrier = account.carrier ?? account.griot;
  let collected: string | null = null;
  if (account.collection === "direct") {
    collected = t.oralCollectedDirectly;
  } else if (account.collection === "mediated") {
    collected = account.collector
      ? `${t.oralCollectedByPrefix} ${account.collector}.`
      : t.oralCollectedByIntermediary;
  }

  return (
    <>
      {" "}
      {carrier
        ? `${t.oralAttributionPrefix} ${carrier}.`
        : t.oralCarrierNotStated}
      {collected ? ` ${collected}` : null}
      {account.context ? ` ${account.context}.` : null}
    </>
  );
}

/**
 * Where a name is said to come from.
 *
 * Three parallel lists rather than one classified origin, because that is
 * what the corpus writes and what the subject needs: a carried oral account
 * and a colonial chronicle are two testimonies about the same name, and
 * ranking one as *the* origin would decide by format what the sources leave
 * open.
 *
 * An oral tradition is presented with its carrier and collection as the record
 * states them, never as a bare fact — a fiche that dropped that attribution
 * would make one carrier's account read as our own claim.
 *
 * The section is printed whether or not the corpus fills it (atlas charter
 * §4). It used to return null on a shape mismatch, which removed it from the
 * page *and* from the chapter rail — the rail reads its entries from the
 * rendered DOM, so the omission hid its own evidence.
 */
// @req REQ-133
export function PatronymeOriginSection({
  patronyme,
  language,
}: {
  patronyme: PublicPatronyme;
  language: Language;
}) {
  const t = getTranslation(language).patronymes;
  const origin = readOrigin(patronyme.content);
  const gaps = readGaps(patronyme.content);

  const strands: Array<{
    label: string;
    accounts: OriginAccount[];
    oral?: boolean;
  }> = [
    {
      label: t.originOralTraditionsLabel,
      accounts: origin.oralTraditions,
      oral: true,
    },
    {
      label: t.originWrittenChroniclesLabel,
      accounts: origin.writtenChronicles,
    },
    {
      label: t.originLinguisticReconstructionsLabel,
      accounts: origin.linguisticReconstructions,
    },
  ].filter((strand) => strand.accounts.length > 0);

  const chapter = resolveChapter(
    "name",
    "origin",
    strands.length > 0 ? strands : null,
    gaps
  );

  return (
    <FicheSection title={t.originTitle}>
      {strands.length > 0 ? (
        strands.map((strand) => (
          <div key={strand.label}>
            <h3 className="afh-prose-heading">{strand.label}</h3>
            <ul className="afh-prose-list">
              {strand.accounts.map((account) => (
                <li key={account.claim}>
                  {account.claim}
                  {account.claimStatus ? (
                    <> — {t.originClaimStatusLabels[account.claimStatus]}</>
                  ) : null}
                  {strand.oral ? (
                    <OralProvenance account={account} t={t} />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <FieldProvenanceMarker
          state={chapter.state}
          reason={chapter.reason}
          language={language}
        />
      )}
      {origin.oralTraditions.length > 0 ? (
        <p className="afh-parchment-note">{t.oralOriginNote}</p>
      ) : null}
    </FicheSection>
  );
}
