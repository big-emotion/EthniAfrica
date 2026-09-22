/**
 * Validate the versioned production history under `docs/productions/`.
 *
 *   npx tsx scripts/ci/checkProductionLedger.ts --selftest   fixtures only
 *   npx tsx scripts/ci/checkProductionLedger.ts               every ledger file
 *
 * One JSON file per subject, at `docs/productions/<typologie>/<NNN>-<slug>.json`.
 * The schema and the reasoning behind it are in
 * `docs/plans/production-history-plan.md` §2–3. This gate enforces what a
 * skill filling the file correctly can always get right the first time — it
 * is not a ratchet, unlike `check:dead` or `chronology-symmetry`: there is no
 * backlog to lower, only entries authored from now on.
 *
 * What it refuses: a schema violation, a duplicate or non-contiguous episode
 * number within a typology, a duplicate campaign, a subject id the corpus
 * does not hold, a `sitePath` that names no known route for that subject, and
 * a network × format pairing GABARITS §1 bis does not allow.
 *
 * What it does not refuse: a missing publication URL (recorded as
 * unpublished, not an error — the private ledger already tracks "publié,
 * URL non enregistrée" and losing that fact loses the publication), a missing
 * English `question`/`myth` (that is `check:translation-parity`'s report, not
 * this gate), and a subject with an empty `publications[]` (not yet posted).
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageRoute,
  getPatronymeRoute,
  getPeopleRoute,
} from "@/lib/routing";

import { corpusIdExists, type CorpusKind } from "../lib/afrikCorpusIds";
import {
  networkAcceptsFormat,
  type Network,
  type ProductionFormat,
} from "../lib/socialFormatMatrix";

const LEDGER_ROOT = path.join(__dirname, "../../docs/productions");

/** The five typologies name a corpus entity. `mot` is the one exception, added
 * by the operator on 2026-09-21 for « ethnie »: a word of the vocabulary that
 * the project cannot avoid using and that no corpus fiche carries. It is the
 * vocabulary exception allowing an empty `subjects[]` — see
 * `docs/productions/README.md`, "The mot exception". The project introduction
 * is separately recorded without an episode or a myth. */
const TYPOLOGIES = [
  "peuple",
  "pays",
  "patronyme",
  "lieu",
  "langue",
  "mot",
  "introduction",
] as const;
type Typologie = (typeof TYPOLOGIES)[number];

const NETWORKS: readonly Network[] = [
  "tiktok",
  "instagram",
  "facebook",
  "youtube",
  "linkedin",
  "x",
];
const FORMATS: readonly ProductionFormat[] = ["video", "carrousel", "texte"];

const CORPUS_KINDS = [
  "people",
  "country",
  "family",
  "language",
  "patronyme",
] as const;

/** `lieu` names no corpus table of its own — a toponym is always filed under
 * one of the other four (almost always `country`, sometimes `people`). This
 * is why `subjects[].kind` is never derived from `typologie`.
 *
 * Composed through `routing.ts`'s own helpers rather than a hardcoded segment
 * map — `routeLiteralCharter.test.ts` refuses a written-out `/fr/atlas/...`
 * anywhere but `routing.ts` itself, and a second segment table here would be
 * exactly the kind of copy that gate exists to catch. */
const ROUTE_FN_BY_KIND: Record<
  (typeof CORPUS_KINDS)[number],
  (id: string) => string
> = {
  people: (id) => getPeopleRoute("fr", id),
  country: (id) => getCountryRoute("fr", id),
  family: (id) => getFamilyRoute("fr", id),
  language: (id) => getLanguageRoute("fr", id),
  patronyme: (id) => getPatronymeRoute("fr", id),
};

export interface LedgerEntry {
  campaign: string;
  typologie: string;
  episode: number | null;
  question: { fr: string; en?: string };
  myth: { fr: string; en?: string } | null;
  narrativePattern?: string;
  subjects: Array<{
    kind: string;
    id: string;
    label: { fr: string; en?: string };
  }>;
  sitePath: string;
  publications: Array<{
    network: string;
    format: string;
    url?: string;
    publishedAt?: string;
  }>;
  poster?: { src: string; width: number; height: number };
  durationSeconds?: number;
  sources?: Array<{ title: string; url: string; tier: string }>;
}

