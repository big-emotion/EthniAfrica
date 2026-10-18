import type {
  PatronymeDossier,
  PatronymeOrigin,
  PatronymeSource,
} from "@/lib/afrik/parsers/patronymeTypes";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";

export type OriginAccountType = keyof PatronymeOrigin;

export interface ReviewedOriginMerge {
  originType: OriginAccountType;
  originIndex: number;
  targetName: string;
  targetStatements?: string[];
  targetPeriod?: string;
  targetStatementPrefix?: string;
  targetSourceUrl?: string;
  mergedStatement?: string;
}

type HistoryAccount = NameHistory["names"][number]["accounts"][number];
type HistorySource = HistoryAccount["sources"][number];

const REVIEWED_SOURCE_AUTHORS: Record<string, string> = {
  "hga-v-wondji": "Christophe Wondji",
};

function periodLabel(account: HistoryAccount): string | undefined {
  const period: unknown = account.period;
  if (typeof period === "string") return period;
  if (period && typeof period === "object" && "label" in period) {
    return typeof period.label === "string" ? period.label : undefined;
  }
  return undefined;
}

function sameSource(
  left: Pick<HistorySource, "title" | "url">,
  right: Pick<HistorySource, "title" | "url">
): boolean {
  return left.title === right.title && left.url === right.url;
}

