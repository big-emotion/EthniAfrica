import { FicheSection } from "@/components/fiche/FicheSection";
import { splitLeadSentence } from "@/lib/fiche/prose";
import { ficheNameStoryCopy } from "@/lib/i18n/copy/ficheNameStory";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import type {
  NamingPresentationForm,
  NamingProjection,
} from "@/lib/search/naming";
import type { Language } from "@/types/shared";

/** Forms shown before the disclosure. Six or more read as a list to skip. */
const FORMS_SHOWN = 5;

/**
 * A lead longer than this is cut at a word and the whole origin goes behind
 * the disclosure. Cutting is safe only because the full text stays one tap
 * away; a fiche's lead sentence is otherwise never rewritten.
 */
const LEAD_LIMIT = 240;

export interface FicheNameStoryProps {
  naming: NamingProjection;
  language: Language;
  /**
   * Stand alone as the fiche's first chapter, for the classes that have no
   * « En bref » to sit in. Absent, the block is drawn inside the section that
   * already carries a heading.
   */
  chapter?: boolean;
}

function cutAtWord(sentence: string): string {
  if (sentence.length <= LEAD_LIMIT) return sentence;
  const head = sentence.slice(0, LEAD_LIMIT);
  return `${head.slice(0, head.lastIndexOf(" "))}…`;
}

function tagsOf(form: NamingPresentationForm, language: Language): string[] {
  const tags = [
    form.qualifier,
    form.origin?.period ?? form.attestationPeriod,
    form.problematic === "recorded"
      ? nameAnswerCopy[language].problematicMark
      : undefined,
  ].filter((tag): tag is string => Boolean(tag));
  return [...new Set(tags)];
}

function FormRow({
  form,
  language,
}: {
  form: NamingPresentationForm;
  language: Language;
}) {
  const words = ficheNameStoryCopy[language];
  const tags = tagsOf(form, language);
  const sense = [
    form.origin?.meaning,
    form.origin?.imposedBy
      ? `${words.imposedBy} ${form.origin.imposedBy}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      className="fiche-name-story__form"
      data-testid="name-story-form"
      data-form={form.form}
      data-self-given={form.selfGiven === true ? "true" : undefined}
    >
      <span className="fiche-name-story__name">
        {form.form}
        {form.selfGiven === true ? (
          <>
            <span className="fiche-name-story__mark" aria-hidden="true" />
            <span className="sr-only">
              {nameAnswerCopy[language].selfGivenMark}
            </span>
          </>
        ) : null}
      </span>
      {tags.length > 0 ? (
        <span className="fiche-name-story__tag">{tags.join(" · ")}</span>
      ) : null}
      {sense ? <p className="fiche-name-story__sense">{sense}</p> : null}
    </li>
  );
}

/**
 * The history of a fiche's names, drawn from `readNaming` alone.
 *
 * Every text on it is a field the fiche holds. The sentence under the question
 * is the lead sentence of the origin as the curator wrote it, so an origin the
 * fiche calls « not established » stays unasserted here; a form's tag and line
 * appear only when a name record states them. Nothing is derived, and a fiche
 * with no form and no origin draws nothing — not an announcement that it has
 * none.
 *
 * The name a people gives itself is listed first. That is an order: every form
 * keeps the same element and the same weight.
 */
// @req REQ-151
export function FicheNameStory({
  naming,
  language,
  chapter = false,
}: FicheNameStoryProps) {
  const words = ficheNameStoryCopy[language];
  const origin = naming.origin?.trim();
  const forms = [...naming.presentation.forms].sort(
    (a, b) => Number(b.selfGiven === true) - Number(a.selfGiven === true)
  );
  if (forms.length === 0 && !origin) return null;

  const { lead, rest } = origin
    ? splitLeadSentence(origin)
    : { lead: "", rest: null };
  const shownLead = cutAtWord(lead);
  const remainder = shownLead !== lead ? origin : rest;
  const visible = forms.slice(0, FORMS_SHOWN);
  const hidden = forms.slice(FORMS_SHOWN);

  const body = (
    <div className="fiche-name-story" data-testid="fiche-name-story">
      {chapter ? null : (
        <p className="fiche-name-story__eyebrow">{words.eyebrow}</p>
      )}
      {origin ? (
        <>
          <h3 className="fiche-name-story__ask">
            {forms.length > 1 ? words.askSeveral : words.askOne}
          </h3>
          <p className="fiche-name-story__lead" data-testid="name-story-lead">
            {shownLead}
          </p>
          {remainder ? (
            <details
              className="fiche-name-story__disclosure"
              data-name-story-more
            >
              <summary>{words.readMore}</summary>
              <p>{remainder}</p>
            </details>
          ) : null}
        </>
      ) : null}
      {forms.length > 0 ? (
        <ul className="fiche-name-story__forms">
          {visible.map((form) => (
            <FormRow key={form.form} form={form} language={language} />
          ))}
        </ul>
      ) : null}
      {hidden.length > 0 ? (
        <details className="fiche-name-story__disclosure" data-name-story-extra>
          <summary>{words.moreForms(hidden.length)}</summary>
          <ul className="fiche-name-story__forms">
            {hidden.map((form) => (
              <FormRow key={form.form} form={form} language={language} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );

  return chapter ? (
    <FicheSection title={words.eyebrow}>{body}</FicheSection>
  ) : (
    body
  );
}