export interface ValidationDeps {
  corpusIdExists: (kind: CorpusKind, id: string) => boolean;
  networkAcceptsFormat: (network: Network, format: ProductionFormat) => boolean;
}

const REAL_DEPS: ValidationDeps = { corpusIdExists, networkAcceptsFormat };

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "campaign",
  "typologie",
  "episode",
  "question",
  "myth",
  "narrativePattern",
  "subjects",
  "sitePath",
  "publications",
  "poster",
  "durationSeconds",
  "sources",
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates one already-parsed entry in isolation — no episode/campaign
 * uniqueness here, that needs the whole ledger (see `validateLedger`). */
export function validateEntry(
  entry: unknown,
  deps: ValidationDeps = REAL_DEPS
): string[] {
  const errors: string[] = [];
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return ["not a JSON object"];
  }
  const record = entry as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) errors.push(`unknown field "${key}"`);
  }

  if (typeof record.campaign !== "string" || !record.campaign) {
    errors.push("campaign must be a non-empty string");
  }

  if (!TYPOLOGIES.includes(record.typologie as Typologie)) {
    errors.push(`typologie must be one of ${TYPOLOGIES.join(", ")}`);
  }

  const isIntroduction = record.typologie === "introduction";
  if (isIntroduction) {
    if (record.episode !== null)
      errors.push("introduction episode must be null");
    if (record.myth !== null) errors.push("introduction myth must be null");
    if (!Array.isArray(record.subjects) || record.subjects.length !== 0) {
      errors.push("introduction subjects must be empty");
    }
    if (record.sitePath !== "/fr/about") {
      errors.push("introduction sitePath must be /fr/about");
    }
  } else if (
    !Number.isInteger(record.episode) ||
    (record.episode as number) < 1
  ) {
    errors.push("episode must be a positive integer");
  }

  // EthniAfrica never asserts an origin, it always poses one — see
  // docs/productions/README.md's "Never an assertion" section. `question`
  // and `myth` are the two fields a reader sees rendered close to verbatim,
  // so both must read as a question, not a stated fact, even a hedged one.
  for (const [field, label] of [
    ["question", "question"],
    ["myth", "myth"],
  ] as const) {
    if (isIntroduction && field === "myth") continue;
    const value = record[field] as { fr?: unknown; en?: unknown } | undefined;
    if (!value || typeof value.fr !== "string" || !value.fr.trim()) {
      errors.push(`${label}.fr must be a non-empty string`);
    } else if (!value.fr.trim().endsWith("?")) {
      errors.push(`${label}.fr must be phrased as a question, ending in "?"`);
    }
    if (value?.en !== undefined && typeof value.en !== "string") {
      errors.push(`${label}.en must be a string when present`);
    } else if (
      typeof value?.en === "string" &&
      value.en.trim() &&
      !value.en.trim().endsWith("?")
    ) {
      errors.push(`${label}.en must be phrased as a question, ending in "?"`);
    }
  }

  const subjects = record.subjects;
  const mayHaveNoSubject = record.typologie === "mot" || isIntroduction;
  if (
    !Array.isArray(subjects) ||
    (subjects.length === 0 && !mayHaveNoSubject)
  ) {
    errors.push("subjects must be a non-empty array");
  } else {
    subjects.forEach((subject, index) => {
      const kind = subject?.kind;
      const id = subject?.id;
      if (!CORPUS_KINDS.includes(kind)) {
        errors.push(
          `subjects[${index}].kind must be one of ${CORPUS_KINDS.join(", ")}`
        );
      } else if (typeof id !== "string" || !id) {
        errors.push(`subjects[${index}].id must be a non-empty string`);
      } else if (!deps.corpusIdExists(kind, id)) {
        errors.push(`subjects[${index}] — no ${kind} fiche carries id "${id}"`);
      }
      if (typeof subject?.label?.fr !== "string" || !subject.label.fr.trim()) {
        errors.push(`subjects[${index}].label.fr must be a non-empty string`);
      }
    });
  }

  if (
    typeof record.sitePath !== "string" ||
    !record.sitePath.startsWith("/fr/")
  ) {
    errors.push("sitePath must be a French route starting with /fr/");
  } else if (Array.isArray(subjects)) {
    const matchesAny = subjects.some((subject) => {
      const routeFor =
        ROUTE_FN_BY_KIND[subject?.kind as keyof typeof ROUTE_FN_BY_KIND];
      return (
        routeFor &&
        typeof subject?.id === "string" &&
        record.sitePath === routeFor(subject.id)
      );
    });
    if (subjects.length > 0 && !matchesAny) {
      errors.push(`sitePath "${record.sitePath}" matches no subject's route`);
    }
  }

  const publications = record.publications;
  if (!Array.isArray(publications)) {
    errors.push(
      "publications must be an array (empty when nothing is posted yet)"
    );
  } else {
    publications.forEach((publication, index) => {
      const network = publication?.network;
      const format = publication?.format;
      if (isIntroduction && format === "carrousel") {
        errors.push(
          `publications[${index}] — an introduction has no myth for a carousel`
        );
      }
      if (!NETWORKS.includes(network)) {
        errors.push(
          `publications[${index}].network must be one of ${NETWORKS.join(", ")}`
        );
      }
      if (!FORMATS.includes(format)) {
        errors.push(
          `publications[${index}].format must be one of ${FORMATS.join(", ")}`
        );
      }
      if (
        NETWORKS.includes(network) &&
        FORMATS.includes(format) &&
        !deps.networkAcceptsFormat(network, format)
      ) {
        errors.push(
          `publications[${index}] — ${network} does not receive ${format} (GABARITS §1 bis)`
        );
      }
      if (
        publication?.url !== undefined &&
        typeof publication.url !== "string"
      ) {
        errors.push(`publications[${index}].url must be a string when present`);
      }
      if (
        publication?.publishedAt !== undefined &&
        !ISO_DATE.test(publication.publishedAt)
      ) {
        errors.push(`publications[${index}].publishedAt must be YYYY-MM-DD`);
      }
    });
  }

  return errors;
}

