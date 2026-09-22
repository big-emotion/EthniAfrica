import type { CountedClassKey } from "@/lib/home/corpusClasses";
import type { Language } from "@/types/shared";

export interface HomeCorpusCountsCopy {
  title: string;
  /** The figures' own name, kept beside the title because it carries the scope word. */
  ariaLabel: string;
  /**
   * « pour le moment » because a failed read is an outage, not a finding: the
   * bare « Indisponible » could read as the corpus holding nothing to count.
   */
  unavailable: string;
  /**
   * Lowercase and scoped — « peuples documentés », not « Peuples » — because
   * the tile is read as one phrase from the number down, and the scope word is
   * the band's only defence against being read as a claim of exhaustiveness
   * (see corpusClasses.ts).
   */
  tileLabels: Record<CountedClassKey, string>;
}

// @req REQ-113
// @req REQ-145
export const homeCorpusCountsCopy: Record<Language, HomeCorpusCountsCopy> = {
  en: {
    title: "EthniAfrica at a glance",
    ariaLabel: "What we document",
    unavailable: "Unavailable for now",
    tileLabels: {
      peoples: "peoples documented",
      languages: "languages documented",
      patronymes: "names documented",
    },
  },
  fr: {
    title: "EthniAfrica en quelques repères",
    ariaLabel: "Ce que nous documentons",
    unavailable: "Indisponible pour le moment",
    tileLabels: {
      peoples: "peuples documentés",
      languages: "langues documentées",
      patronymes: "noms documentés",
    },
  },
};
