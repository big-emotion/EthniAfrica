import { violatesReaderRegister } from "@/lib/editorial/readerRegister";
import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import {
  publicAgentCopy,
  type AgentSubjectKind,
  type OriginMarker,
  type SourcesMarker,
} from "@/lib/i18n/copy/publicAgent";
import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageRoute,
  getNameAnswerRoute,
  getPatronymeRoute,
  getPeopleRoute,
} from "@/lib/routing";
import type { SearchAnswer } from "@/lib/search/answer";
import type { SearchEvidence } from "@/lib/search/evidence";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import {
  formKey,
  type NamingClaimStatus,
  type NamingPresentationForm,
  type NamingProjection,
} from "@/lib/search/naming";
import { resolveSiteUrl } from "@/lib/siteUrl";

/**
 * The public agent's answer for one subject, in the approved frame.
 *
 * Built only from what the search service already projects (`naming`,
 * `answer`): the agent writes no sentence about a name that the fiche does not
 * write, and a marker the data gives no ground for stays `null` rather than a
 * guess. A source reaches the agent as its title and its type; its tier is an
 * audit field and never leaves this module.
 */

const copy = publicAgentCopy.fr;
const MAX_LEADS = 4;

export interface AgentSubjectInput {
  kind: AgentSubjectKind;
  id: string;
  title: string;
  naming?: NamingProjection;
  answer?: SearchAnswer;
  /** Names the corpus graph links to, read off the fiche or the search row. */
  graph?: {
    familyId?: string;
    familyName?: string;
    peoples?: Array<{ id: string; name?: string }>;
  };
}

export interface AgentSource {
  titre: string;
  type: string;
  url?: string;
}

export interface AgentAccount {
  texte: string;
  statut?: SourcesMarker;
  sources: AgentSource[];
}

export interface AgentLead {
  libelle: string;
  url: string;
}

export interface AgentFrame {
  type: AgentSubjectKind;
  id: string;
  nom: string;
  forme: string;
  fiche: string;
  reperes: { origine: OriginMarker | null; sources: SourcesMarker | null };
  enBref: string;
  langue?: string;
  sensEtPourquoi: string[];
  recits: AgentAccount[];
  autresNoms: string[];
  croyances: string[];
  inconnu: string[];
  pistes: AgentLead[];
}

const ROUTE_OF: Record<AgentSubjectKind, (id: string) => string> = {
  people: (id) => getPeopleRoute("fr", id),
  country: (id) => getCountryRoute("fr", id),
  language: (id) => getLanguageRoute("fr", id),
  languageFamily: (id) => getFamilyRoute("fr", id),
  patronyme: (id) => getPatronymeRoute("fr", id),
};

const SOURCES_MARKER_OF: Record<NamingClaimStatus, SourcesMarker> = {
  established: "etabli",
  contested: "discute",
  claimed: "rapporte",
};

function absolute(path: string): string {
  return `${resolveSiteUrl().replace(/\/$/, "")}${path}`;
}