export interface LedgerFile {
  filePath: string;
  entry: unknown;
}

export interface LedgerValidationResult {
  errorsByFile: Map<string, string[]>;
}

/** Validates the whole ledger together — this is where cross-file rules
 * (unique campaign, contiguous episode numbers per typologie) live, since a
 * single file cannot know about its siblings. */
export function validateLedger(
  files: LedgerFile[],
  deps: ValidationDeps = REAL_DEPS
): LedgerValidationResult {
  const errorsByFile = new Map<string, string[]>();
  const campaignSeenAt = new Map<string, string>();
  const episodesByTypologie = new Map<Typologie, Map<number, string>>();

  for (const { filePath, entry } of files) {
    const errors = validateEntry(entry, deps);
    const record =
      typeof entry === "object" && entry !== null
        ? (entry as Record<string, unknown>)
        : {};

    const campaign = record.campaign;
    if (typeof campaign === "string" && campaign) {
      const seenAt = campaignSeenAt.get(campaign);
      if (seenAt) {
        errors.push(`campaign "${campaign}" is also used by ${seenAt}`);
      } else {
        campaignSeenAt.set(campaign, filePath);
      }
    }

    const typologie = record.typologie as Typologie;
    const episode = record.episode;
    if (
      typologie !== "introduction" &&
      TYPOLOGIES.includes(typologie) &&
      Number.isInteger(episode)
    ) {
      const perTypologie = episodesByTypologie.get(typologie) ?? new Map();
      const existing = perTypologie.get(episode as number);
      if (existing) {
        errors.push(
          `episode ${episode} in "${typologie}" is also used by ${existing}`
        );
      } else {
        perTypologie.set(episode as number, filePath);
      }
      episodesByTypologie.set(typologie, perTypologie);
    }

    errorsByFile.set(filePath, errors);
  }

  for (const [typologie, perTypologie] of episodesByTypologie) {
    const episodes = [...perTypologie.keys()].sort((a, b) => a - b);
    episodes.forEach((episode, index) => {
      const expected = index + 1;
      if (episode !== expected) {
        const filePath = perTypologie.get(episode)!;
        const existing = errorsByFile.get(filePath) ?? [];
        existing.push(
          `episode ${episode} leaves a hole in "${typologie}" — expected ${expected} next`
        );
        errorsByFile.set(filePath, existing);
      }
    });
  }

  return { errorsByFile };
}

