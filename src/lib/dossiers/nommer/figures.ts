/**
 * Every number the dossier prints, and where each one comes from.
 *
 * The dossier argues from counts, so the counts have to be auditable. Three
 * provenances are genuinely in play and the reader is told which is which
 * (atlas charter §4):
 *
 *   - `counted`  — reproducible from `dataset/source/afrik/`. The suite
 *                  **replays** the count and fails if the corpus has moved,
 *                  so a figure cannot quietly become false.
 *   - `read`     — a human reading of free prose. Unverifiable by
 *                  construction, so it is required to declare its caveat, and
 *                  the caveat is published with the figure.
 *   - `missing`  — the corpus cannot produce it, and the dossier says so
 *                  rather than reaching for a number that looks like it.
 *
 * The lexical probes are the reason the `read`/`counted` split matters. They
 * are word-stem occurrences in free prose, not a coding of the corpus: a
 * fiche writing « ce nom n'est pas d'origine européenne » lands in `europ`.
 * That is `counted` — the command is exact and replayable — but each one
 * still carries the caveat in its label, because a reproducible count of an
 * ambiguous thing is still a count of an ambiguous thing.
 */

import type { CorpusFigure, FigureKey } from "./types";

/** Format a published count without duplicating it in reader-facing prose. */
// @req REQ-113
export function formatNommerFigure({
  figureKey,
}: Pick<CorpusFigure, "figureKey">): string {
  const figure = NOMMER_FIGURES[figureKey];
  if (!figure || figure.kind === "missing") {
    throw new Error(`No numeric figure for ${figureKey}`);
  }
  return figure.value.toLocaleString("fr-FR");
}

/** Every count below was taken against `recette` on this date. */
const COUNTED_ON = "2026-09-29";

const PEOPLE_GLOB = "dataset/source/afrik/peuples/*/*.json";

/**
 * The word family behind the « dépréciatif » probe, declared here because the
 * dossier publishes it.
 *
 * `péjoratif` alone answers 19. The corpus says the same thing in four ways,
 * and a chapter about naming cannot count one spelling and call it the
 * phenomenon — so the probe is widened and the widening is published. The
 * suite reads this list, so the number and its method cannot drift apart.
 */
// @req REQ-113
export const PEJORATIVE_STEMS = [
  "pejorat",
  "depreciat",
  "moqueur",
  "derisoire",
] as const;

