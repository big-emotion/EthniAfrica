/**
 * Gives fiche sources their `source_kind` from explicit, reviewable rules.
 *
 * Readers see a source's type, never its tier (doctrine §1.1), so a source
 * without a kind reads « Type non précisé ». The rules below are the whole
 * method: a URL host the table names, a national statistics or government
 * domain shape, a university domain, or — for a citation without a URL — a
 * title pattern. Nothing is inferred from the tier: the tier says how much
 * authority a citation carries, the kind says what it is, and the two axes are
 * kept apart (src/types/sources.ts).
 *
 * A source no rule names is never guessed: it stays without a kind and is
 * listed in the review file for a person to rule on. Some hosts are named on
 * purpose with no kind ("held"): the kind depends on the work behind the page
 * (archive.org scans dictionaries and travel journals alike). A person types
 * such a page by reading its work, in `WORK_RULINGS`; a page nobody has ruled
 * on stays held. Writing `unknown` instead would say the same thing to the
 * reader while hiding the gap from the coverage ratchet.
 *
 * Only `source_kind` keys are added, right after `tier`, at the fiche's own
 * indentation; tiers, URLs and text are never touched, and a typed source —
 * `ai_generated` included — is never re-typed.
 *
 * Usage:
 *   npx tsx scripts/afrik/classifySourceKinds.ts            # dry run: counts per kind and rule
 *   npx tsx scripts/afrik/classifySourceKinds.ts --apply    # writes fiches and the review file
 */
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import * as prettier from "prettier";

import type { SourceKind } from "@/types/sources";

import { WORK_RULINGS } from "./sourceKindWorkRulings";
import { readCorpusFiches } from "./sourceTierRulings";

const DEFAULT_DATASET_ROOT = "dataset/source/afrik";
export const SOURCE_KIND_REVIEW_FILE =
  "docs/editorial/source-review/source-kind-review.json";

interface HostRule {
  id: string;
  /** `null` holds the host on purpose: listed for review with `reason`. */
  kind: SourceKind | null;
  /** A host matches a domain when it equals it or is a subdomain of it. */
  domains: string[];
  reason?: string;
}

interface PatternRule {
  id: string;
  /** `null` holds the match on purpose, as in `HOST_RULES`. */
  kind: SourceKind | null;
  pattern: RegExp;
}

/**
 * Explicit domains. When several match, the longest domain wins, so an
 * exception is written as a more specific domain (daily.jstor.org is a
 * magazine, jstor.org is not) rather than as a rule order to remember.
 * Where the corpus already typed a host, the table follows that precedent.
 */
