import { nommerMeasuresCopy as copy } from "@/lib/i18n/copy/nommer";
import { NOMMER_FIGURES } from "@/lib/dossiers/nommer/figures";
import { formatNumber } from "@/lib/languageTag";
import type { Language } from "@/types/shared";

/**
 * The three numbers the dossier rests on, stated as composition rather than
 * as paragraphs.
 *
 * Each is a `<p>` at hero size — licensed by name in the typography charter
 * §3: "the key figure … set at `hero` inside a `<p>` — it is a number, not a
 * section". A card's three-level rule does not apply, because these are not
 * cards; they are the band.
 *
 * All three take the page accent. Brand charter §5.2: three sibling blocks of
 * the same kind are told apart by their content, "never by rotating through
 * the palette" — a colour that changes with position carries no meaning and
 * reads as decoration.
 *
 * The third measure is the one that matters most and is easiest to get wrong.
 * Printing the ratio as a percentage would let a reader infer that every fiche
 * outside it was examined and found sound, when most were never examined at
 * all. So the band publishes the gap beside the finding, which is what the
 * atlas charter §4 asks of an absent value. The counts themselves stay in
 * `NOMMER_FIGURES`: spelling them out here is how a comment outlives them.
 */

const countedValue = (figureKey: string): number => {
  const figure = NOMMER_FIGURES[figureKey];
  return figure && figure.kind === "counted" ? figure.value : 0;
};

interface Measure {
  value: string;
  claim: string;
  provenance: string;
}

const measures = (language: Language): Measure[] => {
  const exonyms = countedValue("corpus-exonyms");
  const autonyms = countedValue("corpus-autonyms");
  const contested = countedValue("status-contested-or-colonial");
  const peoples = countedValue("corpus-peoples");
  const undeclared = countedValue("status-undeclared");
  const africanChoice = countedValue("countries-african-choice");
  const countries = countedValue("corpus-countries");

  const ratio = Math.round(exonyms / autonyms);
  return [
    {
      value: copy.ratio(ratio),
      claim: copy.ratioClaim(ratio),
      provenance: copy.ratioProvenance(
        formatNumber(language, exonyms),
        formatNumber(language, autonyms)
      ),
    },
    {
      value: copy.share(contested, peoples),
      claim: copy.contestedClaim,
      provenance: copy.undeclared(undeclared),
    },
    {
      value: copy.share(africanChoice, countries),
      claim: copy.countryClaim,
      provenance: copy.countryProvenance,
    },
  ];
};

// @req REQ-113
export const ThesisMeasures = ({ language }: { language: Language }) => (
  <ul className="grid list-none grid-cols-1 gap-afh-xl p-0 sm:grid-cols-3">
    {measures(language).map((measure) => (
      <li key={measure.value} className="text-left">
        <p className="font-afh-display text-afh-h1 font-black leading-none text-[color:var(--accent-ink)]">
          {measure.value}
        </p>
        <p className="mt-afh-sm text-afh-body text-afh-text">{measure.claim}</p>
        <p className="mt-afh-sm text-afh-caption text-afh-text-soft">
          {measure.provenance}
        </p>
      </li>
    ))}
  </ul>
);
