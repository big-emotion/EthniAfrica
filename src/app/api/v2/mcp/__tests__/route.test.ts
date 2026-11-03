import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/handlers/search", () => ({ ftsSearchHandler: vi.fn() }));
vi.mock("@/api/v2/handlers/peoples", () => ({ getPeopleHandler: vi.fn() }));
vi.mock("@/api/v2/handlers/countries", () => ({ getCountryHandler: vi.fn() }));
vi.mock("@/api/v2/handlers/languages", () => ({
  getLanguageHandler: vi.fn(),
}));
vi.mock("@/api/v2/handlers/languageFamilies", () => ({
  getLanguageFamilyHandler: vi.fn(),
}));
vi.mock("@/api/v2/handlers/patronymes", () => ({
  getPatronymeHandler: vi.fn(),
}));
vi.mock("@/lib/search/searchQueryLog", () => ({
  searchQueryLog: { write: vi.fn() },
}));
vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { getPeopleHandler } from "@/api/v2/handlers/peoples";
import { ftsSearchHandler } from "@/api/v2/handlers/search";
import * as mcpRoute from "@/app/api/v2/mcp/route";

const { OPTIONS, POST } = mcpRoute;
import { getCountryRoute, getFamilyRoute, getPeopleRoute } from "@/lib/routing";
import { searchQueryLog } from "@/lib/search/searchQueryLog";

const SITE = "https://ethniafrica.example";

/** A source as the search envelope carries it: tier beside kind. */
const academic = {
  id: "src-1",
  title: "Une étude des noms de la vallée",
  tier: "official" as const,
  sourceKind: "academic" as const,
};
const oral = {
  id: "src-2",
  title: "Récit recueilli auprès des anciens",
  tier: "unverified" as const,
  sourceKind: "oral_tradition" as const,
};

function evidence(sources: Array<typeof academic | typeof oral>) {
  return {
    assertion: {
      statement: "x",
      sourceCount: sources.length,
      lastHumanAuditAt: null,
    },
    sources,
    standing: "official" as const,
  };
}

interface HitOptions {
  selfGiven?: string;
  searchedForm?: { selfGiven: boolean | null; claimStatus?: string };
  debated?: boolean;
  accountStatus?: string;
  oralSource?: boolean;
  problem?: string;
}

/**
 * One people hit, shaped as `ftsSearchHandler` returns it: `naming` and
 * `answer` are already projected by the service.
 */
function peopleHit({
  selfGiven = "Nomvo",
  searchedForm = { selfGiven: false, claimStatus: "contested" },
  debated = true,
  accountStatus = "contested",
  oralSource = false,
  problem = "Beaucoup pensent que Nomva est le nom que le groupe se donne.",
}: HitOptions = {}) {
  const sources = oralSource ? [academic, oral] : [academic];
  return {
    id: "PPL_NOMVO",
    name: "Nomvo",
    languageFamilyId: "FLG_EXEMPLE",
    languageFamilyName: "Famille exemple",
    normalizedScore: 0.9,
    naming: {
      selfGiven,
      forms: [{ form: "Nomva" }],
      problem,
      eras: [],
      presentation: {
        forms: [
          {
            form: "Nomvo",
            selfGiven: true,
            attestations: [],
            evidence: [],
          },
          {
            form: "Nomva",
            selfGiven: searchedForm.selfGiven,
            origin: {
              languageCode: "Langue voisine",
              meaning: "« ceux d'en bas »",
              imposedBy: "les voisins du nord",
              period: "XIXe siècle",
            },
            shortLine: "Le nom que donnent les voisins.",
            ...(searchedForm.claimStatus
              ? { claimStatus: searchedForm.claimStatus }
              : {}),
            attestations: [],
            evidence: [evidence(sources)],
          },
        ],
        eras: [],
        disagreements: [],
        evidence: [],
      },
    },
    answer: {
      kind: "people",
      title: "Nomvo",
      what: {
        lead: "Les Nomvo vivent dans la vallée du fleuve.",
        facts: { population: 120000 },
      },
      origin: {
        accounts: [
          {
            text: "Le nom Nomva viendrait des voisins du nord.",
            claimStatus: accountStatus,
            evidence: [evidence(sources)],
          },
        ],
        debated,
      },
      names: [
        { form: "Nomvo", selfGiven: true },
        {
          form: "Nomva",
          selfGiven: false,
          shortLine: "Le nom que donnent les voisins.",
        },
      ],
      where: {
        unit: "population",
        estimate: true,
        rows: [{ countryId: "SEN", value: 120000 }],
      },
      sources: { count: sources.length },
    },
  };
}

