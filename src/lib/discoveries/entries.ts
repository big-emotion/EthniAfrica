import { DID_YOU_KNOW_FACTS } from "@/lib/home/didYouKnowFacts";
import { DID_YOU_KNOW_ILLUSTRATIONS } from "@/lib/home/didYouKnowIllustrations";
import { DID_YOU_KNOW_ILLUSTRATIONS_EN } from "@/lib/home/didYouKnowIllustrations.en";
import { localizeDidYouKnowFact } from "@/lib/home/didYouKnowLocalization";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";

import type { DiscoveryPublication } from "./catalog";
import { DISCOVERY_SLUGS } from "./slugs";

const selections = [
  {
    factId: "burkina-faso",
    slug: DISCOVERY_SLUGS["burkina-faso"],
    licence: "public-domain",
    focus: "52% 50%",
    sourceLabel: "Jeune Afrique",
    shortCredit: {
      fr: discoveriesCopy.fr.credits.burkina,
      en: discoveriesCopy.en.credits.burkina,
    },
  },
  {
    factId: "guere-wobe",
    slug: DISCOVERY_SLUGS["guere-wobe"],
    licence: "cc-by-sa",
    focus: "42% 50%",
    sourceLabel: "African Studies Review",
    shortCredit: {
      fr: discoveriesCopy.fr.credits.guere,
      en: discoveriesCopy.en.credits.guere,
    },
  },
] as const;

// @req REQ-157
export function getDiscoveryPublications(): DiscoveryPublication[] {
  return selections.flatMap((selection) => {
    const fact = DID_YOU_KNOW_FACTS.find(
      (entry) => entry.id === selection.factId
    );
    const illustration = DID_YOU_KNOW_ILLUSTRATIONS[selection.factId];
    const englishIllustration = DID_YOU_KNOW_ILLUSTRATIONS_EN[selection.factId];
    if (
      !fact?.sources?.length ||
      !illustration ||
      illustration.kind !== "picture" ||
      englishIllustration?.kind !== "picture" ||
      !illustration.filePage
    ) {
      return [];
    }
    const english = localizeDidYouKnowFact(fact, "en");
    if (!english.translationKind) return [];
    const entities = fact.entities.flatMap((entity) => {
      const counterpart = english.entities.find(
        (candidate) =>
          candidate.id === entity.id && candidate.kind === entity.kind
      );
      return counterpart
        ? [
            {
              kind: entity.kind,
              id: entity.id,
              label: { fr: entity.label, en: counterpart.label },
            },
          ]
        : [];
    });
    if (entities.length !== fact.entities.length) return [];
    return [
      {
        id: `anecdote:${fact.id}`,
        kind: "anecdote",
        status: "published",
        slug: selection.slug,
        title: { fr: fact.headline, en: english.headline },
        description: { fr: fact.body[0], en: english.body[0] },
        source: {
          title: fact.sources[0].title,
          shortTitle: selection.sourceLabel,
          url: fact.sources[0].url,
          tier: fact.sources[0].tier,
        },
        detail: {
          body: { fr: fact.body, en: english.body },
          entities,
          sources: fact.sources.map(({ title, url }) => ({ title, url })),
        },
        image: {
          src: illustration.src,
          filePage: illustration.filePage,
          credit: illustration.credit,
          shortCredit: selection.shortCredit,
          alt: { fr: illustration.alt, en: englishIllustration.alt },
          focus: selection.focus,
          licenceUrl: illustration.licenceUrl,
          licence: selection.licence,
        },
      } satisfies DiscoveryPublication,
    ];
  });
}
