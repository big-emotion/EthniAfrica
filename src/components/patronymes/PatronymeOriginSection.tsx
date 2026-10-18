import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";
import { FicheSection } from "@/components/fiche/FicheSection";
import { getTranslation } from "@/lib/translations";
import type { Language } from "@/types/shared";

/** Points readers from the origin chapter to the sourced name history. */
// @req REQ-133
export function PatronymeOriginSection({
  language,
}: {
  patronyme: PublicPatronyme;
  language: Language;
}) {
  const t = getTranslation(language).patronymes;

  return (
    <FicheSection title={t.originTitle}>
      <p>{t.originHistorySources}</p>
    </FicheSection>
  );
}