/** Accents and case ignored, as the search itself matches. */
function fold(value: string): string {
  return formKey(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function readable(text: string | undefined): string | undefined {
  const trimmed = text?.trim();
  return trimmed && !violatesReaderRegister(trimmed) ? trimmed : undefined;
}

/**
 * The form the answer is about: the one the reader searched where it is
 * among the subject's names, else the name the group gives itself, else the
 * first name the fiche lists (doctrine §1.1).
 */
function focusForm(
  subject: AgentSubjectInput,
  query: string | undefined
): NamingPresentationForm | undefined {
  const forms = subject.naming?.presentation?.forms ?? [];
  const searched = query
    ? forms.find((form) => fold(form.form) === fold(query))
    : undefined;
  return searched ?? forms.find((form) => form.selfGiven === true) ?? forms[0];
}

function originMarker(
  form: NamingPresentationForm | undefined,
  naming: NamingProjection | undefined
): OriginMarker | null {
  if (!form) return null;
  if (form.selfGiven === true) return "interieur";
  if (form.selfGiven !== false) return null;
  // An outside name the group also gives itself today: the fiche records it
  // both as given by others and as its own name.
  return naming?.selfGiven && fold(naming.selfGiven) === fold(form.form)
    ? "venu_d_ailleurs_puis_repris"
    : "venu_d_ailleurs";
}

function sourcesMarker(
  form: NamingPresentationForm | undefined,
  answer: SearchAnswer | undefined
): SourcesMarker | null {
  const accounts = answer?.origin?.accounts ?? [];
  const statuses = [
    form?.claimStatus,
    ...accounts.map(({ claimStatus }) => claimStatus),
  ].filter((status): status is NamingClaimStatus => Boolean(status));
  if (answer?.origin?.debated || statuses.includes("contested")) {
    return "discute";
  }
  return statuses.length ? SOURCES_MARKER_OF[statuses[0]] : null;
}

function sourcesOf(evidence: readonly SearchEvidence[]): AgentSource[] {
  const seen = new Map<string, AgentSource>();
  for (const { sources } of evidence) {
    for (const source of sources) {
      if (seen.has(source.id)) continue;
      seen.set(source.id, {
        titre: source.title,
        type: sourceKindLabel(source.sourceKind, "fr"),
        ...(source.url ? { url: source.url } : {}),
      });
    }
  }
  return [...seen.values()];
}

function hasOralSource(evidence: readonly SearchEvidence[]): boolean {
  return evidence.some(({ sources }) =>
    sources.some((source) => source.sourceKind === "oral_tradition")
  );
}

function leadsOf(
  subject: AgentSubjectInput,
  form: string,
  siblings: readonly AgentSubjectInput[]
): AgentLead[] {
  const leads: AgentLead[] = [];
  const { graph = {}, answer } = subject;
  if (graph.familyId && subject.kind !== "languageFamily") {
    leads.push({
      libelle: copy.familyLead(graph.familyName),
      url: absolute(getFamilyRoute("fr", graph.familyId)),
    });
  }
  for (const people of graph.peoples ?? []) {
    leads.push({
      libelle: copy.peopleLead(people.name),
      url: absolute(getPeopleRoute("fr", people.id)),
    });
  }
  for (const row of answer?.where?.rows ?? []) {
    if ("countryId" in row && subject.kind !== "country") {
      leads.push({
        libelle: copy.countryLead(row.countryId),
        url: absolute(getCountryRoute("fr", row.countryId)),
      });
    } else if ("peopleId" in row) {
      leads.push({
        libelle: copy.peopleLead(undefined),
        url: absolute(getPeopleRoute("fr", row.peopleId)),
      });
    }
  }
  for (const sibling of siblings) {
    if (sibling.kind === subject.kind && sibling.id === subject.id) continue;
    leads.push({
      libelle: copy.sameNameLead(sibling.kind, sibling.title),
      url: absolute(ROUTE_OF[sibling.kind](sibling.id)),
    });
  }
  const unique = [...new Map(leads.map((lead) => [lead.url, lead])).values()];
  // The page of the name is always reachable, so no subject leaves the agent
  // without somewhere to go next.
  if (!unique.length && form) {
    unique.push({
      libelle: copy.nameLink(form),
      url: absolute(getNameAnswerRoute("fr", form)),
    });
  }
  return unique.slice(0, MAX_LEADS);
}

// @req REQ-178
export function buildAgentFrame(
  subject: AgentSubjectInput,
  options: {
    query?: string;
    nameAnswers?: readonly NameAnswer[];
    siblings?: readonly AgentSubjectInput[];
  } = {}
): AgentFrame {
  const { naming, answer } = subject;
  const form = focusForm(subject, options.query);
  const formText = form?.form ?? subject.title;
  const accounts = answer?.origin?.accounts ?? [];
  const reviewed = options.nameAnswers?.find(({ subjects }) =>
    subjects.some(({ type, id }) => type === subject.kind && id === subject.id)
  );

  const recits: AgentAccount[] = accounts.flatMap((account) => {
    const texte = readable(account.text);
    if (!texte) return [];
    return [
      {
        texte,
        ...(account.claimStatus
          ? { statut: SOURCES_MARKER_OF[account.claimStatus] }
          : {}),
        sources: sourcesOf(account.evidence),
      },
    ];
  });

  const sensEtPourquoi: string[] = [];
  const meaning = readable(form?.origin?.meaning);
  if (meaning) sensEtPourquoi.push(copy.meaningLine(meaning));
  const by = readable(form?.origin?.imposedBy);
  const period = readable(form?.origin?.period);
  if (by || period) sensEtPourquoi.push(copy.givenBy(by, period));

  const autresNoms = (answer?.names ?? [])
    .filter((name) => fold(name.form) !== fold(formText))
    .map((name) =>
      [
        name.form,
        name.selfGiven === true ? copy.selfGivenNote : undefined,
        readable(name.shortLine),
        name.period,
      ]
        .filter(Boolean)
        .join(", ")
    );

  const croyances = [readable(naming?.problem)].filter(Boolean) as string[];

  const allEvidence = [
    ...(form?.evidence ?? []),
    ...accounts.flatMap(({ evidence }) => evidence),
  ];
  const inconnu = [
    readable(reviewed?.uncertainty),
    recits.length === 0 && !meaning ? copy.unknown.noOrigin : undefined,
    allEvidence.length > 0 && !hasOralSource(allEvidence)
      ? copy.unknown.noOral
      : undefined,
    form && !period && !form.attestationPeriod
      ? copy.unknown.noPeriod
      : undefined,
  ].filter(Boolean) as string[];

  const enBref =
    readable(answer?.what?.lead) ??
    readable(reviewed?.paragraphs[0]) ??
    copy.briefFallback(subject.kind, subject.title);

  const langue = readable(form?.origin?.languageCode);

  return {
    type: subject.kind,
    id: subject.id,
    nom: subject.title,
    forme: formText,
    fiche: absolute(ROUTE_OF[subject.kind](subject.id)),
    reperes: {
      origine: originMarker(form, naming),
      sources: sourcesMarker(form, answer),
    },
    enBref,
    ...(langue ? { langue } : {}),
    sensEtPourquoi,
    recits,
    autresNoms,
    croyances,
    inconnu,
    pistes: leadsOf(subject, formText, options.siblings ?? []),
  };
}

function section(heading: string, lines: string[]): string {
  return [
    `## ${heading}`,
    ...(lines.length ? lines : [copy.nothingWritten]),
  ].join("\n");
}

/** The frame as the text an agent relays, headings in the approved order. */
// @req REQ-178
export function renderAgentFrame(frame: AgentFrame): string {
  const { headings } = copy;
  const origin = frame.reperes.origine
    ? copy.originMarker[frame.reperes.origine]
    : copy.markerUnknown;
  const sources = frame.reperes.sources
    ? copy.sourcesMarker[frame.reperes.sources]
    : copy.markerUnknown;
  const accounts = frame.recits.map((account) =>
    [
      account.statut
        ? `${account.texte} (${copy.sourcesMarker[account.statut].split(",")[0]})`
        : account.texte,
      account.sources.length
        ? copy.sourcesLine(
            account.sources
              .map((source) => copy.sourceEntry(source.titre, source.type))
              .join(" ; ")
          )
        : undefined,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return [
    `# ${copy.subjectLine(frame.type, frame.nom)}`,
    section(headings.brief, [frame.enBref]),
    `${headings.origin} : ${origin}.`,
    `${headings.sources} : ${sources}.`,
    section(
      headings.language,
      frame.langue ? [copy.languageLine(frame.langue)] : []
    ),
    section(headings.meaning, [...frame.sensEtPourquoi, ...accounts]),
    section(
      headings.otherNames,
      frame.autresNoms.map((name) => `* ${name}`)
    ),
    section(headings.beliefs, frame.croyances),
    section(headings.unknowns, frame.inconnu),
    section(headings.further, [
      `* ${copy.ficheLink} : ${frame.fiche}`,
      ...frame.pistes.map((lead) => `* ${lead.libelle} : ${lead.url}`),
    ]),
  ].join("\n\n");
}
