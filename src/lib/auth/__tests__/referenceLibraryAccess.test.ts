import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockIsEmailAllowlisted, mockCreateClient } = vi.hoisted(
  () => ({
    mockGetUser: vi.fn(),
    mockIsEmailAllowlisted: vi.fn(),
    mockCreateClient: vi.fn(),
  })
);

vi.mock("@/lib/auth/adminAllowlist", () => ({
  isEmailAllowlisted: mockIsEmailAllowlisted,
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: mockCreateClient,
}));

import { hasReferenceLibraryAccess } from "../referenceLibraryAccess";

function signedInAs(email: string) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-uuid-123", email } },
    error: null,
  });
}

describe("hasReferenceLibraryAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({ auth: { getUser: mockGetUser } });
  });

  // @req REQ-042
  it("opens the library to a session whose address is on the allowlist", async () => {
    signedInAs("moderation@example.org");
    mockIsEmailAllowlisted.mockResolvedValue(true);

    await expect(hasReferenceLibraryAccess()).resolves.toBe(true);
    expect(mockIsEmailAllowlisted).toHaveBeenCalledWith(
      "moderation@example.org"
    );
  });

  // @req REQ-042
  it("keeps it closed to a signed-in address the allowlist does not hold", async () => {
    signedInAs("reader@example.org");
    mockIsEmailAllowlisted.mockResolvedValue(false);

    await expect(hasReferenceLibraryAccess()).resolves.toBe(false);
  });

  // @req REQ-042
  it("keeps it closed without a session, and never reads the allowlist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(hasReferenceLibraryAccess()).resolves.toBe(false);
    expect(mockIsEmailAllowlisted).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("keeps it closed when the session cannot be read at all", async () => {
    mockCreateClient.mockRejectedValue(new Error("cookies unavailable"));

    await expect(hasReferenceLibraryAccess()).resolves.toBe(false);
  });
});