export const HOST_RULES: HostRule[] = [
  {
    id: "linguistic-reference",
    kind: "linguistic_reference",
    domains: [
      "ethnologue.com",
      "glottolog.org",
      "sil.org",
      "silcam.org",
      "sil-burkina.org",
      "omniglot.com",
      "wals.info",
      "clld.org",
      "phoible.org",
      "scriptsource.org",
      "webonary.org",
      "endangeredlanguages.com",
      "cormand.huma-num.fr",
      "bamadaba.coastsystems.net",
      "cnrtl.fr",
      "dictionnaire-academie.fr",
      "larousse.fr",
      "oed.com",
      "dsae.co.za",
      "dictionary.ankataa.com",
    ],
  },
  {
    id: "intergovernmental",
    kind: "intergovernmental",
    domains: [
      "un.org",
      "unesco.org",
      "unfpa.org",
      "unicef.org",
      "undp.org",
      "unep.org",
      "unhcr.org",
      "refworld.org",
      "worldbank.org",
      "fao.org",
      "ilo.org",
      "oecd.org",
      "paris21.org",
      "peaceau.org",
      "euaa.europa.eu",
    ],
  },
  {
    id: "official-statistics",
    kind: "official_statistics",
    domains: [
      "statssa.gov.za",
      "knbs.or.ke",
      "ubos.org",
      "statsghana.gov.gh",
      "ess.gov.et",
      "csa.gov.et",
      "ansd.sn",
      "ine.gov.mz",
      "hcp.ma",
      "nsa.org.na",
      "instat.mg",
      "nbs.go.tz",
      "zimstat.co.zw",
      "statistics.gov.rw",
      "statsbots.org.bw",
      "lisgis.gov.lr",
      "stat-guinee.org",
      "statistics.sl",
      "zamstats.gov.zm",
      "isteebu.bi",
      "insee.fr",
      "ibge.gov.br",
      "dane.gov.co",
      "dhsprogram.com",
    ],
  },
  {
    id: "government",
    kind: "government",
    domains: [
      "countrystudies.us",
      "govmu.org",
      "seylii.org",
      "presidence.dj",
      "presidence.cd",
      "mairieyamoussoukro.ci",
      "landinfo.no",
      "api.parliament.uk",
      "ambacongo-us.org",
      "southsudanembassy.be",
      "mozambiquehighcommission.org.uk",
      "consuladoguineabissaumalaga.com",
      "pdfcoffee.com",
    ],
  },
  {
    id: "academic",
    kind: "academic",
    domains: [
      "doi.org",
      "hdl.handle.net",
      "jstor.org",
      "persee.fr",
      "cairn.info",
      "openedition.org",
      "erudit.org",
      "redalyc.org",
      "scielo.org.za",
      "scielo.br",
      "scielo.pt",
      "ajol.info",
      "journals.co.za",
      "dergipark.org.tr",
      "jstage.jst.go.jp",
      "cambridge.org",
      "oup.com",
      "brill.com",
      "degruyterbrill.com",
      "benjamins.com",
      "jbe-platform.com",
      "tandfonline.com",
      "taylorfrancis.com",
      "sagepub.com",
      "springer.com",
      "sciencedirect.com",
      "journals.uchicago.edu",
      "langsci-press.org",
      "lingref.com",
      "ling.auf.net",
      "books.openbookpublishers.com",
      "universitypressscholarship.com",
      "scholarlypublishingcollective.org",
      "iupress.org",
      "nature.com",
      "science.org",
      "pnas.org",
      "biomedcentral.com",
      "biorxiv.org",
      "ncbi.nlm.nih.gov",
      "academia.edu",
      "researchgate.net",
      "semanticscholar.org",
      "core.ac.uk",
      "hal.science",
      "theses.fr",
      "ird.fr",
      "cnrs.fr",
      "eric.ed.gov",
      "apics-online.info",
      "webpulaaku.site",
      "ouvroir.fr",
      "koeppe.de",
      "pasteur.fr",
      "aequatoria.be",
      "metmuseum.org",
      "scholarlypublications.universiteitleiden.nl",
      "ascleiden.nl",
      "ugent.be",
      "uva.nl",
      "nai.uu.se",
      "ethz.ch",
      "uni-hamburg.de",
      "uni-koeln.de",
      "uni-mainz.de",
      "uned.es",
      "up.pt",
      "carleton.ca",
      "ucalgary.ca",
      "mun.ca",
      "ubc.ca",
      "mcgill.ca",
      "uqam.ca",
      "ulaval.ca",
      "unza.zm",
      "asjp.cerist.dz",
      "revues.imist.ma",
      "acaref.net",
      "glossa-journal.org",
      "lddjournal.org",
      "onomajournal.org",
      "journalofwestafricanlanguages.org",
      "journal.oraltradition.org",
      "revue-akofena.com",
      "revue-slc.org",
      "njas.fi",
      "jolr.ru",
      "scirp.org",
      "rsisinternational.org",
      "iosrjournals.org",
      "sciencepublishinggroup.com",
    ],
  },
  {
    id: "press",
    kind: "press",
    domains: [
      "daily.jstor.org",
      "bbc.com",
      "bbc.co.uk",
      "lemonde.fr",
      "jeuneafrique.com",
      "tv5monde.com",
      "aljazeera.com",
      "reuters.com",
      "nytimes.com",
      "latimes.com",
      "bostonglobe.com",
      "time.com",
      "nbcnews.com",
      "npr.org",
      "voanews.com",
      "dw.com",
      "english.elpais.com",
      "english.news.cn",
      "dailysabah.com",
      "allafrica.com",
      "africanews.com",
      "theconversation.com",
      "thenewhumanitarian.org",
      "justiceinfo.net",
      "globalvoices.org",
      "globalpressjournal.com",
      "newlinesmag.com",
      "smithsonianmag.com",
      "nationalgeographic.com",
      "historytoday.com",
      "modernghana.com",
      "ghanaweb.com",
      "myjoyonline.com",
      "citinewsroom.com",
      "gbcghanaonline.com",
      "premiumtimesng.com",
      "guardian.ng",
      "blueprint.ng",
      "triumphnewspapers.ng",
      "tuko.co.ke",
      "lefaso.net",
      "seneweb.com",
      "ndarinfo.com",
      "abidjan.net",
      "lebanco.net",
      "ivoire225.com",
      "ladepechedabidjan.info",
      "cameroon-tribune.cm",
      "camer.be",
      "togofirst.com",
      "namibian.com.na",
      "namibiansun.com",
      "frontpageafricaonline.com",
      "mwnation.com",
      "nation.sc",
      "moroccoworldnews.com",
      "yabiladi.com",
      "zehabesha.com",
      "ethiopia-insight.com",
      "dubawa.org",
      "factchecknews.com.ng",
      "en-attendant-nadeau.fr",
    ],
  },
  {
    id: "archive",
    kind: "archive",
    domains: ["gutenberg.org", "mpi.nl", "bvpb.mcu.es"],
  },
  {
    id: "repository",
    kind: "repository",
    domains: [
      "catalogue.bnf.fr",
      "idref.fr",
      "searchworks.stanford.edu",
      "datashare.ed.ac.uk",
      "zenodo.org",
      "sahistory.org.za",
      "nigeriareposit.nln.gov.ng",
    ],
  },
  {
    id: "community",
    kind: "community",
    domains: [
      "wikipedia.org",
      "wiktionary.org",
      "wikidata.org",
      "wikimedia.org",
      "kiddle.co",
      "justapedia.org",
      "behindthename.com",
      "yorubaname.com",
      "soninkara.com",
      "rezoivoire.net",
      "bugandaheritage.org.uk",
      "buganda.or.ug",
      "bunyoro-kitara.org",
    ],
  },
  {
    id: "held:work-dependent",
    kind: null,
    reason:
      "The host serves many kinds of work (a dictionary, a travel journal, a report); the kind is the work's, so a person reads the title.",
    domains: [
      "archive.org",
      "wikisource.org",
      "si.edu",
      "books.google.com",
      "loc.gov",
      "gallica.bnf.fr",
      "scribd.com",
      "dokumen.pub",
      "calameo.com",
      "sites.google.com",
      "github.com",
      "familysearch.org",
      "mjp.univ-perp.fr",
    ],
  },
  {
    // Wikipedia stays `community`: its readers write it, nobody edits it as
    // a publisher does.
    id: "encyclopedia",
    kind: "encyclopedia",
    domains: [
      "britannica.com",
      "encyclopedia.com",
      "ebsco.com",
      "universalis.fr",
      "worldhistory.org",
      "encyclopaediaafricana.com",
      "scencyclopedia.org",
      "georgiaencyclopedia.org",
      "anthroencyclopedia.com",
      "chalochatu.org",
      "encyclopedia.adventist.org",
    ],
  },
  {
    id: "ngo",
    kind: "ngo",
    domains: [
      "minorityrights.org",
      "iwgia.org",
      "culturalsurvival.org",
      "survivalinternational.org",
      "hrw.org",
      "forestpeoples.org",
      "iied.org",
      "c-r.org",
      "cfr.org",
      "issafrica.org",
      "accord.org.za",
      "brookings.edu",
      "citizenshiprightsafrica.org",
    ],
  },
  {
    id: "missionary-database",
    kind: "missionary_database",
    domains: [
      "joshuaproject.net",
      "peoplegroups.org",
      "imb.org",
      "prayafrica.org",
      "globalrecordings.net",
      "wycliffe.org",
      "scriptureearth.org",
      "map.swordshare.com",
      "hornofafrica.org",
      "tanzaniascripture.com",
      "ethiopiascripture.org",
      "worldmap.org",
      "globalprn.com",
      "missioninfobank.org",
      "madmissions.com",
    ],
  },
];

