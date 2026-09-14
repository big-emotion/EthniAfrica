import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pullSourceTierRulings } from "../pullSourceTierRulings";
import { readRulingLedger, validateRulings } from "../sourceTierRulings";

let workspace: string;
let ledgerPath: string;

const drafts = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    fiche_path: "pays/BEN.json",
    source_title: "ONU – World Population Prospects 2025",
    source_url: null,
    decision: "tier",
    tier: "official",
    repaired_url: null,
    rationale: "United Nations population estimates.",
    decided_by: "3f1d2a8e-0000-4000-8000-00000000abcd",
    decided_at: "2026-09-14T10:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    fiche_path: "pays/SEN.json",
    source_title: "Site mort",
    source_url: "http://dead.example",
    decision: "repair",
    tier: "referenced",
    repaired_url: "https://web.archive.org/web/2025/http://dead.example",
    rationale: "Dated archive of the ministry page.",
    decided_by: "3f1d2a8e-0000-4000-8000-00000000abcd",
    decided_at: "2026-09-14T11:00:00.000Z",
  },
];

function draftsEndpoint() {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(drafts), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
  );
}

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "pull-rulings-"));
  ledgerPath = path.join(workspace, "source-tier-rulings.json");
  fs.writeFileSync(
    ledgerPath,
    JSON.stringify({ description: "ledger", rulings: [] }, null, 2) + "\n"
  );
});

afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

describe("pullSourceTierRulings", () => {
  // @req REQ-092
  it("appends each draft once as a well-formed ruling, and a second pull changes nothing", async () => {
    const fetchImpl = draftsEndpoint();
    const options = {
      supabaseUrl: "https://db.example",
      serviceRoleKey: "service-role",
      ledgerPath,
      fetchImpl,
    };

    const first = await pullSourceTierRulings(options);
    const afterFirst = fs.readFileSync(ledgerPath, "utf8");
    const second = await pullSourceTierRulings(options);

    expect(first.appended).toEqual([
      "STR-11111111-1111-4111-8111-111111111111",
      "STR-22222222-2222-4222-8222-222222222222",
    ]);
    expect(second.appended).toEqual([]);
    expect(fs.readFileSync(ledgerPath, "utf8")).toBe(afterFirst);

    const rulings = readRulingLedger(ledgerPath);
    expect(validateRulings(rulings)).toEqual([]);
    expect(rulings[1]).toEqual({
      id: "STR-22222222-2222-4222-8222-222222222222",
      match: { title: "Site mort", url: "http://dead.example" },
      decision: "repair",
      tier: "referenced",
      repairedUrl: "https://web.archive.org/web/2025/http://dead.example",
      rationale: "Dated archive of the ministry page.",
      decidedBy: "3f1d2a8e-0000-4000-8000-00000000abcd",
      decidedAt: "2026-09-14",
      draftId: "22222222-2222-4222-8222-222222222222",
    });
    expect(JSON.parse(afterFirst).description).toBe("ledger");
  });

  // Read-only on the database: one GET, service-role authenticated.
  // @req REQ-092
  it("reads the drafts with a single service-role GET", async () => {
    const fetchImpl = draftsEndpoint();

    await pullSourceTierRulings({
      supabaseUrl: "https://db.example/",
      serviceRoleKey: "service-role",
      ledgerPath,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://db.example/rest/v1/source_tier_ruling_drafts?select=*&order=decided_at.asc"
    );
    expect(init.method ?? "GET").toBe("GET");
    expect(init.headers).toMatchObject({
      apikey: "service-role",
      Authorization: "Bearer service-role",
    });
  });
});
