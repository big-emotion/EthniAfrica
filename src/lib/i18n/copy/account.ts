import type { Language } from "@/types/shared";

/**
 * The reader account (REQ-213, DEC-085): the page that opens from the link a
 * commenter receives, the account itself and the sign-in that leads back to
 * it. Laid out on the approved board `docs/design/mockups/site/account-430`.
 */
const fr = {
  metadataTitle: "Mon compte",
  title: "Mon compte",
  lead: (email: string) =>
    `Vous utilisez l'adresse ${email}. Vous retrouvez ici vos commentaires et les réponses qu'ils ont reçues.`,
  contributionsTitle: "Mes commentaires",
  empty:
    "Vous n'avez pas encore de commentaire. Vous pouvez commenter un passage depuis la page d'un nom.",
  linkSent:
    "Un nouveau lien vient de partir vers votre adresse. Ouvrez-le pour publier votre commentaire.",
  state: {
    pending: "En attente de confirmation",
    published: "Publié",
    hidden: "Masqué",
    accepted: "Pris en compte",
    rejected: "Non retenu",
    duplicate: "Déjà signalé",
    withdrawn: "Retiré",
  },
  pendingHelp:
    "Ce commentaire sera publié quand vous aurez cliqué sur le lien reçu par e-mail.",
  hiddenHelp:
    "Des lecteurs ont signalé ce commentaire, ou la modération l'a masqué. Il n'est plus visible sur la page tant que la modération ne l'a pas revu.",
  resendLink: "Renvoyer le lien",
  integrated: (date: string) => `Intégré à la fiche le ${date}`,
  moderationSignature: (date: string) => `Modération EthniAfrica · ${date}`,
  moderationName: "Modération EthniAfrica",
  replies: (total: number, fromModeration: number) => {
    if (total === 0) return "Aucune réponse";
    if (total === fromModeration) {
      return total === 1
        ? "1 réponse de la modération"
        : `${total} réponses de la modération`;
    }
    const count = total === 1 ? "1 réponse" : `${total} réponses`;
    return fromModeration > 0 ? `${count}, dont la modération` : count;
  },
  viewDiscussion: "Voir la discussion",
  reportLabel: "Signalement",
  subject: {
    people: "Peuple",
    country: "Pays",
    language: "Langue",
    language_family: "Famille de langues",
    patronyme: "Nom de famille",
    place: "Lieu",
  },
  searchedName: (name: string) => `Nom « ${name} »`,
  section: {
    naming: "Les autres noms",
    origin: "D'où vient le nom",
    what: "Ce que désigne le nom",
    where: "Où se trouve ce nom",
    sources: "Les sources du nom",
    culture: "La culture",
    history: "L'histoire du nom",
    verdict: "La réponse à la recherche",
  },
  signOut: "Me déconnecter",
  deletion: {
    explanation:
      "Si vous supprimez votre compte, vos commentaires publiés restent en ligne, signés « Un lecteur ».",
    open: "Supprimer mon compte",
    confirmQuestion:
      "Votre adresse sera effacée et vous ne pourrez plus modifier ni suivre vos commentaires. Voulez-vous vraiment supprimer votre compte ?",
    confirm: "Oui, supprimer mon compte",
    cancel: "Garder mon compte",
  },
  confirmation: {
    metadataTitle: "Publier mon commentaire",
    title: "Publier mon commentaire",
    lead: "Appuyez sur le bouton pour publier votre commentaire. Vous ouvrirez en même temps votre compte, où vous pourrez le suivre.",
    why: "Le lien ne publie rien tout seul : certains logiciels ouvrent les liens d'un e-mail avant vous, et ils ne doivent pas publier à votre place.",
    submit: "Publier mon commentaire",
    signInTitle: "Ouvrir mon compte",
    signInLead: "Appuyez sur le bouton pour ouvrir votre compte.",
    signInSubmit: "Ouvrir mon compte",
    incomplete:
      "Ce lien est incomplet. Copiez le lien entier depuis l'e-mail, ou demandez-en un nouveau.",
    askAgain: "Demander un nouveau lien",
  },
  signIn: {
    metadataTitle: "Ouvrir mon compte",
    title: "Ouvrir mon compte",
    introduction:
      "Indiquez l'adresse avec laquelle vous avez publié un commentaire. Nous vous envoyons un lien pour ouvrir votre compte, sans mot de passe.",
    emailLabel: "Votre adresse e-mail",
    submit: "Recevoir le lien",
    neutralAnswer:
      "Si un compte existe pour cette adresse, un lien vient de lui être envoyé. Ouvrez-le dans les prochaines minutes.",
    invalidEmail: "Cette adresse ne semble pas complète. Vérifiez-la.",
    expiredLink:
      "Ce lien ne fonctionne plus : il a déjà servi ou il a expiré. Demandez-en un nouveau ci-dessous.",
    deleted:
      "Votre compte est supprimé. Vos commentaires publiés restent en ligne, signés « Un lecteur ».",
    signedOut: "Vous avez quitté votre compte sur cet appareil.",
    noAccountYet:
      "Pas encore de compte ? Il s'ouvre la première fois que vous publiez un commentaire avec votre adresse.",
  },
  email: {
    subject: "Publiez votre commentaire sur EthniAfrica",
    signInSubject: "Votre lien pour ouvrir votre compte EthniAfrica",
    intro:
      "Merci pour votre commentaire. Pour le publier, ouvrez ce lien puis appuyez sur « Publier mon commentaire » :",
    signInIntro:
      "Voici le lien pour ouvrir votre compte EthniAfrica. Ouvrez-le puis appuyez sur « Ouvrir mon compte » :",
    validity:
      "Il ne sert qu'une fois et n'est valable que peu de temps. Le même lien ouvre votre compte, où vous suivez vos commentaires et les réponses qu'ils reçoivent.",
    ignore:
      "Si vous n'avez rien écrit sur EthniAfrica, ignorez ce message : rien ne sera publié avec votre adresse.",
  },
};

type AccountCopy = typeof fr;

// @req REQ-213
export const accountCopy: Record<Language, AccountCopy> = { fr };
