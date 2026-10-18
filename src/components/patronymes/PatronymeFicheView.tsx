import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";
import type { Language } from "@/types/shared";
import { PatronymeNamingSystemSection } from "@/components/patronymes/PatronymeNamingSystemSection";
import { PatronymeOriginSection } from "@/components/patronymes/PatronymeOriginSection";
import { PatronymeAssociationsSection } from "@/components/patronymes/PatronymeAssociationsSection";
import { PatronymeAlliancesSection } from "@/components/patronymes/PatronymeAlliancesSection";
import { PatronymeHomonymsSection } from "@/components/patronymes/PatronymeHomonymsSection";
import { PatronymeBearersSection } from "@/components/patronymes/PatronymeBearersSection";
import { PatronymeSourcesSection } from "@/components/patronymes/PatronymeSourcesSection";
import {
  NameClosingBand,
  NameFicheSourcesBlock,
  NameNextStep,
} from "@/components/search/timeline/NameClosing";
import { FicheStoryLink } from "@/components/fiche/FicheStoryLink";
import { nameStoryLink } from "@/lib/search/nameClosing";
import { patronymeSilences } from "@/lib/fiche/ficheNameClosing";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { readGaps, readHomonyms } from "@/lib/patronymes/content";

/**
 * The parchment of a name fiche, in the order a reader meets a name's facts:
 * what it is, what sources describe it, where it comes from, where it reaches,
 * who it is allied with, what else answers to the same string, who is known to
 * carry it, what remains unknown, and what all of that rests on.
 *
 * Every chapter here is one the strict model declares, and every one is
 * printed whether or not the corpus fills it (atlas charter §4). Three of
 * them — alliances, homonyms, sources — had no section at all until now,
 * although the corpus carries sources on all 30 dossiers, and the filiation
 * section that stood here read `content.filiationClaims`, a key no model and
 * no dossier has ever had.
 *
 * The bibliography stays last behind « La liste »; its `#sources` anchor is
 * shared with every source review chip.
 */
// @req REQ-133
export function PatronymeFicheView({
  patronyme,
  language,
  nextSteps = [],
}: {
  patronyme: PublicPatronyme;
  language: Language;
  nextSteps?: Parameters<typeof NameNextStep>[0]["cards"];
}) {
  const history = patronyme.nameHistory;
  const gaps = readGaps(patronyme.content);
  const story = nameStoryLink(
    {
      type: "patronyme",
      id: patronyme.id,
      name: patronyme.nameMain,
      content: patronyme.content,
    },
    history,
    language
  );

  return (
    <div className="afh-parchment" id="fiche">
      <PatronymeNamingSystemSection patronyme={patronyme} language={language} />
      {history ? (
        <>
          <NameFicheSourcesBlock
            history={history}
            subjectType="patronyme"
            language={language}
          />
          <FicheStoryLink
            story={story}
            from="name"
            language={language}
            familyName
          />
        </>
      ) : null}
      <PatronymeOriginSection patronyme={patronyme} language={language} />
      <PatronymeAssociationsSection patronyme={patronyme} language={language} />
      <PatronymeAlliancesSection patronyme={patronyme} language={language} />
      <PatronymeHomonymsSection patronyme={patronyme} language={language} />
      <PatronymeBearersSection patronyme={patronyme} language={language} />
      {/* Before the bibliography, not after it: the reader this block exists
          for is the one who finished the reading, and almost none of them
          scroll past a source list to find out what to read next. */}
      {history && history.names.length > 0 ? (
        <NameClosingBand
          silences={patronymeSilences(
            history,
            {
              gapFieldPaths: gaps.map((gap) => gap.fieldPath),
              homonymCount: readHomonyms(patronyme.content).length,
            },
            language
          )}
          contributionTarget={{
            type: "name",
            id: patronyme.id,
            name: patronyme.nameMain,
            fieldPath: "naming",
            fieldLabel: nameAnswerCopy[language].appellations,
          }}
          language={language}
        />
      ) : null}
      <NameNextStep cards={nextSteps} language={language} trackFrom="name" />
      <PatronymeSourcesSection patronyme={patronyme} language={language} />
    </div>
  );
}
