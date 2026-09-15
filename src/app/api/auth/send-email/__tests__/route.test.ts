import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendViaGraph: vi.fn(),
  graphConfigured: vi.fn(),
}));

// Microsoft Graph is the boundary: everything up to the message handed to it
// runs for real — the signature check, the link, the language, the copy.
vi.mock("@/lib/email/graph", () => ({
  sendViaGraph: mocks.sendViaGraph,
  graphConfigured: mocks.graphConfigured,
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { POST } from "../route";

const SIGNING_KEY = Buffer.from("send-email-hook-test-signing-key");
const HOOK_SECRET = `v1,whsec_${SIGNING_KEY.toString("base64")}`;

const FRENCH_CALLBACK =
  "https://ethniafrica.com/api/auth/callback?redirect=%2Ffr%2Fadmin";
const ENGLISH_CALLBACK =
  "https://ethniafrica.com/api/auth/callback?redirect=%2Fen%2Fadmin";

function hookPayload(emailData: Record<string, string> = {}) {
  return {
    user: { email: "contact@ethniafrica.com" },
    email_data: {
      token: "123456",
      token_hash: "pkce_abc123",
      redirect_to: FRENCH_CALLBACK,
      email_action_type: "magiclink",
      site_url: "https://ethniafrica.com",
      token_new: "",
      token_hash_new: "",
      ...emailData,
    },
  };
}

// Signed the way GoTrue signs it: Standard Webhooks, HMAC-SHA256 over
// `id.timestamp.body` with the base64 key that follows `v1,whsec_`.
function signedHookRequest(
  payload: unknown,
  {
    key = SIGNING_KEY,
    timestamp = Math.floor(Date.now() / 1000),
  }: { key?: Buffer; timestamp?: number } = {}
) {
  const body = JSON.stringify(payload);
  const id = "msg_2m1nd8f";
  const signature = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");

  return new Request("https://ethniafrica.com/api/auth/send-email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(timestamp),
      "webhook-signature": `v1,${signature}`,
    },
    body,
  });
}

function sentMessage() {
  return mocks.sendViaGraph.mock.calls[0][0] as {
    to: string;
    subject: string;
    text: string;
  };
}

describe("POST /api/auth/send-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SEND_EMAIL_HOOK_SECRET", HOOK_SECRET);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.ethniafrica.com");
    mocks.graphConfigured.mockReturnValue(true);
    mocks.sendViaGraph.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // @req REQ-042
  it("mails the moderator a sign-in link that verifies against Supabase and returns to the callback", async () => {
    const response = await POST(signedHookRequest(hookPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    expect(mocks.sendViaGraph).toHaveBeenCalledTimes(1);
    expect(sentMessage().to).toBe("contact@ethniafrica.com");
    expect(sentMessage().text).toContain(
      "https://supabase.ethniafrica.com/auth/v1/verify?token=pkce_abc123&type=magiclink&redirect_to=https%3A%2F%2Fethniafrica.com%2Fapi%2Fauth%2Fcallback%3Fredirect%3D%252Ffr%252Fadmin"
    );
  });

  // An address never confirmed before receives a signup link, not a magic
  // link: the first sign-in of every moderator takes this path.
  // @req REQ-042
  it("keeps the action GoTrue asked for, so a first sign-in confirms the account", async () => {
    await POST(signedHookRequest(hookPayload({ email_action_type: "signup" })));

    expect(sentMessage().text).toContain("&type=signup&");
  });

  // @req REQ-042
  it("writes in English when the sign-in was asked for from the English console", async () => {
    await POST(signedHookRequest(hookPayload()));
    const french = sentMessage();
    mocks.sendViaGraph.mockClear();

    await POST(
      signedHookRequest(hookPayload({ redirect_to: ENGLISH_CALLBACK }))
    );
    const english = sentMessage();

    expect(english.subject).not.toBe(french.subject);
    expect(english.text).toContain("redirect%3D%252Fen%252Fadmin");
  });

  // @req REQ-042
  it("refuses a request signed with another key and sends nothing", async () => {
    const response = await POST(
      signedHookRequest(hookPayload(), {
        key: Buffer.from("somebody-elses-key"),
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.sendViaGraph).not.toHaveBeenCalled();
  });

  // A captured request replayed later must not mail a fresh copy of the link.
  // @req REQ-042
  it("refuses a correctly signed request that is too old to be fresh", async () => {
    const response = await POST(
      signedHookRequest(hookPayload(), {
        timestamp: Math.floor(Date.now() / 1000) - 10 * 60,
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.sendViaGraph).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("refuses everything while no hook secret is configured", async () => {
    vi.stubEnv("SEND_EMAIL_HOOK_SECRET", "");

    const response = await POST(signedHookRequest(hookPayload()));

    expect(response.status).toBe(401);
    expect(mocks.sendViaGraph).not.toHaveBeenCalled();
  });

  // The console only ever asks for links. A code-only or notification mail
  // arriving here means Auth was reconfigured, and saying so beats sending a
  // message nobody wrote.
  // @req REQ-042
  it("refuses a mail kind the console never asks for", async () => {
    const response = await POST(
      signedHookRequest(hookPayload({ email_action_type: "reauthentication" }))
    );

    expect(response.status).toBe(400);
    expect(mocks.sendViaGraph).not.toHaveBeenCalled();
  });

  // GoTrue turns a non-200 into a failed sign-in request; answering 200 when
  // nothing left would bury the outage behind the sign-in page's neutral answer.
  // @req REQ-042
  it("reports an unconfigured mail transport as a failure instead of pretending to send", async () => {
    mocks.graphConfigured.mockReturnValue(false);

    const response = await POST(signedHookRequest(hookPayload()));

    expect(response.status).toBe(503);
    expect((await response.json()).error.message).toBeTruthy();
    expect(mocks.sendViaGraph).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("reports a mail Microsoft refused as a failure", async () => {
    mocks.sendViaGraph.mockResolvedValue(false);

    const response = await POST(signedHookRequest(hookPayload()));

    expect(response.status).toBe(502);
    expect((await response.json()).error.http_code).toBe(502);
  });
});
