/**
 * Public agent — a read-only Model Context Protocol server over the corpus.
 *
 * Stateless: each POST carries one JSON-RPC message and gets one JSON answer,
 * no session id, no event stream. Two tools, both read-only: search a name,
 * read one fiche. The corpus is read through the /api/v2 handlers and their
 * services, never through a database client of its own.
 *
 * Nothing about the caller is stored: the search is called without the
 * route's query log, and the handler keeps no state between calls.
 */
import { z } from "zod";

import { getCountryHandler } from "@/api/v2/handlers/countries";
import { getLanguageFamilyHandler } from "@/api/v2/handlers/languageFamilies";
import { getLanguageHandler } from "@/api/v2/handlers/languages";
import { getPatronymeHandler } from "@/api/v2/handlers/patronymes";
import { getPeopleHandler } from "@/api/v2/handlers/peoples";
import { ftsSearchHandler } from "@/api/v2/handlers/search";
import { logger } from "@/lib/api/logger";
import {
  publicAgentCopy,
  type AgentSubjectKind,
} from "@/lib/i18n/copy/publicAgent";
import {
  buildAgentFrame,
  renderAgentFrame,
  type AgentFrame,
  type AgentSubjectInput,
} from "@/lib/publicAgent/frame";
import { readAnswer, type SearchAnswer } from "@/lib/search/answer";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import { readNaming, type NamingProjection } from "@/lib/search/naming";

const copy = publicAgentCopy.fr;

export const PUBLIC_AGENT_PROTOCOL_VERSIONS = [
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
] as const;

const SERVER_INFO = { name: "ethniafrica", version: "0.1.0" };
const MAX_SUBJECTS = 3;
const SEARCH_LIMIT = 10;

export const JSON_RPC_ERRORS = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
} as const;

type JsonRpcId = string | number | null;

export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: JsonRpcId; result: unknown }
  | {
      jsonrpc: "2.0";
      id: JsonRpcId;
      error: { code: number; message: string };
    };

const FICHE_TYPES = {
  peuple: "people",
  pays: "country",
  langue: "language",
  famille: "languageFamily",
  patronyme: "patronyme",
} as const satisfies Record<string, AgentSubjectKind>;

const searchArgsSchema = z.object({
  nom: z.string().trim().min(1).max(120),
});

const ficheArgsSchema = z.object({
  type: z.enum(
    Object.keys(FICHE_TYPES) as [
      keyof typeof FICHE_TYPES,
      ...(keyof typeof FICHE_TYPES)[],
    ]
  ),
  id: z.string().trim().min(1).max(64),
});

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const TOOLS = [
  {
    name: "rechercher_nom",
    title: copy.tools.searchTitle,
    description: copy.tools.searchDescription,
    inputSchema: {
      type: "object",
      properties: {
        nom: {
          type: "string",
          description: copy.tools.searchName,
          maxLength: 120,
        },
      },
      required: ["nom"],
      additionalProperties: false,
    },
    annotations: READ_ONLY,
  },
  {
    name: "lire_fiche",
    title: copy.tools.ficheTitle,
    description: copy.tools.ficheDescription,
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: Object.keys(FICHE_TYPES) },
        id: { type: "string", maxLength: 64 },
      },
      required: ["type", "id"],
      additionalProperties: false,
    },
    annotations: READ_ONLY,
  },
];

class InvalidParams extends Error {}

type Row = Record<string, unknown>;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function titleOf(row: Row): string {
  return (
    text(row.nameMain) ??
    text(row.name) ??
    text(row.nameFr) ??
    String(row.id ?? "")
  );
}

function projected(row: Row): {
  naming?: NamingProjection;
  answer?: SearchAnswer;
} {
  return {
    naming: row.naming as NamingProjection | undefined,
    answer: row.answer as SearchAnswer | undefined,
  };
}

/** The search rows, as subjects of the frame, in the search's own order. */
function subjectsOfSearch(data: Row): AgentSubjectInput[] {
  const rows = (key: string): Row[] =>
    Array.isArray(data[key]) ? (data[key] as Row[]) : [];
  const byKey = new Map<string, AgentSubjectInput>();
  const add = (kind: AgentSubjectKind, row: Row, graph = {}) =>
    byKey.set(`${kind}:${row.id}`, {
      kind,
      id: String(row.id),
      title: titleOf(row),
      ...projected(row),
      graph,
    });

  for (const row of rows("peoples")) {
    add("people", row, {
      familyId: text(row.languageFamilyId),
      familyName: text(row.languageFamilyName),
    });
  }
  for (const row of rows("countries")) add("country", row);
  for (const row of rows("families")) add("languageFamily", row);
  for (const row of rows("patronymes")) {
    add("patronyme", row, {
      peoples: Array.isArray(row.associatedPeoples)
        ? row.associatedPeoples
        : [],
    });
  }

  const ranked: AgentSubjectInput[] = [];
  for (const hit of rows("results")) {
    const subject = byKey.get(`${hit.kind}:${hit.id}`);
    if (subject) {
      ranked.push(subject);
      byKey.delete(`${hit.kind}:${hit.id}`);
    }
  }
  ranked.push(...byKey.values());
  // Languages are a facet beside the ranking, not in it.
  for (const row of rows("languages")) {
    ranked.push({
      kind: "language",
      id: String(row.id),
      title: titleOf(row),
      ...projected(row),
      graph: {
        familyId: text(row.familyId),
        familyName: text(row.familyName),
      },
    });
  }
  return ranked.slice(0, MAX_SUBJECTS);
}

