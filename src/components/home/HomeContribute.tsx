import { ActionLink } from "@/components/ui/ActionLink";
import { homePurposeCopy } from "@/lib/i18n/copy/homePurpose";
import { getStaticPageRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

// @req REQ-115
export function HomeContribute({ language }: { language: Language }) {
  const copy = homePurposeCopy[language].contribute;
  return (
    <section
      className="home-contribute afh-shell afh-accent-ocre"
      data-testid="home-contribute"
      aria-label={copy.title}
    >
      <ActionLink href={getStaticPageRoute(language, "contribute")}>
        {copy.linkLabel}
      </ActionLink>
      <style>{`
        .home-contribute {
          display: flex;
          justify-content: center;
          padding-block: var(--afh-space-5xl);
        }
      `}</style>
    </section>
  );
}
