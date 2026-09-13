import { DID_YOU_KNOW_FACTS } from "@/lib/home/didYouKnowFacts";
import { DID_YOU_KNOW_ILLUSTRATIONS } from "@/lib/home/didYouKnowIllustrations";
import { DID_YOU_KNOW_ILLUSTRATIONS_EN } from "@/lib/home/didYouKnowIllustrations.en";
import { localizeDidYouKnowFact } from "@/lib/home/didYouKnowLocalization";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import { findProverb, type Proverb } from "@/lib/proverbs/proverbs";
import { localizeProverb } from "@/lib/proverbs/proverbs.en";
import type { Language } from "@/types/shared";

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

/**
 * The proverbs the reader carries, hand-picked like the anecdotes above.
 *
 * Only attested origins: a visitor lands on this reader without the dossier's
 * context, so a card here names a people only where a source with authority
 * does. Kept short on purpose — the reader is photo-led, and a deck of
 * typographic cards with two photographs in it is a different surface.
 */
// @req REQ-157
export const DISCOVERY_PROVERB_IDS: readonly string[] = [
  "une-parole-douce-lie-les-coeurs",
  "peu-a-peu-l-oeuf-marchera",
  "l-homme-est-le-remede-de-l-homme",
  "hate-hate-n-a-pas-de-benediction",
  "la-grenouille-fait-tomber-la-pluie-sur-sa-tete",
  "un-pouce-seul-n-ecrase-pas-un-pou",
];

function anecdotePublications(): DiscoveryPublication[] {
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

/** What the detail sheet reads: the sense, then why the origin is qualified. */
function proverbBody(proverb: Proverb): string[] {
  return [
    proverb.meaning,
    ...(proverb.origin.note ? [proverb.origin.note] : []),
  ];
}

function proverbPublications(): DiscoveryPublication[] {
  const slugs = DISCOVERY_SLUGS as Record<string, Record<Language, string>>;
  return DISCOVERY_PROVERB_IDS.flatMap((id) => {
    const proverb = findProverb(id);
    const slug = slugs[`proverb:${id}`];
    // Enforced here, not left to the list above: an estimated proverb that
    // happens to cite one referenced work would otherwise pass `authority`.
    if (!proverb || !slug || proverb.origin.status !== "attested") return [];
    const english = localizeProverb(proverb, "en");
    if (!english.translationKind) return [];
    // The card's one source line names the citation that carries authority,
    // not whichever happens to be listed first.
    const authority = proverb.sources.find(
      (source) => source.tier !== "unverified" && source.url
    );
    if (!authority?.url) return [];
    return [
      {
        id: `proverb:${proverb.id}`,
        kind: "proverb",
        status: "published",
        slug,
        title: { fr: proverb.text, en: english.text },
        description: { fr: proverb.meaning, en: english.meaning },
        original: proverb.original
          ? { text: proverb.original.text, lang: proverb.original.lang }
          : undefined,
        source: {
          title: authority.title,
          url: authority.url,
          tier: authority.tier,
        },
        detail: {
          body: { fr: proverbBody(proverb), en: proverbBody(english) },
          entities: proverb.entities.map((entity, index) => ({
            kind: entity.kind,
            id: entity.id,
            label: {
              fr: entity.label,
              en: english.entities[index]?.label ?? entity.label,
            },
          })),
          sources: proverb.sources.flatMap(({ title, url }) =>
            url ? [{ title, url }] : []
          ),
        },
      } satisfies DiscoveryPublication,
    ];
  });
}

// @req REQ-157
export function getDiscoveryPublications(): DiscoveryPublication[] {
  return [...anecdotePublications(), ...proverbPublications()];
}