/** Domain shapes, tried in order once no explicit domain matched. */
export const HOST_PATTERN_RULES: PatternRule[] = [
  {
    id: "intergovernmental-int",
    kind: "intergovernmental",
    pattern: /\.int$/,
  },
  {
    id: "government-domain",
    kind: "government",
    pattern: /(^|\.)(gov|gouv|go|gob)(\.[a-z]{2})?$/,
  },
  {
    id: "university-domain",
    kind: "academic",
    pattern: /(^|\.)(edu|ac)(\.[a-z]{2})?$/,
  },
];

/**
 * Title patterns, for citations without a URL only: on a web page a title
 * says what the page calls itself, not what it is.
 */
export const TITLE_RULES: PatternRule[] = [
  {
    // Anchored so that a book read "via Britannica" is not typed by the name.
    id: "title-encyclopedia",
    kind: "encyclopedia",
    pattern:
      /^Britannica\b|Encyclop(æ|ae)dia Britannica|^Encyclopaedia of Islam\b/,
  },
  {
    id: "title-missionary-database",
    kind: "missionary_database",
    pattern: /^Joshua Project\b/,
  },
  {
    id: "title-ngo",
    kind: "ngo",
    pattern: /^(Minority Rights Group|UNPO)\b/,
  },
  {
    id: "title-intergovernmental",
    kind: "intergovernmental",
    pattern:
      /^\[?(ONU|UN|UNESCO|UNFPA|Nations unies|United Nations|Banque mondiale|World Bank)\b|Histoire générale de l'Afrique|General History of Africa/,
  },
  {
    id: "title-linguistic-reference",
    kind: "linguistic_reference",
    pattern: /^(SIL )?(Ethnologue|Glottolog)\b/,
  },
  {
    id: "title-government",
    kind: "government",
    pattern: /^CIA World Factbook/,
  },
  {
    id: "title-official-statistics",
    kind: "official_statistics",
    pattern:
      /Bureau of Statistics|Statistical Agency|Statistics South Africa|Institut national de la statistique/,
  },
  {
    id: "title-academic-publisher",
    kind: "academic",
    pattern:
      /\bUniversity Press\b|\bUniversity of\b|Universit(é|ät|y)\b|Presses universitaires|\bPhD\b|\bthèse\b|\bThèse\b|\bdissertation\b|\bJournal\b|\bProceedings\b|\bRoutledge\b|\bBrill\b|\bKarthala\b|\bHarmattan\b|Pr[ée]sence Africaine|\bMouton\b|\bK[öo]ppe\b|\bPeeters\b|\bArmand Colin\b|\bPUF\b|CNRS [ÉE]ditions|\bVerlag\b|\bNature\b|\bPLOS\b|Proceedings of the National Academy|American Anthropologist|International African Institute|\bde Gruyter\b|\bBenjamins\b|\bLincom\b|\bForis\b|\bSELAF\b|\bJames Currey\b|\bAlta[Mm]ira\b|\bCSLI\b|\bScience\b|\beLife\b|Molecular Biology|Human Genetics|Studies in African|Afrikanistische Arbeitspapiere|Africana Linguistica|Linguistics Compass|\bAfrican Affairs\b|\bvol\. \d|\bpp\. \d/,
  },
];

export interface CitedSource {
  title?: unknown;
  url?: unknown;
  tier?: unknown;
}

export interface Classification {
  kind: SourceKind | null;
  /** The rule that decided, `held:*` for a host held on purpose, null when none applies. */
  rule: string | null;
}

export function hostOf(url: unknown): string | null {
  if (typeof url !== "string" || url.length === 0) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

export function classifySource(source: CitedSource): Classification {
  const ruled =
    typeof source.url === "string" ? WORK_RULINGS[source.url] : undefined;
  if (ruled) return { kind: ruled, rule: "work-ruling" };

  const host = hostOf(source.url);

  if (host) {
    let best: { rule: HostRule; length: number } | null = null;
    for (const rule of HOST_RULES) {
      for (const domain of rule.domains) {
        if (
          matchesDomain(host, domain) &&
          (!best || domain.length > best.length)
        ) {
          best = { rule, length: domain.length };
        }
      }
    }
    if (best) return { kind: best.rule.kind, rule: best.rule.id };

    const shape = HOST_PATTERN_RULES.find((rule) => rule.pattern.test(host));
    return shape
      ? { kind: shape.kind, rule: shape.id }
      : { kind: null, rule: null };
  }

  if (source.url == null && typeof source.title === "string") {
    const title = source.title;
    const titleRule = TITLE_RULES.find((rule) => rule.pattern.test(title));
    if (titleRule) return { kind: titleRule.kind, rule: titleRule.id };
  }

  return { kind: null, rule: null };
}

// ───── Locating sources in the fiche text ─────────────────────────────────

interface SourceSpan {
  start: number;
  end: number;
  /** Offset just past the `tier` value, where the new key goes. */
  tierEnd: number | null;
}

interface Frame {
  type: "object" | "array";
  /** For an array, the key it sits under; for an object, its current key. */
  key: string | null;
  expectingKey: boolean;
  span: SourceSpan | null;
}

/**
 * The `sources[]` entries of a fiche, in document order, with their offsets.
 * A tokenizer rather than JSON.parse + stringify, because most fiches are not
 * in JSON.stringify's layout and re-serialising them would rewrite lines
 * another agent may be editing.
 */
export function locateSources(text: string): SourceSpan[] {
  const spans: SourceSpan[] = [];
  const stack: Frame[] = [];

  const valueEnded = (end: number): void => {
    const top = stack[stack.length - 1];
    if (top?.type === "object" && top.span && top.key === "tier") {
      top.span.tierEnd = end;
    }
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const top = stack[stack.length - 1];

    if (char === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      const end = j + 1;
      if (top?.type === "object" && top.expectingKey) {
        top.key = JSON.parse(text.slice(i, end)) as string;
        top.expectingKey = false;
      } else {
        valueEnded(end);
      }
      i = end;
      continue;
    }

    if (char === "{" || char === "[") {
      const parentKey = top?.type === "object" ? top.key : null;
      const isSource =
        char === "{" && top?.type === "array" && top.key === "sources";
      stack.push({
        type: char === "{" ? "object" : "array",
        key: char === "[" ? parentKey : null,
        expectingKey: char === "{",
        span: isSource ? { start: i, end: -1, tierEnd: null } : null,
      });
      i += 1;
      continue;
    }

    if (char === "}" || char === "]") {
      const closed = stack.pop();
      if (closed?.span) {
        closed.span.end = i + 1;
        spans.push(closed.span);
      }
      valueEnded(i + 1);
      i += 1;
      continue;
    }

    if (char === ",") {
      if (top?.type === "object") top.expectingKey = true;
      i += 1;
      continue;
    }

    if (/[-0-9tfn]/.test(char)) {
      let j = i;
      while (j < text.length && !/[\s,\]}]/.test(text[j])) j += 1;
      valueEnded(j);
      i = j;
      continue;
    }

    i += 1;
  }

  return spans.sort((a, b) => a.start - b.start);
}