// ---------------------------------------------------------------------------
// --selftest: the fixtures below are written before the validation logic
// above ever ran, per this repository's test-first rule for infra scripts —
// see scripts/ci/checkLocalPaths.ts for the precedent this follows. A
// vitest `it()` file is not used here because a brand-new test file would
// need a fresh `@req` id from Confluence (lint:req), which this ledger has
// not been assigned yet; the CLI selftest carries the same rigor without one.
// ---------------------------------------------------------------------------

const STUB_DEPS: ValidationDeps = {
  corpusIdExists: (kind, id) =>
    (kind === "language" && id === "lin") ||
    (kind === "patronyme" && id === "PAT_TRAORE") ||
    (kind === "country" && id === "MWI") ||
    (kind === "people" && id === "PPL_WOLOF"),
  networkAcceptsFormat,
};

function validLingalaEntry(): LedgerEntry {
  return {
    campaign: "lingala",
    typologie: "langue",
    episode: 1,
    question: {
      fr: "D'où vient le nom lingala ?",
      en: "Where does the name Lingala come from?",
    },
    myth: { fr: "Le Lingala, un nom inventé par les colons belges ?", en: "" },
    narrativePattern: "une langue accusée d'invention coloniale",
    subjects: [
      { kind: "language", id: "lin", label: { fr: "Lingala", en: "Lingala" } },
    ],
    sitePath: getLanguageRoute("fr", "lin"),
    publications: [
      {
        network: "youtube",
        format: "video",
        url: "https://youtube.com/x",
        publishedAt: "2026-09-05",
      },
      { network: "instagram", format: "carrousel", publishedAt: "2026-09-05" },
    ],
  };
}

function validMotEntry(): LedgerEntry {
  return {
    campaign: "ethnie-d-ou-vient-le-mot",
    typologie: "mot",
    episode: 1,
    question: { fr: "D'où vient le nom ethnie ?" },
    myth: { fr: "Ethnie, un mot inventé par la colonisation ?" },
    subjects: [],
    sitePath: "/fr/about",
    publications: [],
  };
}

type Fixture = [string, unknown, boolean];

const introductionFixture = {
  campaign: "comprendre-afrique-noms",
  typologie: "introduction",
  episode: null,
  question: { fr: "Quelles histoires les noms ouvrent-ils ?" },
  myth: null,
  subjects: [],
  sitePath: "/fr/about",
  publications: [],
};

