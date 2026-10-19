import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";
import {
  readNameStanding,
  readSpellings,
  type NameStanding,
} from "@/lib/patronymes/content";
import {
  addressSpellingOf,
  addressedHistoryNames,
  buildNameAddressDirectory,
} from "@/lib/search/nameAddress";
import { readGaps } from "@/lib/patronymes/content";
import { getTranslation } from "@/lib/translations";
import type { Language } from "@/types/shared";

type PatronymeCopy = ReturnType<typeof getTranslation>["patronymes"];

/** An accented corpus spelling is the name readers see on this fiche. */
// @req REQ-133
export function patronymeDisplayName(patronyme: PublicPatronyme): string {
  const historySpelling = addressSpellingOf(
    buildNameAddressDirectory(addressedHistoryNames(patronyme.nameHistory)),
    patronyme.nameMain
  );
  if (historySpelling) return historySpelling;

  const plainMainName = patronyme.nameMain
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");
  return (
    readSpellings(patronyme.content).find((form) => {
      const plainSpelling = form.spelling
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("fr");
      return (
        plainSpelling === plainMainName &&
        /\p{Diacritic}/u.test(form.spelling.normalize("NFD"))
      );
    })?.spelling ?? patronyme.nameMain
  );
}

/** How many sources the fiche cites, and how many of those a machine wrote. */
function standingSentence(standing: NameStanding, t: PatronymeCopy): string {
  const count =
    standing.sourceCount === 1
      ? t.sourceStanding.countOne
      : t.sourceStanding.countMany.replace(
          "{count}",
          String(standing.sourceCount)
        );

  if (standing.aiGeneratedCount === 0) return `${count}.`;

  const aiShare =
    standing.aiGeneratedCount === 1
      ? t.sourceStanding.aiShareOne
      : t.sourceStanding.aiShareMany.replace(
          "{count}",
          String(standing.aiGeneratedCount)
        );

  return `${count}${aiShare}.`;
}

/**
 * The head of a patronyme fiche: what the name is, — AC1 — the naming system
 * it belongs to, stated in the header rather than left to the reader to infer
 * from which fields the dossier below happens to show, and what the fiche
 * rests on.
 *
 * The standing carries no percentage and no `SourceReviewChip`: DEC-050 rules
 * that a name has neither a confidence row nor a human-audit date, so a figure
 * here would be arithmetic on two terms that are zero by construction. Nor
 * does it name the sources' tier (doctrine §1.1): the reader is told how many
 * sources back the fiche and how many a machine wrote. Only a dossier citing
 * nothing says it is being assembled: the tier of what it cites never
 * decides that (REQ-194).
 */
// @req REQ-133
// @req REQ-147
export function PatronymeFicheTitle({
  patronyme,
  language,
}: {
  patronyme: PublicPatronyme;
  language: Language;
}) {
  const t = getTranslation(language).patronymes;
  const standing = readNameStanding(patronyme.content);
  const displayedName = patronymeDisplayName(patronyme);
  const hasNameSystemGap = readGaps(patronyme.content).some(
    (gap) => gap.fieldPath === "nameSystem"
  );

  return (
    <header className="afh-parchment-head">
      <p className="afh-parchment-eyebrow">{t.eyebrow}</p>
      <h1>{displayedName}</h1>
      {!hasNameSystemGap ? (
        <p className="afh-parchment-lede">
          {t.nameSystemStatementPrefix}{" "}
          {t.nameSystemLabels[patronyme.nameSystem]}
        </p>
      ) : null}
      <p className="afh-parchment-note">
        {standing === null
          ? t.sourceStanding.assembling
          : standingSentence(standing, t)}
      </p>
    </header>
  );
}