function toolResult(query: string | undefined, frames: AgentFrame[]) {
  return {
    content: [
      {
        type: "text",
        text: frames.length
          ? frames.map(renderAgentFrame).join("\n\n")
          : copy.noAnswer(query ?? ""),
      },
    ],
    structuredContent: {
      ...(query ? { requete: query } : {}),
      sujets: frames,
    },
  };
}

function toolError(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}

async function searchName(args: unknown) {
  const parsed = searchArgsSchema.safeParse(args);
  if (!parsed.success) throw new InvalidParams("nom is required");
  const query = parsed.data.nom;
  const envelope = await ftsSearchHandler({
    q: query,
    limit: SEARCH_LIMIT,
    offset: 0,
    lang: "fr",
  });
  const data = envelope.data as unknown as Row;
  const subjects = subjectsOfSearch(data);
  const nameAnswers = (data.nameAnswers ?? []) as NameAnswer[];
  return toolResult(
    query,
    subjects.map((subject) =>
      buildAgentFrame(subject, {
        query,
        nameAnswers,
        siblings: subjects,
      })
    )
  );
}

function ficheEnvelopeData(outcome: unknown): Row | null {
  if (!outcome || typeof outcome !== "object") return null;
  const record = outcome as Row;
  if (record.ok === false) return null;
  const envelope = (record.ok === true ? record.envelope : record) as Row;
  const data = envelope?.data;
  return data && typeof data === "object" ? (data as Row) : null;
}

async function loadFiche(kind: AgentSubjectKind, id: string): Promise<Row> {
  switch (kind) {
    case "people":
      return ficheEnvelopeData(await getPeopleHandler(id));
    case "country":
      return ficheEnvelopeData(await getCountryHandler(id));
    case "languageFamily":
      return ficheEnvelopeData(await getLanguageFamilyHandler(id));
    case "language":
      return ficheEnvelopeData(await getLanguageHandler(id));
    case "patronyme":
      return ficheEnvelopeData(await getPatronymeHandler(id));
  }
}

function subjectOfFiche(kind: AgentSubjectKind, fiche: Row): AgentSubjectInput {
  const content = (fiche.content ?? {}) as Row;
  const root = kind === "patronyme" ? { ...content, ...fiche } : fiche;
  const family = (fiche.family ?? {}) as Row;
  const peoples =
    kind === "language"
      ? fiche.speakingPeoples
      : kind === "patronyme"
        ? fiche.associatedPeoples
        : undefined;
  return {
    kind,
    id: String(fiche.id),
    title: titleOf(fiche),
    naming: readNaming(kind, content, root),
    answer: readAnswer(kind, content, root),
    graph: {
      familyId: text(fiche.languageFamilyId) ?? text(family.id),
      familyName: text(family.name),
      peoples: Array.isArray(peoples) ? peoples : [],
    },
  };
}

async function readFiche(args: unknown) {
  const parsed = ficheArgsSchema.safeParse(args);
  if (!parsed.success) throw new InvalidParams("type and id are required");
  const kind = FICHE_TYPES[parsed.data.type];
  const fiche = await loadFiche(kind, parsed.data.id);
  if (!fiche) return toolError(copy.ficheNotFound);
  return toolResult(undefined, [buildAgentFrame(subjectOfFiche(kind, fiche))]);
}

const TOOL_RUNNERS: Record<string, (args: unknown) => Promise<unknown>> = {
  rechercher_nom: searchName,
  lire_fiche: readFiche,
};

async function callTool(params: Row) {
  const run = TOOL_RUNNERS[String(params.name)];
  if (!run) throw new InvalidParams(`Unknown tool: ${String(params.name)}`);
  try {
    return await run(params.arguments ?? {});
  } catch (error) {
    if (error instanceof InvalidParams) throw error;
    // The corpus could not be read: a tool error the agent can relay, with
    // nothing of the failure's internals in it.
    logger.error("public agent: tool failed", error, { tool: params.name });
    return toolError(copy.outage);
  }
}

function negotiatedVersion(params: Row): string {
  const requested = String(params.protocolVersion ?? "");
  return (PUBLIC_AGENT_PROTOCOL_VERSIONS as readonly string[]).includes(
    requested
  )
    ? requested
    : PUBLIC_AGENT_PROTOCOL_VERSIONS[0];
}

/**
 * Answers one JSON-RPC message. A notification (no id) gets `null`, which the
 * route turns into a bodiless 202.
 */
// @req REQ-002
export async function handlePublicAgentMessage(
  message: unknown
): Promise<JsonRpcResponse | null> {
  const request = (message ?? {}) as Row;
  if (
    typeof message !== "object" ||
    Array.isArray(message) ||
    request.jsonrpc !== "2.0" ||
    typeof request.method !== "string"
  ) {
    return {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: JSON_RPC_ERRORS.invalidRequest,
        message: "Invalid Request",
      },
    };
  }
  if (!("id" in request)) return null;

  const id = request.id as JsonRpcId;
  const params = (request.params ?? {}) as Row;
  const ok = (result: unknown): JsonRpcResponse => ({
    jsonrpc: "2.0",
    id,
    result,
  });
  const fail = (code: number, text: string): JsonRpcResponse => ({
    jsonrpc: "2.0",
    id,
    error: { code, message: text },
  });

  switch (request.method) {
    case "initialize":
      return ok({
        protocolVersion: negotiatedVersion(params),
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call":
      try {
        return ok(await callTool(params));
      } catch (error) {
        if (error instanceof InvalidParams) {
          return fail(JSON_RPC_ERRORS.invalidParams, error.message);
        }
        throw error;
      }
    default:
      return fail(JSON_RPC_ERRORS.methodNotFound, "Method not found");
  }
}
