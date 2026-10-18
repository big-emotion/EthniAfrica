import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { parsePatronymeFile } from "@/lib/afrik/parsers/patronymeParser";
import type { PatronymeDossier } from "@/lib/afrik/parsers/patronymeTypes";
import {
  migratePatronymeOriginToNameHistory,
  type ReviewedOriginMerge,
} from "./migratePatronymeOriginToNameHistory";

const TRAORE_MERGES: ReviewedOriginMerge[] = [
  {
    originType: "oralTraditions",
    originIndex: 0,
    targetName: "Traoré",
    targetStatements: [
      "Le nom Traoré appartiendrait à la même branche paternelle",
    ],
    mergedStatement:
      "Les Mara appartiennent à la même branche paternelle que les Traoré : les deux noms ont un ancêtre commun, Mansa Yurukara Nayni, et sont de la même famille que les Sako et les Kouyaté. C'est ce que dit Babou Condé, griot de Fadama, dans la préfecture de Kouroussa en Guinée, selon le mémoire d'E. A. Bogacheva.",
  },
  {
    originType: "oralTraditions",
    originIndex: 1,
    targetName: "Traoré",
    targetStatements: [
      "Le nom Traoré est celui de deux frères chasseurs",
      "Le nom Diabaté serait né d'une séparation",
      "Le nom Traoré serait lié au nom Kondé",
    ],
  },
  {
    originType: "oralTraditions",
    originIndex: 2,
    targetName: "Traoré",
    targetStatements: ["Le nom Traoré est celui de Tiramaghan Traoré"],
    mergedStatement:
      "Tiramaghan Traoré, général de Soundiata, aurait vaincu le roi du Jolof puis conquis la Casamance et le Kaabu. Les Mandenka de l'Ouest le tiennent pour le fondateur de nombreux royaumes, dont le Kaabu, et les griots du Kaabu chantent sa geste à la kora ; il est donné comme l'ancêtre des Traoré. Les traditions ne s'accordent pas sur sa fin : plusieurs villages du Kaabu disent garder ses restes, tandis que des traditions du Gangaran le font revenir au Mali.",
  },
  {
    originType: "oralTraditions",
    originIndex: 3,
    targetName: "Traoré",
    targetStatements: ["Le nom Traoré est celui de chasseurs qui vivaient"],
    mergedStatement:
      "Avant l'empire du Mali, une partie des Traoré vit dans le pays de Kiri, mais la plupart habitent la province appelée plus tard Gangaran, au nord-ouest du Bouré. Ce sont des chasseurs du clan Traoré qui auraient donné en mariage au roi Maghan Kön Fatta la mère de Soundiata.",
  },
  {
    originType: "writtenChronicles",
    originIndex: 0,
    targetName: "Traoré",
    targetStatements: ["Le nom Traoré viendrait d'une formule"],
    mergedStatement:
      "Le nom viendrait d'une formule, « À taá dá wéele », que l'ouvrage ne traduit pas et qu'il rattache à l'appel lancé à l'ancêtre. Túraman, général du temps de Soundiata, avait quitté la guerre devenu vieux ; quand une guerre faillit perdre le Manden, on l'envoya chercher, il partit, vainquit les ennemis et ramena la paix. Les conteurs chantèrent ensuite ses descendants en rappelant que leur aïeul avait été appelé à cette guerre, et ceux-ci répondaient que, sans cet appel, le Manden était perdu. Ainsi la lignée prit le nom de Tárawele, et le nom de l'ancêtre, Túraman, devint son jamu. Le même ouvrage, écrit en n'ko par Souleymane Kanté, divise les Tárawele en quatre branches, Dàamasí, Nàyité, Sídimɛ et Jàbaatɛ́, et rapporte aussi qu'on les dit descendants de Lònsanín ; son auteur ajoute qu'il ne croit pas à une origine arabe.",
  },
  {
    originType: "linguisticReconstructions",
    originIndex: 0,
    targetName: "Traoré",
    targetStatements: ["Le nom Traoré est la graphie française"],
    mergedStatement:
      "Aucun dictionnaire consulté ne donne de sens au mot : le dictionnaire des noms de clan mandingues l'écrit Tàrawéle, avec les variantes Traore et Taraore, et le définit seulement comme un nom de clan. Traoré en est la graphie française.",
  },
  {
    originType: "linguisticReconstructions",
    originIndex: 2,
    targetName: "Traoré",
    targetStatements: [
      "Le nom Traoré a des équivalents chez des peuples voisins",
    ],
    mergedStatement:
      "Le nom a des équivalents chez d'autres peuples : en pays wolof, un Traoré est reçu comme un frère par les Diop et peut prendre leur nom, et un Diop peut devenir Traoré chez les Mandenka. La tradition fait remonter ces correspondances entre noms de clan à l'assemblée tenue après la victoire de Soundiata, à qui l'on prête aussi des faits bien postérieurs ; la pratique s'est poursuivie après lui.",
  },
];