/**
 * Adds `"source_kind"` after the `tier` of each source whose entry in `kinds`
 * is not null, keeping the tier line's indentation. `kinds` follows the order
 * of `locateSources`. A source that already declares a kind is never changed.
 */
export function insertSourceKinds(
  text: string,
  kinds: (SourceKind | null)[]
): string {
  const spans = locateSources(text);
  const insertions: { at: number; value: string }[] = [];

  spans.forEach((span, index) => {
    const kind = kinds[index];
    if (!kind || span.tierEnd === null) return;
    const entry = JSON.parse(text.slice(span.start, span.end)) as {
      source_kind?: unknown;
    };
    if (entry.source_kind !== undefined) return;

    const lineStart = text.lastIndexOf("\n", span.tierEnd - 1) + 1;
    const line = text.slice(lineStart, span.tierEnd);
    const indent = /^[ \t]*/.exec(line)[0];
    const ownLine = line.trimStart().startsWith('"tier"');
    insertions.push({
      at: span.tierEnd,
      value: ownLine
        ? `,\n${indent}"source_kind": "${kind}"`
        : `, "source_kind": "${kind}"`,
    });
  });

  let updated = text;
  for (const { at, value } of insertions.sort((a, b) => b.at - a.at)) {
    updated = updated.slice(0, at) + value + updated.slice(at);
  }
  return updated;
}

