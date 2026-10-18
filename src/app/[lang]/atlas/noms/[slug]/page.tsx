import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ficheHead } from "@/lib/seo/ficheHead";
import type { Language } from "@/types/shared";
import { loadPatronymeFiche } from "@/lib/fiche/ficheExistence";
import {
  isIndexableStanding,
  readNameStanding,
} from "@/lib/patronymes/content";
import { PageLayout } from "@/components/layout/PageLayout";
import { FicheJsonLd } from "@/components/fiche/FicheJsonLd";
import { loadPatronymeNextSteps } from "@/lib/fiche/patronymeNextSteps";
import { ficheJsonLdFor } from "@/lib/seo/ficheJsonLd";
import { FicheSequence } from "@/components/fiche/FicheSequence";
import { FicheHeroHead } from "@/components/fiche/FicheHeroHead";
import {
  PatronymeFicheTitle,
  patronymeDisplayName,
} from "@/components/patronymes/PatronymeFicheTitle";
import { PatronymeFicheView } from "@/components/patronymes/PatronymeFicheView";

// A literal on purpose: Next reads segment config statically. Held to
// `CORPUS_AGGREGATE_REVALIDATE_SECONDS` (`PUBLIC_FLAGS_REVALIDATE_SECONDS` for
// the 60 s pages) by `src/app/__tests__/cacheFreshnessContract.test.ts`.
// @req REQ-133
export const revalidate = 3600;

interface PageParams {
  lang: string;
  slug: string;
}

/**
 * What this fiche asks a crawler to do with it.
 *
 * A name dossier is indexable when it cites at least one readable source that
 * a person wrote, whatever that source's tier (DEC-055, which replaces
 * DEC-050's threshold by tier; operator decisions of 2026-09-30). The Source
 * Tier Policy labels and never suppresses, and the sitemap applies the same
 * predicate. Only a dossier citing nothing readable, or only machine-written
 * sources, is withheld from the index; it stays published and labelled.
 *
 * `follow` stays `true` on purpose: the fiche's outbound links point at
 * sourced fiches, and `nofollow` would strip the inbound signal those earn
 * from a page whose only fault is its own thin sourcing.
 *
 * The canonical is declared either way. Indexability and identity answer
 * different questions, and a `noindex` page still has to say which address it
 * is the duplicate of.
 */
// @req REQ-133
// @req REQ-147
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { lang, slug } = await params;

  const canonical = await ficheHead("name", lang as Language, slug);
  // An unparseable slug gets no metadata from `ficheHead`, and a robots
  // directive on a 404 would be the same mistake in another field.
  if (!canonical.alternates) return canonical;

  let standing: ReturnType<typeof readNameStanding>;
  try {
    const patronyme = await loadPatronymeFiche(decodeURIComponent(slug));
    // The route 404s an unknown name from its layout; a 404 declares nothing.
    if (!patronyme) return {};
    standing = readNameStanding(patronyme.content);
  } catch {
    // An unreachable corpus is not a weak dossier. Answering `noindex` to a
    // timeout would de-list a sourced fiche, so a failed read leaves the
    // metadata as it stood before this directive existed. The page body reads
    // the corpus again and is where the failure surfaces.
    return canonical;
  }

  // A readable, human-written citation keeps the name indexable, whatever its
  // tier — the same predicate the sitemap applies, so a submitted URL never
  // declares itself `noindex`. A dossier that cites nothing readable, or only
  // machine-written sources, is withheld.
  if (isIndexableStanding(standing)) return canonical;

  return { ...canonical, robots: { index: false, follow: true } };
}

/**
 * A patronyme fiche carries no globe (REQ-133 — see FicheSequence's own
 * doc comment on `globe?`): it is a naming fact, not a bounded cartographic
 * subject, so `FicheSequence` renders with `globe` omitted rather than
 * passed as `null` or an empty band.
 */
// @req REQ-133
export default async function AppellationsSlugPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { lang, slug } = await params;

  const patronyme = await loadPatronymeFiche(decodeURIComponent(slug));
  if (!patronyme) {
    notFound();
  }

  const nextSteps = await loadPatronymeNextSteps(
    patronyme.alliances.map((alliance) => ({
      id: alliance.targetId,
      name: alliance.targetNameMain,
    })),
    lang as Language,
    patronyme.id
  );

  return (
    <PageLayout
      language={lang as Language}
      sectionName="Appellations"
      flushTop
      trailLabel={patronymeDisplayName(patronyme)}
      heroHead={
        <FicheHeroHead entityType="name">
          <PatronymeFicheTitle
            patronyme={patronyme}
            language={lang as Language}
          />
        </FicheHeroHead>
      }
    >
      <FicheJsonLd
        graph={await ficheJsonLdFor("name", lang as Language, patronyme.id)}
      />
      <FicheSequence
        language={lang as Language}
        entityType="name"
        entityId={patronyme.id}
        entityName={patronyme.nameMain}
        record={
          <PatronymeFicheView
            patronyme={patronyme}
            language={lang as Language}
            nextSteps={nextSteps}
          />
        }
      />
    </PageLayout>
  );
}
