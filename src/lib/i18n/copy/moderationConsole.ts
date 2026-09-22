import type { Language } from "@/types/shared";

/**
 * The case file's own words.
 *
 * Separate from `admin.ts`, which is the queue, the source-review screen and
 * the sign-in page: this surface states two rules a moderator has to read in
 * full — that the register names roles and not people, and that the console
 * cannot declare a correction published — and burying them in a dictionary of
 * button labels is how a rule becomes a string nobody re-reads.
 *
 * Nothing here is reader-facing. The register the public sees is the
 * `/signalements` surface and speaks its own copy.
 */
export interface ModerationConsoleCopy {
  caseFile: {
    expand: string;
    collapse: string;
    targetHeading: string;
    entityType: string;
    entityId: string;
    fieldPath: string;
    noTarget: string;
    openFiche: string;
    counterSourceHeading: string;
    noCounterSource: string;
    noteHeading: string;
    notePublished: string;
  };
  trail: {
    heading: string;
    /** Why the stamps read the same from every time zone. */
    timeZoneNote: string;
    rolesNotPeople: string;
    loading: string;
    unreadable: string;
    pending: string;
    events: {
      received: string;
      under_review: string;
      accepted: string;
      rejected: string;
      duplicate: string;
      withdrawn: string;
      revision_linked: string;
      publication: string;
    };
    roles: {
      reader: string;
      moderator: string;
    };
    /** Rendered as « modérateur · rôle admin » — role, then the level. */
    level: (level: string) => string;
  };
  remediation: {
    heading: string;
    readOnlyMarker: string;
    /** The one line that says why the console cannot close this state. */
    readOnlyReason: string;
    stateHeading: string;
    states: {
      not_started: string;
      in_progress: string;
      published: string;
      not_applicable: string;
    };
    untracked: string;
    publishedAt: string;
    summaryHeading: string;
    linkedRevision: string;
    noLinkedRevision: string;
  };
}

const en: ModerationConsoleCopy = {
  caseFile: {
    expand: "Open the case file",
    collapse: "Close the case file",
    targetHeading: "What is contested",
    entityType: "Type",
    entityId: "Identifier",
    fieldPath: "Field",
    noTarget:
      "This report names no entity — it proposes one we do not hold yet.",
    openFiche: "Open the contested fiche",
    counterSourceHeading: "Counter-source supplied by the reader",
    noCounterSource: "The reader supplied no counter-source.",
    noteHeading: "Moderation note",
    notePublished:
      "The note recorded with a decision is published on the public register, word for word.",
  },
  trail: {
    heading: "Audit trail",
    timeZoneNote: "Times are UTC.",
    rolesNotPeople:
      "The register names the role that acted and the level it was authorised at, never the person.",
    loading: "Reading the register…",
    unreadable:
      "The register could not be read. Nothing here says no decision was taken.",
    pending: "Has not occurred yet",
    events: {
      received: "Report received",
      under_review: "Under review",
      accepted: "Accepted",
      rejected: "Rejected",
      duplicate: "Filed as a duplicate",
      withdrawn: "Withdrawn by its author",
      revision_linked: "Revision linked",
      publication: "Publication to production",
    },
    roles: {
      reader: "reader",
      moderator: "moderator",
    },
    level: (level: string) => `authorisation ${level}`,
  },
  remediation: {
    heading: "Remediation",
    readOnlyMarker: "Read-only",
    readOnlyReason:
      "The console reads this state and cannot write it. A moderator may link a revision — an intention — but only the publication of the corpus closes a remediation, so a tick-box here would announce a correction that has not happened.",
    stateHeading: "State",
    states: {
      not_started: "Not started",
      in_progress: "Revision under way",
      published: "Published to production",
      not_applicable: "No corpus change required",
    },
    untracked: "Not yet tracked for this report.",
    publishedAt: "Published on",
    summaryHeading: "What changed",
    linkedRevision: "Linked revision",
    noLinkedRevision: "No revision is linked to this report.",
  },
};

const fr: ModerationConsoleCopy = {
  caseFile: {
    expand: "Ouvrir le dossier de cas",
    collapse: "Fermer le dossier de cas",
    targetHeading: "Ce qui est contesté",
    entityType: "Type",
    entityId: "Identifiant",
    fieldPath: "Champ",
    noTarget:
      "Ce signalement ne nomme aucune entité — il en propose une que nous ne portons pas encore.",
    openFiche: "Ouvrir la fiche contestée",
    counterSourceHeading: "Contre-source fournie par le lecteur",
    noCounterSource: "Le lecteur n'a fourni aucune contre-source.",
    noteHeading: "Note de modération",
    notePublished:
      "La note consignée avec une décision est publiée au registre public, mot pour mot.",
  },
  trail: {
    heading: "Piste d'audit",
    timeZoneNote: "Les heures sont en UTC.",
    rolesNotPeople:
      "Le registre nomme le rôle qui a agi et le niveau d'autorisation, jamais la personne.",
    loading: "Lecture du registre…",
    unreadable:
      "Le registre n'a pas pu être lu. Rien ici ne dit qu'aucune décision n'a été prise.",
    pending: "N'a pas encore eu lieu",
    events: {
      received: "Signalement reçu",
      under_review: "Mis à l'examen",
      accepted: "Accepté",
      rejected: "Rejeté",
      duplicate: "Classé en doublon",
      withdrawn: "Retiré par son auteur",
      revision_linked: "Révision liée",
      publication: "Publication en production",
    },
    roles: {
      reader: "lecteur",
      moderator: "modérateur",
    },
    level: (level: string) => `rôle ${level}`,
  },
  remediation: {
    heading: "Remédiation",
    readOnlyMarker: "Lecture seule",
    readOnlyReason:
      "La console lit cet état et ne peut pas l'écrire. Un modérateur peut lier une révision — une intention — mais seule la publication du corpus clôt une remédiation : une case à cocher ici annoncerait une correction qui n'a pas eu lieu.",
    stateHeading: "État",
    states: {
      not_started: "Non entamée",
      in_progress: "Révision en cours",
      published: "Publiée en production",
      not_applicable: "Aucune correction du corpus nécessaire",
    },
    untracked: "Pas encore suivie pour ce signalement.",
    publishedAt: "Publiée le",
    summaryHeading: "Ce qui a changé",
    linkedRevision: "Révision liée",
    noLinkedRevision: "Aucune révision n'est liée à ce signalement.",
  },
};

// @req REQ-145
export const moderationConsoleCopy: Record<Language, ModerationConsoleCopy> = {
  en,
  fr,
};
