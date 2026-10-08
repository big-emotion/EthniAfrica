import type { Language } from "@/types/shared";

const fr = {
  page: {
    metadataTitle: "Signalez une erreur",
    title: "Signalez une erreur",
    accuracyTitle: "Contribuez à l'exactitude des données",
    accuracyIntroduction:
      "Les informations présentées sur ce site proviennent de différentes sources, publiques ou collaboratives. Bien que nous fassions de notre mieux pour vérifier et consolider ces données, certaines peuvent être incomplètes, approximatives ou contenir des erreurs.",
    formIntroduction:
      "Décrivez ci-dessous ce qui ne va pas. Aucun compte n'est nécessaire, et la correction proposée comme la source sont facultatives : nous préférons un signalement incomplet à un signalement que vous renoncez à écrire.",
    ficheGuidanceBefore:
      "Si l'erreur se trouve sur une page précise, le bouton",
    reportButton: "Signaler",
    ficheGuidanceAfter:
      "de la barre de lecture de cette page vise directement le chapitre concerné — c'est plus rapide pour vous et plus précis pour la modération.",
    openAtlas: "Ouvrir l'atlas des peuples",
    followUpTitle: "Ce que deviennent les signalements",
    followUp:
      "Tous les signalements sont publics, du dépôt à la décision. Vous pouvez consulter ceux qui sont en cours d'examen et ceux qui ont été tranchés, ainsi que le motif retenu à chaque fois.",
    viewRegister: "Voir le registre des signalements",
  },
  form: {
    targetTitle: "Élément signalé",
    targetLabels: {
      people: "Peuple",
      country: "Pays",
      language: "Langue",
      language_family: "Famille linguistique",
      fiche_section: "Section de page",
      assertion: "Affirmation",
      source: "Source",
      general: "Signalement général",
    },
    reason: "Qu'est-ce qui ne va pas ?",
    correctionDisclosure: "Vous connaissez la bonne réponse ?",
    proposedRewrite: "Proposition de correction",
    decisionDisclosure: "Vous voulez connaître la décision ?",
    reporterEmail: "Votre adresse e-mail",
    emailHelp:
      "Nous vous enverrons un lien pour confirmer cette adresse, puis la décision de la modération. Elle n'apparaît jamais publiquement et ne sert à rien d'autre.",
    sourceDisclosure: "Vous avez une source ?",
    sourcesLegend: "Sources à l'appui",
    sourceHelp: "Ajoutez un lien ou une citation si vous en disposez.",
    sourceRequired: "Ajoutez au moins un lien ou une citation.",
    counterSourceUrl: "Lien de la contre-source",
    counterSourceCitation: "Citation de la contre-source",
    cancel: "Annuler",
    send: "Envoyer",
    sending: "Envoi en cours…",
    honeypot: "Ne remplissez pas ce champ",
    verification: "Vérification anti-robot",
    verificationPlaceholder: "La vérification anti-robot sera chargée ici.",
    verificationIncomplete:
      "La vérification anti-robot n'est pas terminée. Patientez un instant.",
    verificationFailed:
      "La vérification anti-robot n'a pas abouti. Rechargez la page pour réessayer.",
    submissionFailed: "L’envoi du signalement a échoué. Réessayez.",
    invalidUrl: "Saisissez une adresse HTTP ou HTTPS valide.",
    citationTooLong: "La citation ne peut pas dépasser 2 000 caractères.",
    invalidReason: "La description doit contenir entre 10 et 2 000 caractères.",
    invalidEmail:
      "Saisissez une adresse e-mail valide, ou laissez le champ vide.",
    successTitle: "Signalement enregistré",
    successWithEmail:
      "Merci — confirmez votre adresse depuis le message que nous venons de vous envoyer, et vous recevrez la décision de la modération.",
    successAnonymous:
      "Merci — votre signalement est consultable ci-dessous, et son statut y sera mis à jour.",
    viewReport: "Consulter le signalement",
  },
  dialog: {
    trigger: "Signaler",
    title: "Signaler un problème",
    description: "Formulaire de signalement pour cet élément.",
    saved: "signalement enregistré",
  },
  detail: {
    metadataDescription:
      "Consultation d'un signalement éditorial sur la plateforme.",
    report: "Signalement",
    sectionName: "Signalements",
    targetTitle: "Élément concerné",
    type: "Type",
    identifier: "Identifiant",
    field: "Champ",
    detailsTitle: "Détails du signalement",
    kind: {
      inaccurate: "Information inexacte",
      missingSource: "Source manquante",
      brokenUrl: "URL brisée",
      offensive: "Contenu offensant",
      correctionProposal: "Proposition de correction",
      other: "Autre",
    },
    counterSource: "Source contradictoire",
    proposedRewrite: "Proposition de réécriture",
    reportedOn: "Signalé le",
    resolvedOn: "Résolu le",
    by: "Par",
  },
  verification: {
    metadataTitle: "Confirmation de votre adresse",
    verified: {
      title: "Adresse confirmée",
      body: "Vous recevrez un message dès que la modération aura tranché sur votre signalement.",
    },
    alreadyVerified: {
      title: "Adresse déjà confirmée",
      body: "Ce lien avait déjà été utilisé. Rien à faire de plus : votre adresse est bien enregistrée.",
    },
    expired: {
      title: "Lien expiré",
      body: "Ce lien de confirmation avait une validité de 24 heures. Votre signalement, lui, est toujours enregistré et consultable — seule la notification par e-mail ne pourra pas vous être envoyée.",
    },
    unknown: {
      title: "Lien inconnu",
      body: "Ce lien ne correspond à aucune confirmation en attente. Si vous avez envoyé un signalement, il est enregistré et consultable dans le registre public.",
    },
    viewReport: "Consulter votre signalement",
    viewRegister: "Voir le registre des signalements",
  },
};

type ReportsCopy = typeof fr;

// @req REQ-145
export const reportsCopy: Record<Language, ReportsCopy> = { fr };
