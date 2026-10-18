import Link from "next/link";

import type { PlaceRecord } from "@/api/v2/services/places";
import { FicheNameReadings } from "@/components/fiche/FicheNameReadings";
import { FicheNameStory } from "@/components/fiche/FicheNameStory";
import { FicheStoryLink } from "@/components/fiche/FicheStoryLink";
import { FicheSection } from "@/components/fiche/FicheSection";
import { FicheSources } from "@/components/fiche/FicheSources";
import {
  NameClosingBand,
  NameFicheSourcesBlock,
  NameNextStep,
} from "@/components/search/timeline/NameClosing";
import { TileSourceMarker } from "@/components/search/timeline/TileSourceMarker";
import { ficheSourceEntries } from "@/lib/afrik/ficheSourceLabel";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { placeNaming } from "@/lib/fiche/placeNaming";
import { placeCopy } from "@/lib/i18n/copy/place";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { nameStoryLink, type NextStepCard } from "@/lib/search/nameClosing";
import { getCountryRoute, getPeopleRoute } from "@/lib/routing";
import type { FicheSource } from "@/types/afrik";
import type { Language } from "@/types/shared";

export interface PlaceRecordViewProps {
  place: PlaceRecord;
  language: Language;
  nextSteps?: NextStepCard[];
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
export function PlaceRecordView({
  place,
  language,
  nextSteps = [],
}: PlaceRecordViewProps) {
  const copy = placeCopy[language];
  const gaps = gapReasons(place.content);
  const history = place.nameHistory;
  const sources = ficheSourceEntries(
    Array.isArray(place.content.sources)
      ? (place.content.sources as FicheSource[])
      : []
  );
  const firstName = history?.names[0];
  const isYamoussoukro = place.id === "LOC_YAMOUSSOUKRO";
  const familyAccount = isYamoussoukro
    ? firstName?.accounts.find(
        (account) =>
          account.period.label === copy.sections.familyAccountPeriod &&
          account.statement.includes("Yaha M'so")
      )
    : undefined;
  const readingsHistory =
    history && isYamoussoukro
      ? ({
          ...history,
          names: history.names.map((name, index) =>
            index === 0
              ? {
                  ...name,
                  accounts: name.accounts.filter(
                    (account) =>
                      account.hypothesisGroup === "origine du nom" &&
                      account !== familyAccount
                  ),
                }
              : name
          ),
        } as NameHistory)
      : history;
  const story = nameStoryLink(
    {
      type: "place",
      id: place.id,
      name: place.nameMain,
      content: place.content,
    },
    history,
    language
  );

  return (
    <div className="afh-parchment" id="fiche">
      <FicheSection title={copy.sections.summary}>
        <p>{place.summary}</p>
        <FicheNameStory
          naming={placeNaming(place.id, place.nameHistory)}
          language={language}
          storyLink={
            story ? (
              <FicheStoryLink
                story={story}
                from="place"
                language={language}
                copyOverride={{
                  linkLabel: copy.storyLinkLabel(story.name),
                  hint: copy.storyLinkHint,
                }}
              />
            ) : null
          }
        />
        {readingsHistory && firstName ? (
          <FicheNameReadings
            history={readingsHistory}
            language={language}
            nameText={firstName.nameText}
            title={isYamoussoukro ? copy.sections.hypothesesLead : undefined}
          />
        ) : null}
        {familyAccount ? (
          <div className="ea-readings-family afh-tile mt-afh-2xl flex flex-col gap-afh-md text-left">
            <p className="afh-name-timeline-tag">
              {copy.sections.familyAccount} · {familyAccount.period.label}
            </p>
            <p className="afh-name-timeline-statement">
              {familyAccount.statement}
              <TileSourceMarker
                statement={familyAccount.statement}
                sources={familyAccount.sources}
                anchorId="place-yamoussoukro-family-account"
                language={language}
                surface="fiche"
              />
            </p>
            <p className="text-afh-small text-afh-text-soft">
              Selon{" "}
              {[
                ...new Set(
                  familyAccount.sources.map((source) => source.author)
                ),
              ].join(", ")}
              .
            </p>
          </div>
        ) : null}
      </FicheSection>

      {history ? (
        <NameFicheSourcesBlock
          history={history}
          subjectType="place"
          language={language}
        />
      ) : null}

      <FicheSection title={copy.sections.related}>
        <h3 className="afh-tile-term">{copy.countryLabel}</h3>
        {place.countries.length === 1 ? (
          <p>
            <Link href={getCountryRoute(language, place.countries[0].id)}>
              {place.countries[0].name ?? place.countries[0].id}
            </Link>
          </p>
        ) : (
          <ul className="afh-prose-list">
            {place.countries.map((country) => (
              <li key={country.id}>
                <Link href={getCountryRoute(language, country.id)}>
                  {country.name ?? country.id}
                </Link>
              </li>
            ))}
          </ul>
        )}
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
        <NameClosingBand
          silences={gaps}
          contributionTarget={
            history
              ? {
                  type: "place",
                  id: place.id,
                  name: place.nameMain,
                  fieldPath: "naming",
                  fieldLabel: nameAnswerCopy[language].appellations,
                }
              : undefined
          }
          language={language}
        />
      ) : null}

      <NameNextStep cards={nextSteps} language={language} trackFrom="place" />

      {sources.length > 0 ? (
        <FicheSection title={copy.sections.sources} id="sources" as="footer">
          <FicheSources sources={sources} language={language} />
        </FicheSection>
      ) : null}
    </div>
  );
}