const FIXTURES: Fixture[] = [
  [
    "an unnumbered introduction without an invented myth",
    introductionFixture,
    false,
  ],
  [
    "an introduction cannot take an episode number",
    { ...introductionFixture, episode: 1 },
    true,
  ],
  [
    "an introduction explicitly records no episode",
    { ...introductionFixture, episode: undefined },
    true,
  ],
  [
    "an introduction cannot claim a myth",
    { ...introductionFixture, myth: { fr: "Un mythe ?" } },
    true,
  ],
  [
    "an introduction explicitly records no myth",
    { ...introductionFixture, myth: undefined },
    true,
  ],
  [
    "an introduction cannot become a corpus episode",
    { ...introductionFixture, subjects: validLingalaEntry().subjects },
    true,
  ],
  [
    "an introduction points to the project",
    { ...introductionFixture, sitePath: "/fr/unknown" },
    true,
  ],
  [
    "an introduction still needs a question",
    { ...introductionFixture, question: { fr: "A statement." } },
    true,
  ],
  [
    "an introduction still checks media distribution",
    {
      ...introductionFixture,
      publications: [{ network: "x", format: "carrousel" }],
    },
    true,
  ],
  [
    "historical episodes cannot omit their number",
    { ...validLingalaEntry(), episode: null },
    true,
  ],
  [
    "historical episodes cannot omit their myth",
    { ...validLingalaEntry(), myth: null },
    true,
  ],
  [
    "an introduction without a myth cannot register a carousel",
    {
      ...introductionFixture,
      publications: [{ network: "instagram", format: "carrousel" }],
    },
    true,
  ],
  ["a well-formed entry", validLingalaEntry(), false],
  [
    "a publication with no url yet",
    {
      ...validLingalaEntry(),
      publications: [{ network: "facebook", format: "video" }],
    },
    false,
  ],
  [
    "an unknown corpus id",
    {
      ...validLingalaEntry(),
      subjects: [
        { kind: "language", id: "not-a-real-language", label: { fr: "Faux" } },
      ],
    },
    true,
  ],
  // The 2026-09-21 revision of §1 bis: both formats go to every network, and
  // X alone refuses the carrousel because the platform has none.
  [
    "carousel sent to Facebook",
    {
      ...validLingalaEntry(),
      publications: [{ network: "facebook", format: "carrousel" }],
    },
    false,
  ],
  [
    "video sent to TikTok",
    {
      ...validLingalaEntry(),
      publications: [{ network: "tiktok", format: "video" }],
    },
    false,
  ],
  [
    "carousel sent to X, which has no carousel",
    {
      ...validLingalaEntry(),
      publications: [{ network: "x", format: "carrousel" }],
    },
    true,
  ],
  [
    "sitePath matching no subject",
    { ...validLingalaEntry(), sitePath: getCountryRoute("fr", "SEN") },
    true,
  ],
  [
    "unknown top-level field",
    { ...validLingalaEntry(), extra: "should not be here" },
    true,
  ],
  [
    "typologie outside the five and the mot exception",
    { ...validLingalaEntry(), typologie: "ville" },
    true,
  ],
  // `mot` is the operator's exception of 2026-09-21: a word names no corpus
  // fiche, so its numbered episodes allow an empty `subjects[]`.
  ["a mot entry with no subject", validMotEntry(), false],
  [
    "a langue entry with no subject",
    { ...validLingalaEntry(), subjects: [] },
    true,
  ],
  [
    "a mot entry still refuses a subject the corpus does not hold",
    {
      ...validMotEntry(),
      subjects: [
        { kind: "language", id: "not-a-real-language", label: { fr: "Faux" } },
      ],
    },
    true,
  ],
  [
    "a mot entry still refuses a non-French sitePath",
    { ...validMotEntry(), sitePath: "/en/about" },
    true,
  ],
  ["episode zero", { ...validLingalaEntry(), episode: 0 }, true],
  ["missing myth.fr", { ...validLingalaEntry(), myth: { fr: "" } }, true],
  [
    "myth stated as a flat assertion, not a question",
    {
      ...validLingalaEntry(),
      myth: { fr: "Le lingala a été inventé par les colons belges." },
    },
    true,
  ],
  [
    "question stated as a flat assertion, not a question",
    {
      ...validLingalaEntry(),
      question: { fr: "Le nom lingala vient des colons belges." },
    },
    true,
  ],
  [
    "myth.en present but stated as a flat assertion",
    {
      ...validLingalaEntry(),
      myth: {
        fr: "Le Lingala, un nom inventé par les colons belges ?",
        en: "Lingala was invented by Belgian colonists.",
      },
    },
    true,
  ],
  [
    "malformed publishedAt",
    {
      ...validLingalaEntry(),
      publications: [
        { network: "youtube", format: "video", publishedAt: "5 sept 2026" },
      ],
    },
    true,
  ],
];

