import Link from "next/link";

import type { PlaceRecord } from "@/api/v2/services/places";
import { FicheNameStory } from "@/components/fiche/FicheNameStory";
import { FicheSection } from "@/components/fiche/FicheSection";
import { FicheSources } from "@/components/fiche/FicheSources";
import { ficheSourceEntries } from "@/lib/afrik/ficheSourceLabel";
import { placeNaming } from "@/lib/fiche/placeNaming";
import { placeCopy } from "@/lib/i18n/copy/place";
import { getCountryRoute, getPeopleRoute } from "@/lib/routing";
import type { FicheSource } from "@/types/afrik";
import type { Language } from "@/types/shared";

export interface PlaceRecordViewProps {
  place: PlaceRecord;
  language: Language;
}

/** The fiche's documented gaps, as the curator wrote them for the reader. */
function gapReasons(content: Record<string, unknown>): string[] {
  if (!Array.isArray(content.gaps)) return [];
  return content.gaps
    .map((gap) => (gap as { reason?: unknown })?.reason)
    .filter(
      (reason): reason is string =>
        typeof reason === "string" && reason.trim() !== ""
    );
}

/**
 * A place's record, on the same parchment chapters as the other fiches:
 * what it is, the history of its names, what it is tied to, what is still
 * unknown, and the sources. A chapter the fiche leaves empty is not drawn.
 */
// @req REQ-196
export function PlaceRecordView({ place, language }: PlaceRecordViewProps) {
  const copy = placeCopy[language];
  const gaps = gapReasons(place.content);
  const sources = ficheSourceEntries(
    Array.isArray(place.content.sources)
      ? (place.content.sources as FicheSource[])
      : []
  );

  return (
    <div className="afh-parchment" id="fiche">
      <FicheSection title={copy.sections.summary}>
        <p>{place.summary}</p>
        <FicheNameStory
          naming={placeNaming(place.id, place.nameHistory)}
          language={language}
        />
      </FicheSection>

      <FicheSection title={copy.sections.related}>
        <h3 className="afh-tile-term">{copy.countryLabel}</h3>
        <p>
          <Link href={getCountryRoute(language, place.country.id)}>
            {place.country.name ?? place.country.id}
          </Link>
        </p>
        {place.associatedPeoples.length > 0 ? (
          <>
            <h3 className="afh-tile-term">{copy.peoplesLabel}</h3>
            <ul className="afh-prose-list">
              {place.associatedPeoples.map((people) => (
                <li key={people.id}>
                  <Link href={getPeopleRoute(language, people.id)}>
                    {people.name ?? people.id}
                  </Link>
                  {people.relation ? <p>{people.relation}</p> : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </FicheSection>

      {gaps.length > 0 ? (
        <FicheSection title={copy.sections.gaps}>
          <ul className="afh-prose-list">
            {gaps.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </FicheSection>
      ) : null}

      {sources.length > 0 ? (
        <FicheSection title={copy.sections.sources} id="sources" as="footer">
          <FicheSources sources={sources} language={language} />
        </FicheSection>
      ) : null}
    </div>
  );
}
