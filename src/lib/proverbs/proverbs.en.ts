/**
 * The English proverb bank — the sidecar of `proverbs.ts`.
 *
 * Keyed by the French id so the parity test refuses an entry on one side
 * without its twin. Every entry is an agent-produced translation and says so
 * (`provenance: "machine"`, DEC-048).
 *
 * What stays verbatim follows the invariant class of REQ-143: the original
 * text is the proverb itself, a people's name is its subject, and a source
 * title or URL translated stops being findable. The English rendering of the
 * proverb is ours, and is a translation of the source's wording rather than of
 * the French one wherever the source is English.
 */

import type { TranslationKind } from "@/lib/i18n/translationSidecarRules";
import type { Language } from "@/types/shared";

import { type Proverb } from "./proverbs";

// @req REQ-145
export type ProverbTranslation = Omit<Proverb, "id"> & {
  provenance: TranslationKind;
};

export type LocalizedProverb = Proverb & { translationKind?: TranslationKind };

// @req REQ-145
export const PROVERBS_EN: Record<string, ProverbTranslation> = {
  "on-ne-montre-pas-le-ciel-a-un-enfant": {
    text: "No one shows a child the sky.",
    meaning:
      "Some things are self-evident and need no teaching. On another reading, which Rattray reports cautiously, no one needs to teach a child that the Supreme Being exists.",
    origin: {
      status: "attested",
      note: "Proverb published in 1916 by R. S. Rattray with its Twi text (no. 3), drawn from J. G. Christaller's collection of Twi proverbs.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ASANTE",
        label: "Asante",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger–Congo",
      },
    ],
    sources: [
      {
        title: "Ashanti Proverbs (The Primitive Ethics of a Savage People)",
        url: "https://archive.org/details/ashantiproverbst00rattuoft",
        tier: "referenced",
        notes:
          "A collection published by Clarendon Press and digitised by Internet Archive. It attributes the proverb to the Asante and gives the Twi text and a commentary gathered from elders. The subtitle uses the disparaging vocabulary of the colonial administration of the time.",
      },
    ],
    provenance: "machine",
  },
  "on-n-apprend-pas-au-petit-leopard-a-bondir": {
    text: "No one teaches a leopard's cub how to spring.",
    meaning:
      "What is passed on by birth or example needs no teaching. Rattray relates it to kings' sons not needing to be taught force.",
    origin: {
      status: "attested",
      note: "Proverb published in 1916 by R. S. Rattray with its Twi text (no. 123). Ruth Finnegan quotes it again as an Akan proverb.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ASANTE",
        label: "Asante",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger–Congo",
      },
    ],
    sources: [
      {
        title: "Ashanti Proverbs (The Primitive Ethics of a Savage People)",
        url: "https://archive.org/details/ashantiproverbst00rattuoft",
        tier: "referenced",
        notes:
          "A published collection that attributes the proverb to the Asante, with the Twi text and a note on the interpretation given by elders. The subtitle uses the disparaging vocabulary of the colonial period.",
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book (Open Book Publishers). It quotes the proverb as Akan and links it to royal authority.",
      },
    ],
    provenance: "machine",
  },
  "au-sot-il-faut-expliquer-le-proverbe": {
    text: "When the fool is told a proverb, the meaning of it has to be explained to him.",
    meaning:
      "A proverb is meant for those who take a hint: having to explain it already shows one was not understood.",
    origin: {
      status: "attested",
      note: "Proverb published in 1916 by R. S. Rattray with its Twi text (no. 589). Ruth Finnegan takes it up as an Akan proverb on the subtlety of proverbs.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ASANTE",
        label: "Asante",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger–Congo",
      },
    ],
    sources: [
      {
        title: "Ashanti Proverbs (The Primitive Ethics of a Savage People)",
        url: "https://archive.org/details/ashantiproverbst00rattuoft",
        tier: "referenced",
        notes:
          "A published collection that attributes the proverb to the Asante and gives the Twi text. The author also quotes it in his introduction. The subtitle uses the disparaging vocabulary of the colonial period.",
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It quotes the proverb as Akan, after Rattray (1916).",
      },
    ],
    provenance: "machine",
  },
  "en-marchant-doucement-on-dort-loin": {
    text: "Travelling slowly (and with due caution) you will sleep far.",
    original: {
      text: "Taffia sanu sanu kwana nesa.",
      lang: "hau",
      language: "Hausa",
    },
    meaning: "Caution and steadiness take one further than haste.",
    origin: {
      status: "attested",
      note: "Hausa proverb published in 1905 with its original text (no. 166), in an old spelling. Present-day Hausa writes it differently.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroon",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Chad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Sudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Chadic",
      },
    ],
    sources: [
      {
        title: "Hausa Proverbs",
        url: "https://archive.org/details/hausaproverbs00merrrich",
        tier: "referenced",
        notes:
          "A collection published in London by Kegan Paul and digitised by Internet Archive. It gives the Hausa text, an English translation and an explanation. The author is a British officer of the colonial period.",
      },
    ],
    provenance: "machine",
  },
  "le-nombre-fait-tirer-la-pierre-au-coton": {
    text: "Quantity makes the cotton draw a stone.",
    original: {
      text: "Yawa shi kan sa zarre ya ja duchi.",
      lang: "hau",
      language: "Hausa",
    },
    meaning:
      "Fragile threads, once joined, move what none could move alone: unity is strength.",
    origin: {
      status: "attested",
      note: "Hausa proverb published in 1905 with its original text (no. 7), in an old spelling.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroon",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Chad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Sudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Chadic",
      },
    ],
    sources: [
      {
        title: "Hausa Proverbs",
        url: "https://archive.org/details/hausaproverbs00merrrich",
        tier: "referenced",
        notes:
          'A published collection that gives the Hausa text, the translation "Quantity makes the cotton draw a stone" and the equivalent "Unity is strength".',
      },
    ],
    provenance: "machine",
  },
  "meme-le-niger-a-une-ile": {
    text: "Even the Niger has an island.",
    meaning:
      "Even the greatest power must sometimes give way before an obstacle.",
    origin: {
      status: "attested",
      note: "Quoted as Hausa by Ruth Finnegan, after C. E. J. Whitting's collection (1940). The source does not give the Hausa text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroon",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Chad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Sudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Chadic",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes the proverb to the Hausa, cites Whitting (1940) and explains that even power must sometimes give way.",
      },
    ],
    provenance: "machine",
  },
  "les-petites-averses-remplissent-le-ruisseau": {
    text: "Small showers fill the stream.",
    original: {
      text: "Da yeyefi kwogi kan chikka.",
      lang: "hau",
      language: "Hausa",
    },
    meaning:
      "Perseverance, through small contributions, eventually completes the work.",
    origin: {
      status: "attested",
      note: "Hausa proverb published in 1905 with its original text (no. 233), in an old spelling. The digitised copy of the collection slightly misreads the last word.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAUSA",
        label: "Hausa",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroon",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Chad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Sudan",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_TCHADIQUE",
        label: "Chadic",
      },
    ],
    sources: [
      {
        title: "Hausa Proverbs",
        url: "https://archive.org/details/hausaproverbs00merrrich",
        tier: "referenced",
        notes:
          'A published collection that gives the Hausa text, the translation "Small showers fill the stream" and the commentary "Perseverance finishes work".',
      },
    ],
    provenance: "machine",
  },
  "aujourd-hui-frere-aine-de-demain": {
    text: "Today is the elder brother of tomorrow, and a heavy dew is the elder brother of rain.",
    meaning: "What happens today announces and prepares what is to come.",
    origin: {
      status: "attested",
      note: "Couplet quoted as Yoruba by Ruth Finnegan, as an example of antithetical construction. The source does not give the Yoruba text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_YORUBA",
        label: "Yoruba",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes the couplet to the Yoruba and analyses it as antithetical parallelism.",
      },
    ],
    provenance: "machine",
  },
  "clin-d-oeil-du-crabe": {
    text: "He who waits to see a crab wink will tarry long upon the shore.",
    meaning: "Waiting for the impossible is a waste of time.",
    origin: {
      status: "attested",
      note: "Quoted as Yoruba by Ruth Finnegan, after A. B. Ellis (1894). The source does not give the Yoruba text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_YORUBA",
        label: "Yoruba",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes the proverb to the Yoruba, after Ellis (1894), as an example of an image standing for the impossible.",
      },
    ],
    provenance: "machine",
  },
  "la-maison-lieu-de-repos-du-voyageur": {
    text: "The native land is the ultimate resting place of the pilgrim.",
    original: {
      text: "Ilé làbọ̀ sinmi oko",
      lang: "yor",
      language: "Yoruba",
    },
    meaning:
      "However far one travels, it is at home that one comes back to rest.",
    origin: {
      status: "attested",
      note: "Yoruba proverb published in 2025 with its original text by linguists at the University of Ibadan. They note that emigration has changed the way many people receive it.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_YORUBA",
        label: "Yoruba",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title: "Yorùbá Proverbs and their Relevance to our Contemporary Times",
        url: "https://www.academicresearchjournals.org/IJELC/PDF/2025/February/Oluwadoro%20et%20al.pdf",
        tier: "referenced",
        notes:
          "A journal article (International Journal of English Literature and Culture, vol. 13, no. 1). It gives the proverb in Yoruba (no. 15) with its English translation and a commentary on economic recession and emigration.",
      },
    ],
    provenance: "machine",
  },
  "proverbes-huile-de-palme-des-mots": {
    text: "Proverbs are the palm-oil with which words are eaten.",
    meaning:
      "Among the Igbo, speech without proverbs is like food without seasoning: the proverb makes words palatable.",
    origin: {
      status: "attested",
      note: "The sentence comes from Chinua Achebe's novel Things Fall Apart (1958). The narrator presents it as the Igbo view of the art of conversation. It has since been quoted as an Igbo proverb, but the atlas rests on no collection of oral tradition, and the Igbo text is not given.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_IGBO",
        label: "Igbo",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title:
          "'The palm-oil with which Igbo words are eaten': a descriptive analysis of the translation of Igbo idioms into Zulu in Things Fall Apart",
        url: "https://www.researchgate.net/publication/233035724_'The_palm-oil_with_which_Igbo_words_are_eaten'_a_descriptive_analysis_of_the_translation_of_Igbo_idioms_into_Zulu_in_Things_Fall_Apart",
        tier: "referenced",
        notes:
          "An academic article on the translation into Zulu of the Igbo expressions in Achebe's novel. Its title takes up the saying and ties it to the Igbo language.",
      },
      {
        title: "Use of Language in Things Fall Apart",
        url: "https://www.cliffsnotes.com/literature/t/things-fall-apart/critical-essays/use-of-language-in-things-fall-apart",
        tier: "unverified",
        notes:
          "A school reading guide that quotes the sentence from the first chapter of the novel, where it is said of the Igbo.",
      },
    ],
    provenance: "machine",
  },
  "que-le-milan-se-pose-et-l-aigle-aussi": {
    text: "Let the kite perch and let the eagle perch; whichever says the other should not perch, let its wing break.",
    original: {
      text: "Egbe bere ugo bere, nke si ibe ya ebena nku kwaa ya.",
      lang: "ibo",
      language: "Igbo",
    },
    meaning: "Everyone has a right to their place: live and let live.",
    origin: {
      status: "attested",
      note: "Igbo proverb spoken in shortened form by a character in Chinua Achebe's Things Fall Apart (1958). A Nigerian press column analyses it as an Igbo proverb. The Igbo text given here comes from an unverified source.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_IGBO",
        label: "Igbo",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title:
          'A Dissection of the Proverb "Let the kite perch and let the eagle perch"',
        url: "https://www.opinionnigeria.com/a-dissection-of-the-proverb-let-the-kite-perch-and-let-the-eagle-perch-by-azuka-onwuka/",
        tier: "referenced",
        notes:
          "A signed column in the Nigerian press. It discusses the proverb as an Igbo proverb.",
      },
      {
        title: "Things Fall Apart Chapter 3 Questions and Answers",
        url: "https://www.enotes.com/topics/things-fall-apart/quiz/chapter-3-questions-answers",
        tier: "unverified",
        notes:
          "A reading guide that places the sentence in chapter 3 of the novel, spoken by the character Nwakibie.",
      },
      {
        title: "IGBO PROVERBS (compte X) — « Egbe bere ugo bere… »",
        url: "https://x.com/IgboProverbs_/status/1198126440983801856",
        tier: "unverified",
        notes:
          "A social media post that gives the full Igbo text and an English translation, without citing any collection.",
      },
    ],
    provenance: "machine",
  },
  "peu-a-peu-on-remplit-la-mesure": {
    text: "Little by little fills up the measure.",
    original: {
      text: "Haba na haba hujaza kibaba",
      lang: "swh",
      language: "Swahili",
    },
    meaning: "Small amounts, accumulated, eventually add up.",
    origin: {
      status: "attested",
      note: "Proverb published with its Swahili text and translation by the Center for African Studies at the University of Illinois.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "Tanzania",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comoros",
      },
      {
        kind: "country",
        id: "COD",
        label: "Democratic Republic of the Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Uganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Swahili Proverbs — Methali za Kiswahili",
        url: "https://swahiliproverbs.afrst.illinois.edu/proverbs.htm",
        tier: "referenced",
        notes:
          'An online university collection. It gives the proverb in Swahili and its English translation "Little by little fills up the measure".',
      },
    ],
    provenance: "machine",
  },
  "hate-hate-n-a-pas-de-benediction": {
    text: "Hurry, hurry, has no blessing.",
    original: {
      text: "Haraka haraka haina baraka",
      lang: "swh",
      language: "Swahili",
    },
    meaning: "What is done in a rush rarely turns out well.",
    origin: {
      status: "attested",
      note: "Swahili proverb published by the University of Illinois. Ruth Finnegan also quotes it, after Doke (1947), for its reduplication.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "Tanzania",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comoros",
      },
      {
        kind: "country",
        id: "COD",
        label: "Democratic Republic of the Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Uganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Swahili Proverbs — Methali za Kiswahili",
        url: "https://swahiliproverbs.afrst.illinois.edu/proverbs.htm",
        tier: "referenced",
        notes:
          'An online university collection. It gives the proverb in Swahili and the translation "Hurry, hurry, has no blessings".',
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It quotes the proverb as Swahili, with its original text, as an example of reduplication.",
      },
    ],
    provenance: "machine",
  },
  "une-personne-c-est-des-gens": {
    text: "A person is people.",
    original: {
      text: "Mtu ni watu",
      lang: "swh",
      language: "Swahili",
    },
    meaning: "One exists fully only through one's ties to others.",
    origin: {
      status: "attested",
      note: "Proverb published with its Swahili text and translation by the Center for African Studies at the University of Illinois.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "Tanzania",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comoros",
      },
      {
        kind: "country",
        id: "COD",
        label: "Democratic Republic of the Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Uganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Swahili Proverbs — Methali za Kiswahili",
        url: "https://swahiliproverbs.afrst.illinois.edu/proverbs.htm",
        tier: "referenced",
        notes:
          'An online university collection. It gives the proverb in Swahili and the translation "A person is people".',
      },
    ],
    provenance: "machine",
  },
  "qui-n-est-pas-instruit-par-sa-mere": {
    text: "Whoever is not taught by their mother will be taught by the world.",
    original: {
      text: "Asiyefunzwa na mamae hufunzwa na ulimwengu",
      lang: "swh",
      language: "Swahili",
    },
    meaning:
      "What upbringing failed to pass on, life will teach, often more harshly.",
    origin: {
      status: "attested",
      note: 'Swahili proverb quoted by the US public broadcaster NPR as an approximate African equivalent of "It takes a village to raise a child". The translation is the atlas\'s own, made from the quoted Swahili text.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SWAHILI",
        label: "Swahili",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "Tanzania",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "COM",
        label: "Comoros",
      },
      {
        kind: "country",
        id: "COD",
        label: "Democratic Republic of the Congo",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Uganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title:
          "It Takes A Village To Determine The Origins Of An African Proverb",
        url: "https://www.npr.org/sections/goatsandsoda/2016/07/30/487925796/it-takes-a-village-to-determine-the-origins-of-an-african-proverb",
        tier: "referenced",
        notes:
          'A press article. It quotes this proverb in Swahili, gathered during a discussion among Africanist academics, as close in meaning to "It takes a village".',
      },
    ],
    provenance: "machine",
  },
  "l-enfant-est-a-tous-jita": {
    text: "The child belongs to everyone.",
    original: {
      text: "Omwana ni wa bhone",
      lang: "jit",
      language: "Jita",
    },
    meaning:
      "A child's upbringing belongs to the community, whatever the child's parentage.",
    origin: {
      status: "attested",
      note: "Jita proverb quoted by NPR, which found it in a discussion among Africanist academics. The translation follows the explanation given by the source.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_JITA",
        label: "Jita",
      },
      {
        kind: "country",
        id: "TZA",
        label: "Tanzania",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title:
          "It Takes A Village To Determine The Origins Of An African Proverb",
        url: "https://www.npr.org/sections/goatsandsoda/2016/07/30/487925796/it-takes-a-village-to-determine-the-origins-of-an-african-proverb",
        tier: "referenced",
        notes:
          "A press article. It gives the proverb in Jita and explains that raising a child belongs to the community.",
      },
    ],
    provenance: "machine",
  },
  "aucun-putois-ne-sent-sa-propre-odeur": {
    text: "No polecat ever smelt its own stink.",
    original: {
      text: "Aku 'qaqa lazizwa ukunuka.",
      lang: "zul",
      language: "Zulu",
    },
    meaning: "Nobody recognises their own faults.",
    origin: {
      status: "attested",
      note: "Zulu proverb published in 1912 with its original text (no. 10), in the spelling of the time. Ruth Finnegan quotes it again.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "South Africa",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambia",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Zulu Proverbs",
        url: "https://emandulo.apc.uct.ac.za/collection/Mayr/Publications/Mayr_Zulu_Proverbs.pdf",
        tier: "referenced",
        notes:
          'An article in the journal Anthropos (vol. 7), put online by the University of Cape Town. It gives the Zulu text, the English translation and the meaning "Nobody recognises his own faults".',
      },
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It quotes the proverb as Zulu, after Mayr (1912), on blindness to oneself.",
      },
    ],
    provenance: "machine",
  },
  "on-n-atteint-pas-la-hauteur-dans-la-hate": {
    text: "Height is not reached in a hurry.",
    original: {
      text: "Ubude abupangwa.",
      lang: "zul",
      language: "Zulu",
    },
    meaning: "What grows takes time: there is no point in rushing.",
    origin: {
      status: "attested",
      note: "Zulu proverb published in 1912 with its original text (no. 2), in the spelling of the time.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "South Africa",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambia",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Zulu Proverbs",
        url: "https://emandulo.apc.uct.ac.za/collection/Mayr/Publications/Mayr_Zulu_Proverbs.pdf",
        tier: "referenced",
        notes:
          'An article in the journal Anthropos (vol. 7). It gives the Zulu text and the translation "Height is not reached in a hurry", followed by advice against haste.',
      },
    ],
    provenance: "machine",
  },
  "pas-de-riviere-sans-son-propre-bruit": {
    text: "There is no river that has not its own sound.",
    original: {
      text: "Aku 'mfula ungahlokomi.",
      lang: "zul",
      language: "Zulu",
    },
    meaning: "Everyone has their own qualities.",
    origin: {
      status: "attested",
      note: "Zulu proverb published in 1912 with its original text (no. 27), in the spelling of the time.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "South Africa",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambia",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Zulu Proverbs",
        url: "https://emandulo.apc.uct.ac.za/collection/Mayr/Publications/Mayr_Zulu_Proverbs.pdf",
        tier: "referenced",
        notes:
          'An article in the journal Anthropos (vol. 7). It gives the Zulu text, the translation and the meaning "Everyone has his own qualities".',
      },
    ],
    provenance: "machine",
  },
  "une-personne-est-une-personne-par-les-autres": {
    text: "A person is a person through other persons.",
    original: {
      text: "Umuntu ngumuntu ngabantu",
      lang: "zul",
      language: "Zulu and Ndebele",
    },
    meaning:
      "Each person's humanity is realised through relations with others. It is the maxim often associated with the notion of ubuntu.",
    origin: {
      status: "attested",
      note: 'A peer-reviewed encyclopedia of philosophy gives this maxim in Zulu and Ndebele. It cites the Shona equivalent "munhu munhu muvanhu" and a Xhosa form used by Desmond Tutu. The text does not say since when the maxim has served to define ubuntu.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZULU",
        label: "Zoulou",
      },
      {
        kind: "people",
        id: "PPL_NDEBELE",
        label: "Ndebele",
      },
      {
        kind: "people",
        id: "PPL_SHONA",
        label: "Shona",
      },
      {
        kind: "people",
        id: "PPL_XHOSA",
        label: "Xhosa",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "South Africa",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambia",
      },
      {
        kind: "country",
        id: "LSO",
        label: "Lesotho",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Hunhu/Ubuntu in Traditional Southern African Thought",
        url: "https://iep.utm.edu/hunhu-ubuntu-southern-african-thought/",
        tier: "referenced",
        notes:
          'An article in the peer-reviewed Internet Encyclopedia of Philosophy. It gives the maxim in Zulu and Ndebele, its Shona equivalent and a Xhosa form, all translated "a person is a person through other persons".',
      },
    ],
    provenance: "machine",
  },
  "un-pouce-seul-n-ecrase-pas-un-pou": {
    text: "One thumb cannot crush a louse.",
    original: {
      text: "Chara chimwe hachitswanyi inda",
      lang: "sna",
      language: "Shona",
    },
    meaning: "One achieves less alone than together.",
    origin: {
      status: "attested",
      note: 'Shona proverb published in 2015 in an African studies journal. The authors set it against other Shona proverbs that advocate self-reliance. Their English translation reads "crash a mouse", which appears to be a typo: "inda" means louse.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SHONA",
        label: "Shona",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title:
          "Communicating co-operation or individualism? The paradox of the Shona proverb",
        url: "https://academicjournals.org/journal/JASD/article-full-text/01F90D253039",
        tier: "referenced",
        notes:
          "An article in the Journal of African Studies and Development, vol. 7, no. 5. It gives the proverb in Shona with an English translation, and discusses it alongside Shona proverbs of opposite meaning.",
      },
    ],
    provenance: "machine",
  },
  "deterrer-les-rats-demande-de-s-y-mettre-ensemble": {
    text: "To dig for mice needs concerted effort.",
    original: {
      text: "Kuchera mbeva kukomberana",
      lang: "sna",
      language: "Shona",
    },
    meaning: "Some tasks succeed only if everyone closes in and takes part.",
    origin: {
      status: "attested",
      note: "Shona proverb published in 2015 with its original text in an African studies journal article on Shona proverbs about cooperation.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SHONA",
        label: "Shona",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title:
          "Communicating co-operation or individualism? The paradox of the Shona proverb",
        url: "https://academicjournals.org/journal/JASD/article-full-text/01F90D253039",
        tier: "referenced",
        notes:
          'A journal article. It gives the proverb in Shona with the translation "To dig for mice needs concerted effort".',
      },
    ],
    provenance: "machine",
  },
  "crepitement-n-est-pas-feu": {
    text: "Splutter, splutter is not fire.",
    original: {
      text: "bugu-bugu simuliro",
      lang: "lug",
      language: "Luganda",
    },
    meaning: "Noise and fuss do not prove that anything real is happening.",
    origin: {
      status: "attested",
      note: "Quoted as Ganda, with its original text, by Ruth Finnegan after Doke (1947), as an example of reduplication.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAGANDA",
        label: "Baganda / Ganda",
      },
      {
        kind: "country",
        id: "UGA",
        label: "Uganda",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          'An open-access academic book. It attributes the proverb to the Ganda and gives the text "bugu-bugu simuliro" with its translation.',
      },
    ],
    provenance: "machine",
  },
  "un-jour-ne-suffit-pas-a-pourrir-un-elephant": {
    text: "One day is not sufficient to rot an elephant.",
    meaning: "Great things, and their undoing, take time.",
    origin: {
      status: "attested",
      note: "Quoted as Ila by Ruth Finnegan, after the collection by Smith and Dale (1920). The source does not give the Ila text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ILA",
        label: "Ila",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambia",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          'An open-access academic book. It attributes the proverb to the Ila, after Smith and Dale (1920), and compares it with "Rome was not built in a day".',
      },
    ],
    provenance: "machine",
  },
  "la-force-du-crocodile-est-dans-l-eau": {
    text: "The strength of the crocodile is in the water.",
    meaning:
      "One draws strength from one's surroundings and kin; out of place, one becomes vulnerable.",
    origin: {
      status: "attested",
      note: 'Quoted as "Thonga" by Ruth Finnegan, after Henri-Alexandre Junod (1938). "Thonga" is the name Junod gave to the Tsonga. The source does not give the original text.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_TSONGA",
        label: "Tsonga",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZAF",
        label: "South Africa",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "country",
        id: "SWZ",
        label: "Eswatini",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger–Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes the proverb to the Thonga, after Junod (1938), and gives two meanings: kin make strength, or everyone must keep to their place.",
      },
    ],
    provenance: "machine",
  },
  "c-est-la-patience-qui-sort-du-filet": {
    text: "It is patience which gets you out of the net.",
    meaning:
      "Struggling or lying entangles you further; patience lets you get free.",
    origin: {
      status: "attested",
      note: "A proverb used in customary courts, quoted as Nyanja by Ruth Finnegan after Gray (1944). The source does not give the Nyanja text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_NYANJA",
        label: "Nyanja",
      },
      {
        kind: "country",
        id: "MWI",
        label: "Malawi",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambia",
      },
      {
        kind: "country",
        id: "MOZ",
        label: "Mozambique",
      },
      {
        kind: "country",
        id: "ZWE",
        label: "Zimbabwe",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger–Congo",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes the proverb to the Nyanja, after Gray (1944), in the context of trials: lying only tangles things further.",
      },
    ],
    provenance: "machine",
  },
  "la-grenouille-fait-tomber-la-pluie-sur-sa-tete": {
    text: "The frog brings down rain on its own head.",
    meaning:
      "Whoever provokes a misfortune is the first to bear its consequences.",
    origin: {
      status: "attested",
      note: "Quoted as Azande by Ruth Finnegan, after E. E. Evans-Pritchard (1963), who describes it as an unanswerable argument in disputes. The source does not give the Zande text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_ZANDE",
        label: "Azande",
      },
      {
        kind: "country",
        id: "COD",
        label: "Democratic Republic of the Congo",
      },
      {
        kind: "country",
        id: "CAF",
        label: "Central African Republic",
      },
      {
        kind: "country",
        id: "SSD",
        label: "South Sudan",
      },
      {
        kind: "family",
        id: "FLG_SOUDANIQUECENTRAL",
        label: "Central Sudanic",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes the proverb to the Azande, after Evans-Pritchard (1963), and presents it as a plain statement set against the other party in disputes.",
      },
    ],
    provenance: "machine",
  },
  "une-bouchee-ne-brise-pas-la-compagnie": {
    text: "One morsel of food does not break a company, what breaks a company is the mouth.",
    meaning: "It is not shared goods that divide a group, but words.",
    origin: {
      status: "attested",
      note: "Quoted as Lamba by Ruth Finnegan, as an example of chiastic construction. The source also gives the Lamba text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_LALA_LAMBA",
        label: "Lala-Lamba",
      },
      {
        kind: "country",
        id: "ZMB",
        label: "Zambia",
      },
      {
        kind: "country",
        id: "COD",
        label: "Democratic Republic of the Congo",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes the proverb to the Lamba and analyses it as crossed parallelism.",
      },
    ],
    provenance: "machine",
  },
  "ou-vont-les-vieux-habits": {
    text: "When new clothes are sewn, where do the old ones go?",
    meaning:
      "An unanswerable question used to close a discussion: the new does not make what came before simply vanish.",
    origin: {
      status: "attested",
      note: "Quoted as Kikuyu by Ruth Finnegan: a question asked to bring a discussion to an end. The source does not give the Gikuyu text.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KIKUYU",
        label: "Kikuyu",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title: "Oral Literature in Africa — 14. Proverbs",
        url: "https://books.openedition.org/obp/1202?lang=en",
        tier: "referenced",
        notes:
          "An open-access academic book. It attributes this proverbial question to the Kikuyu and states that it serves to close a discussion.",
      },
    ],
    provenance: "machine",
  },
  "l-homme-est-le-remede-de-l-homme": {
    text: "A person is the remedy of another person.",
    original: {
      text: "Nit nitay garabam",
      lang: "wol",
      language: "Wolof",
    },
    meaning:
      "Humanity is not a given: each person achieves it with the help of others.",
    origin: {
      status: "attested",
      note: "Wolof maxim discussed by the philosopher Souleymane Bachir Diagne. He recalls that Léopold Sédar Senghor analysed it at length in a 1978 speech on human rights.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_WOLOF",
        label: "Wolof",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Senegal",
      },
      {
        kind: "country",
        id: "GMB",
        label: "The Gambia",
      },
      {
        kind: "country",
        id: "MRT",
        label: "Mauritania",
      },
      {
        kind: "family",
        id: "FLG_ATLANTIQUE",
        label: "Atlantic (anciennement West Atlantic)",
      },
    ],
    sources: [
      {
        title: "Ubuntu, nite et humanisme",
        url: "https://palaisdetokyo.com/en/ressource/ubuntu-nite-et-humanisme/",
        tier: "referenced",
        notes:
          'A signed text by a philosopher, published by the Palais de Tokyo. It gives the maxim in Wolof, translates it as "man is the remedy of man", presents a variant that differs by one vowel and refers to Senghor\'s analysis (1978).',
      },
    ],
    provenance: "machine",
  },
  "la-langue-ennemie-de-son-proprietaire": {
    text: "The tongue is the enemy of its owner.",
    original: {
      text: "ɗemngal ko ganyo jooma mum",
      lang: "fuc",
      language: "Pulaar",
    },
    meaning: "Uncontrolled speech turns against the one who utters it.",
    origin: {
      status: "attested",
      note: 'Fula proverb from Fouladou (Senegal), published in 1987 with its original text. The Fula set against it an opposite proverb: "the tongue is usefulness". In the online version of the article, the first letter is rendered with a similar-looking character.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_FULA",
        label: "Fula (Fulbe / Peul)",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Senegal",
      },
      {
        kind: "country",
        id: "GIN",
        label: "Guinea",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "NER",
        label: "Niger",
      },
      {
        kind: "country",
        id: "NGA",
        label: "Nigeria",
      },
      {
        kind: "country",
        id: "CMR",
        label: "Cameroon",
      },
      {
        kind: "country",
        id: "TCD",
        label: "Chad",
      },
      {
        kind: "country",
        id: "SDN",
        label: "Sudan",
      },
      {
        kind: "country",
        id: "CAF",
        label: "Central African Republic",
      },
      {
        kind: "country",
        id: "MRT",
        label: "Mauritania",
      },
      {
        kind: "country",
        id: "SLE",
        label: "Sierra Leone",
      },
      {
        kind: "family",
        id: "FLG_ATLANTIQUE",
        label: "Atlantic (anciennement West Atlantic)",
      },
    ],
    sources: [
      {
        title:
          "La parole à travers quelques proverbes peuls du Fouladou (Sénégal)",
        url: "https://www.persee.fr/doc/jafr_0399-0346_1987_num_57_1_2162",
        tier: "referenced",
        notes:
          'An article in the Journal des Africanistes (vol. 57), online on Persée. It gives the proverb in Pulaar, translated as "the tongue is the enemy of its owner", together with the antithetical proverb "the tongue is usefulness".',
      },
    ],
    provenance: "machine",
  },
  "l-or-perit-la-relation-humaine-demeure": {
    text: "Gold and money perish, but human bonds remain.",
    original: {
      text: "Sanu ni wari bè ban, nga mogoya te ban",
      lang: "bam",
      language: "Bambara",
    },
    meaning: "Wealth can vanish; fellowship is more lasting.",
    origin: {
      status: "attested",
      note: "Bambara proverb published in 2008 with its original text by a Malian jurist, in a University of Fribourg series. The author gathers proverbs useful to dialogue on human rights.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAMBARA",
        label: "Bambara",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "country",
        id: "GIN",
        label: "Guinea",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Senegal",
      },
      {
        kind: "family",
        id: "FLG_MANDE",
        label: "Mande",
      },
    ],
    sources: [
      {
        title:
          "Grenier à mots — Bamanan (Dagné Jiginé), Document de travail de l'IIEDH n° 15.3",
        url: "https://www.unifr.ch/ethique/fr/assets/public/Files/bambaradt.pdf",
        tier: "referenced",
        notes:
          "A working paper published by the Interdisciplinary Institute of Ethics and Human Rights (University of Fribourg). It gives the proverb in Bambara with a French translation, and explains that wealth can disappear while brotherhood is more stable.",
      },
    ],
    provenance: "machine",
  },
  "le-propre-de-l-homme-est-de-comprendre": {
    text: "It is the nature of the seed to sprout, of the fruit to ripen, and of the human being to understand.",
    original: {
      text: "Dànnifen ye wilita ye, jiriden ye mofen ye, mogoya ye hakili ye",
      lang: "bam",
      language: "Bambara",
    },
    meaning: "Reflection and wisdom are what set the human being apart.",
    origin: {
      status: "attested",
      note: 'Bambara proverb published in 2008 with its original text in a University of Fribourg series. The author marks it as one of the "pearls" of Bamanan wisdom.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAMBARA",
        label: "Bambara",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "country",
        id: "GIN",
        label: "Guinea",
      },
      {
        kind: "country",
        id: "SEN",
        label: "Senegal",
      },
      {
        kind: "family",
        id: "FLG_MANDE",
        label: "Mande",
      },
    ],
    sources: [
      {
        title:
          "Grenier à mots — Bamanan (Dagné Jiginé), Document de travail de l'IIEDH n° 15.3",
        url: "https://www.unifr.ch/ethique/fr/assets/public/Files/bambaradt.pdf",
        tier: "referenced",
        notes:
          "A university working paper. It gives the proverb in Bambara with a French translation, and explains that reflection, intelligence and wisdom are proper to humankind.",
      },
    ],
    provenance: "machine",
  },
  "il-n-y-a-pas-de-bon-village": {
    text: "One must know how to settle and exist; there is no good village.",
    original: {
      text: "Bãng n zĩnd n be, tẽng sẽn nooma ka ye",
      lang: "mos",
      language: "Mooré",
    },
    meaning:
      "Elsewhere is not necessarily better: one must learn to live well where one is.",
    origin: {
      status: "attested",
      note: "Moaga proverb published in 2014 with its original text. It was sung to dissuade young people from leaving. Returning migrants have read it differently: one must know how to fit in wherever one settles.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_MOSSI",
        label: "Mossi",
      },
      {
        kind: "country",
        id: "BFA",
        label: "Burkina Faso",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "MLI",
        label: "Mali",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "family",
        id: "FLG_GUR",
        label: "Gur / Voltaic (terme ancien)",
      },
    ],
    sources: [
      {
        title:
          "Mobilités et migrations dans les discours et la littérature orale moose (Burkina Faso)",
        url: "https://journals.openedition.org/etudesafricaines/17667",
        tier: "referenced",
        notes:
          "An article in the Cahiers d'études africaines (no. 213-214), open access. It gives the proverb in Mooré with its French translation and analyses its uses in funeral songs, theatre and migrants' accounts.",
      },
    ],
    provenance: "machine",
  },
  "dieu-puise-l-eau-des-termites": {
    text: "It is God who draws water for the termites.",
    meaning:
      "The weak and the destitute are not abandoned: a benevolent power provides for them.",
    origin: {
      status: "attested",
      note: "Baoulé proverb analysed in 2016 by two linguists at Félix Houphouët-Boigny University. They gloss it word by word and explain the image: termites build with water that God provides.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_BAOULE",
        label: "Baoulé",
      },
      {
        kind: "country",
        id: "CIV",
        label: "Côte d'Ivoire",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title: "Approche cognitive du figement dans les proverbes baoulé",
        url: "https://cvc.cervantes.es/lengua/paremia/pdf/025/012_yao-kouakou.pdf",
        tier: "referenced",
        notes:
          "An article in the journal Paremia (no. 25, pp. 149-160), online on the Centro Virtual Cervantes. It gives the proverb in Baoulé with a word-by-word gloss, its French translation and the explanation of the image.",
      },
    ],
    provenance: "machine",
  },
  "une-main-seule-n-attrape-pas-le-buffle": {
    text: "One hand cannot catch a buffalo.",
    original: {
      text: "Asideka melea todzo o.",
      lang: "ewe",
      language: "Ewe",
    },
    meaning: "There is no strength in isolation.",
    origin: {
      status: "attested",
      note: "Ewe proverb published in 2010 with its original text in a signed, self-published collection. The text is reproduced as it appears in the online version; some letters specific to Ewe may have been simplified there.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_EWE",
        label: "Ewe",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title: "A Collection of Ewe Proverbs",
        url: "https://afriprov.tangaza.ac.ke/wp-content/uploads/2008/11/images_afriprov_books_ewe100proverbs.pdf",
        tier: "referenced",
        notes:
          "A signed collection of one hundred Ewe proverbs, privately printed in Nairobi and put online by the Afriprov collection. It gives the Ewe text (no. 24), an English translation and the meaning that there is no strength in isolation.",
      },
    ],
    provenance: "machine",
  },
  "c-est-avec-patience-qu-on-ote-les-sandales-du-chef": {
    text: "It is with patience that one removes the sandals from a chief.",
    original: {
      text: "Dzigbodi wotsona dea afokpa le Fia fe afo.",
      lang: "ewe",
      language: "Ewe",
    },
    meaning: "Patience makes it possible to obtain what seems out of reach.",
    origin: {
      status: "attested",
      note: "Ewe proverb published in 2010 with its original text in a signed, self-published collection. The text is reproduced as it appears in the online version; some letters specific to Ewe may have been simplified there.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_EWE",
        label: "Ewe",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
    ],
    sources: [
      {
        title: "A Collection of Ewe Proverbs",
        url: "https://afriprov.tangaza.ac.ke/wp-content/uploads/2008/11/images_afriprov_books_ewe100proverbs.pdf",
        tier: "referenced",
        notes:
          'A signed collection of Ewe proverbs. It gives the Ewe text (no. 46), the English translation and the meaning "Patience pays".',
      },
    ],
    provenance: "machine",
  },
  "connais-le-prix-de-la-chikwangue": {
    text: "Know the price of a kwanga while dad and mom are still alive.",
    original: {
      text: "Tata ye mama bakinu zinga, zaya ntalu ya kwanga",
      lang: "kng",
      language: "Kikongo",
    },
    meaning:
      "One must learn from one's parents, while they live, the skills needed to provide for oneself.",
    origin: {
      status: "attested",
      note: "Kongo proverb published with its original text in a signed collection, self-published in 2012. Chikwangue (kwanga) is a cassava bread whose preparation takes months of cultivation and skill.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KONGO",
        label: "Kongo",
      },
      {
        kind: "country",
        id: "COD",
        label: "Democratic Republic of the Congo",
      },
      {
        kind: "country",
        id: "AGO",
        label: "Angola",
      },
      {
        kind: "country",
        id: "COG",
        label: "Republic of the Congo",
      },
      {
        kind: "country",
        id: "GAB",
        label: "Gabon",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title:
          'May 2012: "Know the price of a Kwanga while dad and mom are still alive." – Kongo Proverb',
        url: "https://afriprov.tangaza.ac.ke/apoftmmay2012/",
        tier: "referenced",
        notes:
          'The online collection African Proverbs, Sayings and Stories. It attributes the proverb to the Kongo of Angola and of both Congos, gives the Kikongo text, and cites the collection "Kongo Proverbs" (self-published, Nairobi, May 2012, no. 44).',
      },
    ],
    provenance: "machine",
  },
  "une-parole-douce-lie-les-coeurs": {
    text: "A gentle word binds hearts.",
    original: {
      text: "Awal ziḍan ittarez ulawen",
      lang: "kab",
      language: "Kabyle",
    },
    meaning: "Politeness and gentle speech strengthen social bonds.",
    origin: {
      status: "attested",
      note: "Kabyle proverb studied in 2025 in an Algerian university journal, drawing on T. Hamadache's collection of Berber proverbs from Kabylia (2015).",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KABYLE",
        label: "Kabyle",
      },
      {
        kind: "country",
        id: "DZA",
        label: "Algeria",
      },
      {
        kind: "family",
        id: "FLG_BERBERE",
        label: "Berber / Amazigh",
      },
    ],
    sources: [
      {
        title:
          "La politesse dans le proverbe kabyle : entre éthique et esthétique",
        url: "https://aleph.edinum.org/14804",
        tier: "referenced",
        notes:
          'An article in the journal Aleph (vol. 12, no. 2). It gives the proverb in Kabyle, translated as "a gentle word binds hearts", and analyses it after Hamadache\'s collection (2015).',
      },
    ],
    provenance: "machine",
  },
  "le-silence-vaut-mieux-que-la-science": {
    text: "Silence is worth more than knowledge.",
    original: {
      text: "Ttif tasusmi, tamusni",
      lang: "kab",
      language: "Kabyle",
    },
    meaning:
      "Restraint in speech is a form of wisdom greater than displayed knowledge.",
    origin: {
      status: "attested",
      note: "Kabyle proverb studied in 2025 in an Algerian university journal, drawing on T. Hamadache's collection (2015).",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_KABYLE",
        label: "Kabyle",
      },
      {
        kind: "country",
        id: "DZA",
        label: "Algeria",
      },
      {
        kind: "family",
        id: "FLG_BERBERE",
        label: "Berber / Amazigh",
      },
    ],
    sources: [
      {
        title:
          "La politesse dans le proverbe kabyle : entre éthique et esthétique",
        url: "https://aleph.edinum.org/14804",
        tier: "referenced",
        notes:
          'An article in the journal Aleph (vol. 12, no. 2). It gives the proverb in Kabyle, translated as "silence is worth more than knowledge", and reads it as praise of restraint.',
      },
    ],
    provenance: "machine",
  },
  "peu-a-peu-l-oeuf-marchera": {
    text: "Little by little, the egg will walk on its legs.",
    original: {
      text: "ቀስ በቀስ እንቁላል በእግሩ ይሄዳል",
      lang: "amh",
      language: "Amharic",
    },
    meaning:
      "Given time, what seems inert is transformed: the egg becomes a chick.",
    origin: {
      status: "attested",
      note: 'Amharic proverb published in 2018 with its original text in an Addis Ababa University journal. The author compares it with "Rome was not built in a day". The literal translation is the atlas\'s own.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_AMHARA",
        label: "Amhara",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Ethiopia",
      },
      {
        kind: "family",
        id: "FLG_SEMITIQUE",
        label: "Semitic",
      },
    ],
    sources: [
      {
        title: "Cross-cultural Wisdom in English and Amharic Proverbs",
        url: "https://ejol.aau.edu.et/index.php/EJOLL/article/download/2842/2308/4747",
        tier: "referenced",
        notes:
          'An article in the Ethiopian Journal of Languages and Literature (vol. 14). It gives the proverb in Ge\'ez script and classes it under the evolution of phenomena, with the image of the egg that becomes a chick, alongside the English "Rome was not built in a day".',
      },
    ],
    provenance: "machine",
  },
  "le-mensonge-souper-d-un-soir": {
    text: "A lie is a one-evening supper.",
    original: {
      text: "ሓሶት ድራር ሓደ ምሸት",
      lang: "tir",
      language: "Tigrinya",
    },
    meaning: "A lie does not last long.",
    origin: {
      status: "attested",
      note: "Tigrinya proverb published in 2021 with its original text in the journal Aethiopica. It is common in Eritrea as well as in Tigray.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_TIGRAY",
        label: "Tigray",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Ethiopia",
      },
      {
        kind: "country",
        id: "ERI",
        label: "Eritrea",
      },
      {
        kind: "family",
        id: "FLG_SEMITIQUE",
        label: "Semitic",
      },
    ],
    sources: [
      {
        title:
          "Proverbs in Language Teaching: Using the Example of Let's Speak Tigrinya (2018)",
        url: "https://journals.sub.uni-hamburg.de/aethiopica/article/view/1347",
        tier: "referenced",
        notes:
          'An article in the journal Aethiopica (vol. 23), open access, University of Hamburg. It gives the proverb in Ge\'ez script and in transliteration, translates it "Lie is a one-evening supper" and explains that a lie does not last.',
      },
    ],
    provenance: "machine",
  },
  "avant-de-dire-un-on-ne-dit-pas-deux": {
    text: 'Before you say "one", "two" is not said.',
    original: {
      text: "ሓደ ከይበልካ፡ ክልተ ኣይበሃልን",
      lang: "tir",
      language: "Tigrinya",
    },
    meaning:
      "One thing at a time: an action begun must be finished before moving to the next.",
    origin: {
      status: "attested",
      note: "Tigrinya proverb published in 2021 with its original text in the journal Aethiopica.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_TIGRAY",
        label: "Tigray",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Ethiopia",
      },
      {
        kind: "country",
        id: "ERI",
        label: "Eritrea",
      },
      {
        kind: "family",
        id: "FLG_SEMITIQUE",
        label: "Semitic",
      },
    ],
    sources: [
      {
        title:
          "Proverbs in Language Teaching: Using the Example of Let's Speak Tigrinya (2018)",
        url: "https://journals.sub.uni-hamburg.de/aethiopica/article/view/1347",
        tier: "referenced",
        notes:
          "An article in the journal Aethiopica (vol. 23). It gives the proverb in Ge'ez script, its English translation and its meaning: each action in its own time and in order.",
      },
    ],
    provenance: "machine",
  },
  "tant-que-le-lion-n-a-pas-son-conteur": {
    text: "Until the lion has his or her own storyteller, the hunter will always have the best part of the story.",
    original: {
      text: "Gnatola ma no kpon sia, eyenabe adelan to kpo mi sena.",
      lang: "gej",
      language: "Gen",
    },
    meaning:
      "A story depends on who tells it: whoever has no voice always ends up the loser.",
    origin: {
      status: "estimated",
      note: 'In 1994 Chinua Achebe quotes "that great proverb" in another wording, with historians in place of the storyteller, and names no people. The only source that gives a people and an original text is a contribution to the Afriprov collection: it attributes the proverb to the Ewe-Mina and refers to no published collection. The same page mentions an Igbo variant, with no source.',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_EWE",
        label: "Ewe",
      },
      {
        kind: "people",
        id: "PPL_MINA",
        label: "Mina",
      },
      {
        kind: "country",
        id: "GHA",
        label: "Ghana",
      },
      {
        kind: "country",
        id: "TGO",
        label: "Togo",
      },
      {
        kind: "country",
        id: "BEN",
        label: "Benin",
      },
      {
        kind: "family",
        id: "FLG_BENOUECONGO",
        label: "Benue–Congo",
      },
      {
        kind: "family",
        id: "FLG_NIGERCONGO",
        label: "Niger–Congo",
      },
    ],
    sources: [
      {
        title:
          'Apr. 2006: "Until the lion has his or her own storyteller, the hunter will always have the best part of the story." – Ewe-mina (Benin, Ghana, and Togo) Proverb',
        url: "https://afriprov.tangaza.ac.ke/april-2006-proverb-quntil-the-lion-has-his-or-her-own-storyteller-the-hunter-will-always-have-the-best-part-of-the-storyq-ewe-mina-benin-ghana-and-togo/",
        tier: "unverified",
        notes:
          "The online collection African Proverbs, Sayings and Stories (Tangaza University). It attributes the proverb to the Ewe-Mina of Benin, Ghana and Togo and gives the original text. It cites no published collection and mentions an Igbo variant about historians.",
      },
      {
        title: "Chinua Achebe, The Art of Fiction No. 139",
        url: "https://www.theparisreview.org/interviews/1720/the-art-of-fiction-no-139-chinua-achebe",
        tier: "referenced",
        notes:
          'An interview published in The Paris Review. Achebe quotes "that great proverb": until the lions have their own historians, the history of the hunt will always glorify the hunter. He attributes it to no specific people.',
      },
    ],
    provenance: "machine",
  },
  "deux-fourmis-et-la-sauterelle": {
    text: "Two ants do not fail to pull one grasshopper.",
    original: {
      text: "Obusisi bubili tibulemwa nsenene emoi",
      lang: "hay",
      language: "Haya",
    },
    meaning:
      "Together, even the smallest can move a load larger than themselves.",
    origin: {
      status: "estimated",
      note: "The only source that attributes this proverb to the Haya is a contribution to an online collection. It gives the original text but refers to no published collection. The same page also reports it among the Ganda and the Sukuma.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_HAYA",
        label: "Haya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "Tanzania",
      },
      {
        kind: "family",
        id: "FLG_BANTU",
        label: "Bantu",
      },
    ],
    sources: [
      {
        title:
          'Jan. 2007: "Two ants do not fail to pull one grasshopper." – Haya (Tanzania) Proverb',
        url: "https://afriprov.tangaza.ac.ke/january2007/",
        tier: "unverified",
        notes:
          "The online collection African Proverbs, Sayings and Stories (Tangaza University). It attributes the proverb to the Haya of Tanzania and gives the Haya text, without citing any published collection.",
      },
    ],
    provenance: "machine",
  },
  "le-zebre-emporte-ses-rayures": {
    text: "A zebra takes its stripes wherever it goes.",
    original: {
      text: "Enap oloitiko isirat enelo.",
      lang: "mas",
      language: "Maa",
    },
    meaning: "One carries who one is: habits and culture are not left behind.",
    origin: {
      status: "estimated",
      note: "The only source that attributes this proverb to the Maasai is an online collection of one hundred Maasai proverbs. It gives the Maa text but names neither a compiler nor a source.",
    },
    entities: [
      {
        kind: "people",
        id: "PPL_MAASAI",
        label: "Maasai",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "country",
        id: "TZA",
        label: "Tanzania",
      },
      {
        kind: "family",
        id: "FLG_NILOTIQUE",
        label: "Nilotic",
      },
    ],
    sources: [
      {
        title: "A Collection of 100 Maasai Proverbs",
        url: "https://afriprov.tangaza.ac.ke/wp-content/uploads/2008/11/A-collection-of-100-Maasai-Proverbs.pdf",
        tier: "unverified",
        notes:
          "An online collection from Afriprov. It gives the proverb in Maa (no. 49) with English, French and Swahili translations, and compares it with a Bible verse. It names neither a compiler nor a source.",
      },
    ],
    provenance: "machine",
  },
  "tous-tisses-comme-une-grande-natte": {
    text: "All who live under the sky are woven together like one big mat.",
    original: {
      text: "Tsihy be lambanana ny ambanilantra",
      lang: "plt",
      language: "Malagasy",
    },
    meaning:
      "Human beings are bound to one another like the strands of a single mat.",
    origin: {
      status: "estimated",
      note: "Malagasy proverb published with its original text on the website of a librarians' association. The article cites no collection. The atlas rests on none of the major published collections, such as J. A. Houlder's (1915-1916).",
    },
    entities: [
      {
        kind: "country",
        id: "MDG",
        label: "Madagascar",
      },
      {
        kind: "family",
        id: "FLG_AUSTRONESIENNE",
        label: "Austronesian / Malayo-Polynesian",
      },
    ],
    sources: [
      {
        title: "Ohabolana: Malagasy Proverbs",
        url: "https://glli-us.org/2021/12/11/ohabolana-malagasy-proverbs/",
        tier: "unverified",
        notes:
          "A post published by the Global Literature in Libraries Initiative. It gives a dozen Malagasy proverbs with their text and an English translation, without citing any published collection or naming any group.",
      },
    ],
    provenance: "machine",
  },
  "le-mensonge-a-les-jambes-courtes": {
    text: "Lies have short legs.",
    original: {
      text: "Beeni raad ma leh.",
      lang: "som",
      language: "Somali",
    },
    meaning: "A lie does not get far: it is eventually found out.",
    origin: {
      status: "estimated",
      note: 'The atlas knows this proverb in Somali only through a personal blog. The blog renders it with the English equivalent "Lies have short legs", not word for word, and cites no collection. The atlas does not draw on Georgi Kapchits\'s major dictionary of Somali proverbs (1998).',
    },
    entities: [
      {
        kind: "people",
        id: "PPL_SOMALI",
        label: "Somali",
      },
      {
        kind: "country",
        id: "SOM",
        label: "Somalia",
      },
      {
        kind: "country",
        id: "DJI",
        label: "Djibouti",
      },
      {
        kind: "country",
        id: "ETH",
        label: "Ethiopia",
      },
      {
        kind: "country",
        id: "KEN",
        label: "Kenya",
      },
      {
        kind: "family",
        id: "FLG_COUCHITIQUE",
        label: "Cushitic",
      },
    ],
    sources: [
      {
        title: "Somali Proverbs with Equivalent English Proverbs",
        url: "https://ismail4all.wordpress.com/2013/11/22/somali-proverbs-with-equivalent-english-proverbs-2/",
        tier: "unverified",
        notes:
          "A personal blog that pairs Somali proverbs with English equivalents, without a literal translation or any cited collection.",
      },
    ],
    provenance: "machine",
  },
  "vite-seul-loin-ensemble": {
    text: "If you want to go fast, go alone; if you want to go far, go together.",
    meaning: "Solitary effort is quick, but shared effort lasts longer.",
    origin: {
      status: "unestablished",
      note: 'No African-language text is known. The folklorists Charles Doyle and Wolfgang Mieder record Anglo-American forms from 1917, as a reply to Kipling\'s line "He travels the fastest who travels alone". The "African" label appears only from 2004, and they judge it false. A related Luo proverb exists, and it is not this sentence.',
    },
    entities: [],
    sources: [
      {
        title:
          '"If you want to travel fast, travel alone; if you want to travel far, travel with others." (message à la liste ADS-L)',
        url: "https://listserv.linguistlist.org/pipermail/ads-l/2016-March/141091.html",
        tier: "referenced",
        notes:
          'A signed message from the co-author of the Dictionary of Modern Proverbs (Yale). It presents the sentence as a reply to the Anglo-American proverb "He who travels fastest travels alone". It calls the African attribution probably false and gives English attestations from 1917.',
      },
      {
        title:
          "Who first said: if you want to go fast, go alone; if you want to go far, go together?",
        url: "https://andrewwhitby.com/2020/12/25/if-you-want-to-go-fast/",
        tier: "unverified",
        notes:
          'A documented investigation on a personal blog. It dates the first African attribution to 2004, in a book by Bill Hull. It reports that Mieder and Doyle replaced "perhaps wrongly" with "wrongly" in their publication. It also cites a Luo variant and a Burkinabe origin put forward by a missionary, with no original text for either.',
      },
    ],
    provenance: "machine",
  },
  "tout-un-village-pour-elever-un-enfant": {
    text: "It takes a village to raise a child.",
    meaning:
      "Raising a child is the concern of the whole community, not only of the parents.",
    origin: {
      status: "unestablished",
      note: "No one has found this sentence in an African language. Several peoples have proverbs with a similar meaning, for example in Jita or Swahili, but none says these words. It became popular in English, notably as the title of a book in 1996.",
    },
    entities: [],
    sources: [
      {
        title:
          "It Takes A Village To Determine The Origins Of An African Proverb",
        url: "https://www.npr.org/sections/goatsandsoda/2016/07/30/487925796/it-takes-a-village-to-determine-the-origins-of-an-african-proverb",
        tier: "referenced",
        notes:
          "A press article (NPR). It concludes that no precise origin can be traced. It quotes academics and two related proverbs, one in Jita and the other in Swahili, which are not this sentence.",
      },
    ],
    provenance: "machine",
  },
  "vieillard-bibliotheque-qui-brule": {
    text: "In Africa, when an old man dies, a library burns.",
    meaning:
      "When a keeper of oral tradition dies, knowledge that exists nowhere else disappears.",
    origin: {
      status: "unestablished",
      note: 'This is not a proverb but a rewording of a statement by Amadou Hampâté Bâ, a Fula writer from Mali, at UNESCO on 1 December 1960. He spoke of traditions kept "in the memory of men who die every day". The wording with "library" is traced to a later statement, around 1962. Presenting it as an "African proverb" erases its author.',
    },
    entities: [],
    sources: [
      {
        title:
          "Discours de Hamadou Hampâté Bâ à la commission Afrique de l'UNESCO",
        url: "https://www.ina.fr/ina-eclaire-actu/audio/phd86073514/discours-de-hamadou-hampate-ba-a-la-commission-afrique-de-l-unesco",
        tier: "official",
        notes:
          'A sound archive of the Institut national de l\'audiovisuel, dated 1 December 1960. Hampâté Bâ, then head of the scientific institute of Mali, pleads for saving traditions kept in the memory of men who die every day. The record does not contain the word "library".',
      },
      {
        title:
          "Quelle est l'origine du proverbe ? Un vieillard qui meurt, c'est une bibliothèque qui brûle",
        url: "https://www.dicocitations.com/questions-reponses/question/quelle-est-lorigine-du-proverbe-un-vieillard-qui-meurt-cest-une-bibliotheque-qui-brule/",
        tier: "unverified",
        notes:
          'A quotations website. It places the sentence at the 1960 UNESCO General Conference and traces the wording "each time an old man dies, a library has burned" to 1962, without referring to any archival document.',
      },
    ],
    provenance: "machine",
  },
  "enfant-que-le-village-n-embrasse-pas": {
    text: "The child who is not embraced by the village will burn it down to feel its warmth.",
    meaning:
      "A young person left out of the community may seek belonging through destruction.",
    origin: {
      status: "unestablished",
      note: 'The sentence circulates in English as an "African proverb", with no people, no language and no original text. The atlas knows of no published source attesting its use in an African language.',
    },
    entities: [],
    sources: [
      {
        title:
          'Quote by African Proverb: "A child that is not embraced by the village will..."',
        url: "https://www.goodreads.com/quotes/9946467-a-child-that-is-not-embraced-by-the-village-will",
        tier: "unverified",
        notes:
          'A quotations website. It attributes the sentence to "African Proverb" without naming a people, a language or a source.',
      },
      {
        title:
          "The Child Who Is Not Embraced By The Village: A Powerful Proverb About Connection and Community",
        url: "https://captainaxom.medium.com/the-child-who-is-not-embraced-by-the-village-a-powerful-proverb-about-connection-and-community-d0cf0a4931e5",
        tier: "unverified",
        notes:
          "A blog post that discusses the sentence as an African proverb, with no original text and no verifiable source.",
      },
    ],
    provenance: "machine",
  },
  "trop-petit-moustique": {
    text: "If you think you are too small to make a difference, try sleeping with a mosquito.",
    meaning: "Even a tiny being can have a considerable effect.",
    origin: {
      status: "unestablished",
      note: 'The sentence is attributed sometimes to the Dalai Lama and sometimes to a "West African proverb". None of these sources gives a people, a language or an original text, and the two attributions contradict each other.',
    },
    entities: [],
    sources: [
      {
        title:
          "#12 - West African Proverb: If You Think You're Too Small to Make A Difference…",
        url: "https://www.proverbsonblast.com/p/12-if-you-think-youre-too-small-to",
        tier: "unverified",
        notes:
          "A personal newsletter that presents the sentence as a West African proverb heard during the author's childhood, with no country, language or source. The author notes that it was popularised by the Dalai Lama.",
      },
      {
        title:
          'Quote by Dalai Lama XIV: "If you think you are too small to make a difference..."',
        url: "https://www.goodreads.com/quotes/7777-if-you-think-you-are-too-small-to-make-a",
        tier: "unverified",
        notes:
          "A quotations website that attributes the same sentence to the Dalai Lama, with no reference.",
      },
    ],
    provenance: "machine",
  },
};

// @req REQ-145
export function localizeProverb(
  proverb: Proverb,
  language: Language
): LocalizedProverb {
  if (language === "fr") return proverb;

  const translation = PROVERBS_EN[proverb.id];
  if (!translation) return proverb;
  const { provenance, ...copy } = translation;
  return { id: proverb.id, ...copy, translationKind: provenance };
}
