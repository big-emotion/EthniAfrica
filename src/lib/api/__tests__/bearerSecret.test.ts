import { describe, expect, it } from "vitest";
import { matchesBearerSecret } from "../bearerSecret";

describe("matchesBearerSecret", () => {
  // @req REQ-091
  it("accepts exactly the configured secret as a Bearer credential", () => {
    expect(matchesBearerSecret("Bearer s3cret-value", "s3cret-value")).toBe(
      true
    );
  });

  // @req REQ-091
  it("refuses a wrong secret of the same length", () => {
    expect(matchesBearerSecret("Bearer s3cret-valuX", "s3cret-value")).toBe(
      false
    );
  });

  // @req REQ-091
  it("refuses a secret of a different length instead of throwing", () => {
    expect(matchesBearerSecret("Bearer s3cret", "s3cret-value")).toBe(false);
    expect(
      matchesBearerSecret("Bearer s3cret-value-longer", "s3cret-value")
    ).toBe(false);
  });

  // @req REQ-091
  it("refuses a missing header or a credential without the Bearer scheme", () => {
    expect(matchesBearerSecret(null, "s3cret-value")).toBe(false);
    expect(matchesBearerSecret("s3cret-value", "s3cret-value")).toBe(false);
  });

  // @req REQ-091
  it("refuses everyone when no secret is configured, an empty Bearer included", () => {
    expect(matchesBearerSecret("Bearer ", undefined)).toBe(false);
    expect(matchesBearerSecret("Bearer ", "")).toBe(false);
    expect(matchesBearerSecret("Bearer undefined", undefined)).toBe(false);
  });
});
