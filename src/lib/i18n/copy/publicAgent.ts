import type { Language } from "@/types/shared";

/**
 * The words of the public agent's answer, in the order of the approved frame:
 * « En bref », two markers, then the language, the meaning and the reason,
 * the other names, what people often believe, what nobody knows yet, and
 * where to read further.
 *
 * Same register as the result page: no scholarly word, the project speaks as
 * « nous », and a source is named by its type, never by a level of trust.
 */

export type OriginMarker =
  "interieur" | "venu_d_ailleurs" | "venu_d_ailleurs_puis_repris";

export type SourcesMarker = "etabli" | "discute" | "rapporte";

export type AgentSubjectKind =
  "people" | "country" | "language" | "languageFamily" | "patronyme";

export interface PublicAgentCopy {
  headings: {
    brief: string;
    origin: string;
    sources: string;
    language: string;
    meaning: string;
    otherNames: string;
    beliefs: string;
    unknowns: string;
    further: string;
  };
  originMarker: Record<OriginMarker, string>;
  sourcesMarker: Record<SourcesMarker, string>;
  /** Said beside a marker the fiche gives no ground for. */
  markerUnknown: string;
  /** Said under a heading the fiche leaves empty, so the frame keeps its shape. */
  nothingWritten: string;
  /** « En bref » when the fiche writes no sentence of its own. */
  briefFallback: (kind: AgentSubjectKind, title: string) => string;
  /** The subject's line above its answer, so two same-named subjects stay apart. */
  subjectLine: (kind: AgentSubjectKind, title: string) => string;
  languageLine: (language: string) => string;
  meaningLine: (meaning: string) => string;
  givenBy: (by: string | undefined, period: string | undefined) => string;
  sourcesLine: (sources: string) => string;
  sourceEntry: (title: string, kind: string) => string;
  selfGivenNote: string;
  unknown: {
    noOrigin: string;
    noOral: string;
    noPeriod: string;
  };
  ficheLink: string;
  nameLink: (form: string) => string;
  familyLead: (name: string | undefined) => string;
  countryLead: (countryId: string) => string;
  peopleLead: (name: string | undefined) => string;
  languageLead: string;
  sameNameLead: (kind: AgentSubjectKind, title: string) => string;
  noAnswer: (query: string) => string;
  outage: string;
  ficheNotFound: string;
  /** What the agent's host shows of each tool. */
  tools: {
    searchTitle: string;
    searchDescription: string;
    searchName: string;
    ficheTitle: string;
    ficheDescription: string;
    proposeTitle: string;
    proposeDescription: string;
    proposeFields: {
      name: string;
      type: string;
      details: string;
      sources: string;
      fiche: string;
      element: string;
      consent: string;
      testimony: string;
    };
  };
  /** What the person is told when they propose a name, a correction or a testimony. */
  proposal: {
    unavailable: string;
    tooLong: (field: string, max: number) => string;
    tooManySources: (max: number) => string;
    testimonyNeedsConsent: string;
    testimonyNeedsText: string;
    dailyCap: string;
    outage: string;
    received: (code: string) => string;
    /** PENDING OPERATOR DECISION: how a testimony's transmitter is described. */
    transmitterFormula: string;
  };
}

const KIND_FR: Record<AgentSubjectKind, string> = {
  people: "peuple",
  country: "pays",
  language: "langue",
  languageFamily: "famille de langues",
  patronyme: "nom de famille",
};

const KIND_WITH_ARTICLE_FR: Record<AgentSubjectKind, string> = {
  people: "un peuple",
  country: "un pays",
  language: "une langue",
  languageFamily: "une famille de langues",
  patronyme: "un nom de famille",
};