const PERIOD_MERGE_CANDIDATES: Array<
  [
    string,
    ReviewedOriginMerge["originType"],
    number,
    string,
    string,
    string?,
    string?,
  ]
> = [
  [
    "PAT_ADEWUSI",
    "linguisticReconstructions",
    0,
    "Adewusi",
    "Origine non datée",
  ],
  [
    "PAT_AL_MIRGHANI",
    "writtenChronicles",
    0,
    "al-Mirghani",
    "Rapporté en 1988",
  ],
  [
    "PAT_AMACHREE",
    "linguisticReconstructions",
    0,
    "Amachree",
    "Origine non datée",
  ],
  [
    "PAT_BALOGUN",
    "linguisticReconstructions",
    0,
    "Balogun",
    "Origine non datée",
  ],
  [
    "PAT_BANGOURA",
    "linguisticReconstructions",
    0,
    "Bangoura",
    "Proposé en 1907",
    "Le nom Bangoura pourrait vouloir dire",
  ],
  [
    "PAT_BANGOURA",
    "linguisticReconstructions",
    1,
    "Bangoura",
    "Proposé en 1907",
    "Le nom Bangoura serait le nom que les Soso",
  ],
  [
    "PAT_BAGAYOKO",
    "oralTraditions",
    0,
    "Bagayoko",
    "Recueilli en 1997, publié en 2004",
  ],
  ["PAT_CAMARA", "oralTraditions", 0, "Camara", "Recueilli en 2017"],
  ["PAT_CAMARA", "oralTraditions", 5, "Camara", "Rapporté en 1959"],
  [
    "PAT_CAMARA",
    "writtenChronicles",
    0,
    "Camara",
    "Origine non datée",
    "Le nom Camara viendrait d'un ordre donné",
  ],
  ["PAT_CAMARA", "linguisticReconstructions", 2, "Camara", "Proposé en 1970"],
  [
    "PAT_COULIBALY",
    "linguisticReconstructions",
    0,
    "Kulibali",
    "Entrée de dictionnaire datée de 2014",
  ],
  [
    "PAT_COULIBALY",
    "linguisticReconstructions",
    3,
    "Coulibaly",
    "Proposée en 2017",
    "Le nom Coulibaly viendrait, par ses formes Kudubali",
  ],
  [
    "PAT_DEMBELE",
    "oralTraditions",
    0,
    "Dembélé",
    "Écrit en 2002, cité en 2007",
  ],
  [
    "PAT_DEMBELE",
    "linguisticReconstructions",
    1,
    "Dembélé",
    "Notée en 1959, rapportée en 2017",
  ],
  [
    "PAT_DEMBELE",
    "linguisticReconstructions",
    2,
    "Dembélé",
    "Proposée en 2017",
  ],
  ["PAT_DIALLO", "writtenChronicles", 2, "Diallo", "Rapporté en 2006"],
  ["PAT_DIALLO", "writtenChronicles", 3, "Diallo", "Rapporté en 2011"],
  ["PAT_DIARRA", "oralTraditions", 0, "Diarra", "Récit publié en 1960"],
  [
    "PAT_EKUIKUI",
    "writtenChronicles",
    0,
    "Ekuikui",
    "Écrit entre 1903 et les années 1930",
    "Le nom Ekuikui voudrait dire",
  ],
  [
    "PAT_FFUMBE",
    "oralTraditions",
    0,
    "Ffumbe",
    "Au temps du roi Kintu, selon le récit du clan",
    undefined,
    "https://archive.org/details/bagandaaccountof00roscuoft",
  ],
  [
    "PAT_GHEBREMICHAEL_PATRONYMIC",
    "linguisticReconstructions",
    0,
    "Ghebremichael",
    "Sens donné en 1987",
  ],
  [
    "PAT_KALALA",
    "writtenChronicles",
    0,
    "Kalala",
    "Tradition luba, notice non datée",
  ],
  [
    "PAT_KHATTABI",
    "writtenChronicles",
    0,
    "Khattabi",
    "Proposé en 1965",
    "Le nom Khattabi viendrait du clan Ait Khattab",
  ],
  [
    "PAT_KONATE",
    "oralTraditions",
    0,
    "Konaté",
    "Origine non datée",
    "Le nom Konaté viendrait de « kona tè »",
  ],
  [
    "PAT_KONATE",
    "oralTraditions",
    2,
    "Konaté",
    "Temps de Soundiata, selon l'épopée",
  ],
  [
    "PAT_KONATE",
    "writtenChronicles",
    0,
    "Konaté",
    "Origine non datée",
    "Le nom Konaté viendrait de « kòna tɛ̀ móso »",
  ],
  [
    "PAT_KONATE",
    "linguisticReconstructions",
    0,
    "Konaté",
    "Usage contemporain",
  ],
  [
    "PAT_KOUADIO",
    "linguisticReconstructions",
    0,
    "Kouadio",
    "Usage contemporain",
    "Le nom Kouadio est un nom de jour",
  ],
  [
    "PAT_KOUAKOU",
    "linguisticReconstructions",
    0,
    "Kouakou",
    "Usage contemporain",
    "Le nom Kouakou est un nom de jour",
  ],
  [
    "PAT_KOUAME",
    "linguisticReconstructions",
    0,
    "Kouamé",
    "Usage contemporain",
    "Le nom Kouamé est un nom de jour",
  ],
  [
    "PAT_KOUASSI",
    "linguisticReconstructions",
    0,
    "Kouassi",
    "Constaté en 1968",
  ],
  ["PAT_KOFI", "linguisticReconstructions", 0, "Kofi", "Décrit en 1881"],
  ["PAT_KWAME", "linguisticReconstructions", 0, "Kwame", "Décrit en 1881"],
  [
    "PAT_LUGAVE",
    "oralTraditions",
    0,
    "Lugave",
    "Arrivée de Kintu, selon les traditions",
  ],
  [
    "PAT_MAGHRAWA",
    "writtenChronicles",
    1,
    "Maghrawa",
    "Du VIIe au XIe siècle, selon un article de 2024",
  ],
  [
    "PAT_MAHAMADOU",
    "linguisticReconstructions",
    0,
    "Mahamadou",
    "Usage contemporain",
    "Le nom Mahamadou est un prénom que l'on rapproche",
  ],
  [
    "PAT_MAIGA",
    "writtenChronicles",
    0,
    "Maïga",
    "Récit d'une chronique de Tombouctou",
  ],
  [
    "PAT_MAREGA",
    "linguisticReconstructions",
    0,
    "Marega",
    "Liste publiée en 2007",
  ],
  ["PAT_MBUYI", "linguisticReconstructions", 0, "Mbuyi", "Décrit en 2023"],
  ["PAT_MKAPA", "writtenChronicles", 0, "Mkapa", "Dit en 2018"],
  ["PAT_MOKOENA", "linguisticReconstructions", 0, "Mokoena", "Décrit en 2016"],
  ["PAT_MOYO", "linguisticReconstructions", 0, "Moyo", "Origine non datée"],
  [
    "PAT_MREMA",
    "linguisticReconstructions",
    0,
    "Mrema",
    "Proposé en 2020",
    "Le nom Mrema viendrait du verbe chagga rema",
  ],
  ["PAT_MTHETHWA", "writtenChronicles", 0, "Mthethwa", "Vers 1808"],
  [
    "PAT_MWAIPOPO",
    "linguisticReconstructions",
    0,
    "Mwaipopo",
    "Proposé en 2018",
  ],
  ["PAT_MWALE", "linguisticReconstructions", 0, "Mwale", "Proposée en 1906"],
  [
    "PAT_NACOULMA",
    "writtenChronicles",
    0,
    "Nacoulma",
    "Raconté en 2025",
    "Le nom Nacoulma viendrait des mots « pagba naa coula mam »",
  ],
  ["PAT_NKRUMAH", "linguisticReconstructions", 0, "Nkrumah", "Cité en 1973"],
  ["PAT_NZINGA", "historicalSyntheses", 1, "Nzinga", "1506"],
  ["PAT_NZINGA", "historicalSyntheses", 2, "Njinga", "Décrit en 2014"],
  ["PAT_NZUZI", "linguisticReconstructions", 0, "Nzuzi", "Décrit en 1977"],
  [
    "PAT_N_GUESSAN",
    "linguisticReconstructions",
    0,
    "N'Guessan",
    "Usage contemporain",
  ],
  ["PAT_SOUMAH", "writtenChronicles", 0, "Soumah", "Décrit en 1907"],
  ["PAT_SYLLA", "historicalSyntheses", 0, "Sylla", "Proposé en 1985"],
  ["PAT_SYLLA", "historicalSyntheses", 1, "Sylla", "Décrit en 1985"],
  ["PAT_TAPSOBA", "writtenChronicles", 0, "Tapsoba", "Origine non datée"],
  [
    "PAT_TETTEH",
    "linguisticReconstructions",
    0,
    "Tetteh",
    "Usage contemporain",
  ],
  ["PAT_TSIARASO", "writtenChronicles", 0, "Tsiaraso", "Décrit en 1997"],
  ["PAT_TUBMAN", "writtenChronicles", 0, "Tubman", "Milieu du XXe siècle"],
  ["PAT_WABERI", "writtenChronicles", 0, "Waberi", "2020"],
  ["PAT_WEAH", "writtenChronicles", 0, "Weah", "Ville relevée en 1812"],
  [
    "PAT_WOLDE_MARIAM_PATRONYMIC",
    "linguisticReconstructions",
    0,
    "Wolde Mariam",
    "Proposé en 1987",
  ],
  ["PAT_YAO", "linguisticReconstructions", 0, "Yao", "Constaté en 1968"],
  [
    "PAT_YAO",
    "linguisticReconstructions",
    1,
    "Yaw",
    "Usage contemporain",
    "Le nom Yaw est donné chez les Akan du Ghana",
  ],
  [
    "PAT_YOHANNES",
    "linguisticReconstructions",
    0,
    "Yohannes",
    "Usage contemporain",
  ],
  ["PAT_YUSUF", "writtenChronicles", 0, "Youssouf", "2017"],
  ["PAT_YUSUF", "linguisticReconstructions", 0, "Yusufu", "Décrit en 1981"],
  [
    "PAT_MAHLANGU",
    "writtenChronicles",
    0,
    "Mahlangu",
    "Vers le milieu du XVIIIe siècle, selon un récit publié par South African History Online",
    "Le nom Mahlangu est celui du fils de Sindeni",
  ],
  ["PAT_MAMBA", "linguisticReconstructions", 0, "Mamba", "Proposé en 2002"],
  [
    "PAT_MANDELA",
    "historicalSyntheses",
    0,
    "Mandela",
    "Raconté en 1994",
    "Le nom Mandela est celui du grand-père",
  ],
  [
    "PAT_MANIRAKIZA",
    "linguisticReconstructions",
    0,
    "Manirakiza",
    "Écrit en 2005",
  ],
  [
    "PAT_MANIRAKIZA",
    "linguisticReconstructions",
    1,
    "Manirakiza",
    "Écrit en 2009",
  ],
  ["PAT_MBAPPE", "oralTraditions", 0, "Mbappé", "Rapporté en 1945"],
  ["PAT_MBAPPE", "writtenChronicles", 2, "Mbappé", "Rapporté en 1945"],
  ["PAT_MODISE", "linguisticReconstructions", 0, "Modise", "Décrit en 2019"],
  ["PAT_MUKASA", "oralTraditions", 0, "Mukasa", "Proposée en 1911"],
  ["PAT_MVONDO", "oralTraditions", 0, "Mvondo", "Rapportée en 2015"],
  [
    "PAT_NDIKUMANA",
    "linguisticReconstructions",
    0,
    "Ndikumana",
    "Décrit en 2009",
    "Le nom Ndikumana se comprend en kirundi",
    "https://yorkspace.library.yorku.ca/items/9b20b57a-99b6-45b0-a212-95dfe823c88c",
  ],
  [
    "PAT_NDIKUMANA",
    "historicalSyntheses",
    1,
    "Ndikumana",
    "Décrit en 2009",
    "Le nom Ndikumana est de ceux que l'on donne à l'enfant",
    "https://yorkspace.library.yorku.ca/items/9b20b57a-99b6-45b0-a212-95dfe823c88c",
  ],
  [
    "PAT_NDLOVU",
    "writtenChronicles",
    0,
    "Ndlovu",
    "Proposée en 1929",
    "Le nom Ndlovu viendrait d'un homme, Ndlovu",
  ],
  ["PAT_NDONG", "oralTraditions", 0, "Ndong", "Rapporté en 2006"],
  [
    "PAT_NDONG",
    "linguisticReconstructions",
    1,
    "Ndong",
    "Proposé en 2006",
    "Le nom Ndong pourrait aussi être commun",
  ],
  [
    "PAT_NDUWIMANA",
    "historicalSyntheses",
    0,
    "Nduwimana",
    "Décrit en 2008",
    "Le nom Nduwimana est un nom individuel",
    "https://www.tehrantimes.com/news/165386/In-Burundi-names-speak-volumes",
  ],
  ["PAT_NGOLA", "historicalSyntheses", 2, "Ngola", "XVIIe siècle"],
  [
    "PAT_NJAZA",
    "oralTraditions",
    0,
    "Njaza",
    "Arrivée de Kintu, selon les traditions",
  ],
  [
    "PAT_NXUMALO",
    "linguisticReconstructions",
    2,
    "Nxumalo",
    "Rapportée en 1929",
  ],
  [
    "PAT_NYERERE",
    "historicalSyntheses",
    0,
    "Nyerere",
    "1860, selon un récit publié en 2014",
  ],
  [
    "PAT_OBAME",
    "linguisticReconstructions",
    0,
    "Obame",
    "Proposé en 2006",
    "Le nom Obame viendrait du mot fang obam",
  ],
  [
    "PAT_ODHIAMBO",
    "linguisticReconstructions",
    0,
    "Odhiambo",
    "Décrit en 2022",
    "Le nom Odhiambo désigne chez les Luo",
  ],
  [
    "PAT_OKORO",
    "linguisticReconstructions",
    0,
    "Okoro",
    "Proposé en 2003, repris en 2006",
  ],
  [
    "PAT_SACKO",
    "linguisticReconstructions",
    0,
    "Sacko",
    "Usage contemporain",
    "Le nom Sacko désigne un clan soninké",
  ],
  ["PAT_SANGARE", "oralTraditions", 0, "Sangaré", "Récit recueilli en 2017"],
  [
    "PAT_SANGARE",
    "writtenChronicles",
    0,
    "Sangaré",
    "Origine non datée",
    "Le nom Sangaré descendrait",
  ],
  [
    "PAT_SANGARE",
    "linguisticReconstructions",
    0,
    "Sangaré",
    "Usage contemporain",
  ],
  ["PAT_SANOGO", "writtenChronicles", 0, "Sanogo", "Décrit en 2009"],
  [
    "PAT_SISSOKO",
    "oralTraditions",
    0,
    "Sissoko",
    "Temps de Soundiata, selon l'épopée",
  ],
  ["PAT_SISSOKO", "oralTraditions", 1, "Sissoko", "Rapporté en 1959"],
  [
    "PAT_SISSOKO",
    "linguisticReconstructions",
    1,
    "Sissoko",
    "Usage contemporain",
    "Le nom Sissoko est un nom de clan que le dictionnaire",
  ],
  [
    "PAT_SOUMAH",
    "linguisticReconstructions",
    1,
    "Soumah",
    "Usage contemporain",
  ],
  ["PAT_SOUMARE", "linguisticReconstructions", 0, "Soumaré", "Proposé en 2019"],
  ["PAT_TAIWO", "linguisticReconstructions", 0, "Taiwo", "Origine non datée"],
  [
    "PAT_TOURE",
    "linguisticReconstructions",
    0,
    "Touré",
    "Proposé en 1984",
    "Le nom Touré serait celui de l'un des plus anciens clans",
    "https://unesdoc.unesco.org/ark:/48223/pf0000184313",
  ],
  [
    "PAT_TOURE",
    "linguisticReconstructions",
    6,
    "Touré",
    "Usage contemporain",
    "Le nom Touré est un nom de clan que le dictionnaire",
  ],
  ["PAT_ZADI", "linguisticReconstructions", 0, "Zadi", "Proposée en 2021"],
];