function nameKey(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

function sourceFor(
  sourceRef: string,
  sources: PatronymeSource[],
  existing: HistorySource[]
): HistorySource {
  const source = sources.find((candidate) => candidate.sourceKey === sourceRef);
  if (!source)
    throw new Error(`Unknown patronyme source reference: ${sourceRef}`);
  const match = existing.find((candidate) => sameSource(candidate, source));
  if (match) return { ...match };
  if (!source.source_kind) {
    throw new Error(`Source ${sourceRef} has no source_kind`);
  }
  return {
    title: source.title,
    author: REVIEWED_SOURCE_AUTHORS[sourceRef] ?? "Auteur non précisé",
    year: null,
    url: source.url,
    tier: source.tier,
    source_kind: source.source_kind,
    ...(source.notes ? { notes: source.notes } : {}),
  };
}

function mergeReviewedAccount(
  target: HistoryAccount,
  origin: PatronymeOrigin[keyof PatronymeOrigin][number],
  type: OriginAccountType,
  sources: HistorySource[]
) {
  if (
    target.claimStatus !== undefined &&
    target.claimStatus !== origin.claimStatus
  ) {
    throw new Error("Reviewed merge has conflicting claim statuses");
  }
  target.claimStatus = origin.claimStatus;
  target.sources = [...target.sources];
  for (const source of sources) {
    if (!target.sources.some((candidate) => sameSource(candidate, source))) {
      target.sources.push(source);
    }
  }
  if (type === "oralTraditions") {
    const oral = origin as PatronymeOrigin["oralTraditions"][number];
    const carrier = oral.carrier ?? oral.griot;
    if (carrier) target.carrier ??= carrier;
    if (oral.collection) target.collection ??= oral.collection;
    if (oral.collector) target.collector ??= oral.collector;
    const context = [oral.context, oral.transcription]
      .filter((value): value is string => Boolean(value))
      .join("\n");
    const source = target.sources.find((candidate) =>
      sources.some((originSource) => sameSource(candidate, originSource))
    );
    if (context && source && !source.notes?.includes(context)) {
      source.notes = [source.notes, context].filter(Boolean).join("\n");
    }
  }
}

function createHistory(dossier: PatronymeDossier): NameHistory {
  return {
    summary: `Les sources réunies dans ce dossier racontent l’histoire du nom ${dossier.nameMain}.`,
    originExplained: true,
    names: [
      {
        nameText: dossier.nameMain,
        nameStatus: "current",
        selfGiven: false,
        languageOfOrigin: null,
        namedBy: null,
        accounts: [],
      },
    ],
  };
}

/** Moves origin records into the fiche's primary name history. Merges only
 * accounts named by an explicit reviewed mapping; similar sources alone are
 * never enough to combine claims. */
export function migratePatronymeOriginToNameHistory(
  dossier: PatronymeDossier,
  reviewedMerges: ReviewedOriginMerge[] = []
): PatronymeDossier {
  const migrated = structuredClone(dossier);
  const history = migrated.nameHistory ?? createHistory(migrated);
  const targets = reviewedMerges;
  migrated.origin = {
    oralTraditions: migrated.origin.oralTraditions ?? [],
    writtenChronicles: migrated.origin.writtenChronicles ?? [],
    historicalSyntheses: migrated.origin.historicalSyntheses ?? [],
    linguisticReconstructions: migrated.origin.linguisticReconstructions ?? [],
  };

  for (const type of Object.keys(migrated.origin) as OriginAccountType[]) {
    migrated.origin[type].forEach((origin, originIndex) => {
      const targetRule = targets.find(
        (rule) => rule.originType === type && rule.originIndex === originIndex
      );
      const requestedName = targetRule?.targetName ?? migrated.nameMain;
      const targetName =
        history.names.find((name) => name.nameText === requestedName) ??
        history.names.find(
          (name) => nameKey(name.nameText) === nameKey(requestedName)
        );
      if (!targetName) {
        throw new Error(
          `${migrated.id}: no name history entry for ${targetRule?.targetName ?? migrated.nameMain}`
        );
      }
      const existingSources = history.names.flatMap((name) =>
        name.accounts.flatMap((account) => account.sources)
      );
      const sources = origin.sourceRefs.map((sourceRef) =>
        sourceFor(sourceRef, migrated.sources, existingSources)
      );

      if (targetRule) {
        const matchedTargets = new Set<HistoryAccount>();
        let targetsToMerge: HistoryAccount[];
        if (targetRule.targetPeriod) {
          targetsToMerge = targetName.accounts.filter(
            (account) =>
              (periodLabel(account) === targetRule.targetPeriod ||
                periodLabel(account)?.startsWith(
                  targetRule.targetPeriod ?? ""
                )) &&
              (!targetRule.targetStatementPrefix ||
                account.statement.startsWith(targetRule.targetStatementPrefix))
          );
          if (
            targetsToMerge.length !== 1 ||
            !targetsToMerge[0].sources.some((targetSource) =>
              sources.some(
                (source) =>
                  sameSource(source, targetSource) ||
                  (targetRule.targetSourceUrl !== undefined &&
                    targetRule.targetSourceUrl === source.url &&
                    targetRule.targetSourceUrl === targetSource.url)
              )
            )
          ) {
            throw new Error(
              `${migrated.id}: no unique reviewed target account for period ${targetRule.targetPeriod} (found ${targetsToMerge.length}; candidates: ${targetName.accounts.map((account) => `${periodLabel(account)} / ${account.statement.slice(0, 48)}`).join(" | ")})`
            );
          }
        } else {
          targetsToMerge = (targetRule.targetStatements ?? []).map(
            (statement) => {
              const target = targetName.accounts.find(
                (account) =>
                  !matchedTargets.has(account) &&
                  (account.statement === statement ||
                    account.statement.startsWith(statement))
              );
              if (!target) {
                throw new Error(
                  `${migrated.id}: reviewed target account no longer matches: ${statement}`
                );
              }
              matchedTargets.add(target);
              return target;
            }
          );
          if (targetsToMerge.length === 0) {
            throw new Error(`${migrated.id}: reviewed merge has no target`);
          }
        }
        for (const target of targetsToMerge) {
          mergeReviewedAccount(target, origin, type, sources);
          if (targetRule.mergedStatement)
            target.statement = targetRule.mergedStatement;
        }
        return;
      }

      const account: HistoryAccount = {
        period: { from: null, to: null, label: "Origine non datée" },
        statement: origin.claim,
        claimStatus: origin.claimStatus,
        sources,
      };
      if (type === "oralTraditions") {
        const oral = origin as PatronymeOrigin["oralTraditions"][number];
        const carrier = oral.carrier ?? oral.griot;
        if (carrier) account.carrier = carrier;
        if (oral.collection) account.collection = oral.collection;
        if (oral.collector) account.collector = oral.collector;
        const context = [oral.context, oral.transcription]
          .filter((value): value is string => Boolean(value))
          .join("\n");
        if (context && account.sources[0]) {
          account.sources[0].notes = [account.sources[0].notes, context]
            .filter(Boolean)
            .join("\n");
        }
      }
      targetName.accounts.push(account);
    });
    migrated.origin[type] = [];
  }

  migrated.nameHistory = history;
  if (history.names.some((name) => name.accounts.length > 0)) {
    migrated.gaps = migrated.gaps.filter((gap) => gap.fieldPath !== "origin");
  }
  return migrated;
}