// @req REQ-178
export const publicAgentCopy: Record<Language, PublicAgentCopy> = {
  fr: {
    headings: {
      brief: "En bref",
      origin: "D'où vient le nom",
      sources: "Ce que disent les sources",
      language: "Langue",
      meaning: "Sens et pourquoi",
      otherNames: "Autres noms",
      beliefs: "Ce qu'on croit souvent",
      unknowns: "Ce qu'on ne sait pas",
      further: "Pour aller plus loin",
    },
    originMarker: {
      interieur: "de l'intérieur, c'est le nom que le groupe se donne",
      venu_d_ailleurs: "venu d'ailleurs, d'autres l'ont donné",
      venu_d_ailleurs_puis_repris:
        "venu d'ailleurs, puis repris par le groupe lui-même",
    },
    sourcesMarker: {
      etabli: "établi, les sources s'accordent",
      discute: "discuté, les sources ne s'accordent pas",
      rapporte: "rapporté, une source le dit sans que d'autres le confirment",
    },
    markerUnknown: "nous ne pouvons pas encore le dire",
    nothingWritten: "Nous n'avons encore rien écrit sur ce point.",
    briefFallback: (kind, title) =>
      `${title} est ${KIND_WITH_ARTICLE_FR[kind]}.`,
    subjectLine: (kind, title) => `${title} (${KIND_FR[kind]})`,
    languageLine: (language) => `Ce nom vient de cette langue : ${language}.`,
    meaningLine: (meaning) =>
      `Ce nom veut dire ${meaning}${/[.!?]$/.test(meaning) ? "" : "."}`,
    givenBy: (by, period) =>
      [by ? `Donné par ${by}` : "Donné", period ? `, ${period}` : ""]
        .join("")
        .concat("."),
    sourcesLine: (sources) => `Sources : ${sources}.`,
    sourceEntry: (title, kind) => `${title} (${kind})`,
    selfGivenNote: "le nom que le groupe se donne",
    unknown: {
      noOrigin: "Nous ne savons pas encore d'où vient ce nom.",
      noOral: "Aucune source orale n'est citée pour ce nom.",
      noPeriod: "Nous ne savons pas depuis quand ce nom est employé.",
    },
    ficheLink: "La fiche complète",
    nameLink: (form) => `Tout ce que nous savons du nom ${form}`,
    familyLead: (name) =>
      name ? `La famille de langues ${name}` : "Sa famille de langues",
    countryLead: (countryId) => `Un pays où ce nom est présent (${countryId})`,
    peopleLead: (name) => (name ? `Le peuple ${name}` : "Un peuple de ce pays"),
    languageLead: "Sa langue",
    sameNameLead: (kind, title) =>
      `Le même nom désigne aussi ${KIND_WITH_ARTICLE_FR[kind]}, ${title}`,
    noAnswer: (query) =>
      `Nous n'avons encore rien publié sur le nom ${query}. Essayez une autre orthographe, ou le nom que le groupe se donne.`,
    outage:
      "Nous ne pouvons pas lire nos fiches pour le moment. Réessayez dans quelques minutes.",
    ficheNotFound:
      "Cette fiche n'existe pas. Cherchez d'abord le nom pour trouver la bonne fiche.",
    tools: {
      searchTitle: "Chercher un nom",
      searchDescription:
        "Cherche un nom de peuple, de langue, de famille de langues, de pays ou de famille dans les fiches EthniAfrica. Répond en français, dans l'ordre : en bref, d'où vient le nom, ce que disent les sources, langue, sens et pourquoi, autres noms, ce qu'on croit souvent, ce qu'on ne sait pas, pour aller plus loin.",
      searchName: "Le nom tel que la personne l'a écrit.",
      ficheTitle: "Lire une fiche",
      ficheDescription:
        "Lit une fiche EthniAfrica par son type et son identifiant, tels que rechercher_nom les donne, et répond dans le même ordre.",
      proposeTitle: "Proposer un nom, une correction ou un témoignage",
      proposeDescription:
        "Envoie à l'équipe EthniAfrica une proposition : un nom qui manque, une correction à une fiche, ou un témoignage de famille. Une personne de l'équipe relit tout avant que la fiche change. N'appelez cet outil que si la personne le demande, et dites-lui d'abord que sa proposition sera lue par l'équipe. Ne notez aucun nom de personne ni aucune adresse. Pour un témoignage, demandez d'abord son accord clair : sans cet accord, il n'est pas enregistré. La réponse contient un code de retrait que la personne doit garder : nous ne le redonnons pas.",
      proposeFields: {
        name: "Le nom concerné, tel que la personne l'a écrit.",
        type: "nouveau_nom pour un nom qui manque, correction pour une erreur dans une fiche, temoignage pour un récit de famille.",
        details:
          "Ce que la personne propose, en quelques phrases, sans nom de personne ni adresse.",
        sources:
          "Jusqu'à cinq sources : une adresse web ou un titre par entrée.",
        fiche: "L'identifiant de la fiche concernée, pour une correction.",
        element:
          "La partie de la fiche concernée, pour une correction (par exemple l'histoire du nom).",
        consent:
          "Vrai seulement si la personne a dit clairement qu'elle accepte que son témoignage soit enregistré.",
        testimony:
          "Le récit de famille, pour un témoignage, sans nom de personne.",
      },
    },
    proposal: {
      unavailable:
        "Les propositions sont fermées pour le moment. Réessayez plus tard.",
      tooLong: (field, max) =>
        `Le champ « ${field} » est trop long : ${max} caractères au plus. Raccourcissez-le puis réessayez.`,
      tooManySources: (max) =>
        `Il y a trop de sources : ${max} au plus. Gardez les plus utiles.`,
      testimonyNeedsConsent:
        "Nous n'enregistrons un témoignage qu'avec l'accord clair de la personne. Demandez-lui son accord, puis réessayez.",
      testimonyNeedsText:
        "Un témoignage a besoin du récit lui-même. Ajoutez-le puis réessayez.",
      dailyCap:
        "Il y a eu beaucoup de propositions aujourd'hui. Réessayez demain.",
      outage:
        "Nous ne pouvons pas recevoir votre proposition pour le moment. Réessayez dans quelques minutes.",
      transmitterFormula:
        "un membre de la famille (formule à confirmer par l'opérateur)",
      received: (code) =>
        `Merci, nous avons bien reçu la proposition. Une personne de l'équipe la lira avant que la fiche change. Pour la retirer, écrivez-nous avec ce code : ${code}. Gardez-le, nous ne pourrons pas vous le redonner.`,
    },
  },
};
