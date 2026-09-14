import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockRevalidateTag } = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: mockRevalidateTag }));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn() },
}));

import { POST } from "../route";

function revalidateRequest(authorization?: string) {
  return new NextRequest("http://localhost/api/admin/revalidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify({ tags: ["afrik-peoples"] }),
  });
}

describe("POST /api/admin/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("REVALIDATE_SECRET", "admin-revalidate-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // @req REQ-091
  it("invalidates the requested tags for the configured secret", async () => {
    const response = await POST(
      revalidateRequest("Bearer admin-revalidate-secret")
    );

    expect(response.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("afrik-peoples", "max");
  });

  // @req REQ-091
  it("refuses a wrong secret of the same length and invalidates nothing", async () => {
    const response = await POST(
      revalidateRequest("Bearer admin-revalidate-secreX")
    );

    expect(response.status).toBe(401);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  // @req REQ-091
  it("refuses every caller when no secret is configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");

    const response = await POST(revalidateRequest("Bearer "));

    expect(response.status).toBe(401);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});
