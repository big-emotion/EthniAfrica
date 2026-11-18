/**
 * An in-memory stand-in for the slice of the supabase-js query builder the
 * services use, so a service test can assert what a read *returns* from a
 * set of rows — which rows a filter keeps — rather than which builder
 * methods were called.
 *
 * It evaluates filters, ordering, limits and writes on plain arrays. Column
 * lists in `select()` are ignored: every row comes back whole, so a test that
 * cares about what is exposed asserts on the service's mapped output. Unique
 * constraints are opt-in per table and fail with Postgres's 23505, the code
 * services handle. Unsupported builder methods are absent on purpose: a
 * service that starts using one fails loudly here instead of passing on a
 * filter the fake silently skipped.
 */
import { randomUUID } from "node:crypto";

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;

interface FakeError {
  code: string;
  message: string;
}

interface FakeResult {
  data: unknown;
  error: FakeError | null;
  count?: number | null;
}

export interface FakeSupabaseOptions {
  /** Per table, the column sets that must be unique (NULLs never collide). */
  unique?: Record<string, string[][]>;
}

export interface FakeSupabase {
  tables: Record<string, Row[]>;
  client: { from: (table: string) => FakeQuery };
}

type Mode =
  | { kind: "select" }
  | { kind: "insert"; rows: Row[] }
  | { kind: "update"; patch: Row }
  | { kind: "delete" };

class FakeQuery implements PromiseLike<FakeResult> {
  private mode: Mode = { kind: "select" };
  private filters: Predicate[] = [];
  private sorts: Array<{ column: string; ascending: boolean }> = [];
  private maxRows: number | null = null;
  private offset = 0;
  private cardinality: "many" | "single" | "maybeSingle" = "many";
  private wantsCount = false;

  constructor(
    private readonly database: FakeSupabase,
    private readonly table: string,
    private readonly options: FakeSupabaseOptions
  ) {}

  select(_columns?: string, options?: { count?: string }) {
    if (options?.count) this.wantsCount = true;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.mode = { kind: "insert", rows: Array.isArray(rows) ? rows : [rows] };
    return this;
  }

  update(patch: Row) {
    this.mode = { kind: "update", patch };
    return this;
  }

  delete() {
    this.mode = { kind: "delete" };
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  is(column: string, value: null) {
    this.filters.push((row) => (row[column] ?? null) === value);
    return this;
  }

  not(column: string, operator: "is", value: null) {
    if (operator !== "is") throw new Error(`fake: not.${operator} unsupported`);
    this.filters.push((row) => (row[column] ?? null) !== value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sorts.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  range(from: number, to: number) {
    this.offset = from;
    this.maxRows = to - from + 1;
    return this;
  }

  single() {
    this.cardinality = "single";
    return this;
  }

  maybeSingle() {
    this.cardinality = "maybeSingle";
    return this;
  }

  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: (value: FakeResult) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: unknown) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private rows(): Row[] {
    this.database.tables[this.table] ??= [];
    return this.database.tables[this.table];
  }

  private matching(): Row[] {
    return this.rows().filter((row) => this.filters.every((keep) => keep(row)));
  }

  private violatesUnique(candidate: Row): boolean {
    return (this.options.unique?.[this.table] ?? []).some((columns) =>
      this.rows().some((existing) =>
        columns.every(
          (column) =>
            candidate[column] != null && existing[column] === candidate[column]
        )
      )
    );
  }

  private execute(): FakeResult {
    let affected: Row[];

    if (this.mode.kind === "insert") {
      affected = [];
      for (const input of this.mode.rows) {
        const row = {
          id: randomUUID(),
          created_at: new Date().toISOString(),
          ...input,
        };
        if (this.violatesUnique(row)) {
          return {
            data: null,
            error: { code: "23505", message: "duplicate key value" },
          };
        }
        this.rows().push(row);
        affected.push(row);
      }
    } else if (this.mode.kind === "update") {
      affected = this.matching();
      for (const row of affected) Object.assign(row, this.mode.patch);
    } else if (this.mode.kind === "delete") {
      affected = this.matching();
      this.database.tables[this.table] = this.rows().filter(
        (row) => !affected.includes(row)
      );
    } else {
      affected = [...this.matching()];
      for (const { column, ascending } of [...this.sorts].reverse()) {
        affected.sort((left, right) => {
          const a = String(left[column] ?? "");
          const b = String(right[column] ?? "");
          return ascending ? a.localeCompare(b) : b.localeCompare(a);
        });
      }
    }

    const count = affected.length;
    let page = affected.slice(this.offset);
    if (this.maxRows !== null) page = page.slice(0, this.maxRows);
    const copies = page.map((row) => ({ ...row }));

    if (this.cardinality === "many") {
      return {
        data: copies,
        error: null,
        count: this.wantsCount ? count : null,
      };
    }
    if (copies.length === 1) return { data: copies[0], error: null };
    if (copies.length === 0 && this.cardinality === "maybeSingle") {
      return { data: null, error: null };
    }
    return {
      data: null,
      error: { code: "PGRST116", message: `${copies.length} rows returned` },
    };
  }
}

// @req REQ-212
export function createFakeSupabase(
  tables: Record<string, Row[]> = {},
  options: FakeSupabaseOptions = {}
): FakeSupabase {
  const database: FakeSupabase = {
    tables,
    client: { from: (table) => new FakeQuery(database, table, options) },
  };
  return database;
}