// ───── Corpus run ─────────────────────────────────────────────────────────

export interface UnmatchedSource {
  fiche: string;
  title: string;
  url: string | null;
  host: string | null;
  /** `held:*` when the host is held on purpose, null when no rule names it. */
  rule: string | null;
}

export interface SourceKindReport {
  byKind: Partial<Record<SourceKind, number>>;
  byRule: Record<string, number>;
  unmatched: UnmatchedSource[];
}

export function runSourceKindClassification(options: {
  datasetRoot: string;
  apply: boolean;
}): SourceKindReport {
  const report: SourceKindReport = { byKind: {}, byRule: {}, unmatched: [] };

  for (const fiche of readCorpusFiches(options.datasetRoot)) {
    const spans = locateSources(fiche.text);
    const kinds = spans.map((span) => {
      const source = JSON.parse(
        fiche.text.slice(span.start, span.end)
      ) as CitedSource & { source_kind?: unknown };
      if (source.source_kind !== undefined) return null;

      const { kind, rule } = classifySource(source);
      if (kind) {
        report.byKind[kind] = (report.byKind[kind] ?? 0) + 1;
        report.byRule[rule] = (report.byRule[rule] ?? 0) + 1;
      } else {
        report.unmatched.push({
          fiche: fiche.path,
          title: String(source.title ?? ""),
          url: typeof source.url === "string" ? source.url : null,
          host: hostOf(source.url),
          rule,
        });
      }
      return kind;
    });

    if (options.apply && kinds.some(Boolean)) {
      const updated = insertSourceKinds(fiche.text, kinds);
      assertOnlyKindsAdded(fiche.text, updated, kinds, fiche.path);
      fs.writeFileSync(path.join(options.datasetRoot, fiche.path), updated);
    }
  }

  return report;
}

