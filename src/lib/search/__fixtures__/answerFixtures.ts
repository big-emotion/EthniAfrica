/**
 * The nine reference cases of the answer page, as `SearchAnswer` values.
 *
 * Sentences for the lead, the follow-up question and the origin are taken from
 * the frozen mockup (`docs/design/mockups/search-answer/`, v11) so a component
 * rendered from these fixtures can be laid beside its screen. Three cases have
 * no screen — Nzebi, Bassa and Côte d'Ivoire — and are written from their
 * fiches; they exist to exercise the shapes the screens do not: no lead, an
 * oral account alone, a country's former names.
 *
 * Figures are the mockup's, not the corpus's: they are illustrative, and the
 * real values come from the fiches once the answer is read from them. Sources
 * of the cases that are not the pharaoh piece are placeholders for the shape
 * of the provenance, never citations.
 */
import type {
  AnswerAccount,
  AnswerName,
  SearchAnswer,
  WordAnswer,
} from "@/lib/search/answer";
import type {
  SearchEvidence,
  SearchEvidenceSource,
  SearchSourceStanding,
} from "@/lib/search/evidence";

// @req REQ-178
export const ANSWER_FIXTURE_CASES = [
  "peul",
  "nzebi",
  "bassa",
  "lingala",
  "bantou",
  "civ",
  "congo",
  "camara",
  "pharaon",
] as const;

export type AnswerFixtureCase = (typeof ANSWER_FIXTURE_CASES)[number];

export interface AnswerFixture {
  query: string;
  /** Sentence above several answers to one name (Congo's two states). */
  pageLead?: string;
  answers: SearchAnswer[];
  /** What the envelope carries for a published word, with no fiche behind it. */
  wordAnswers?: WordAnswer[];
}

function source(
  id: string,
  title: string,
  tier: SearchSourceStanding = "referenced",
  url?: string
): SearchEvidenceSource {
  return { id, title, tier, ...(url ? { url } : {}) };
}

function evidence(
  statement: string,
  ...sources: SearchEvidenceSource[]
): SearchEvidence {
  return {
    assertion: {
      statement,
      sourceCount: sources.length,
      lastHumanAuditAt: null,
    },
    sources,
    standing: sources[0]?.tier ?? "needs_review",
  };
}

function distinctSourceCount(accounts: AnswerAccount[] = []): number {
  return new Set(
    accounts.flatMap((account) =>
      account.evidence.flatMap((entry) => entry.sources.map(({ id }) => id))
    )
  ).size;
}

const names = (...forms: AnswerName[]): AnswerName[] => forms;