const PERIOD_MERGES_BY_FILE = new Map<string, ReviewedOriginMerge[]>();
for (const [
  id,
  originType,
  originIndex,
  targetName,
  targetPeriod,
  targetStatementPrefix,
  targetSourceUrl,
] of PERIOD_MERGE_CANDIDATES) {
  const rules = PERIOD_MERGES_BY_FILE.get(id) ?? [];
  rules.push({
    originType,
    originIndex,
    targetName,
    targetPeriod,
    targetStatementPrefix,
    targetSourceUrl,
  });
  PERIOD_MERGES_BY_FILE.set(id, rules);
}

function accountCount(dossier: PatronymeDossier): number {
  const origin = dossier.origin as Partial<PatronymeDossier["origin"]>;
  return (
    (origin.oralTraditions?.length ?? 0) +
    (origin.writtenChronicles?.length ?? 0) +
    (origin.historicalSyntheses?.length ?? 0) +
    (origin.linguisticReconstructions?.length ?? 0)
  );
}

function indentOf(text: string): string {
  return text.match(/\n([ \t]+)"/)?.[1] ?? "  ";
}

async function main() {
  const apply = process.argv.includes("--apply");
  const directory = path.resolve("dataset/source/afrik/patronymes");
  const entries = (await readdir(directory))
    .filter((name) => /^PAT_.*\.json$/.test(name))
    .sort();
  let filesChanged = 0;
  let accountsMoved = 0;
  let accountsMerged = 0;

  for (const entry of entries) {
    const filePath = path.join(directory, entry);
    const original = await readFile(filePath, "utf8");
    const dossier = JSON.parse(original) as PatronymeDossier;
    const count = accountCount(dossier);
    const hasHistoryAccounts =
      dossier.nameHistory?.names.some((name) => name.accounts.length > 0) ??
      false;
    const hasStaleOriginGap = dossier.gaps.some(
      (gap) => gap.fieldPath === "origin"
    );
    if (count === 0 && !(hasHistoryAccounts && hasStaleOriginGap)) continue;
    const merges = [
      ...(dossier.id === "PAT_TRAORE" ? TRAORE_MERGES : []),
      ...(PERIOD_MERGES_BY_FILE.get(dossier.id) ?? []),
    ];
    const migrated = migratePatronymeOriginToNameHistory(dossier, merges);
    const parsed = parsePatronymeFile(migrated);
    if (!parsed.success) {
      throw new Error(`${entry}: ${parsed.errors.join("; ")}`);
    }
    const next = `${JSON.stringify(migrated, null, indentOf(original))}\n`;
    if (next === original) continue;
    filesChanged += 1;
    accountsMoved += count;
    accountsMerged += merges.length;
    if (apply) await writeFile(filePath, next, "utf8");
  }

  console.log(
    `${apply ? "Updated" : "Would update"} ${filesChanged} patronyme files; ` +
      `${accountsMoved} origin accounts; ${accountsMerged} reviewed mappings.`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
