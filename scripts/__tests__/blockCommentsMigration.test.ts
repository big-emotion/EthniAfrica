/**
 * Static analysis of migration 117 — block comments stored on `flags`.
 *
 * Same discipline as the other migration contracts here: the SQL text is read
 * for its contract, no Postgres is applied in CI. The live behaviour (anon
 * never sees an unpublished or hidden flag) is covered by
 * `supabase/__tests__/flags-rls.test.ts` when a local stack is running.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BLOCK_SECTIONS, BLOCK_SUBJECTS } from "@/lib/comments/blockKey";
import { PUBLIC_FLAG_SELECT } from "@/lib/flags/publicFlagColumns";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

function readMigration(prefix: string): string {
  const name = readdirSync(MIGRATIONS).find((file) => file.startsWith(prefix));
  if (!name) throw new Error(`No migration starting with ${prefix}`);
  return readFileSync(join(MIGRATIONS, name), "utf8");
}

const flat = (text: string) =>
  text
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();

const ddl = () => flat(readMigration("117_"));

function alternativesIn(pattern: string, position: "first" | "last") {
  const groups = [...pattern.matchAll(/\(([a-z_|-]+)\)/g)].map((m) => m[1]);
  const group = position === "first" ? groups[0] : groups.at(-1);
  return group.split("|");
}

describe("117 flags: a comment is a flag anchored to a block", () => {
  // @req REQ-212
  it("checks block_key against the same vocabulary as blockKey.ts", () => {
    const check = /CONSTRAINT flags_block_key_shape CHECK \(([^;]*)\);/.exec(
      ddl()
    );
    expect(check).not.toBeNull();
    const pattern = /'(\^[^']+\$)'/.exec(check[1])[1];

    expect(alternativesIn(pattern, "first")).toEqual([...BLOCK_SUBJECTS]);
    expect(alternativesIn(pattern, "last")).toEqual([...BLOCK_SECTIONS]);
  });

  // @req REQ-212
  it("limits knowledge_basis to the four neutral answers", () => {
    expect(ddl()).toContain(
      "CHECK (knowledge_basis IS NULL OR knowledge_basis IN ('family', 'language', 'reading', 'other'))"
    );
  });

  // Flags filed before the migration were already public; re-running the
  // migration must not publish a comment that is waiting for its address.
  // @req REQ-212
  it("backfills published_at only on the run that adds the column", () => {
    const sql = ddl();
    const guard = sql.indexOf("column_name = 'published_at'");
    const add = sql.indexOf(
      "ALTER TABLE public.flags ADD COLUMN published_at timestamptz;"
    );
    const backfill = sql.indexOf(
      "UPDATE public.flags SET published_at = created_at;"
    );

    expect(guard).toBeGreaterThan(-1);
    expect(add).toBeGreaterThan(guard);
    expect(backfill).toBeGreaterThan(add);
    expect(sql).not.toMatch(/published_at timestamptz (NOT NULL|DEFAULT)/i);
  });

  // @req REQ-212
  it("indexes the visible comments of a block", () => {
    expect(ddl()).toContain(
      "ON public.flags (block_key) WHERE published_at IS NOT NULL AND hidden_at IS NULL;"
    );
  });
});

describe("117 flags: the public reads published, visible flags only", () => {
  // @req REQ-212
  it("replaces the read-everything policy with the publication rule", () => {
    const sql = ddl();

    expect(sql).toContain(
      "DROP POLICY IF EXISTS flags_read_public ON public.flags;"
    );
    expect(sql).toContain(
      "CREATE POLICY flags_read_public ON public.flags FOR SELECT TO anon, authenticated USING (published_at IS NOT NULL AND hidden_at IS NULL);"
    );
  });

  // @req REQ-212
  it("grants the new public columns and never the moderator's reason", () => {
    const match =
      /GRANT SELECT \(([^)]*)\) ON public\.flags TO anon, authenticated;/.exec(
        ddl()
      );
    expect(match).not.toBeNull();
    const granted = match[1].split(",").map((column) => column.trim());

    expect(granted).toEqual([
      "block_key",
      "published_at",
      "hidden_at",
      "knowledge_basis",
    ]);
    expect(granted).not.toContain("hidden_reason");
    for (const column of granted) {
      expect(PUBLIC_FLAG_SELECT.split(", ")).toContain(column);
    }
  });
});

describe("117 replies and reader reports: service-role only", () => {
  // @req REQ-212
  it.each(["flag_replies", "flag_abuse_reports"])(
    "%s has RLS on, no policy and no public privilege",
    (table) => {
      const sql = ddl();

      expect(sql).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      );
      expect(sql).toContain(
        `REVOKE ALL ON public.${table} FROM anon, authenticated;`
      );
      expect(sql).not.toMatch(
        new RegExp(`CREATE POLICY \\w+ ON (public\\.)?${table}`, "i")
      );
    }
  );

  // @req REQ-212
  it("a reader report names exactly one target, once per address hash", () => {
    const sql = ddl();

    expect(sql).toContain("CHECK (num_nonnulls(flag_id, reply_id) = 1)");
    expect(sql).toContain(
      "ON public.flag_abuse_reports (flag_id, ip_hash) WHERE flag_id IS NOT NULL;"
    );
    expect(sql).toContain(
      "ON public.flag_abuse_reports (reply_id, ip_hash) WHERE reply_id IS NOT NULL;"
    );
  });
});