// @req REQ-113
export const NOMMER_FIGURES: Record<FigureKey, CorpusFigure> = {
  "corpus-peoples": {
    kind: "counted",
    figureKey: "corpus-peoples",
    label: "fiches de peuple",
    // 772 -> 770 on 2026-10-03: the two Bissa duplicates (PPL_BUSSA, PPL_BUSANSI)
    // were merged into PPL_BISSA through the retired-identifiers ledger.
    // 770 -> 769 on 2026-10-10: PPL_JOLA folded into PPL_DIOLA the same way.
    // 769 -> 755 on 2026-10-10: fourteen duplicate people fiches folded into their keepers
    // (Sotho, Tswana, Zulu, Xhosa, Ashanti, Dagaaba, Kongo, Umbundu, Tonga, Hutu,
    // Swahili, Brong) through the retired-identifiers ledger.
    // 755 -> 740 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers (Lango, Gurma, Fula of the forest, Kikongo, two Ndebele, Northern
    // Sotho, Tshokwe, Karanga, two Yao, two Lomwe, Kirundi Tutsi, Luo) through the
    // retired-identifiers ledger.
    // 740 -> 716 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 716 -> 711 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers; none of their statuses was carried.
    // 711 -> 702 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 702 -> 691 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 691 -> 687 the same day: the Khainai, Koyra, Yerima and Kirdi fiches folded or retired after wave 12.
    // 687 -> 666 on 2026-10-14: twenty-one people fiches of waves 14 to 19 folded into their keepers or withdrawn (fifteen folded, six withdrawn).
    // 666 -> 665 on 2026-10-14: the Nabt fiche, a duplicate of PPL_NABDAM, folded into it.
    // 665 -> 657 on 2026-10-18: the eight people fiches folded or withdrawn after wave 24 (Mucubal into PPL_MUCUVAL; Taal, Guwa, Mbogo, Mobe, Autres peuples bantous, Peuples forestiers du Sud et de l'Est, Africains d'origine récente withdrawn).
    value: 657,
    method: `nombre de fichiers ${PEOPLE_GLOB}`,
    countedOn: COUNTED_ON,
  },
  "corpus-exonyms": {
    kind: "counted",
    figureKey: "corpus-exonyms",
    label: "noms donnés de l’extérieur",
    // 3122 -> 3117 on 2026-10-03: the Bissa merge removed six exonyms with the two
    // retired fiches and added one (Busanga, as the Kusasi use it).
    // 3117 -> 3116 on 2026-10-10: PPL_JOLA's two exonyms left with the fiche,
    // and PPL_MALINKE gained a bare « Mandingue ».
    // 3116 -> 3079 on 2026-10-10: fourteen duplicate people fiches folded into their keepers: their
    // exonyms left with them, those only they held were carried over, and
    // PPL_KHOE_MACRO gave up Khoikhoi and Hottentot to PPL_KHOIKHOI, which has them.
    // 3079 -> 3081 on 2026-10-11: PPL_MAFA and PPL_SARA gained a bare « Kirdi »,
    // which their name histories document, once the Kirdi fiche became an umbrella entry.
    // 3081 -> 3033 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers: their exonyms left with them, and those only they held were carried
    // over (« Fulbe ladde » to the nomadic Fulbe); Ga-Dangme, kept as a grouping,
    // gave « Gan » back to the Ga.
    // 3033 -> 2960 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded into
    // their keepers: their exonyms left with them, and those only they held were
    // carried over (« Calanga » to the Kalanga).
    // 2960 -> 2958 on 2026-10-11: PPL_KABYE gave up « Lokpa » and « Lukpa »,
    // the names of another people with a language of its own (Glottolog lukp1238).
    // 2958 -> 2935 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 2935 -> 2883 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 2883 -> 2832 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 2832 -> 2818 the same day: the Khainai, Koyra, Yerima and Kirdi fiches folded or retired after wave 12.
    // 2818 -> 2740 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 2740 -> 2730 on 2026-10-14: the Nabt fiche's seven exonyms left with it, and Gwa, Nao and Nyiha were removed from the exonyms of the Gwa, Mao and Nyika fiches (Gwa is the people's own name, Nao a different people, Nyiha the Tanzanian people); the Lamba fiche swapped Lamba for Lala-Lamba. 2730 -> 2729 the same day: Gbunde left the exonyms of PPL_GBANDI (Schwab 1947 lists the Gbunde apart from the Gbande).
    // 2729 -> 2702 on 2026-10-18: the twenty-seven exonyms of the eight people fiches folded or withdrawn after wave 24 left with them; PPL_MUCUVAL swapped Kuvale, now its sourced self-name, for Mucubal.
    // 2702 -> 2701 the same day: OvaKuvale left the exonyms of PPL_MUCUVAL, whose self-name field now reads Kuvale.
    value: 2701,
    method:
      "somme de content.appellations.exonyms.length sur les fiches de peuple",
    countedOn: COUNTED_ON,
  },
  "corpus-autonyms": {
    kind: "counted",
    figureKey: "corpus-autonyms",
    label: "noms employés par les peuples eux-mêmes",
    // 772 until eight macro-group fiches were corrected: their field held a
    // sentence listing *other* groups' names — « Variées selon les groupes :
    // Maninka, Bambara, Dioula… » — which the count took for an autonym. A
    // grouping of peoples has no name for itself, so those fiches now declare
    // the absence with `null`, and the figure counts only what it says it does.
    // 761 -> 759 on 2026-10-03: the two retired Bissa fiches each declared one.
    // 759 -> 758 on 2026-10-03: the Nganguela fiche declared a self-name for a
    // grouping whose own source calls the term an outsiders' category over
    // independent peoples; it now declares the absence with `null`, like the other
    // macro-group fiches.
    // 757 -> 743 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 743 -> 728 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 728 -> 704 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 704 -> 699 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 699 -> 689 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa; the Jarawa of Bauchi have no self-name in the sources read.
    // 689 -> 678 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 678 -> 675 the same day: the Khainai, Koyra, Yerima and Kirdi fiches folded or retired after wave 12.
    // 675 -> 654 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 654 -> 653 on 2026-10-14: the Nabt fiche's self-name left with it.
    // 653 -> 654 on 2026-10-18: the Lingala fiche's hero now prints « Bato ya
    // mangala », the self-name its name history already told.
    // 654 -> 647 on 2026-10-18: seven of the eight people fiches folded or withdrawn after wave 24 declared one.
    value: 647,
    method:
      "fiches dont content.appellations.selfAppellation est renseigné et non vide",
    countedOn: COUNTED_ON,
  },

  // The three numbers that replace « 57,5 % ». Publishing the ratio alone
  // would have let a reader infer that every fiche outside it was examined and
  // found sound, when the large majority were never examined at all — and that
  // is the finding, not the footnote. The counts live in the three fields
  // below and nowhere else: restating them in this comment is how they drift.
  "status-contested-or-colonial": {
    kind: "counted",
    figureKey: "status-contested-or-colonial",
    label:
      "fiches déclarant leur appellation contestée ou héritée de la colonisation",
    // 444 -> 443 on 2026-10-03: PPL_BUSANSI, the one "contested" Bissa fiche, was
    // merged into PPL_BISSA, which declares no status.
    // 442 -> 433 on 2026-10-10: fourteen duplicate people fiches folded into their keepers; PPL_BONO
    // took the retired Brong fiche's colonial-legacy status with its whyProblematic.
    // 433 -> 422 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers; none of their statuses was carried.
    // 422 -> 404 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers; none of their statuses was carried.
    // 404 -> 399 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers; none of their statuses was carried.
    // 399 -> 393 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 393 -> 384 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 384 -> 380 the same day: the Khainai, Koyra, Yerima and Kirdi fiches folded or retired after wave 12. All four were contested.
    // 380 -> 370 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 370 -> 368 on 2026-10-18: the Guwa and Mobe fiches, both contested, withdrawn after wave 24.
    value: 368,
    method:
      "fiches dont classificationStatus vaut contested (224) ou colonial-legacy (156)",
    countedOn: COUNTED_ON,
  },
  "status-other": {
    kind: "counted",
    figureKey: "status-other",
    label: "fiches déclarant un autre statut",
    // 19 -> 18 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 18 -> 17 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 17 -> 14 on 2026-10-18: three reconstructive fiches withdrawn after wave 24 (Autres peuples bantous, Peuples forestiers du Sud et de l'Est, Africains d'origine récente).
    value: 14,
    method:
      "fiches dont classificationStatus est renseigné sans être contested ni colonial-legacy",
    countedOn: COUNTED_ON,
  },
  "status-undeclared": {
    kind: "counted",
    figureKey: "status-undeclared",
    label: "fiches ne déclarant aucun statut",
    // 309 -> 308 on 2026-10-03: PPL_BUSSA, which declared no status, was merged.
    // 308 -> 303 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 303 -> 299 on 2026-10-11: four of the fifteen folded duplicate fiches
    // declared no status.
    // 299 -> 294 on 2026-10-11: five of the twenty-four folded duplicate fiches of waves 4
    // and 5 declared no status.
    // 294 -> 291 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 291 -> 290 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 290 -> 279 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 279 -> 278 on 2026-10-14: the Nabt fiche, which declared no status, was folded.
    // 278 -> 275 on 2026-10-18: the Mucubal, Taal and Mbogo fiches, which declared no status, folded or withdrawn after wave 24.
    value: 275,
    method: "fiches sans classificationStatus",
    countedOn: COUNTED_ON,
  },

  // Lexical probes over originOfExonyms + whyProblematic, accent-folded.
  "probe-colonial": {
    kind: "counted",
    figureKey: "probe-colonial",
    label: "fiches employant le radical « colonial »",
    // 243 -> 242 on 2026-10-07: PPL_HADZA no longer calls Kangeju colonial, which no source read says.
    // Recounted after the 304-fiche plain-language pass; the published probe is unchanged.
    // 236 -> 227 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 227 -> 221 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 221 -> 213 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 213 -> 212 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 212 -> 211 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 211 -> 208 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 208 -> 207 the same day: the Khainai, Koyra, Yerima and Kirdi fiches folded or retired after wave 12.
    // 207 -> 201 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 201 -> 200 on 2026-10-14: the Nabt fiche, which counted, was folded.
    // 200 -> 199 on 2026-10-15: PPL_TUAREG's origin text, rewritten from the
    // research for series 2 n° 1, dates the French spelling (Targui, 19th
    // century) instead of saying « à l'époque coloniale ».
    // 199 -> 197 on 2026-10-18: the Taal and Mbogo fiches, which counted, withdrawn after wave 24.
    value: 197,
    method: "radical colonial dans originOfExonyms + whyProblematic",
    countedOn: "2026-10-09",
  },
  "probe-administration": {
    kind: "counted",
    figureKey: "probe-administration",
    label: "fiches employant le radical « administr- »",
    // 180 -> 181 on 2026-09-18. Gbodjibo was not counted: its « administratif »
    // lived inside the exonym string, which this probe does not read. Writing it
    // into the field the probe does read brought the fiche into the count — the
    // figure moved because the corpus got more legible, not because it grew.
    // 181 -> 182 on 2026-09-25. Dogon's origin-of-exonyms prose now cites the
    // colonial administrators who borrowed « Habe » from the Fula; a sourced
    // sentence, not a rewording made for the count.
    // 182 -> 183 on 2026-10-03: the Tutrugbu note now states its argument from the
    // fiche's own fields (Nyangbo is the official administrative name), where it
    // used to recommend a merge with a fiche that does not exist.
    // 183 -> 182 on 2026-10-03: the Frafra explanation no longer says the "British
    // administrators" heard the greeting; its source gives missionaries in one
    // account and the British in a variant, so the sentence follows the source.
    // 181 -> 177 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 177 -> 175 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 175 -> 169 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 169 -> 167 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 167 -> 164 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 164 -> 163 the same day: the Khainai, Koyra, Yerima and Kirdi fiches folded or retired after wave 12.
    // 163 -> 156 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 156 -> 155 on 2026-10-14: the Nabt fiche, which counted, was folded.
    // 155 -> 152 on 2026-10-18: the Taal, Mbogo and « Africains d'origine récente » fiches, which counted, withdrawn after wave 24.
    value: 152,
    method: "radical administr dans originOfExonyms + whyProblematic",
    countedOn: COUNTED_ON,
  },
  "probe-european": {
    kind: "counted",
    figureKey: "probe-european",
    label: "fiches employant le radical « europ- »",
    // 119 -> 120 on 2026-09-25: the same Dogon sentence (« Europeens »).
    // 121 -> 120 on 2026-10-03: PPL_BUSANSI, which named the first Europeans, was
    // merged into PPL_BISSA.
    // 120 -> 121 on 2026-10-07: PPL_BAOULE now says the old forms Bahooree and
    // Baouré were written by Europeans, which its sources state.
    // 121 -> 122 on 2026-10-07: PPL_BETE now reports that Magwé's author says the
    // French took « bété » from the English.
    // Recounted after the 304-fiche plain-language pass; the published probe is unchanged.
    // 120 -> 119 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 119 -> 118 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 118 -> 115 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 115 -> 112 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 112 -> 110 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 110 -> 108 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 108 -> 107 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 107 -> 108 on 2026-10-15: PPL_TUAREG's origin text now says European
    // travellers took the name up from 1802 (Hornemann, Caillié).
    value: 108,
    method: "radical europ dans originOfExonyms + whyProblematic",
    countedOn: "2026-10-09",
  },
  "probe-neighbours": {
    kind: "counted",
    figureKey: "probe-neighbours",
    label: "fiches contenant le mot « voisin » ou ses variantes",
    // 113 -> 112 on 2026-10-07: PPL_HADZA no longer attributes Kindiga/Tindiga to neighbours, which no source read says.
    // 112 -> 113 on 2026-10-07: PPL_BETE now says the Gouro called their southern neighbours Tshien (Dozon 1985, p. 45).
    // Recounted after the 304-fiche plain-language pass; the published probe is unchanged.
    // 114 -> 113 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 113 -> 112 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 112 -> 108 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 108 -> 109 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 109 -> 107 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 107 -> 103 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 103 -> 102 on 2026-10-18: the Taal fiche, which counted, withdrawn after wave 24.
    value: 102,
    method: "radical voisin dans originOfExonyms + whyProblematic",
    countedOn: "2026-10-09",
  },
  "probe-portuguese": {
    kind: "counted",
    figureKey: "probe-portuguese",
    label: "fiches employant « portugais »",
    // 83 -> 79 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 79 -> 70 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 70 -> 68 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 68 -> 67 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 67 -> 65 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 65 -> 63 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    // 63 -> 61 on 2026-10-18: the Mucubal fiche, folded into PPL_MUCUVAL, and the « Africains d'origine récente » fiche, withdrawn, both counted.
    value: 61,
    method: "radical portugais dans originOfExonyms + whyProblematic",
    countedOn: COUNTED_ON,
  },
  "probe-pejorative": {
    kind: "counted",
    figureKey: "probe-pejorative",
    label:
      "fiches contenant les mots recherchés pour repérer les noms méprisants",
    // Recounted after the 304-fiche plain-language pass; the published probe is unchanged.
    // 60 -> 59 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 59 -> 58 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 58 -> 55 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 55 -> 54 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 54 -> 50 on 2026-10-12: eleven duplicate people fiches of wave 10 folded into their keepers, and the « Swahili (Yémen) » fiche renamed PPL_MUWALLADEEN.
    // 50 -> 49 the same day: the Khainai, Koyra, Yerima and Kirdi fiches folded or retired after wave 12.
    // 49 -> 50 on 2026-10-12: the Bakwé fiche now records Tuwè, a pejorative Krou name for them, in originOfExonyms.
    value: 50,
    method: `radicaux ${PEJORATIVE_STEMS.join(", ")} dans originOfExonyms + whyProblematic`,
    countedOn: "2026-10-09",
  },
  "probe-arabic": {
    kind: "counted",
    figureKey: "probe-arabic",
    label: "fiches employant le radical « arab- »",
    // 74 -> 72 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 72 -> 71 on 2026-10-11: the Kirdi fiche dropped its unsourced etymologies, the Arabic one included.
    // 71 -> 68 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 68 -> 67 on 2026-10-11: five duplicate people fiches of wave 6 folded into their keepers.
    // 67 -> 66 on 2026-10-11: ten duplicate people fiches of wave 8 folded into their keepers, and the Afizere fiche split from Jarawa.
    // 66 -> 65 on 2026-10-18: the Mobe fiche, which counted, withdrawn after wave 24.
    value: 65,
    method: "radical arab dans originOfExonyms + whyProblematic",
    countedOn: COUNTED_ON,
  },
  "probe-swahili": {
    kind: "counted",
    figureKey: "probe-swahili",
    label: "fiches employant « swahili »",
    // 68 -> 66 on 2026-10-10: fourteen duplicate people fiches folded into their keepers.
    // 66 -> 63 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 63 -> 61 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 61 -> 60 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    value: 60,
    method: "radical swahili dans originOfExonyms + whyProblematic",
    countedOn: COUNTED_ON,
  },
  "probe-slavery": {
    kind: "counted",
    figureKey: "probe-slavery",
    label: "fiches employant le radical « esclav- »",
    // Recounted after the 304-fiche plain-language pass; the published probe is unchanged.
    // 28 -> 27 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    value: 27,
    method: "radical esclav dans originOfExonyms + whyProblematic",
    countedOn: "2026-10-09",
  },
  "probe-missionary": {
    kind: "counted",
    figureKey: "probe-missionary",
    label: "fiches employant le radical « missionn- »",
    // 26 -> 25 on 2026-10-11: fifteen duplicate people fiches folded into their
    // keepers.
    // 25 -> 24 on 2026-10-11: twenty-four duplicate people fiches of waves 4 and 5 folded
    // into their keepers.
    // 24 -> 23 on 2026-10-14: the twenty-one people fiches of waves 14 to 19, folded or withdrawn, left with what they counted.
    value: 23,
    method: "radical missionn dans originOfExonyms + whyProblematic",
    countedOn: COUNTED_ON,
  },

  "corpus-countries": {
    kind: "counted",
    figureKey: "corpus-countries",
    label: "fiches de pays",
    value: 54,
    method: "nombre de fichiers dataset/source/afrik/pays/*.json",
    countedOn: COUNTED_ON,
  },

  // The four country families are a hand reading of `nameOriginActor`, which
  // holds two to four sentences of free prose and no controlled value. The
  // caveat travels with every one of them.
  "countries-european-exonym": {
    kind: "read",
    figureKey: "countries-european-exonym",
    label: "pays ayant conservé un nom donné par des Européens",
    value: 20,
    method:
      "dépouillement à la main du champ nameOriginActor des 54 fiches pays",
    readOn: COUNTED_ON,
    caveat:
      "Ces chiffres viennent d'une lecture des 54 fiches pays. Au moment de ce relevé, les explications de l'origine des noms n'étaient pas accompagnées de sources. Il s'agit d'un classement proposé à partir de ces textes.",
  },
  "countries-ancient-exonym": {
    kind: "read",
    figureKey: "countries-ancient-exonym",
    label: "pays portant un nom ancien donné de l’extérieur",
    value: 6,
    method:
      "dépouillement à la main du champ nameOriginActor des 54 fiches pays",
    readOn: COUNTED_ON,
    caveat:
      "Ces chiffres viennent d'une lecture des 54 fiches pays. Au moment de ce relevé, les explications de l'origine des noms n'étaient pas accompagnées de sources. Il s'agit d'un classement proposé à partir de ces textes.",
  },
  "countries-local-kept": {
    kind: "read",
    figureKey: "countries-local-kept",
    label: "pays dont le nom local a été repris par le colonisateur",
    value: 11,
    method:
      "dépouillement à la main du champ nameOriginActor des 54 fiches pays",
    readOn: COUNTED_ON,
    caveat:
      "Ces chiffres viennent d'une lecture des 54 fiches pays. Au moment de ce relevé, les explications de l'origine des noms n'étaient pas accompagnées de sources. Il s'agit d'un classement proposé à partir de ces textes.",
  },
  "countries-african-choice": {
    kind: "read",
    figureKey: "countries-african-choice",
    label: "pays dont le nom a été choisi ou restauré par des Africains",
    value: 17,
    method:
      "dépouillement à la main du champ nameOriginActor des 54 fiches pays",
    readOn: COUNTED_ON,
    caveat:
      "Ces chiffres viennent d'une lecture des 54 fiches pays. Au moment de ce relevé, les explications de l'origine des noms n'étaient pas accompagnées de sources. Il s'agit d'un classement proposé à partir de ces textes.",
  },

  "patronyme-fiches": {
    kind: "counted",
    figureKey: "patronyme-fiches",
    label: "fiches de nom",
    // 625 -> 621 on 2026-10-11: ten duplicate family-name fiches of wave 7 folded into their keepers; PAT_MAHAMAT now cites a source of its own.
    // 621 -> 620 on 2026-10-11: three duplicate family-name fiches of wave 9 folded into their keepers; only Moussa cited a source of its own.
    // 620 -> 619 on 2026-10-12: three duplicate family-name fiches of wave 11 folded into their keepers; only Tesfay cited a source of its own.
    // 619 -> 620 on 2026-10-13: PAT_MAMBA now cites sources of its own (van Warmelo 1935, Patricks 2002), wave 15; it cited only the candidate queue before.
    // 620 -> 622 on 2026-10-13: PAT_SOUMAH (Arcin 1907, Bamadaba) and PAT_ABAZA (a Wikipedia article) now cite sources of their own; both cited only the candidate queue before.
    // 622 -> 618 on 2026-10-14: the four family-name fiches of wave 15 folded or withdrawn (Djaló, Bah, Fadicca, Koum).
    // 618 -> 619 on 2026-10-14: PAT_NSENGIYUMVA now cites sources of its own (wave 22).
    // 619 -> 621 on 2026-10-15: PAT_KOFI and PAT_KWAME now cite sources of their own (Christaller 1881, Agyekum 2006); both cited only the candidate queue before.
    // 621 -> 622 on 2026-10-15: PAT_KWABENA, the Twi Tuesday day name, added with sources of its own (Christaller 1881, Agyekum 2006, Grottanelli 1977, Dolphyne 1986).
    // 622 -> 626 on 2026-10-16: PAT_BANGOURA, the Bangura fiche (since folded into it), PAT_CONTEH and PAT_KONE now cite sources of their own (Arcin 1907, Bamadaba, Binger 1892); all four cited only the candidate queue before (wave 23).
    // 626 -> 624 on 2026-10-16: the Koroma and Bangura fiches folded into PAT_KOUROUMA and PAT_BANGOURA; both cited sources of their own.
    // 624 -> 635 on 2026-10-18: eleven Southern African family names of wave 25 (Baloyi, Gamedze, Ginindza, Hlophe, Letsie, Mabote, Mabuza, Macuacua, Magagula, Matsebula, Mondlane) now cite sources of their own (Junod, Van Warmelo, Ellenberger, the Swazi surnames dictionary); all eleven cited only the candidate queue before.
    // 635 -> 627 on 2026-10-18: the eight family-name fiches folded or withdrawn after wave 25 (Njie, Jallow, Jalloh and Aden into Ndiaye, Diallo and Adam; El Kenzi, Ngarlejy, Ngarta and Kigozi withdrawn); all eight cited sources of their own.
    // 627 -> 628 on 2026-10-18: PAT_LADO now cites a source of its own (Seligman 1932: two Bari named Lado alone on p. 270, a chief « Laro Lado » on p. 268), on which it is filed as a personal name; it cited only the candidate queue before.
    value: 628,
    method:
      "fiches dataset/source/afrik/patronymes/PAT_*.json portant un nameSystem et " +
      "au moins une source autre que la file d'attente des candidats — les fiches " +
      "générées depuis cette file couvrent un nom sans rien en documenter, et le " +
      "dossier dit « documente »",
    countedOn: COUNTED_ON,
  },
  "patronyme-non-hereditary": {
    kind: "counted",
    figureKey: "patronyme-non-hereditary",
    label: "fiches sur des noms qui ne se transmettent pas à l’identique",
    // 176 -> 173 on 2026-10-11: ten duplicate family-name fiches of wave 7 folded into their keepers; PAT_MAHAMAT now cites a source of its own.
    // 173 -> 172 on 2026-10-11: three duplicate family-name fiches of wave 9 folded into their keepers; only Moussa cited a source of its own.
    // 172 -> 171 on 2026-10-12: three duplicate family-name fiches of wave 11 folded into their keepers; only Tesfay cited a source of its own.
    // 171 -> 172 on 2026-10-14: PAT_NSENGIYUMVA, a non-hereditary patronymic, now cites sources of its own (wave 22).
    // 172 -> 171 on 2026-10-14: PAT_TAIWO is now a hereditary family name taken from the father, so its transmission is patrilineal.
    // 171 -> 173 on 2026-10-15: PAT_KOFI and PAT_KWAME, two non-hereditary day names, now cite sources of their own.
    // 173 -> 174 on 2026-10-15: PAT_KWABENA, a non-hereditary day name, added.
    // 174 -> 172 on 2026-10-18: the Aden fiche, folded into PAT_ADAM, and the Ngarlejy fiche, withdrawn, were both typed non-hereditary.
    value: 172,
    method:
      "fiches de nom recherchées dont transmissionMode vaut non_hereditary, au " +
      "même périmètre que le compte ci-dessus",
    countedOn: COUNTED_ON,
  },

  "corpus-language-families": {
    kind: "counted",
    figureKey: "corpus-language-families",
    label: "familles linguistiques",
    value: 25,
    method:
      "nombre de fichiers dataset/source/afrik/famille_linguistique/FLG_*.json",
    countedOn: "2026-09-14",
  },

  // The number the dossier would most like to print and cannot. Stating the
  // gap is the charter's requirement and, here, half the argument: the corpus
  // records that a name came from outside without recording what made it
  // stick.
  "exonyms-imposed-by-administration": {
    kind: "missing",
    figureKey: "exonyms-imposed-by-administration",
    label: "noms réellement imposés par une administration",
    reason:
      "Nos fiches racontent l'origine des noms donnés de l'extérieur. Compter celles qui contiennent le mot « administration » ne permet pas de savoir combien de noms une administration a réellement imposés.",
  },
};
