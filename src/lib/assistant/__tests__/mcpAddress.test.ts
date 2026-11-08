// @req REQ-045
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMcpAddress } from "@/lib/assistant/mcpAddress";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("the address a reader pastes into an assistant", () => {
  // @req REQ-045
  it("is the site origin followed by the MCP route", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemple.test");

    expect(getMcpAddress()).toBe("https://exemple.test/api/v2/mcp");
  });

  // @req REQ-045
  it("does not double the slash when the configured origin ends with one", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemple.test/");

    expect(getMcpAddress()).toBe("https://exemple.test/api/v2/mcp");
  });
});
