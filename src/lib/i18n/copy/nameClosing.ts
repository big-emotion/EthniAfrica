import { aboutCopy } from "@/lib/i18n/copy/about";
import type { NextStepKind } from "@/lib/search/nameClosing";
import type { SearchEntityType } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";
import type { SourceKind } from "@/types/sources";

/**
 * The blocks under the timeline on the search result page (brief 1, approved
 * 2026-10-14, boards in docs/design/mockups/site/): the sources of the name,
 * what the project does not know yet, and where to go next. The conviction
 * and the invitation are the about page's own sentences, so the site says
 * them once.
 *
 * The block is titled by what it is, « Les sources du nom … », with one plain
 * sentence under it (operator, 2026-10-17): no block "speaks", no title asks
 * a question. The sentence counts sources, not accounts, because one source
 * can back several accounts and « plusieurs sources » must stay true.
 */
export interface NameClosingCopy {
  sourcesTitle: (name: string) => string;
  sourcesLead: (sources: number, accounts: number, name: string) => string;
  sourcesStrip: string;
  sourceCount: (count: number) => string;
  accountCount: (count: number) => string;
  undated: string;
  /**
   * The note under block 3 when the subject's other names cite kinds of
   * source the open one does not: who else speaks, and where to read them.
   */
  otherVoices: (
    subject: SearchEntityType,
    kinds: readonly SourceKind[]
  ) => string;
  closingTitle: string;
  silence: {
    noOral: (name: string) => string;
    noBirth: (name: string) => string;
    beforeBirth: (name: string) => string;
    beforeYear: (name: string, year: string) => string;
    unwritten: (label: string, name: string) => string;
    unknown: (query: string) => string;
  };
  conviction: string;
  /**
   * The site's thesis, one discreet line under the conviction. Empty until
   * the operator fixes the wording: an empty line is not drawn.
   */
  thesis: string;
  invitationTitle: string;
  invitationBody: string;
  report: string;
  propose: string;
  nextTitle: string;
  /** A next-step card's eyebrow: what its target is. */
  nextRelation: Record<NextStepKind, string>;
  /**
   * The same blocks on a fiche (brief 2, approved 2026-10-15, boards
   * people-*.dc.html): a fiche tells every name of its subject, so the
   * sources block and the silences speak of « the names of this people ».
   */
  fiche: {
    sourcesTitle: (subject: SearchEntityType) => string;
    sourcesLead: (
      sources: number,
      accounts: number,
      names: number,
      subject: SearchEntityType,
      originExplained?: boolean
    ) => string;
    noOral: (subject: SearchEntityType) => string;
    undated: (names: readonly string[]) => string;
    firstWritten: (name: string, year: number) => string;
    beforeCentury: (name: string, label: string) => string;
    /** A name the fiche lists without a single account (brief 4). */
    noAccount: (name: string) => string;
    /**
     * Oral traditions the project only knows through the authors who wrote
     * them down, none recorded from the people who carry them (brief 4).
     */
    oralOnlyThrough: (name: string, authors: readonly string[]) => string;
    /** A name whose competing readings carry no date at all (brief 5). */
    undatedReadings: (count: number, name: string) => string;
    carrier: (carrier: string, place?: string) => string;
    reportedBy: (author: string, year: number | null, title: string) => string;
    /** An oral tradition with no carrier, named by who wrote it down. */
    traditionsReportedBy: (
      author: string,
      year: number | null,
      title: string
    ) => string;
    originUnexplained: (name: string) => string;
    noHomonyms: (name: string) => string;
    noBearerCount: (name: string) => string;
    documentedGaps: (fields: readonly string[]) => string;
    gapWording: Record<string, string>;
  };
}

const about = aboutCopy.fr;

