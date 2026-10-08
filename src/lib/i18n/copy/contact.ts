import type {
  ContactCivility,
  ContactSubject,
} from "@/lib/validations/contact";
import type { DidYouKnowEntityKind } from "@/lib/home/didYouKnowFacts";
import type { Language } from "@/types/shared";

const fr = {
  metadataTitle: "Contactez-nous",
  metadataDescription:
    "Nous écrire : signaler une erreur, proposer une source, demander une réutilisation des données.",
  eyebrow: "Nous écrire",
  title: "Contactez-nous",
  introduction:
    "Une erreur sur une page, une source à verser à notre projet, une réutilisation des données à discuter : écrivez-nous. Chaque message arrive dans la même boîte, et l'objet que vous choisissez est ce qui la trie.",
  formTitle: "Envoyer un message",
  requiredFields: "Les champs marqués d'un astérisque sont obligatoires.",
  civility: "Civilité",
  selectCivility: "Sélectionnez…",
  civilities: {
    madame: "Madame",
    monsieur: "Monsieur",
    "sans-mention": "Sans mention",
  } satisfies Record<ContactCivility, string>,
  firstName: "Prénom *",
  lastName: "Nom *",
  email: "Adresse électronique *",
  subject: "Objet *",
  selectSubject: "Sélectionnez un objet",
  subjects: {
    correction: "Signaler une erreur ou une imprécision",
    source: "Proposer une source",
    contribution: "Proposer une contribution",
    reutilisation: "Réutiliser les données",
    presse: "Presse, recherche et partenariats",
    "donnees-personnelles": "Données personnelles",
    autre: "Autre demande",
  } satisfies Record<ContactSubject, string>,
  message: "Message *",
  messagePlaceholder: "Décrivez votre demande…",
  honeypot: "Ne remplissez pas ce champ",
  sending: "Envoi en cours…",
  send: "Envoyer le message",
  sent: "Votre message est bien parti. Nous vous répondons à l'adresse que vous avez indiquée.",
  sendFailed: (email: string) =>
    `Votre message n'a pas pu être envoyé. Écrivez-nous directement à ${email}.`,
  server: {
    invalidJson: "Requête illisible.",
    validationFailed: "Le formulaire comporte des champs à corriger.",
    transportUnavailable: (email: string) =>
      `L'envoi est momentanément indisponible. Écrivez-nous directement à ${email}.`,
    sendFailed: (email: string) =>
      `Votre message n'a pas pu être envoyé. Écrivez-nous directement à ${email}.`,
    rateLimited: (email: string) =>
      `Trop de messages ont été envoyés depuis cette connexion. Réessayez plus tard ou écrivez-nous directement à ${email}.`,
    fieldErrors: {
      civility: "Sélectionnez une civilité valide.",
      firstName: "Indiquez votre prénom.",
      lastName: "Indiquez votre nom.",
      email: "Cette adresse électronique n'est pas valide.",
      subject: "Sélectionnez un objet valide.",
      message: "Décrivez votre demande en quelques mots.",
    },
  },
  emailEyebrow: "Adresse électronique",
  emailHelp:
    "Le formulaire écrit à cette adresse. Nous répondons à celle que vous indiquez.",
  didYouKnow: "Saviez-vous que",
  entityLabels: {
    people: "Peuple",
    country: "Pays",
    family: "Famille linguistique",
  } satisfies Record<DidYouKnowEntityKind, string>,
};

type ContactCopy = typeof fr;

// @req REQ-145
export const contactCopy: Record<Language, ContactCopy> = { fr };
