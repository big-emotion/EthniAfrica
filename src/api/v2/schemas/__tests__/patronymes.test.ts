import { describe, expect, it } from "vitest";

import { PATRONYME_NAME_SYSTEMS } from "@/lib/afrik/parsers/patronymeTypes";

import { patronymeNameSystemSchema } from "../patronymes";

describe("patronymeNameSystemSchema", () => {
  // @req REQ-133
  it("accepts exactly the naming systems the fiche parser accepts", () => {
    expect([...patronymeNameSystemSchema.options].sort()).toEqual(
      [...PATRONYME_NAME_SYSTEMS].sort()
    );
  });

  // @req REQ-133
  it("accepts hereditary_family_name and still rejects an unknown system", () => {
    expect(
      patronymeNameSystemSchema.safeParse("hereditary_family_name").success
    ).toBe(true);
    expect(patronymeNameSystemSchema.safeParse("surname").success).toBe(false);
  });
});
