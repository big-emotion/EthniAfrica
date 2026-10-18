import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../server", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "../../../server";
import { getAnsweredNameRows } from "../nameAddressEntries";

type Row = Record<string, unknown>;

/**
 * A Supabase double answering `.range()` out of a per-table fixture, with
 * each row projected onto the aliased column list it was asked for
 * (`name:name_main, name_history`), the way PostgREST does: a walk reading a
 * column it never selected finds nothing there.
 */
function supabaseServing(
  rowsByTable: Record<string, Row[]>,
  failures: Record<string, { code?: string; message: string }> = {}
) {
  let table = "";
  const selects: Record<string, string> = {};
  const client = {
    selects,
    from: vi.fn((name: string) => {
      table = name;
      return client;
    }),
    select: vi.fn((columns: string) => {
      selects[table] = columns;
      return client;
    }),
    range: vi.fn(async (start: number, end: number) => {
      if (failures[table]) {
        return { data: null, error: failures[table] };
      }
      const columns = selects[table].split(",").map((part) => part.trim());
      const data = (rowsByTable[table] ?? []).slice(start, end + 1).map((row) =>
        Object.fromEntries(
          columns.map((column) => {
            const [alias, source = alias] = column.split(":");
            return [alias, row[source]];
          })
        )
      );
      return { data, error: null };
    }),
  };
  return client;
}

const history = (nameText: string) => ({
  names: [{ nameText, accounts: [{ sources: [{ tier: "official" }] }] }],
});

function serve(client: ReturnType<typeof supabaseServing>) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
    client
  );
}

describe("the rows an address is decided from", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Each table files its name under its own column: peoples and family names
  // under name_main, countries and families under name_fr, languages under
  // name, words under name_main.
  // @req REQ-200
  it("reads the filed name and the name history of every answered kind", async () => {
    const client = supabaseServing({
      afrik_peoples: [{ name_main: "Wolof", name_history: history("Wolof") }],
      afrik_countries: [
        { name_fr: "Sénégal", name_history: history("Sénégal") },
      ],
      afrik_language_families: [
        { name_fr: "Bantou", name_history: history("Bantou") },
      ],
      afrik_languages: [{ name: "Lingala", name_history: history("Lingala") }],
      afrik_patronymes: [
        { name_main: "Traore", name_history: history("Traoré") },
      ],
      afrik_words: [{ name_main: "ethnie", name_history: history("ethnie") }],
    });
    serve(client);

    const rows = await getAnsweredNameRows();

    expect(rows.map((row) => row.name).sort()).toEqual(
      ["Bantou", "Lingala", "Sénégal", "Traore", "Wolof", "ethnie"].sort()
    );
    expect(rows.find((row) => row.name === "Traore")?.nameHistory).toEqual(
      history("Traoré")
    );
  });

  // The words table lands with its own migration, applied by hand: a stack
  // without it must still list the other five kinds. A table that is not
  // deployed stays absent until someone applies it, so holding that answer
  // for an hour is right.
  // @req REQ-200
  it("lists the other kinds when a table is not deployed on this stack", async () => {
    serve(
      supabaseServing(
        {
          afrik_peoples: [{ name_main: "Wolof", name_history: null }],
          afrik_languages: [{ name: "Lingala", name_history: null }],
        },
        {
          afrik_words: {
            code: "PGRST205",
            message: "Could not find the table 'public.afrik_words'",
          },
        }
      )
    );

    const rows = await getAnsweredNameRows();

    expect(rows.map((row) => row.name).sort()).toEqual(["Lingala", "Wolof"]);
  });

  // Any other failure is a hiccup, not a smaller corpus. Answering fewer rows
  // would be cached for an hour and turn every address of that table into a
  // 404; rejecting leaves nothing cached, so the next request reads again.
  // @req REQ-200
  it("rejects when a deployed table cannot be read", async () => {
    serve(
      supabaseServing(
        {
          afrik_peoples: [{ name_main: "Wolof", name_history: null }],
          afrik_languages: [{ name: "Lingala", name_history: null }],
        },
        { afrik_languages: { message: "range error" } }
      )
    );

    await expect(getAnsweredNameRows()).rejects.toThrow(/afrik_languages/);
  });

  // @req REQ-200
  it("rejects when the client cannot be built", async () => {
    (
      createServerClient as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(() => {
      throw new Error("missing SUPABASE_URL");
    });

    await expect(getAnsweredNameRows()).rejects.toThrow("missing SUPABASE_URL");
  });
});
