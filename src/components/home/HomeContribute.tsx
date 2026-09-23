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
      aria-labelledby="home-contribute-title"
    >
      <div className="home-contribute-inner">
        <h2 id="home-contribute-title">{copy.title}</h2>
        <p>
          {copy.corrections}
          <br />
          {copy.code}
        </p>
        <ActionLink href={getStaticPageRoute(language, "contribute")}>
          {copy.linkLabel}
        </ActionLink>
      </div>
      <style>{`
        .home-contribute {
          padding-top: var(--afh-space-5xl);
        }
        .home-contribute-inner {
          text-align: left;
          border-left: 3px solid var(--accent-ink);
          background: var(--afh-bg-warm);
          padding: var(--afh-space-2xl);
        }
        .home-contribute h2 {
          margin: 0 0 var(--afh-space-md);
          font-family: var(--afh-font-display);
          font-size: var(--afh-text-h3);
          line-height: var(--afh-leading-h3);
          font-weight: 700;
          color: var(--afh-text);
          text-align: left;
          text-wrap: balance;
        }
        .home-contribute p {
          margin: 0 0 var(--afh-space-md);
          font-size: var(--afh-text-body);
          line-height: var(--afh-leading-body);
          color: var(--afh-text);
          text-align: left;
          text-wrap: pretty;
        }
        @media (min-width: 768px) {
          .home-contribute-inner {
          text-align: left;
            padding: var(--afh-space-5xl);
          }
        }
      `}</style>
    </section>
  );
}