function searchEnvelope(peoples: object[]) {
  return {
    data: {
      peoples,
      countries: [],
      families: [],
      persons: [],
      patronymes: [],
      quizzes: [],
      languages: [],
      places: [],
      words: [],
      results: peoples.map((hit) => ({
        kind: "people",
        id: (hit as { id: string }).id,
        name: (hit as { name: string }).name,
        normalizedScore: 0.9,
        snippet: null,
      })),
      total: peoples.length,
      leads: [],
      nearNames: [],
      nameAnswers: [],
      wordAnswers: [],
      nameSuggestions: [],
    },
    meta: {},
    errors: [],
  };
}

function rpc(body: unknown): NextRequest {
  return new NextRequest(`${SITE}/api/v2/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function callTool(name: string, args: Record<string, unknown>) {
  const response = await POST(
    rpc({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name, arguments: args },
    })
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  return body.result as {
    content: Array<{ type: string; text: string }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  };
}

describe("POST /api/v2/mcp — protocol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = SITE;
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  // @req REQ-002
  it("answers initialize statelessly: tools only, no session id", async () => {
    const response = await POST(
      rpc({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test", version: "0" },
        },
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Mcp-Session-Id")).toBeNull();
    const body = await response.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(1);
    expect(body.result.protocolVersion).toBe("2025-06-18");
    expect(body.result.capabilities).toEqual({ tools: {} });
    expect(body.result.serverInfo.name).toBe("ethniafrica");
  });

  // @req REQ-002
  it("lists exactly two read-only tools: search a name, read one fiche", async () => {
    const response = await POST(
      rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })
    );
    const body = await response.json();
    const tools = body.result.tools as Array<{
      name: string;
      inputSchema: { type: string; required?: string[] };
      annotations?: { readOnlyHint?: boolean; openWorldHint?: boolean };
    }>;
    expect(tools.map((tool) => tool.name)).toEqual([
      "rechercher_nom",
      "lire_fiche",
    ]);
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
    expect(tools[0].inputSchema.required).toEqual(["nom"]);
    expect(tools[1].inputSchema.required).toEqual(["type", "id"]);
  });

  // @req REQ-002
  it("accepts a notification with 202 and no body", async () => {
    const response = await POST(
      rpc({ jsonrpc: "2.0", method: "notifications/initialized" })
    );
    expect(response.status).toBe(202);
    expect(await response.text()).toBe("");
  });

  // @req REQ-002
  it("answers ping with an empty result", async () => {
    const body = await (
      await POST(rpc({ jsonrpc: "2.0", id: "p", method: "ping" }))
    ).json();
    expect(body).toEqual({ jsonrpc: "2.0", id: "p", result: {} });
  });

  // @req REQ-002
  it("refuses an unknown method with -32601", async () => {
    const body = await (
      await POST(rpc({ jsonrpc: "2.0", id: 3, method: "resources/list" }))
    ).json();
    expect(body.error.code).toBe(-32601);
  });

  // @req REQ-002
  it("refuses a body that is not JSON with -32700", async () => {
    const response = await POST(rpc("{not json"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe(-32700);
    expect(body.id).toBeNull();
  });

  // @req REQ-002
  it("refuses a call to a tool it does not have: nothing writes", async () => {
    const body = await (
      await POST(
        rpc({
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: { name: "proposer_correction", arguments: {} },
        })
      )
    ).json();
    expect(body.error.code).toBe(-32602);
  });

  // @req REQ-002
  it("refuses a search without a name with -32602", async () => {
    const body = await (
      await POST(
        rpc({
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: { name: "rechercher_nom", arguments: { nom: "  " } },
        })
      )
    ).json();
    expect(body.error.code).toBe(-32602);
    expect(ftsSearchHandler).not.toHaveBeenCalled();
  });

  // @req REQ-002
  it("opens no event stream: no GET handler, so Next answers 405", () => {
    expect("GET" in mcpRoute).toBe(false);
  });

  // @req REQ-084
  it("answers the CORS preflight", () => {
    expect(OPTIONS().status).toBe(204);
  });
});

describe("tool rechercher_nom — the approved answer frame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = SITE;
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  // @req REQ-178
  it("reads the corpus through the search handler, in French", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([peopleHit()]) as never
    );
    await callTool("rechercher_nom", { nom: "Nomva" });
    expect(ftsSearchHandler).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Nomva", lang: "fr", offset: 0 })
    );
  });

  // @req REQ-178
  it("stores nothing about the asker: the query is not logged", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([peopleHit()]) as never
    );
    await callTool("rechercher_nom", { nom: "Nomva" });
    expect(searchQueryLog.write).not.toHaveBeenCalled();
  });

  // @req REQ-178
  it("writes the sections in the approved order", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([peopleHit()]) as never
    );
    const { content } = await callTool("rechercher_nom", { nom: "Nomva" });
    const text = content[0].text;
    const headings = [
      "En bref",
      "D'où vient le nom",
      "Ce que disent les sources",
      "Langue",
      "Sens et pourquoi",
      "Autres noms",
      "Ce qu'on croit souvent",
      "Ce qu'on ne sait pas",
      "Pour aller plus loin",
    ];
    const positions = headings.map((heading) => text.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(text).toContain("Les Nomvo vivent dans la vallée du fleuve.");
    expect(text).toContain("« ceux d'en bas »");
    expect(text).toContain("Beaucoup pensent que Nomva");
  });

  // @req REQ-178
  it("marks an outside name whose sources disagree", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([peopleHit()]) as never
    );
    const { content, structuredContent } = await callTool("rechercher_nom", {
      nom: "Nomva",
    });
    const subject = (
      structuredContent.sujets as Array<{
        reperes: { origine: string; sources: string };
      }>
    )[0];
    expect(subject.reperes).toEqual({
      origine: "venu_d_ailleurs",
      sources: "discute",
    });
    expect(content[0].text).toMatch(/D'où vient le nom : venu d'ailleurs/);
    expect(content[0].text).toMatch(/Ce que disent les sources : discuté/);
  });

  // @req REQ-178
  it("marks a self-given form as from the inside, and an established account", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([
        peopleHit({
          searchedForm: { selfGiven: true, claimStatus: "established" },
          debated: false,
          accountStatus: "established",
        }),
      ]) as never
    );
    const { structuredContent } = await callTool("rechercher_nom", {
      nom: "Nomva",
    });
    expect(
      (structuredContent.sujets as Array<{ reperes: object }>)[0].reperes
    ).toEqual({ origine: "interieur", sources: "etabli" });
  });

  // @req REQ-178
  it("marks an outside name the group now gives itself as taken back", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([
        peopleHit({
          selfGiven: "Nomva",
          searchedForm: { selfGiven: false, claimStatus: "claimed" },
          debated: false,
          accountStatus: "claimed",
        }),
      ]) as never
    );
    const { content, structuredContent } = await callTool("rechercher_nom", {
      nom: "Nomva",
    });
    expect(
      (structuredContent.sujets as Array<{ reperes: object }>)[0].reperes
    ).toEqual({ origine: "venu_d_ailleurs_puis_repris", sources: "rapporte" });
    expect(content[0].text).toContain("venu d'ailleurs, puis repris");
    expect(content[0].text).toContain("rapporté");
  });

  // @req REQ-161
  it("names a source's type and never its tier, and gives no percentage", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([peopleHit({ oralSource: true })]) as never
    );
    const { content, structuredContent } = await callTool("rechercher_nom", {
      nom: "Nomva",
    });
    const text = content[0].text;
    expect(text).toContain("Publication académique");
    expect(text).toContain("Tradition orale");
    const serialized = JSON.stringify(structuredContent) + text;
    expect(serialized).not.toMatch(
      /\b(official|referenced|unverified|needs_review|tier|standing)\b/
    );
    expect(text).not.toMatch(/%/);
  });

  // @req REQ-198
  it("says what is not known: no oral source cited", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([peopleHit({ oralSource: false })]) as never
    );
    const { content } = await callTool("rechercher_nom", { nom: "Nomva" });
    const unknown = content[0].text.split("Ce qu'on ne sait pas")[1];
    expect(unknown).toMatch(/source orale/);
  });

  // @req REQ-178
  it("always links the fiche, plus at least one lead from the corpus graph", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(
      searchEnvelope([peopleHit()]) as never
    );
    const { content, structuredContent } = await callTool("rechercher_nom", {
      nom: "Nomva",
    });
    const further = content[0].text.split("Pour aller plus loin")[1];
    expect(further).toContain(`${SITE}${getPeopleRoute("fr", "PPL_NOMVO")}`);
    expect(further).toContain(`${SITE}${getFamilyRoute("fr", "FLG_EXEMPLE")}`);
    expect(further).toContain("Famille exemple");
    const subject = (
      structuredContent.sujets as Array<{
        fiche: string;
        pistes: Array<{ url: string }>;
      }>
    )[0];
    expect(subject.fiche).toBe(`${SITE}${getPeopleRoute("fr", "PPL_NOMVO")}`);
    expect(subject.pistes.length).toBeGreaterThanOrEqual(1);
  });

  // @req REQ-178
  it("says plainly when nothing answers to the name", async () => {
    vi.mocked(ftsSearchHandler).mockResolvedValue(searchEnvelope([]) as never);
    const result = await callTool("rechercher_nom", { nom: "Inconnu" });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain("Inconnu");
    expect(result.structuredContent.sujets).toEqual([]);
  });

  // @req REQ-178
  it("reports a corpus outage as a tool error, not a protocol error", async () => {
    vi.mocked(ftsSearchHandler).mockRejectedValue(new Error("db down"));
    const result = await callTool("rechercher_nom", { nom: "Nomva" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).not.toContain("db down");
  });
});

describe("tool lire_fiche", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = SITE;
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  // @req REQ-084
  it("reads one people fiche through its handler and frames it", async () => {
    vi.mocked(getPeopleHandler).mockResolvedValue({
      data: {
        id: "PPL_NOMVO",
        name: "Nomvo",
        languageFamilyId: "FLG_EXEMPLE",
        content: {
          appellations: {
            selfAppellation: "Nomvo",
            exonyms: ["Nomva"],
            originOfExonyms: "Le nom Nomva viendrait des voisins du nord.",
          },
          demography: {
            distributionByCountry: [{ country: "SEN", population: 1000 }],
          },
        },
        patronymes: [],
      },
      meta: {},
      errors: [],
    } as never);
    const { content, structuredContent } = await callTool("lire_fiche", {
      type: "peuple",
      id: "PPL_NOMVO",
    });
    expect(getPeopleHandler).toHaveBeenCalledWith("PPL_NOMVO");
    const text = content[0].text;
    expect(text).toContain("En bref");
    expect(text).toContain("D'où vient le nom : de l'intérieur");
    expect(text).toContain("Nomva");
    expect(text).toContain(`${SITE}${getPeopleRoute("fr", "PPL_NOMVO")}`);
    expect(text).toContain(`${SITE}${getCountryRoute("fr", "SEN")}`);
    expect(
      (structuredContent.sujets as Array<{ fiche: string }>)[0].fiche
    ).toBe(`${SITE}${getPeopleRoute("fr", "PPL_NOMVO")}`);
  });

  // @req REQ-084
  it("says so when the fiche does not exist", async () => {
    vi.mocked(getPeopleHandler).mockResolvedValue(null);
    const result = await callTool("lire_fiche", {
      type: "peuple",
      id: "PPL_ABSENT",
    });
    expect(result.isError).toBe(true);
  });

  // @req REQ-084
  it("refuses a type it does not know with -32602", async () => {
    const body = await (
      await POST(
        rpc({
          jsonrpc: "2.0",
          id: 9,
          method: "tools/call",
          params: {
            name: "lire_fiche",
            arguments: { type: "contributeur", id: "x" },
          },
        })
      )
    ).json();
    expect(body.error.code).toBe(-32602);
  });
});
