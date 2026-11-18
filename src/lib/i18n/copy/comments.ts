import type { Language } from "@/types/shared";

/**
 * Comments per passage on the search result page (brief 21, proposal B,
 * approved 2026-11-18; REQ-212). Every sentence is the boards' own:
 * `docs/design/mockups/site/search-state-comments-*` and `comments-*`.
 *
 * The participation sentence is one entry on purpose: its wording is still
 * the operator's to choose, and one entry is one place to change it.
 *
 * One departure from the boards: they write « lectures » for the books a
 * reader learnt from, a word the editorial checks ban outright (operator,
 * 27 October 2026), so « des livres ou des recherches » takes its place.
 *
 * What the reader is told after sending follows the moderation charter §6:
 * with an address, check the mailbox; without one, the team has the message
 * and it will not be shown publicly. Neither promises a reply.
 */
export interface CommentsCopy {
  count: (count: number) => string;
  none: string;
  add: string;
  inviteLabel: string;
  participation: string;
  inviteHow: string;
  corrected: (date: string) => string;
  seeDiscussion: string;
  /** What each commentable passage is called in the sheet's title. */
  blocks: {
    answer: string;
    what: string;
    origin: string;
    names: string;
    timeline: string;
    selfName: string;
    where: string;
    sources: string;
    verdict: string;
    page: string;
  };
  sheet: {
    eyebrow: string;
    pageEyebrow: string;
    close: string;
    description: string;
  };
  thread: {
    anonymous: string;
    moderationHead: string;
    moderationSign: (date: string) => string;
    correction: string;
    source: string;
    basis: Record<"family" | "language" | "reading", string>;
    status: Record<"accepted" | "rejected", string>;
    reply: string;
    report: string;
    reportSent: string;
    reportFailed: string;
    replyLabel: string;
    replySend: string;
    replyCancel: string;
    replyNeedsAccount: string;
    replyFailed: string;
  };
  empty: { title: string; body: string };
  form: {
    title: string;
    body: string;
    bodyPlaceholder: string;
    correction: string;
    source: string;
    optional: string;
    basisLegend: string;
    basisChoices: Record<"family" | "language" | "reading", string>;
    displayName: string;
    displayNameHelp: string;
    email: string;
    emailHelp: string;
    age: string;
    notice: string;
    submit: string;
    sending: string;
    rules: string;
    rulesLink: string;
    invalidBody: string;
    invalidUrl: string;
    invalidEmail: string;
    ageRequired: string;
    failed: string;
  };
  sent: {
    eyebrow: string;
    title: string;
    body: (address: string) => string;
    spam: string;
    back: string;
    privateTitle: string;
    privateBody: string;
  };
}

const fr: CommentsCopy = {
  count: (count) => (count === 1 ? "1 commentaire" : `${count} commentaires`),
  none: "Aucun commentaire",
  add: "Commenter",
  inviteLabel: "Participer",
  participation:
    "Ces informations viennent des sources citées sur cette page. Vous en savez plus ? Vous pouvez corriger ou compléter chaque passage.",
  inviteHow: "Chaque passage se termine par un bouton « Commenter ».",
  corrected: (date) => `Corrigé le ${date} grâce à une contribution.`,
  seeDiscussion: "Voir la discussion",
  blocks: {
    answer: "D'où vient le nom",
    what: "Ce que désigne ce nom",
    origin: "D'où vient le nom",
    names: "Ses noms",
    timeline: "L'histoire du nom",
    selfName: "Leur nom",
    where: "Les lieux",
    sources: "Les sources du nom",
    verdict: "Ce nom",
    page: "Cette page",
  },
  sheet: {
    eyebrow: "Commentaires sur ce passage",
    pageEyebrow: "Corriger ou compléter cette page",
    close: "Fermer",
    description:
      "Les commentaires publiés sur ce passage, et un formulaire pour en ajouter un.",
  },
  thread: {
    anonymous: "Un lecteur",
    moderationHead: "Réponse de la modération",
    moderationSign: (date) => `Modération EthniAfrica · ${date}`,
    correction: "Correction proposée :",
    source: "Source proposée :",
    basis: {
      family: "Connaît ce sujet par sa famille",
      language: "Connaît ce sujet par sa langue",
      reading: "Connaît ce sujet par des livres ou des recherches",
    },
    status: { accepted: "Pris en compte", rejected: "Non retenu" },
    reply: "Répondre",
    report: "Signaler",
    reportSent: "Merci. La modération va regarder ce message.",
    reportFailed: "Le signalement n'a pas abouti. Réessayez plus tard.",
    replyLabel: "Votre réponse",
    replySend: "Envoyer ma réponse",
    replyCancel: "Annuler",
    replyNeedsAccount:
      "Pour répondre, publiez d'abord un commentaire avec votre adresse e-mail. Le lien que vous recevrez vous permettra ensuite de répondre.",
    replyFailed: "La réponse n'a pas pu être envoyée. Réessayez.",
  },
  empty: {
    title: "Aucun commentaire pour l'instant",
    body: "Si vous connaissez ce nom par votre famille, votre langue, des livres ou des recherches, vous pouvez écrire le premier commentaire.",
  },
  form: {
    title: "Ajouter un commentaire",
    body: "Votre commentaire",
    bodyPlaceholder:
      "Ce que vous savez, ce qui manque, ce qui vous semble faux…",
    correction: "Une correction à proposer",
    source: "Le lien d'une source",
    optional: "(facultatif)",
    basisLegend: "Je connais ce sujet par",
    basisChoices: {
      family: "ma famille",
      language: "ma langue",
      reading: "des livres ou des recherches",
    },
    displayName: "Nom affiché",
    displayNameHelp: "Sans nom, votre commentaire est signé « Un lecteur ».",
    email: "Votre adresse e-mail",
    emailHelp: "Elle n'est jamais affichée.",
    age: "J'ai 15 ans ou plus",
    notice:
      "Votre commentaire devient public quand vous cliquez sur le lien que nous vous envoyons par e-mail. Ce lien vous donne aussi un espace pour suivre vos commentaires et les réponses.",
    submit: "Envoyer mon commentaire",
    sending: "Envoi en cours…",
    rules:
      "Un commentaire peut être masqué s'il insulte, s'il ne parle pas du sujet ou s'il est signalé plusieurs fois.",
    rulesLink: "Nos règles de publication",
    invalidBody:
      "Votre commentaire doit contenir entre 10 et 2 000 caractères.",
    invalidUrl: "Saisissez une adresse qui commence par http:// ou https://.",
    invalidEmail:
      "Saisissez une adresse e-mail valide, ou laissez le champ vide.",
    ageRequired:
      "Pour laisser une adresse, confirmez que vous avez 15 ans ou plus.",
    failed: "L'envoi du commentaire a échoué. Réessayez.",
  },
  sent: {
    eyebrow: "Commentaire envoyé",
    title: "Vérifiez votre boîte mail",
    body: (address) =>
      `Nous avons envoyé un lien à ${address}. Votre commentaire sera publié quand vous cliquerez sur ce lien, puis sur le bouton « Publier mon commentaire ».`,
    spam: "Le message vient d'EthniAfrica. Si vous ne le voyez pas, regardez dans les courriers indésirables.",
    back: "Revenir à la page",
    privateTitle: "Votre message est arrivé",
    privateBody:
      "L'équipe le lira, mais il ne sera pas publié. Pour publier un commentaire et suivre les réponses, laissez votre adresse e-mail.",
  },
};

export const commentsCopy: Record<Language, CommentsCopy> = { fr };