/**
 * Insertion only adds text, so what can go wrong is a key landing in the
 * wrong object or breaking the JSON; either must stop the run before disk.
 */
function assertOnlyKindsAdded(
  before: string,
  after: string,
  kinds: (SourceKind | null)[],
  fiche: string
): void {
  const expected = locateSources(before).map((span, index) => {
    const entry = JSON.parse(before.slice(span.start, span.end)) as Record<
      string,
      unknown
    >;
    return kinds[index] ? { ...entry, source_kind: kinds[index] } : entry;
  });
  const actual = locateSources(after).map((span) =>
    JSON.parse(after.slice(span.start, span.end))
  );
  JSON.parse(after);
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${fiche}: the rewrite changed more than source_kind keys`);
  }
}

function groupForReview(unmatched: UnmatchedSource[]): unknown {
  const reasons = new Map(
    HOST_RULES.filter((rule) => rule.kind === null).map((rule) => [
      rule.id,
      rule.reason,
    ])
  );
  const groups = new Map<
    string,
    {
      host: string | null;
      rule: string | null;
      sources: Map<string, UnmatchedSource[]>;
    }
  >();
  for (const source of unmatched) {
    const key = JSON.stringify([source.host, source.rule]);
    const group = groups.get(key) ?? {
      host: source.host,
      rule: source.rule,
      sources: new Map(),
    };
    const identity = JSON.stringify([source.title, source.url]);
    group.sources.set(identity, [
      ...(group.sources.get(identity) ?? []),
      source,
    ]);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => ({
      host: group.host,
      count: [...group.sources.values()].reduce(
        (n, list) => n + list.length,
        0
      ),
      rule: group.rule,
      reason: group.rule ? reasons.get(group.rule) : null,
      sources: [...group.sources.values()].map((list) => ({
        title: list[0].title,
        url: list[0].url,
        fiches: list.map((source) => source.fiche),
      })),
    }))
    .sort(
      (a, b) =>
        b.count - a.count || String(a.host).localeCompare(String(b.host))
    );
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const datasetRoot =
    process.argv.slice(2).find((arg) => !arg.startsWith("--")) ??
    DEFAULT_DATASET_ROOT;

  const report = runSourceKindClassification({ datasetRoot, apply });
  const typed = Object.values(report.byKind).reduce((n, count) => n + count, 0);
  const held = report.unmatched.filter((source) => source.rule).length;

  console.log(`${apply ? "Typed" : "Would type"} ${typed} sources.`);
  console.log("By kind:");
  for (const [kind, count] of Object.entries(report.byKind).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${kind.padEnd(22)} ${count}`);
  }
  console.log("By rule:");
  for (const [rule, count] of Object.entries(report.byRule).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${rule.padEnd(28)} ${count}`);
  }
  console.log(
    `Left for review: ${report.unmatched.length} (${held} held on purpose, ${report.unmatched.length - held} matched by no rule)`
  );

  if (apply) {
    const review = {
      about:
        "Fiche sources the source_kind rules leave untyped, grouped by host. Generated by scripts/afrik/classifySourceKinds.ts --apply; a person decides each one.",
      count: report.unmatched.length,
      hosts: groupForReview(report.unmatched),
    };
    fs.writeFileSync(
      SOURCE_KIND_REVIEW_FILE,
      await prettier.format(JSON.stringify(review), {
        ...((await prettier.resolveConfig(SOURCE_KIND_REVIEW_FILE)) ?? {}),
        filepath: SOURCE_KIND_REVIEW_FILE,
      })
    );
    console.log(`Review file: ${SOURCE_KIND_REVIEW_FILE}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith("classifySourceKinds.ts")) {
  void main();
}
