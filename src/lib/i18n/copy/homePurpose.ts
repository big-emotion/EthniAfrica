import type { Language } from "@/types/shared";

export interface HomePurposeBlock {
  title: string;
  body: string;
  linkLabel: string;
}

export interface HomePurposeCopy {
  contribute: {
    title: string;
    corrections: string;
    code: string;
    linkLabel: string;
  };
  /** Why the project exists; links to the About page. */
  why: HomePurposeBlock;
  /** How it treats a claim; links to the public method page. */
  sources: HomePurposeBlock;
}

/**
 * The home's project-and-method section, below the stories.
 *
 * It replaces the « Notre propos » disclosure that sat above the search, and
 * with it the borders-versus-names sentence that disclosure carried. That
 * sentence stays the project's position on the About page's purpose chapter;
 * on the home it asked a first-time reader to weigh a thesis before they had
 * searched anything (operator ruling, 2026-09-22). What the home owes instead
 * is what the project is for and how it handles what it does not know — the
 * second block is the one promise the result page also keeps (declared
 * silences, the invitation to correct).
 */
// @req REQ-115
// @req REQ-145
export const homePurposeCopy: Record<Language, HomePurposeCopy> = {
  en: {
    contribute: {
      title: "Let us grow EthniAfrica together",
      corrections:
        "Suggest a correction or share a source to improve the information.",
      code: "You can also contribute to the open source project on GitHub.",
      linkLabel: "Contribute",
    },
    why: {
      title: "Why EthniAfrica?",
      body: "We want knowledge about Africa’s peoples to be easier to find and to share. We start from names to connect the stories, the uses and the sources.",
      linkLabel: "Discover the project",
    },
    sources: {
      title: "Sources to understand",
      body: "We show the sources, the disagreements and what we do not know yet.",
      linkLabel: "How we work",
    },
  },
  fr: {
    contribute: {
      title: "Faisons grandir EthniAfrica ensemble",
      corrections:
        "Proposez une correction ou partagez une source pour améliorer les informations.",
      code: "Vous pouvez aussi participer au projet open source sur GitHub.",
      linkLabel: "Contribuer",
    },
    why: {
      title: "Pourquoi EthniAfrica ?",
      body: "Nous voulons rendre les connaissances sur les populations d’Afrique plus faciles à trouver et à partager. Nous partons des noms pour relier les histoires, les usages et les sources.",
      linkLabel: "Découvrir le projet",
    },
    sources: {
      title: "Des sources pour comprendre",
      body: "Nous indiquons les sources, les désaccords et ce que nous ne savons pas encore.",
      linkLabel: "Comment nous travaillons",
    },
  },
};
