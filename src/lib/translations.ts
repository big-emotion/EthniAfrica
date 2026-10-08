import { adminCopy } from "@/lib/i18n/copy/admin";
import { classificationCopy } from "@/lib/i18n/copy/classification";
import { atlasCopy } from "@/lib/i18n/copy/atlas";
import { anecdotesCopy } from "@/lib/i18n/copy/anecdotes";
import { articlesCopy } from "@/lib/i18n/copy/articles";
import { colonizationCopy } from "@/lib/i18n/copy/colonization";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import { chromeCopy } from "@/lib/i18n/copy/chrome";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import { wordAnswerCopy } from "@/lib/i18n/copy/wordAnswer";
import { commonCopy } from "@/lib/i18n/copy/common";
import { consentCopy } from "@/lib/i18n/copy/consent";
import { compareCopy } from "@/lib/i18n/copy/compare";
import { contactCopy } from "@/lib/i18n/copy/contact";
import { aboutCopy } from "@/lib/i18n/copy/about";
import { contributeCopy } from "@/lib/i18n/copy/contribute";
import { facetsCopy } from "@/lib/i18n/copy/facets";
import { fieldProvenanceCopy } from "@/lib/i18n/copy/fieldProvenance";
import { familyCopy } from "@/lib/i18n/copy/family";
import { ficheCopy } from "@/lib/i18n/copy/fiche";
import { footerCopy } from "@/lib/i18n/copy/footer";
import { gamesCopy } from "@/lib/i18n/copy/games";
import { hubsCopy } from "@/lib/i18n/copy/hubs";
import { languagesCopy } from "@/lib/i18n/copy/languages";
import { migrationsCopy } from "@/lib/i18n/copy/migrations";
import { namesCopy } from "@/lib/i18n/copy/names";
import { patronymesCopy } from "@/lib/i18n/copy/patronymes";
import { peopleCopy } from "@/lib/i18n/copy/people";
import { proverbsCopy } from "@/lib/i18n/copy/proverbs";
import { publicFlagsCopy } from "@/lib/i18n/copy/publicFlags";
import { quizCopy } from "@/lib/i18n/copy/quiz";
import { reportsCopy } from "@/lib/i18n/copy/reports";
import { serverCopy } from "@/lib/i18n/copy/server";
import { provenanceCopy } from "@/lib/i18n/copy/provenance";
import { sitemapPageCopy } from "@/lib/i18n/copy/sitemapPage";
import { systemCopy } from "@/lib/i18n/copy/system";
import { trailCopy } from "@/lib/i18n/copy/trail";
import type { Language } from "@/types/shared";

/**
 * The site dictionary, composed from the per-surface modules under
 * `src/lib/i18n/copy/`.
 *
 * A façade rather than the dictionary itself: forty-odd importers read
 * `getTranslation(lang).<surface>` and every one of them would move if the
 * shape changed, so the shape stays and the strings live one file per
 * surface. A client island that is budgeted — the quiz — imports its own
 * module instead, and this file is what keeps that split from costing the
 * server side anything.
 */
const fr = {
  admin: adminCopy.fr,
  server: serverCopy.fr,
  anecdotes: anecdotesCopy.fr,
  articles: articlesCopy.fr,
  proverbs: proverbsCopy.fr,
  atlas: atlasCopy.fr,
  ...commonCopy.fr,
  chrome: chromeCopy.fr,
  nameAnswer: nameAnswerCopy.fr,
  searchAnswer: searchAnswerCopy.fr,
  wordAnswer: wordAnswerCopy.fr,
  consent: consentCopy.fr,
  compare: compareCopy.fr,
  contact: contactCopy.fr,
  contribute: contributeCopy.fr,
  facets: facetsCopy.fr,
  footer: footerCopy.fr,
  about: aboutCopy.fr,
  games: gamesCopy.fr,
  sitemapPage: sitemapPageCopy.fr,
  publicFlags: publicFlagsCopy.fr,
  classification: classificationCopy.fr,
  names: namesCopy.fr,
  languages: languagesCopy.fr,
  patronymes: patronymesCopy.fr,
  migrations: migrationsCopy.fr,
  colonization: colonizationCopy.fr,
  discoveries: discoveriesCopy.fr,
  quiz: quizCopy.fr,
  reports: reportsCopy.fr,
  provenance: provenanceCopy.fr,
  fieldProvenance: fieldProvenanceCopy.fr,
  family: familyCopy.fr,
  fiche: ficheCopy.fr,
  peopleFiche: peopleCopy.fr,
  hubs: hubsCopy.fr,
  trail: trailCopy.fr,
  system: systemCopy.fr,
};

type UiDictionary = typeof fr;

/**
 * Typed `Record<Language, …>` on purpose: with `noImplicitAny: false`, an
 * untyped literal let an unknown locale key compile and return `undefined`.
 */
// @req REQ-014
export const translations: Record<Language, UiDictionary> = { fr };

// @req REQ-014
export const getTranslation = (lang: Language): UiDictionary =>
  translations[lang];

/**
 * Localized labels and tooltips for the `classification_status` enum.
 * Used by the ClassificationBadge component (ETNI-178).
 */
// @req REQ-023
export const classificationLabels = translations.fr.classification;
