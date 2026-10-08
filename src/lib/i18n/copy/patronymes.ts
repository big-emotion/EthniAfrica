import { PATRONYME_VOCABULARY } from "@/lib/glossaire/vocabularies";
import type { Language } from "@/types/shared";

/**
 * The patronyme fiche and its index (ETNI-1464, REQ-133). Distinct from
 * `names.ts`, which covers ethnonyms (how a *people* is called); this covers
 * the naming system a *person* is named under.
 *
 * The key is the internal word and the copy is the public one — DEC-038,
 * same split as `TRAIL_PAGE_LABELS.patronymes` in trail.ts. Anything a
 * reader sees under this key says "nom", except where "patronyme" names one
 * of the five naming systems, which is onomastic vocabulary and not a label
 * for the axis.
 */
const fr = {
  eyebrow: "Nom",
  nameSystemSectionTitle: "Le nom",
  nameSystemStatementPrefix: "Système de nommage :",
  nameSystemLabels: PATRONYME_VOCABULARY.fr.nameSystem,
  sourceStanding: {
    countOne: "1 source citée",
    countMany: "{count} sources citées",
    aiShareOne: ", dont une rédigée par une intelligence artificielle",
    aiShareMany: ", dont {count} rédigées par une intelligence artificielle",
    // Says what the atlas has not established, never why the workshop has
    // not established it yet.
    assembling:
      "Cette page est en cours de constitution : ce qu'elle avance reste à confirmer.",
  },
  casteOrSocialFunctionLabel: "Caste ou fonction sociale",
  attestedFormsTitle: "Graphies attestées",
  spellingAttestedInPrefix: "attestée en",
  transmissionModeLabel: "Mode de transmission",
  transmissionModeLabels: PATRONYME_VOCABULARY.fr.transmissionMode,
  designatedSocialUnitLabel: "Unité sociale désignée",
  designatedSocialUnitLabels: PATRONYME_VOCABULARY.fr.designatedSocialUnit,
  totemicFoodProhibitionLabel: "Interdit alimentaire totémique",
  permittedGivenNamesLabel: "Prénoms autorisés",
  nisbaSubtypeLabel: "Type de nisba",
  nisbaSubtypeLabels: PATRONYME_VOCABULARY.fr.nisbaSubtype,
  originTitle: "Origine",
  // Three parallel lists, not one classification: the corpus can hold a
  // account carried orally and a written chronicle for the same name without
  // either overruling the other. The strand is not called « griotique »: a
  // griot is one possible carrier, named as the record states it.
  originOralTraditionsLabel: "Tradition orale",
  originWrittenChroniclesLabel: "Chronique écrite",
  originHistoricalSynthesesLabel: "Synthèse historique",
  originLinguisticReconstructionsLabel: "Reconstruction linguistique",
  originClaimStatusLabels: PATRONYME_VOCABULARY.fr.originClaimStatus,
  // Attributed to its carrier rather than stated as a bare fact: an oral
  // chain of transmission is the source, and a page that dropped that
  // attribution would present one carrier's telling as our own claim.
  oralOriginNote:
    "Cette origine est transmise oralement. Elle est présentée telle que son transmetteur l'a donnée, avec sa source et, lorsqu'ils sont documentés, celui qui l'a transmise et la manière dont elle a été recueillie.",
  oralAttributionPrefix: "Transmis par",
  oralCollectedByPrefix: "Recueilli par",
  oralCollectedByIntermediary: "Recueilli par un intermédiaire.",
  oralCollectedDirectly: "Recueilli directement auprès du transmetteur.",
  oralCarrierNotStated: "Transmetteur non précisé.",
  sourcesTitle: "Sources",
  alliancesTitle: "Alliances",
  alliancesNote:
    "Les pactes qui lient ce nom à d'autres noms : une parenté à plaisanterie, où les porteurs des deux noms se doivent moquerie rituelle et assistance, et qui interdit le conflit entre eux. Chaque pacte est désigné par le terme que les sources emploient.",
  allianceTermGlosses: {
    sanankuya: "parenté à plaisanterie mandingue",
  },
  allianceTypeFallback: "Alliance documentée",
  homonymsTitle: "Homonymes",
  homonymsNote:
    "Ce que la même chaîne de lettres désigne d'autre — un peuple, un lieu, un autre nom — sans lien démontré avec celui-ci. La liste évite qu'une ressemblance de forme se lise comme une filiation.",
  associationsTitle: "Peuples et pays concernés",
  associatedPeoplesLabel: "Peuples",
  associatedCountriesLabel: "Pays",
  // AC4: a non-hereditary patronymic works differently by region — the
  // page says so explicitly rather than let the reader assume the
  // hereditary-surname model that `nameSystem` elsewhere denies.
  nonHereditaryGuidance:
    "Ce patronyme n'est pas transmis de façon héréditaire : il ne se lit pas comme un nom de famille au sens européen. Sa portée varie selon la région — les peuples et pays ci-dessous indiquent où ce mode de nommage est documenté.",
  bearersTitle: "Porteurs et porteuses",
  // DEC-040: no code path derives a person's ethnic origin from this
  // patronyme, and this note states that editorial guarantee to the reader
  // rather than leave it implicit in what the list omits.
  //
  // It used to open on the eligibility class DEC-040 actually defines —
  // "des personnes publiques ou décédées" — which made a section that
  // simply lists who bears a name read as a search through the dead. The
  // guarantee is the point; who qualifies is a curation rule, and it is
  // stated second and without the word.
  bearersEditorialNote:
    "N'y figurent que des personnalités publiques ou historiques, et des personnes qui se sont elles-mêmes reconnues dans ce nom. La liste documente le nom : elle ne permet de déduire l'origine ethnique d'aucune personne qui le porte.",
  roleCategoryFallback: "Rôle non renseigné",
  // The name dimension as the people and country fiches carry it
  // (REQ-133, `docs/design/name-to-country-linking.md`). The country
  // labels are the load-bearing copy: the two lists answer different
  // questions, and only the wording keeps a reader from reading the
  // second as an attestation the corpus never made.
  onFiche: {
    namesTitle: {
      people: {
        personal: "Noms de personnes rattachés à ce peuple",
        patronymic: "Patronymes rattachés à ce peuple",
      },
      country: {
        personal: "Noms de personnes rattachés à ce pays",
        patronymic: "Patronymes rattachés à ce pays",
      },
    },
    nameCount: (count: number) => `${count} ${count === 1 ? "nom" : "noms"}`,

    peopleEmpty:
      "Nous ne rattachons encore aucun nom à ce peuple. La dimension des noms vient d'ouvrir et ne couvre qu'une petite part de notre projet.",
    peopleUnavailable:
      "Les noms portés n'ont pas pu être chargés. Le problème vient de notre côté, pas d'une absence de noms.",
    countryAlphabeticalIndexLabel: "Index alphabétique",
    attestedLabel: "Attestés dans le pays",
    // Says both halves of the inference in the label itself — whose
    // names these are, and that no source places them here. A label
    // reading merely "Portés par les peuples" would let the chapter
    // title supply the missing word, and the word it would supply is
    // "attestés".
    reachLabel: "Portés par les peuples du pays, sans attestation ici",
    reachViaPrefix: "par",
    countryEmpty:
      "Nous n'attestons encore aucun nom dans ce pays, et aucun des peuples qui y vivent n'en porte de documenté.",
    countryUnavailable:
      "Les noms n'ont pas pu être chargés. Le problème vient de notre côté, pas d'une absence de noms.",
  },
  // The /fr/atlas/noms index (ETNI-1803, REQ-139) — the corpus-class
  // listing that leads to the fiches above. Kept nested here rather than
  // as a sibling top-level key: it is patronyme copy, distinct from
  // `names.ts` (the unrelated Appellations/ethnonym page).
  index: {
    pageTitle: "Noms",
    pageSubtitle:
      "Les systèmes de nommage des personnes documentés ici — noms de clan, patronymes non héréditaires, nisba et noms d'éloge.",
    unavailable:
      "Les noms n'ont pas pu être chargés. Le problème vient de notre côté, pas d'une absence de noms.",
    countSingular: "nom",
    countPlural: "noms",
    emptyState: "Aucun nom n'est encore documenté.",
    pagination: {
      label: "Pagination des noms",
      previous: "Précédent",
      next: "Suivant",
      page: "Page",
    },
  },
};

type PatronymesCopy = typeof fr;

// @req REQ-145
export const patronymesCopy: Record<Language, PatronymesCopy> = { fr };
