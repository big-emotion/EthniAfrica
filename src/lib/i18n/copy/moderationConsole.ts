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
      "La console affiche l'avancement de la correction. Un modérateur peut y associer une révision prévue. La correction sera indiquée comme terminée lorsque le contenu corrigé aura été publié.",
    stateHeading: "État",
    states: {
      not_started: "Non entamée",
      in_progress: "Révision en cours",
      published: "Publiée en production",
      not_applicable: "Aucune correction du contenu nécessaire",
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
  fr,
};
