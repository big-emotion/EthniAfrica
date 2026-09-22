"use client";

import { useLanguage } from "@/hooks/use-language";
import { PageLayout } from "@/components/layout/PageLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionLink } from "@/components/ui/ActionLink";
import {
  ExternalLink,
  Download,
  FileText,
  Code,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { ContributionForm } from "@/components/ContributionForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocalizedRoute, getStaticPageRoute } from "@/lib/routing";
import { getTranslation } from "@/lib/translations";

/**
 * A Google Forms pilot, one per fiche category, scoped in
 * docs/editorial/contribution-forms-draft-2026-09-22.md. Each form is built
 * from the same question tables by a standalone Apps Script project — edit
 * that script and re-run it rather than hand-editing a form if these change.
 *
 * `place` has no strict model, loader or `SearchEntityType` entry yet
 * (§5 of the draft): its answers are raw material for a future corpus class,
 * not a fiche this form alone can publish — hence `inProgress`.
 */
interface ContributionFormLink {
  id: "people" | "country" | "place" | "patronyme" | "language";
  url: string;
  inProgress?: boolean;
}

const CONTRIBUTION_FORM_LINKS: ContributionFormLink[] = [
  {
    id: "people",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSc8vJrOaRWj9tU7PbCWOHEzhdZFdSXrPOrkP71Vxi2hMqS-MQ/viewform",
  },
  {
    id: "country",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdjN4tHOczhmIzbpq1mVSkZ_75JqQ6d9yagHHdzG1ELQkf5gQ/viewform",
  },
  {
    id: "place",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSeKbDH9Y-DmV541UhhJtnUONkpuNW0k30mKTyPaOU7E8BVUqw/viewform",
    inProgress: true,
  },
  {
    id: "patronyme",
    url: "https://docs.google.com/forms/d/e/1FAIpQLScUxRKIw0nG2Rw256f3vtyBmKn89jbTvD83vkzqKPGXOy4d2g/viewform",
  },
  {
    id: "language",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdOsEOIc__JNbPUqe8y7DzmEY5cIyvJdhSoqM-zHhsYNp733Q/viewform",
  },
];

// @req REQ-045
export default function ContributePageClient() {
  // The route's locale, read by the hook itself; nothing here writes it back,
  // because only the switcher may remember a choice (REQ-140).
  const { language, setLanguage } = useLanguage();

  const t = getTranslation(language).contribute.page;

  const handleDownload = (format: "csv" | "excel") => {
    window.open(`/api/download?format=${format}&lang=${language}`, "_blank");
  };

  return (
    <PageLayout
      language={language}
      onLanguageChange={setLanguage}
      hideHeader={true}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-afh-h1 font-display font-bold">{t.title}</h1>

        {/* Section Intro */}
        <section className="space-y-4">
          <h2 className="text-afh-h2 font-display font-bold">{t.introTitle}</h2>
          <p>
            {t.introBeforeStrong}
            <strong>{t.introStrong}</strong>
            {t.introBeforeAbout}
            <Link
              href={getLocalizedRoute(language, "about")}
              className="underline underline-offset-4"
            >
              {t.aboutLink}
            </Link>{" "}
            {t.introAfterAbout}
          </p>
          <p>
            {t.invitationBeforeStrong}
            <strong>{t.invitationStrong}</strong>
            {t.invitationBeforeGithub}
            <a
              href="https://github.com/big-emotion/ethniafrica"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {t.githubRepository}
            </a>
            .
          </p>
        </section>

        {/* Section Contribution Form */}
        <section className="space-y-4">
          <ContributionForm language={language} />
        </section>

        {/* Section Contribution Forms (Google Forms pilot) */}
        <section className="space-y-4">
          <h3 className="text-afh-h2 font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t.formsTitle}
          </h3>
          <p className="text-muted-foreground">{t.formsText}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {CONTRIBUTION_FORM_LINKS.map((entry) => {
              const category = t.formsCategories[entry.id];
              return (
                <Card key={entry.id}>
                  <CardHeader>
                    <CardTitle className="text-afh-body flex items-center gap-2 flex-wrap">
                      {category.title}
                      {entry.inProgress && (
                        <Badge variant="secondary">{t.formsInProgress}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {t.formsCta}
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Section API Documentation */}
        <section className="space-y-4">
          <h3 className="text-afh-h2 font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.apiDocsTitle}
          </h3>
          <p className="text-muted-foreground">{t.apiDocsText}</p>
          <div className="pt-2">
            <Link href="/docs/api" target="_blank" rel="noopener noreferrer">
              <Button variant="default" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {t.apiDocsButton}
              </Button>
            </Link>
          </div>
        </section>

        {/* Section Download */}
        <section className="space-y-4">
          <h3 className="text-afh-h2 font-semibold flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t.downloadTitle}
          </h3>
          <p className="text-muted-foreground">{t.downloadText}</p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              variant="default"
              onClick={() => handleDownload("csv")}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {t.csvButton}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload("excel")}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {t.excelButton}
            </Button>
          </div>
        </section>

        {/* Section GitHub */}
        <section className="space-y-4">
          <h3 className="text-afh-h2 font-semibold flex items-center gap-2">
            <Code className="h-5 w-5" />
            {t.githubTitle}
          </h3>
          <p className="text-muted-foreground">{t.githubText}</p>
          <div className="pt-2">
            <Link
              href="https://github.com/big-emotion/ethniafrica"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {t.githubButton}
              </Button>
            </Link>
          </div>
        </section>

        {/* Section Contact */}
        <section className="space-y-4">
          <h3 className="text-afh-h2 font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t.contactTitle}
          </h3>
          <p className="text-muted-foreground">{t.contactText}</p>
          <div className="pt-2">
            <ActionLink href={getStaticPageRoute(language, "contact")}>
              {t.contactLink}
            </ActionLink>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
