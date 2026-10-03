import type {
  NameAttestationView,
  PeopleNamesDossier,
} from "@/api/v2/schemas/names";
import type { Language } from "@/types/shared";
import { peopleCopy } from "@/lib/i18n/copy/people";
import { bcp47LanguageTag } from "@/lib/languageTag";

/**
 * What the people fiche's answer card shows (REQ-190, DEC-068): the name the
 * people gives itself, then every other form once.
 *
 * When a name record exists it is the only source. Mixing it with the fiche's
 * appellations is what printed « Fulbe (pluriel), Pullo (singulier) » and
 * « Fulɓe (pluriel) ; Pullo (singulier) » one above the other: the two files
 * spell the same name differently, and no comparison of strings can tell. The
 * appellations stay the fallback for the fiches no record covers yet.
 */

/** A badge is a status, never a sentence: own · outside · imposed · debated · usage:<lang>. */
export type NameBadge =
  "own" | "outside" | "imposed" | "debated" | `usage:${string}`;

export interface AnsweredName {
  form: string;
  /** BCP 47 / ISO 639-3 tag for the form's `lang` attribute. */
  lang?: string;
  line?: string;
  badges: NameBadge[];
  attestations: NameAttestationView[];
}

export interface SelfName extends AnsweredName {
  pronunciation?: { respelling: string; audioUrl: string | null };
  /** The long explanation, opened on demand. */
  detail?: string;
}

export interface NameAnswer {
  self: SelfName | null;
  others: AnsweredName[];
  /** The fiche-level origin paragraph, for fiches without a name record. */
  othersNote?: string;
  /** What the names raise, opened on demand — never in the first reading. */
  othersProblem?: string;
}

interface Appellations {
  selfAppellation?: string | null;
  exonyms?: string[] | null;
  originOfExonyms?: string | null;
  whyProblematic?: string | null;
}

type DossierName = PeopleNamesDossier["names"][number];

function badgesOf(name: DossierName): NameBadge[] {
  const badges: NameBadge[] = [];
  if (name.nameType === "endonym") badges.push("own");
  else if (name.imposition?.imposedBy) badges.push("imposed");
  else badges.push("outside");
  if (name.originDebated) badges.push("debated");
  for (const lang of name.usedIn ?? []) badges.push(`usage:${lang}`);
  return badges;
}

function answered(name: DossierName, language: Language): AnsweredName {
  return {
    form: name.nameText,
    // A `lang` attribute takes the BCP 47 tag (`wo`), not the corpus's
    // ISO 639-3 code (`wol`), which accessibility checkers refuse.
    lang: bcp47LanguageTag(name.languageOfOrigin),
    line:
      name.shortLine ??
      (name.namedBy
        ? peopleCopy[language].nameAnswer.givenBy(name.namedBy)
        : undefined),
    badges: badgesOf(name),
    attestations: name.attestations ?? [],
  };
}

// @req REQ-190
export function peopleNameAnswer(
  appellations: Appellations | null | undefined,
  dossier: PeopleNamesDossier | null | undefined,
  language: Language,
  selfLang?: string
): NameAnswer {
  const names = dossier?.names ?? [];

  if (names.length > 0) {
    const seen = new Set<string>();
    const unique = names.filter((name) => {
      const key = name.nameText.trim().toLocaleLowerCase(language);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const selfIndex = unique.findIndex((name) => name.nameType === "endonym");
    const selfRecord = selfIndex >= 0 ? unique[selfIndex] : null;
    const self: SelfName | null = selfRecord
      ? {
          ...answered(selfRecord, language),
          pronunciation: selfRecord.pronunciation
            ? {
                respelling: selfRecord.pronunciation.respelling,
                audioUrl: selfRecord.pronunciation.audio?.url ?? null,
              }
            : undefined,
          detail: selfRecord.meaning ?? undefined,
        }
      : null;
    return {
      self,
      others: unique
        .filter((_, index) => index !== selfIndex)
        .map((name) => answered(name, language)),
    };
  }

  const selfForm = appellations?.selfAppellation?.trim();
  return {
    self: selfForm
      ? {
          form: selfForm,
          lang: bcp47LanguageTag(selfLang),
          badges: ["own"],
          attestations: [],
        }
      : null,
    others: (appellations?.exonyms ?? [])
      .filter((exonym) => exonym && exonym.trim() !== selfForm)
      .map((exonym) => ({
        form: exonym,
        badges: ["outside"],
        attestations: [],
      })),
    othersNote: appellations?.originOfExonyms?.trim() || undefined,
    othersProblem: appellations?.whyProblematic?.trim() || undefined,
  };
}
