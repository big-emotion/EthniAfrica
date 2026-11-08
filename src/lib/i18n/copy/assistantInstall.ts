import type { Language } from "@/types/shared";

// Board: docs/design/mockups/site/agent-install-*.dc.html (brief 20). The
// board's second « Vos données » paragraph (family accounts) is left out: it
// describes proposals, which are not shipped.
const fr = {
  title: "EthniAfrica dans Claude et ChatGPT",
  eyebrow: "Assistant",
  lead: "Demandez à votre assistant d'où vient un nom africain. Il répond avec les fiches d'EthniAfrica, leurs sources et des pistes pour aller plus loin.",
  install: {
    title: "Ajouter EthniAfrica à votre assistant",
    fieldLabel: "Adresse à coller dans votre assistant",
    copy: "Copier l'adresse",
    copied: "Adresse copiée",
    copyFailed:
      "La copie n'a pas marché. L'adresse est sélectionnée : copiez-la avec votre clavier.",
    soon: "Bientôt : l'ajout en un clic, depuis les répertoires de Claude et de ChatGPT.",
  },
  clients: {
    claude: {
      title: "Dans Claude",
      steps: [
        "Ouvrez Paramètres, puis Connecteurs.",
        "Choisissez « Ajouter un connecteur personnalisé ».",
        "Nommez-le EthniAfrica, collez l'adresse, puis validez.",
      ],
      note: "Avec l'offre gratuite, Claude accepte un seul connecteur personnalisé.",
    },
    chatgpt: {
      title: "Dans ChatGPT",
      steps: [
        "Ouvrez Paramètres, puis Plugins.",
        "Choisissez « Ajouter un serveur MCP personnalisé ».",
        "Nommez-le EthniAfrica, collez l'adresse, puis validez.",
      ],
      note: "Selon votre offre, il faut d'abord activer le mode développeur.",
    },
  },
  tries: {
    title: "Questions à essayer",
    questions: [
      "Traoré",
      "Pourquoi on dit Côte d'Ivoire ?",
      "Les Bantous, c'est qui ?",
      "D'où vient le mot tribu ?",
    ],
  },
  obtained: {
    title: "Ce que vous obtenez",
    items: [
      "La langue du nom, ce qu'il veut dire, et qui l'a donné.",
      "Ses autres noms au fil du temps, et ses différents récits quand les sources ne s'accordent pas.",
      "Les sources, avec leur type : archive, publication, tradition orale…",
      "Un lien vers la fiche, et des pistes pour aller plus loin.",
    ],
  },
  privacy: {
    title: "Vos données",
    statement:
      "EthniAfrica ne garde ni votre nom, ni votre compte, ni vos conversations.",
    link: "Lire la politique de données",
  },
};

type AssistantInstallCopy = typeof fr;

// @req REQ-145
export const assistantInstallCopy: Record<Language, AssistantInstallCopy> = {
  fr,
};
