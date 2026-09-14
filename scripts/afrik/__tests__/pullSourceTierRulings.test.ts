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

  // A moderator may correct a decision before it is pulled. Two rulings on one
  // citation would contradict each other in the gate for good, so only the
  // latest decision becomes a ruling.
  // @req REQ-092
  it("keeps only the latest draft of a citation and reports the drafts it superseded", async () => {
    const first = { ...drafts[0] };
    const correction = {
      ...drafts[0],
      id: "33333333-3333-4333-8333-333333333333",
      tier: "referenced",
      rationale: "Corrected: a derived table, not the UN release itself.",
      decided_at: "2026-09-14T12:00:00.000Z",
    };
    // Newest first, as the admin page lists them, to prove order is not trusted.
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify([correction, first]), { status: 200 })
    );

    const result = await pullSourceTierRulings({
      supabaseUrl: "https://db.example",
      serviceRoleKey: "service-role",
      ledgerPath,
      fetchImpl,
    });

    expect(result.appended).toEqual([`STR-${correction.id}`]);
    expect(result.superseded).toEqual([first.id]);
    const rulings = readRulingLedger(ledgerPath);
    expect(rulings).toHaveLength(1);
    expect(rulings[0].tier).toBe("referenced");
    expect(validateRulings(rulings)).toEqual([]);
  });

  // @req REQ-092
  it("appends no draft for a citation the ledger already rules on, and names it", async () => {
    const pulledEarlier = drafts[0];
    const lateCorrection = {
      ...drafts[0],
      id: "44444444-4444-4444-8444-444444444444",
      tier: "unverified",
      decided_at: "2026-09-15T09:00:00.000Z",
    };
    const options = {
      supabaseUrl: "https://db.example",
      serviceRoleKey: "service-role",
      ledgerPath,
    };
    await pullSourceTierRulings({
      ...options,
      fetchImpl: vi.fn(
        async () =>
          new Response(JSON.stringify([pulledEarlier]), { status: 200 })
      ),
    });
    const afterFirst = fs.readFileSync(ledgerPath, "utf8");

    const result = await pullSourceTierRulings({
      ...options,
      fetchImpl: vi.fn(
        async () =>
          new Response(JSON.stringify([pulledEarlier, lateCorrection]), {
            status: 200,
          })
      ),
    });

    expect(result.appended).toEqual([]);
    expect(result.alreadyRuled).toEqual([lateCorrection.id]);
    expect(fs.readFileSync(ledgerPath, "utf8")).toBe(afterFirst);
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
