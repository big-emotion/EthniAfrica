import type { Language } from "@/types/shared";

const fr = {
  page: {
    title: "Contribuer",
    introTitle: "Contribution et participation",
    introBeforeStrong: "Le site est alimenté par une ",
    introStrong: "base de données structurée",
    introBeforeAbout: ", organisée selon la méthodologie AFRIK. La page ",
    aboutLink: "À propos",
    introAfterAbout: "détaille ce que contient notre projet.",
    invitationBeforeStrong: "Je suis ",
    invitationStrong: "ouvert à toutes les propositions ou contributions",
    invitationBeforeGithub:
      ", qu'il s'agisse de partager des sources, des corrections, ou simplement des idées d'amélioration. Si vous souhaitez aider, n'hésitez pas à me contacter ou à proposer directement sur le ",
    githubRepository: "dépôt GitHub du projet",
    apiDocsTitle: "Documentation API",
    apiDocsText:
      "Consultez la documentation complète de l'API pour comprendre comment récupérer les données de manière programmatique. Elle liste chaque famille de ressources et ses endpoints.",
    apiDocsButton: "Voir la documentation API",
    downloadTitle: "Télécharger les données",
    downloadText:
      "Téléchargez toutes les données au format CSV ou Excel pour votre propre usage, analyse ou contributions.",
    csvButton: "Télécharger CSV (ZIP)",
    excelButton: "Télécharger Excel",
    contactTitle: "Contact",
    contactText:
      "Vous souhaitez nous écrire — une erreur à signaler, une source à proposer, une réutilisation des données à discuter ?",
    contactLink: "Aller au formulaire de contact",
    githubTitle: "Contribuer via GitHub",
    githubText:
      "Le projet est open source et hébergé sur GitHub. Vous pouvez contribuer en soumettant des issues, des pull requests, ou en améliorant le code source.",
    githubButton: "Participer sur GitHub",
    formsTitle: "Documenter une entrée en détail",
    formsText:
      "Le formulaire ci-dessus corrige une fiche rapidement. Ces cinq formulaires documentent une entrée en détail, un par catégorie, à travers un jeu de questions dédié — relu par un curateur avant toute publication.",
    formsCta: "Ouvrir le formulaire",
    formsInProgress: "En construction",
    formsCategories: {
      people: {
        title: "Un peuple",
        description:
          "Comment il s'appelle lui-même, les formes qu'on lui a données, ce qu'elles soulèvent.",
      },
      country: {
        title: "Une nation",
        description:
          "D'où vient l'appellation qu'elle porte aujourd'hui, et ses formes passées.",
      },
      place: {
        title: "Un lieu",
        description:
          "Ville, région, site historique — une catégorie encore à l'étude ; vos réponses nourrissent le futur modèle.",
      },
      patronyme: {
        title: "Un patronyme",
        description:
          "Orthographes attestées, mode de transmission, une origine racontée ou écrite.",
      },
      language: {
        title: "Une langue",
        description:
          "Formes attestées, ce qu'elles posent, la famille linguistique quand elle est connue.",
      },
    },
  },
  title: "Soumettre une contribution",
  type: "Type de contribution",
  inputMode: "Mode de saisie",
  jsonMode: "JSON",
  formMode: "Formulaire",
  payload: "Données (JSON)",
  payloadPlaceholder:
    '{"name_main": "nom principal", "language_family_id": "FLG_...", ...}',
  name: "Votre nom (optionnel)",
  email: "Votre email (optionnel)",
  notes: "Notes (optionnel)",
  submit: "Soumettre la contribution",
  submitting: "Envoi en cours...",
  success:
    "Merci. Votre contribution a bien été reçue. Elle sera examinée avant toute modification de la page.",
  error:
    "Votre contribution n’a pas pu être envoyée. Réessayez dans un instant.",
  invalidJson: "Format JSON invalide",
  verification: "Vérification anti-robot",
  notVerified:
    "La vérification anti-robot n'est pas terminée. Patientez quelques instants, puis réessayez.",
  verificationFailed:
    "La vérification anti-robot n'a pas abouti. Rechargez la page pour réessayer.",
  selectType: "Sélectionner un type",
  newPeople: "Nouveau peuple",
  updatePeople: "Modifier un peuple",
  newCountry: "Nouveau pays",
  updateCountry: "Modifier un pays",
  newLanguageFamily: "Nouvelle famille linguistique",
  updateLanguageFamily: "Modifier une famille linguistique",
  requiredFields: "Veuillez remplir tous les champs obligatoires",
  sourceUnverified:
    "Cette source sera publiée avec la mention « Non vérifiée » : la contribution est acceptée, mais l'indice de confiance affiché sur la page en tiendra compte et sera plus bas.",
  summaries: {
    new_people: "Proposition d'un nouveau peuple",
    update_people: "Proposition de correction sur un peuple",
    new_country: "Proposition d'un nouveau pays",
    update_country: "Proposition de correction sur un pays",
    new_language_family: "Proposition d'une nouvelle famille linguistique",
    update_language_family:
      "Proposition de correction sur une famille linguistique",
    fallback: "Contribution",
  },
  fields: {
    selectEntity: "Sélectionner l'entité à modifier",
    id: "ID",
    nameMain: "Nom principal",
    nameFr: "Nom (FR)",
    etymology: "Étymologie",
    nameOriginActor: "Acteur à l'origine du nom",
    languageFamily: "Famille linguistique",
    currentCountries: "Pays (codes ISO séparés par des virgules)",
    loading: "Chargement...",
  },
  reference: {
    title: "Ajouter une référence",
    introduction:
      "Recherchez une référence déjà vérifiée ou enregistrez un ouvrage que vous consultez hors ligne.",
    modeLabel: "Mode de référence",
    searchMode: "Rechercher dans la bibliothèque",
    offlineMode: "Enregistrer un ouvrage hors ligne",
    searchLabel: "Rechercher une référence existante",
    searchPlaceholder: "Titre, auteur, éditeur…",
    search: "Rechercher",
    searching: "Recherche en cours…",
    searchError: "La recherche n'a pas pu être effectuée.",
    selected: "Référence sélectionnée.",
    offlineTitle: "Titre de l’ouvrage",
    authors: "Auteur(s)",
    authorsPlaceholder: "Séparez plusieurs auteurs par un point-virgule",
    year: "Année de publication",
    sourceKind: "Type de source",
    identifier: "Identifiant bibliographique (ISBN, DOI ou cote)",
    identifierPlaceholder: "Ex. ISBN 978-… ou cote ANC-1912-7",
    publisher: "Éditeur ou institution (optionnel)",
    url: "URL (optionnelle)",
    saving: "Enregistrement…",
    save: "Enregistrer la référence",
    saved:
      "Référence enregistrée. Vous pouvez ajouter un repère ou un document privé.",
    saveError: "La référence n'a pas pu être enregistrée.",
    selectedPrefix: "Référence sélectionnée :",
    locator: "Repère précis dans la source (optionnel)",
    locatorPlaceholder: "Ex. p. 48, § 2 ou 01:32",
    linking: "Association…",
    link: "Lier à l’assertion",
    linked: "Référence liée à l'assertion.",
    linkError: "Le repère n'a pas pu être enregistré.",
    privateDocumentType: "Type de document privé",
    scan: "Scan",
    ocr: "Texte OCR",
    addDocument: "Ajouter un scan ou un texte OCR",
    privateHelp:
      "Le scan ou le texte OCR reste privé et ne sera pas publié sans vérification des droits.",
    uploading: "Ajout…",
    upload: "Ajouter le document privé",
    uploaded: "Document privé enregistré.",
    uploadError: "Le document privé n'a pas pu être enregistré.",
    authRequired: "Connectez-vous pour ajouter une référence.",
    moderatorOnlyTitle: "Bibliothèque de références",
    moderatorOnly:
      "L’ajout de références à la bibliothèque partagée est réservé aux modérateurs. Citez vos sources dans la contribution elle-même, dans les champs du formulaire ou dans les notes : un modérateur les enregistrera.",
    requestError: "La demande n'a pas pu être traitée.",
    sourceKinds: {
      intergovernmental: "Organisation intergouvernementale",
      government: "Institution publique",
      official_statistics: "Statistiques officielles",
      linguistic_reference: "Référence linguistique",
      academic: "Publication académique",
      community: "Organisation communautaire",
      repository: "Dépôt documentaire",
      archive: "Archive",
    },
  },
  antibot: {
    working: "Vérification en cours…",
    solved: "Vérification terminée.",
    failed:
      "La vérification n'a pas abouti. Rechargez la page pour réessayer, ou écrivez-nous.",
  },
};

type ContributeCopy = typeof fr;

// @req REQ-145
export const contributeCopy: Record<Language, ContributeCopy> = { fr };
