import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("@/lib/api/logger", () => ({ logger: { error: logError } }));

import { describeLegalHost } from "@/lib/legalHost";

// A legal notice that answers 500 is worse than one that names less, so the
// absence of the host is reported to the operator and never thrown at a reader.
describe("describeLegalHost", () => {
  beforeEach(() => {
    logError.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // @req REQ-088
  it("names the host and its address when the environment provides them", () => {
    vi.stubEnv("LEGAL_HOST_NAME", "Exemple Hébergement SAS");
    vi.stubEnv("LEGAL_HOST_ADDRESS", "1 rue de l’Exemple, 00000 Ville, Pays");

    expect(describeLegalHost("fr")).toBe(
      "par Exemple Hébergement SAS, 1 rue de l’Exemple, 00000 Ville, Pays"
    );
    expect(describeLegalHost("en")).toBe(
      "by Exemple Hébergement SAS, 1 rue de l’Exemple, 00000 Ville, Pays"
    );
    expect(logError).not.toHaveBeenCalled();
  });

  // @req REQ-088
  it("names the host alone when no address is configured", () => {
    vi.stubEnv("LEGAL_HOST_NAME", "Exemple Hébergement SAS");
    vi.stubEnv("LEGAL_HOST_ADDRESS", "");

    expect(describeLegalHost("fr")).toBe("par Exemple Hébergement SAS");
  });

  // @req REQ-088
  it("falls back to a description of the role, never to a provider's name", () => {
    vi.stubEnv("LEGAL_HOST_NAME", "");
    vi.stubEnv("LEGAL_HOST_ADDRESS", "");

    expect(describeLegalHost("fr")).toBe(
      "sur un serveur dédié exploité pour le compte de l’éditeur"
    );
    expect(describeLegalHost("en")).toBe(
      "on a dedicated server operated on the publisher’s behalf"
    );
  });

  // @req REQ-088
  it("reports the missing host to the operator instead of throwing", () => {
    vi.stubEnv("LEGAL_HOST_NAME", "");

    expect(() => describeLegalHost("fr")).not.toThrow();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  // The address without the name identifies nobody a reader could write to.
  // @req REQ-088
  it("treats an address with no name as an absent host", () => {
    vi.stubEnv("LEGAL_HOST_NAME", "");
    vi.stubEnv("LEGAL_HOST_ADDRESS", "1 rue de l’Exemple");

    expect(describeLegalHost("fr")).not.toContain("rue de l’Exemple");
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
