import type { LegalDocumentContent } from "@/components/layout/LegalDocument";
import { legalPagesEn } from "@/lib/legal-pages.en";
import { legalPages } from "@/lib/legal-pages";
import { describeLegalHost } from "@/lib/legalHost";
import type { Language } from "@/types/shared";

export type LegalPageKey = keyof typeof legalPages;

/** Where the legal texts say who hosts the site; filled from the environment. */
const HOST_TOKEN = "{host}";

function withHost(
  document: LegalDocumentContent,
  language: Language
): LegalDocumentContent {
  const carriesHost = document.sections.some((section) =>
    section.paragraphs.some((paragraph) => paragraph.includes(HOST_TOKEN))
  );
  if (!carriesHost) return document;

  const host = describeLegalHost(language);
  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph) =>
        paragraph.replace(HOST_TOKEN, host)
      ),
    })),
  };
}

// @req REQ-145
export function getLegalPage(
  language: Language,
  page: LegalPageKey
): LegalDocumentContent {
  const document = language === "en" ? legalPagesEn[page] : legalPages[page];
  return withHost(document, language);
}