/** Each kind of source as a voice, plural and with its article. */
const VOICES_FR: Partial<Record<SourceKind, string>> = {
  oral_tradition: "des traditions orales",
  community: "des organisations communautaires",
  academic: "des publications académiques",
  linguistic_reference: "des références linguistiques",
  encyclopedia: "des encyclopédies",
  press: "des articles de presse",
  government: "des sources gouvernementales",
  intergovernmental: "des organisations intergouvernementales",
  official_statistics: "des statistiques publiques",
  ngo: "des organisations non gouvernementales",
  archive: "des archives",
  repository: "des dépôts documentaires",
};

const SUBJECT_FR: Partial<Record<SearchEntityType, string>> = {
  people: "de ce peuple",
  country: "de ce pays",
  language: "de cette langue",
  languageFamily: "de cette famille de langues",
  patronyme: "de ce nom de famille",
  place: "de ce lieu",
};

/**
 * What the fiche's names are, as a sentence object. A family name is one
 * name with several forms, so « les noms de ce nom de famille » would double
 * the word: it is « ce nom de famille », and its names are « forms ».
 */
function namesOf(subject: SearchEntityType): string {
  return subject === "patronyme"
    ? "ce nom de famille"
    : `les noms ${SUBJECT_FR[subject] ?? "de ce sujet"}`;
}

function otherNamesOf(subject: SearchEntityType): string {
  if (subject === "patronyme") return "les autres formes de ce nom de famille";
  const of = SUBJECT_FR[subject];
  return `les autres noms${of ? ` ${of}` : ""}`;
}

/**
 * Small counts in words, as a sentence reads them; a count it lacks is
 * written in figures. Shared with the timeline's count of explanations.
 */
// @req REQ-198
export const COUNT_FR: Record<number, string> = {
  2: "deux",
  3: "trois",
  4: "quatre",
  5: "cinq",
  6: "six",
};

