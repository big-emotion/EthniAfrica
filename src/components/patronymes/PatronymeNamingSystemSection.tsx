import { DossierLinks } from "@/components/dossiers/DossierLinks";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";
import { FicheFieldList, type FicheField } from "@/components/fiche/FicheProse";
import { FicheSection } from "@/components/fiche/FicheSection";
import {
  readDesignatedSocialUnit,
  readGaps,
  readNisbaSubtype,
  readPermittedGivenNames,
  readSpellings,
  readTotemicFoodProhibition,
  readTransmissionMode,
} from "@/lib/patronymes/content";
// Server-only here, so the map asset behind the names never reaches the
// browser. It is the resolver that maps SSD onto the asset's SDS.
import { getAdmin0NameFr } from "@/lib/atlas/overlays";
import { getTranslation } from "@/lib/translations";
import type { Language } from "@/types/shared";

function withoutDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");
}

/**
 * AC1: states the naming system (in the header — `PatronymeFicheTitle`) and
 * renders only the fields belonging to it. The shared fields (attested
 * forms, transmission mode, designated social unit) render for every
 * system; the subtype-only fields are gated on `nameSystem` so a nisba
 * fiche never shows a totemic food prohibition and vice versa, even if the
 * opaque `content` bag happens to carry the other subtype's key.
 */
// @req REQ-133
export function PatronymeNamingSystemSection({
  patronyme,
  language,
}: {
  patronyme: PublicPatronyme;
  language: Language;
}) {
  const t = getTranslation(language).patronymes;
  const { content, nameSystem, casteOrSocialFunction } = patronyme;
  const gaps = new Set(readGaps(content).map((gap) => gap.fieldPath));

  const spellings = readSpellings(content);
  const transmissionMode = readTransmissionMode(content);
  const designatedSocialUnit = readDesignatedSocialUnit(content);
  const currentName = patronyme.nameHistory?.names.find(
    (name) =>
      withoutDiacritics(name.nameText) === withoutDiacritics(patronyme.nameMain)
  );
  const equivalents = currentName?.equivalents ?? [];

  const isTotemicClan = nameSystem === "totemic_clan";
  const isNisba = nameSystem === "nisba";

  const totemicFoodProhibition = isTotemicClan
    ? readTotemicFoodProhibition(content)
    : null;
  const permittedGivenNames = isTotemicClan
    ? readPermittedGivenNames(content)
    : [];
  const nisbaSubtype = isNisba ? readNisbaSubtype(content) : null;

  const fieldsWithPaths: Array<{ fieldPath: string; field: FicheField }> = [
    {
      fieldPath: "casteOrSocialFunction",
      field: {
        label: t.casteOrSocialFunctionLabel,
        prose: casteOrSocialFunction,
      },
    },
    {
      fieldPath: "spellings",
      field: {
        label: t.attestedFormsTitle,
        node:
          spellings.length > 0 ? (
            <ul className="afh-prose-list">
              {spellings.map((form) => (
                <li key={form.spelling}>
                  <strong>{form.spelling}</strong>
                  {form.countryIds.length > 0 ? (
                    <span>
                      {" — "}
                      {t.spellingAttestedIn(
                        form.countryIds.map((id) => getAdmin0NameFr(id) ?? id)
                      )}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : undefined,
      },
    },
    {
      fieldPath: "equivalents",
      field: {
        label: t.equivalentsLabel,
        node:
          equivalents.length > 0 ? (
            <ul className="afh-prose-list">
              {equivalents.map((equivalent, index) => (
                <li key={`${equivalent}-${index}`}>{equivalent}</li>
              ))}
            </ul>
          ) : undefined,
      },
    },
    {
      fieldPath: "transmissionMode",
      field: {
        label: t.transmissionModeLabel,
        prose: transmissionMode
          ? t.transmissionModeLabels[transmissionMode]
          : null,
      },
    },
    {
      fieldPath: "designatedSocialUnit",
      field: {
        label: t.designatedSocialUnitLabel,
        prose: designatedSocialUnit
          ? t.designatedSocialUnitLabels[designatedSocialUnit]
          : null,
      },
    },
    {
      fieldPath: "totemicFoodProhibition",
      field: {
        label: t.totemicFoodProhibitionLabel,
        prose: totemicFoodProhibition,
      },
    },
    {
      fieldPath: "permittedGivenNames",
      field: {
        label: t.permittedGivenNamesLabel,
        prose:
          permittedGivenNames.length > 0
            ? permittedGivenNames.join(", ")
            : null,
      },
    },
    {
      fieldPath: "nisbaSubtype",
      field: {
        label: t.nisbaSubtypeLabel,
        prose: nisbaSubtype ? t.nisbaSubtypeLabels[nisbaSubtype] : null,
      },
    },
  ];
  const fields = fieldsWithPaths
    .filter(({ fieldPath }) => !gaps.has(fieldPath))
    .map(({ field }) => field);

  return (
    <FicheSection title={t.nameSystemSectionTitle}>
      <FicheFieldList fields={fields} language={language} />
      <DossierLinks
        language={language}
        kind="name"
        id={patronyme.id}
        section="naming-system"
      />
    </FicheSection>
  );
}