const peul: SearchAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "Le nom que les Fula se donnent, Fulbe au pluriel et Pullo au singulier, n'a pas de sens établi. Les linguistes du fulfulde consultés admettent une racine ful- ou pul- sans en donner la signification.",
      attribution: "linguistic",
      evidence: [
        evidence(
          "Le nom des Fulɓe n'a pas de sens établi.",
          source("fixture-peul-1", "Source de test : fulfulde, racine du nom"),
          source("fixture-peul-2", "Source de test : dictionnaire fulfulde")
        ),
      ],
    },
  ];
  return {
    kind: "people",
    title: "Fulɓe",
    what: {
      lead: "Le nom qu'ils se donnent : Fulɓe au pluriel, Pullo au singulier. « Peul », que vous avez cherché, est le nom qu'utilise le français.",
      facts: {
        population: 40_000_000,
        countryCount: 12,
        familyId: "FLG_NIGERCONGO",
      },
    },
    origin: { accounts, debated: false },
    names: names(
      {
        form: "Fulɓe · Pullo",
        selfGiven: true,
        shortLine: "En fulfulde, leur langue.",
      },
      {
        form: "Peul",
        selfGiven: false,
        shortLine: "La forme française, venue du wolof.",
      },
      {
        form: "Fulani",
        selfGiven: false,
        shortLine: "La forme anglaise, venue du haoussa.",
      },
      {
        form: "Fellata",
        selfGiven: false,
        shortLine: "Employée au Bornou ; son origine est discutée.",
      },
      { form: "Peulh", selfGiven: false },
      { form: "Fula", selfGiven: false },
      { form: "Fulah", selfGiven: false },
      { form: "Mbororo", selfGiven: false }
    ),
    where: {
      unit: "population",
      estimate: true,
      rows: [
        { countryId: "NGA", value: 14_000_000 },
        { countryId: "GIN", value: 5_000_000 },
        { countryId: "SEN", value: 4_000_000 },
        { countryId: "MLI", value: 3_500_000 },
        { countryId: "CMR", value: 3_000_000 },
      ],
    },
    next: { question: "Pourquoi des Fulɓe du Sénégal jusqu'au Soudan ?" },
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const nzebi: SearchAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "Bandjabi, ou Bandzabi, est le nom que donnaient les administrateurs coloniaux français et les peuples voisins. Il se compose du préfixe bantou Ba-, qui marque le pluriel des personnes, et du radical nzabi ou njabi.",
      attribution: "written",
      evidence: [
        evidence(
          "Bandjabi est formé du préfixe Ba- et du radical nzabi ou njabi.",
          source("fixture-nzebi-1", "Source de test : Nzebi, appellations")
        ),
      ],
    },
  ];
  return {
    kind: "people",
    title: "Nzebi",
    what: { facts: {} },
    origin: { accounts, debated: false },
    names: names(
      { form: "Nzebi", selfGiven: null },
      { form: "Bandjabi", selfGiven: false },
      { form: "Bandzabi", selfGiven: false },
      { form: "Nzabi", selfGiven: false },
      { form: "Njabi", selfGiven: false }
    ),
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const bassa: SearchAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "Aucune explication venue d'Europe n'est rapportée dans les sources consultées. La seule explication publiée est une tradition orale bassa, rapportée par l'historien bassa Joseph Gbadyu.",
      attribution: "oral",
      claimStatus: "claimed",
      evidence: [
        evidence(
          "Tradition orale bassa sur l'origine du nom.",
          source("fixture-bassa-1", "Source de test : tradition orale bassa")
        ),
      ],
    },
  ];
  return {
    kind: "people",
    title: "Bassa",
    what: { facts: {} },
    origin: { accounts, debated: false },
    names: names(
      { form: "Bassa", selfGiven: null },
      { form: "Gboboh", selfGiven: false },
      { form: "Adbassa", selfGiven: false },
      { form: "Bambog-Mbog", selfGiven: false }
    ),
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const lingala: SearchAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "Des Européens auraient d'abord appelé « Bangala » le parler du poste de Bangala Station (1884-1885), puis des missionnaires l'auraient rebaptisé « Lingala » en 1901-1902. Aucune source antérieure à 1902 ne mentionne le nom « Lingala ».",
      attribution: "written",
      claimStatus: "claimed",
      evidence: [
        evidence(
          "Le parler de Bangala Station, rebaptisé Lingala par des missionnaires.",
          source(
            "fixture-lingala-1",
            "Source de test : lingala, lecture européenne"
          ),
          source("fixture-lingala-2", "Source de test : missions du haut Congo")
        ),
      ],
    },
    {
      text: "Une autre lecture y voit un nom bobangi : Lingála et Mangála signifieraient « la langue des marchés ». Selon cette lecture, le nom n'est pas une création missionnaire.",
      attribution: "linguistic",
      claimStatus: "claimed",
      evidence: [
        evidence(
          "Lingála et Mangála, noms bobangi de la langue des marchés.",
          source(
            "fixture-lingala-3",
            "Source de test : lingala, lecture bobangi"
          ),
          source("fixture-lingala-4", "Source de test : bobangi, dictionnaire")
        ),
      ],
    },
  ];
  return {
    kind: "language",
    title: "Lingala",
    what: {
      lead: "Une langue née du commerce sur le fleuve Congo, aujourd'hui parlée de Kinshasa à Brazzaville et au-delà.",
      facts: { population: 40_000_000, countryCount: 4 },
    },
    origin: { accounts, debated: true },
    names: names(
      { form: "Lingala", selfGiven: null },
      { form: "Bangala", selfGiven: null },
      { form: "Mangala", selfGiven: null },
      { form: "Ngala", selfGiven: null },
      { form: "Losengo", selfGiven: null }
    ),
    where: {
      unit: "speakers",
      estimate: true,
      rows: [
        { countryId: "COD", value: 34_000_000 },
        { countryId: "COG", value: 4_500_000 },
        { countryId: "CAF", value: 800_000 },
        { countryId: "AGO", value: 300_000 },
      ],
    },
    next: {
      question:
        "Comment une langue de marché est-elle devenue celle de deux capitales ?",
    },
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const bantou: SearchAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "Le terme « bantou » a été introduit par le philologue allemand Wilhelm Bleek, qui l'emploie dès 1857 ou 1858. Il a choisi ce mot parce qu'il signifie « gens » ou « personnes » dans plusieurs de ces langues : ba- marque le pluriel, -ntu veut dire « personne ». Autrement dit : un linguiste a pris le mot « les gens », commun à ces langues, pour nommer leur parenté.",
      attribution: "written",
      evidence: [
        evidence(
          "Bleek introduit « bantou » vers 1857-1858 à partir de ba-ntu, « les gens ».",
          source(
            "fixture-bantou-1",
            "Source de test : Bleek, comparaison des langues"
          ),
          source(
            "fixture-bantou-2",
            "Source de test : histoire de la linguistique bantoue"
          )
        ),
      ],
    },
  ];
  return {
    kind: "languageFamily",
    title: "Les langues bantoues",
    what: {
      lead: "On parle souvent « des Bantous » comme d'un seul peuple. Le mot désigne d'abord une grande famille de langues — et les nombreux peuples qui les parlent, du Cameroun à l'Afrique du Sud.",
      facts: { population: 420_000_000, countryCount: 21, peopleCount: 169 },
    },
    origin: { accounts, debated: false },
    names: names(
      { form: "abantu", selfGiven: null, shortLine: "En zoulou." },
      { form: "bato", selfGiven: null, shortLine: "En lingala." },
      { form: "watu", selfGiven: null, shortLine: "En swahili." },
      { form: "Bantu", selfGiven: null, shortLine: "En anglais." }
    ),
    where: {
      unit: "speakers",
      estimate: true,
      rows: [
        { countryId: "COD", value: 95_000_000 },
        { countryId: "TZA", value: 60_000_000 },
        { countryId: "ZAF", value: 46_000_000 },
        { countryId: "KEN", value: 35_000_000 },
        { countryId: "MOZ", value: 33_000_000 },
      ],
    },
    next: {
      question:
        "Comment ces langues se sont-elles répandues sur tout un demi-continent ?",
    },
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const civ: SearchAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "Le nom Côte d'Ivoire renvoie au commerce de l'ivoire pratiqué le long du littoral. L'appellation dont il procède est néerlandaise : au début du XVIIe siècle, des marchands hollandais nomment ce littoral Tand Kust, la côte des dents. L'administration française l'a ensuite fixé par décret, à la fin du XIXe siècle.",
      attribution: "written",
      evidence: [
        evidence(
          "Tand Kust, la côte des dents, est l'appellation néerlandaise dont procède le nom.",
          source("fixture-civ-1", "Source de test : Côte d'Ivoire, toponymie")
        ),
      ],
    },
  ];
  return {
    kind: "country",
    title: "Côte d'Ivoire",
    what: { facts: {} },
    origin: { accounts, debated: false },
    names: names(
      {
        form: "Tand Kust, la côte des dents",
        selfGiven: null,
        period: "XVIIe siècle",
      },
      {
        form: "Établissements français de la Côte d'Or",
        selfGiven: null,
        period: "1889",
      },
      { form: "Colonie de Côte d'Ivoire", selfGiven: null, period: "1893-1960" }
    ),
    where: {
      unit: "percent",
      estimate: true,
      rows: [
        { peopleId: "PPL_AKAN", value: 42 },
        { peopleId: "PPL_SENUFO", value: 17 },
        { peopleId: "PPL_MALINKE", value: 16 },
        { peopleId: "PPL_KROU_MACRO", value: 11 },
        { peopleId: "PPL_MANDE_DU_SUD", value: 10 },
      ],
      unsplitPercent: 4,
    },
    next: { template: "formerName", params: { formerName: "Tand Kust" } },
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const kongoOrigin = (): AnswerAccount[] => [
  {
    text: "Le nom vient du royaume Kongo, un royaume précolonial puissant. « Congo » est la forme portugaise de « Kongo ». Le fleuve a été nommé d'après ce royaume, puis les deux pays d'après le fleuve. Ce que voulait dire « Kongo » au départ n'est pas établi.",
    attribution: "written",
    evidence: [
      evidence(
        "Congo est la forme portugaise de Kongo, nom d'un royaume.",
        source("fixture-congo-1", "Source de test : royaume Kongo")
      ),
    ],
  },
];

const congoRepublic: SearchAnswer = (() => {
  const accounts = kongoOrigin();
  return {
    kind: "country",
    title: "Congo",
    what: { facts: { peopleCount: 25 } },
    origin: { accounts, debated: false },
    names: names(
      { form: "Congo français", selfGiven: null, period: "1880-1960" },
      { form: "Congo-Brazzaville", selfGiven: null }
    ),
    where: {
      unit: "percent",
      estimate: true,
      rows: [{ peopleId: "PPL_KONGO_BRAZZA", value: 40 }],
      unsplitPercent: 60,
      documentedPeopleCount: 25,
    },
    next: {
      question:
        "Un royaume, trois pays : comment le Kongo a-t-il été partagé ?",
    },
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const congoDemocratic: SearchAnswer = (() => {
  const accounts = kongoOrigin();
  return {
    kind: "country",
    title: "RD Congo",
    what: { facts: { peopleCount: 64 } },
    origin: { accounts, debated: false },
    names: names(
      {
        form: "État indépendant du Congo",
        selfGiven: null,
        period: "1885-1908",
      },
      { form: "Congo belge", selfGiven: null, period: "1908-1960" },
      { form: "Zaïre", selfGiven: null, period: "1971-1997" }
    ),
    where: {
      unit: "percent",
      estimate: true,
      rows: [
        { peopleId: "PPL_LUBA", value: 18 },
        { peopleId: "PPL_MONGO", value: 17 },
        { peopleId: "PPL_KONGO", value: 12 },
        { peopleId: "PPL_TETELA", value: 7 },
        { peopleId: "PPL_NANDE", value: 2.5 },
      ],
      unsplitPercent: 34,
      documentedPeopleCount: 64,
    },
    next: { template: "formerName", params: { formerName: "Zaïre" } },
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const camara: SearchAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "Le nom viendrait d'un ancêtre : la lignée remonterait à Kela Mansa Subri, un guerrier venu de Djida. Les descendants de Kamanjan Boro, fils de Neni Mansa Kara, sont les premiers à avoir été appelés Kamara.",
      attribution: "oral",
      claimStatus: "claimed",
      evidence: [
        evidence(
          "Récit de griot sur l'ancêtre Kela Mansa Subri.",
          source("fixture-camara-1", "Source de test : récit de griot, Camara")
        ),
      ],
    },
    {
      text: "L'épopée de Soundiata distingue deux branches : les Kamara de Sibi et les Kamara forgerons de Tabon, unis à Soundiata par une alliance. Elle fait sceller par Soundiata une alliance perpétuelle entre les Kamara de Sibi et les Keita du Manding.",
      attribution: "oral",
      claimStatus: "claimed",
      evidence: [
        evidence(
          "Deux branches Kamara dans l'épopée de Soundiata.",
          source("fixture-camara-2", "Source de test : épopée de Soundiata")
        ),
      ],
    },
    {
      text: "Souleymane Kanté rapporte un récit écrit en n'ko qui lit le nom comme « qu'il règne ». Le même ouvrage compte six branches du nom : Tabon, Sibi, Gbakundo, Kidimaga, Somono et Fina Kamara.",
      attribution: "written",
      claimStatus: "claimed",
      evidence: [
        evidence(
          "Lecture du nom comme « qu'il règne » dans un écrit en n'ko.",
          source("fixture-camara-3", "Source de test : écrits en n'ko")
        ),
      ],
    },
  ];
  return {
    kind: "patronyme",
    title: "Camara",
    what: {
      lead: "Un nom de clan mandingue, porté du Mali jusqu'à la côte, de la Guinée au Liberia.",
      facts: { countryCount: 7 },
    },
    origin: { accounts, debated: true },
    names: names(
      { form: "Camara", selfGiven: null },
      { form: "Kamara", selfGiven: null },
      { form: "Kàmara", selfGiven: null },
      { form: "Kámala", selfGiven: null },
      { form: "Kamana", selfGiven: null, shortLine: "En vaï." }
    ),
    where: {
      unit: "presence",
      estimate: false,
      rows: ["GIN", "MLI", "SLE", "LBR", "CIV", "GMB", "GNB"].map(
        (countryId) => ({ countryId, value: null })
      ),
    },
    next: {
      question:
        "Comment des Camara du haut Niger sont-ils arrivés jusqu'à la côte ?",
    },
    sources: { count: distinctSourceCount(accounts) },
  };
})();

const pharaon: WordAnswer = (() => {
  const accounts: AnswerAccount[] = [
    {
      text: "De l'égyptien per-aa, « la grande maison ». Le premier emploi certain pour désigner le roi lui-même se trouve dans une lettre adressée à Amenhotep IV, au XIVe siècle avant notre ère.",
      attribution: "linguistic",
      evidence: [
        evidence(
          "Pharaon vient de l'égyptien per-aa, « la grande maison ».",
          source(
            "tlfi-pharaon",
            "Trésor de la langue française informatisé (TLFi), « pharaon », étymologie et histoire",
            "referenced",
            "https://www.cnrtl.fr/etymologie/pharaon"
          ),
          source(
            "josephe-aj-8-156",
            "Flavius Josèphe, Antiquités juives VIII, 156 (traduction de William Whiston)",
            "referenced",
            "https://lexundria.com/j_aj/8.156/wst"
          )
        ),
      ],
    },
  ];
  return {
    kind: "word",
    title: "Pharaon",
    queries: ["pharaon", "pharaons", "pharaoh"],
    what: {
      lead: "Au départ, « pharaon » ne désignait pas le roi d'Égypte, mais sa maison : le palais et la cour.",
      facts: {},
    },
    origin: { accounts, debated: false },
    names: names(
      { form: "pharaon", selfGiven: null },
      { form: "pharaoh", selfGiven: null }
    ),
    path: [
      { form: "per-aa", language: "égyptien" },
      { form: "par'ōh", language: "hébreu" },
      { form: "pharaō", language: "grec" },
      { form: "pharao", language: "latin" },
      { form: "pharaon · pharaoh", language: "français · anglais" },
    ],
    publications: [
      {
        network: "tiktok",
        url: "https://www.tiktok.com/@ethniafrica/photo/7692366804777274646",
        format: "carrousel",
        publishedAt: "2026-10-03",
      },
      {
        network: "instagram",
        url: "https://www.instagram.com/p/DeBtgAUiOYp/",
        format: "carrousel",
        publishedAt: "2026-10-03",
      },
    ],
    sources: { count: distinctSourceCount(accounts) },
  };
})();

// @req REQ-178
export const ANSWER_FIXTURES: Record<AnswerFixtureCase, AnswerFixture> = {
  peul: { query: "peul", answers: [peul] },
  nzebi: { query: "nzebi", answers: [nzebi] },
  bassa: { query: "bassa", answers: [bassa] },
  lingala: { query: "lingala", answers: [lingala] },
  bantou: { query: "bantou", answers: [bantou] },
  civ: { query: "côte d'ivoire", answers: [civ] },
  congo: {
    query: "congo",
    pageLead:
      "Deux États portent ce nom, de part et d'autre du même fleuve : la République du Congo, capitale Brazzaville, et la République démocratique du Congo, capitale Kinshasa.",
    answers: [congoRepublic, congoDemocratic],
  },
  camara: { query: "camara", answers: [camara] },
  pharaon: { query: "pharaon", answers: [], wordAnswers: [pharaon] },
};