function joinFr(items: readonly string[]): string {
  return items.length < 2
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// @req REQ-198
export const nameClosingCopy: Record<Language, NameClosingCopy> = {
  fr: {
    sourcesTitle: (name) => `Les sources du nom ${name}`,
    sourcesLead: (sources, accounts) =>
      sources === 1
        ? `Une seule source explique ce nom pour l’instant. Voici ${accounts === 1 ? "son récit" : `ses ${accounts} récits`}.`
        : `Plusieurs sources expliquent l’origine de ce nom. Voici ${accounts === 1 ? "leur récit" : `leurs ${accounts} récits`}, rangés par type de source.`,
    sourcesStrip: "Types de sources",
    sourceCount: (count) => `${count} ${count === 1 ? "source" : "sources"}`,
    accountCount: (count) => `${count} ${count === 1 ? "récit" : "récits"}`,
    undated: "Date inconnue",
    otherVoices: (subject, kinds) => {
      const voices = joinFr(kinds.flatMap((kind) => VOICES_FR[kind] ?? []));
      return `Pour ${otherNamesOf(subject)}, d’autres sources existent : ${voices}. Choisissez un nom plus haut pour les lire.`;
    },
    closingTitle: "Ce que nous ne savons pas encore",
    silence: {
      noOral: (name) =>
        `Aucun récit transmis oralement n’est enregistré pour le nom ${name}.`,
      noBirth: (name) =>
        `L’origine du nom ${name} n’est pas datée dans le projet pour l’instant.`,
      beforeYear: (name, year) =>
        `Aucune trace du nom ${name} plus ancienne que ${year} n’est connue du projet.`,
      beforeBirth: (name) =>
        `Avant sa plus ancienne trace connue du projet, l’histoire du nom ${name} reste à écrire.`,
      unwritten: (label, name) =>
        `L’histoire du nom ${name} (${label.toLowerCase()}) n’est pas encore écrite.`,
      unknown: (query) =>
        `Aucune source sur le nom ${query} n’est enregistrée dans le projet.`,
    },
    conviction: about.conviction.paragraphs[0],
    thesis: "",
    // The about page's correction paragraph, split where the card breaks it.
    invitationTitle: about.correction.paragraphs[0].split(" ? ")[0] + " ?",
    invitationBody: `${about.correction.paragraphs[0].split(" ? ")[1]} ${about.correction.paragraphs[1]}`,
    report: "Signaler une erreur",
    propose: "Proposer une source",
    nextTitle: "Poursuivre avec un autre nom",
    nextRelation: {
      family: "Famille de langues",
      patronyme: "Nom de famille",
      country: "Pays",
      people: "Peuple",
      language: "Langue",
      place: "Lieu",
    },
    fiche: {
      sourcesTitle: (subject) =>
        subject === "patronyme"
          ? "Les sources de ce nom de famille"
          : `Les sources des noms ${SUBJECT_FR[subject] ?? "de ce sujet"}`,
      sourcesLead: (sources, accounts, _names, subject, originExplained) => {
        const by = subject === "patronyme" ? "forme" : "nom";
        if (subject === "patronyme" && originExplained === false) {
          const count = COUNT_FR[sources] ?? String(sources);
          return sources === 1
            ? `Une source mentionne ce nom, sans en expliquer l’origine. Voici son récit, rangé par forme, puis par type de source.`
            : `${count[0].toLocaleUpperCase("fr")}${count.slice(1)} sources mentionnent ce nom, sans en expliquer l’origine. Voici leurs ${accounts} récits, rangés par forme, puis par type de source.`;
        }
        return sources === 1
          ? `Une seule source explique ${namesOf(subject)} pour l’instant. Voici ses ${accounts} récits, rangés par ${by}.`
          : `Plusieurs sources expliquent ${namesOf(subject)}. Voici leurs ${accounts} récits, rangés par ${by}, puis par type de source.`;
      },
      noOral: (subject) =>
        `Aucun récit transmis oralement n’est enregistré pour ${namesOf(subject)}.`,
      undated: (names) =>
        names.length === 1
          ? `L’origine du nom ${names[0]} n’est pas datée dans le projet pour l’instant.`
          : `L’origine des noms ${joinFr(names)} n’est pas datée dans le projet pour l’instant.`,
      firstWritten: (name, year) =>
        `On ne sait pas avec certitude quand le nom ${name} a été écrit pour la première fois. La plus ancienne trace datée que le projet connaît est de ${year}.`,
      beforeCentury: (name, label) =>
        `Avant sa plus ancienne trace connue du projet, au ${label}, l’histoire du nom ${name} reste à écrire.`,
      noAccount: (name) =>
        `Aucune source du projet ne raconte encore le nom ${name}.`,
      oralOnlyThrough: (name, authors) =>
        `Les traditions orales sur le nom ${name} ne nous parviennent que par ${joinFr(authors)}. Le projet n’a pas encore de récit recueilli auprès de celles et ceux qui les transmettent.`,
      undatedReadings: (count, name) =>
        `Les ${COUNT_FR[count] ?? count} explications du nom ${name} ne sont pas datées.`,
      carrier: (carrier, place) =>
        `récit porté par ${carrier}${place ? `, ${place}` : ""}`,
      reportedBy: (author, year, title) =>
        `rapporté par ${author}${year ? `, ${year}` : ""}, « ${title} »`,
      traditionsReportedBy: (author, year, title) =>
        `rapportées par ${author}${year ? `, ${year}` : ""}, « ${title} »`,
      originUnexplained: (name) =>
        `Aucune source n’explique l’origine du nom ${name}.`,
      noHomonyms: (name) => `Aucun homonyme du nom ${name} n’est documenté.`,
      noBearerCount: (name) =>
        `Le nombre de personnes qui portent le nom ${name} n’est pas connu du projet.`,
      documentedGaps: (fields) =>
        `Le projet ne documente pas encore ${joinFr(fields)}.`,
      gapWording: {
        origin: "l’origine de ce nom",
        alliances: "les noms qui lui sont liés",
        casteOrSocialFunction: "sa fonction sociale",
        transmissionMode: "son mode de transmission",
        homonyms: "les autres noms de même forme",
        bearers: "le nombre de personnes qui le portent",
      },
    },
  },
};