function selftestEntries(): number {
  const failures: string[] = [];
  for (const [label, entry, shouldFail] of FIXTURES) {
    const errors = validateEntry(entry, STUB_DEPS);
    const failed = errors.length > 0;
    if (failed !== shouldFail) {
      failures.push(
        `  ${label}: expected ${shouldFail ? "a failure" : "no failure"}, got ${
          errors.length
        } error(s)${errors.length ? ` — ${errors.join("; ")}` : ""}`
      );
    }
  }

  const duplicateCampaign = validateLedger(
    [
      { filePath: "a.json", entry: validLingalaEntry() },
      { filePath: "b.json", entry: validLingalaEntry() },
    ],
    STUB_DEPS
  );
  if (
    ![...duplicateCampaign.errorsByFile.values()].some(
      (errs) => errs.length > 0
    )
  ) {
    failures.push(
      "  duplicate campaign across two files should have failed both"
    );
  }

  const withIntroduction = validateLedger(
    [
      { filePath: "intro.json", entry: introductionFixture },
      { filePath: "ep1.json", entry: validLingalaEntry() },
    ],
    STUB_DEPS
  );
  if (
    [...withIntroduction.errorsByFile.values()].some((errors) => errors.length)
  ) {
    failures.push("  an introduction must not affect episode numbering");
  }
  const repeatedIntroduction = validateLedger(
    [
      { filePath: "intro.json", entry: introductionFixture },
      { filePath: "duplicate.json", entry: introductionFixture },
    ],
    STUB_DEPS
  );
  if (
    !(repeatedIntroduction.errorsByFile.get("duplicate.json") ?? []).some(
      (error) => error.includes("campaign")
    )
  ) {
    failures.push("  duplicate introduction campaigns must still fail");
  }

  const episodeHole = validateLedger(
    [
      {
        filePath: "ep1.json",
        entry: { ...validLingalaEntry(), campaign: "a", episode: 1 },
      },
      {
        filePath: "ep3.json",
        entry: { ...validLingalaEntry(), campaign: "b", episode: 3 },
      },
    ],
    STUB_DEPS
  );
  if (
    !(episodeHole.errorsByFile.get("ep3.json") ?? []).some((e) =>
      e.includes("hole")
    )
  ) {
    failures.push(
      "  a hole in the episode sequence should have failed the later file"
    );
  }

  if (failures.length) {
    console.error(
      `✖ ${failures.length} cas sur ${FIXTURES.length + 4} :\n${failures.join("\n")}`
    );
    return 1;
  }
  console.log(`✔ ${FIXTURES.length + 4} cas de contrôle passent`);
  return 0;
}

// ---------------------------------------------------------------------------

function loadLedgerFiles(): LedgerFile[] {
  let typologyDirs: string[];
  try {
    typologyDirs = readdirSync(LEDGER_ROOT, { withFileTypes: true })
      .filter((entryDir) => entryDir.isDirectory())
      .map((entryDir) => entryDir.name);
  } catch {
    return [];
  }
  const files: LedgerFile[] = [];
  for (const dir of typologyDirs) {
    for (const name of readdirSync(path.join(LEDGER_ROOT, dir))) {
      if (!name.endsWith(".json")) continue;
      const filePath = path.join("docs/productions", dir, name);
      const raw = readFileSync(path.join(LEDGER_ROOT, dir, name), "utf8");
      try {
        files.push({ filePath, entry: JSON.parse(raw) });
      } catch (error) {
        files.push({ filePath, entry: { __parseError: String(error) } });
      }
    }
  }
  return files;
}

function main(): number {
  if (process.argv.includes("--selftest")) return selftestEntries();

  const files = loadLedgerFiles();
  const { errorsByFile } = validateLedger(files);
  const offences: string[] = [];
  for (const [filePath, errors] of errorsByFile) {
    for (const error of errors) offences.push(`${filePath}: ${error}`);
  }

  if (offences.length) {
    console.error(
      `\n✖ ${offences.length} problème(s) dans docs/productions/ :\n\n${offences.join("\n")}\n`
    );
    return 1;
  }
  console.log(`✔ ${files.length} fiche(s) de production valides`);
  return 0;
}

if (require.main === module) {
  process.exit(main());
}
