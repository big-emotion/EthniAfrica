import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/ratelimit/contactRateLimit", () => ({
  checkContactRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

import { __resetGraphToken } from "@/lib/email/graph";
import { checkContactRateLimit } from "@/lib/ratelimit/contactRateLimit";

import { POST } from "../route";

const validBody = {
  civility: "madame",
  firstName: "Aminata",
  lastName: "Diallo",
  email: "aminata@example.org",
  subject: "correction",
  message: "La fiche Peul cite une population de 1998, la source est datée.",
};

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Graph is two calls: the OAuth token, then the send. Selecting by URL rather
 * than by index means the assertions keep describing the mail even if the
 * transport ever mints a token it did not need.
 */
function graphSendCall() {
  return (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
    ([url]) => typeof url === "string" && url.includes("/sendMail")
  );
}

/**
 * The mail as a reader would describe it, lifted out of Graph's nesting. The
 * assertions below are about what was sent, not about the wire format, and
 * should not have to change again if the transport does.
 */
function sentPayload() {
  const call = graphSendCall();
  if (!call) throw new Error("no sendMail call was made");
  const [, init] = call;
  const { message } = JSON.parse((init as RequestInit).body as string);
  return {
    to: message.toRecipients[0]?.emailAddress?.address,
    replyTo: message.replyTo?.[0]?.emailAddress?.address,
    subject: message.subject,
    text: message.body.content,
  };
}

describe("POST /api/contact", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    __resetGraphToken();
    process.env.GRAPH_TENANT_ID = "tenant-test";
    process.env.GRAPH_CLIENT_ID = "client-test";
    process.env.GRAPH_CLIENT_SECRET = "secret-test";
    process.env.MAIL_SENDER = "contact@ethniafrica.com";
    // Graph is two calls, not one: the token, then the send. Both are answered
    // here so the route sees a transport that works end to end.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: async () => "",
      json: async () => ({ access_token: "tok-test", expires_in: 3600 }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GRAPH_TENANT_ID;
    delete process.env.GRAPH_CLIENT_ID;
    delete process.env.GRAPH_CLIENT_SECRET;
    delete process.env.MAIL_SENDER;
  });

  // @req REQ-045
  it("accepts a complete message and reports it sent", async () => {
    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });

  // @req REQ-045
  it("delivers the message to the atlas's contact address", async () => {
    await POST(postRequest(validBody));

    expect(sentPayload().to).toBe("contact@ethniafrica.com");
  });

  /**
   * Without this the recipient can read a message and not answer it: the
   * sender's address is in the body, and the From is our own transport.
   */
  // @req REQ-045
  it("addresses the reply to the reader who wrote", async () => {
    await POST(postRequest(validBody));

    expect(sentPayload().replyTo).toBe("aminata@example.org");
  });

  // @req REQ-045
  it("puts the chosen subject in the mail's own subject line", async () => {
    await POST(postRequest(validBody));

    expect(sentPayload().subject).toContain(
      "Signaler une erreur ou une imprécision"
    );
  });

  // @req REQ-045
  it("carries the sender's identity and their words into the body", async () => {
    await POST(postRequest(validBody));

    const { text } = sentPayload();
    expect(text).toContain("Aminata");
    expect(text).toContain("Diallo");
    expect(text).toContain("aminata@example.org");
    expect(text).toContain("la source est datée");
  });

  // @req REQ-045
  it("refuses an incomplete message and names the fields at fault", async () => {
    const response = await POST(postRequest({ ...validBody, email: "nope" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors).toHaveProperty("email");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // @req REQ-140
  it("localizes reader-facing validation messages from the submitted locale", async () => {
    const response = await POST(
      postRequest({ ...validBody, language: "en", email: "nope" })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "VALIDATION_ERROR",
      message: "The form contains fields that need correcting.",
      fieldErrors: {
        email: ["Enter a valid email address."],
      },
    });
  });

  /**
   * A bot that fills the hidden field is answered exactly as a reader is, so
   * it learns nothing — and nothing is mailed.
   */
  // @req REQ-045
  it("swallows a message whose hidden field was filled", async () => {
    const response = await POST(
      postRequest({ ...validBody, honeypot: "https://spam.example" })
    );

    expect(response.status).toBe(201);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // @req REQ-045
  it("refuses a body that is not JSON at all", async () => {
    const request = new NextRequest("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  /**
   * The alternative — answering 201 with nothing sent — is the failure the
   * antibot secret already produced once: a green build over a dead form.
   */
  // @req REQ-045
  it("says the message did not leave when no transport is configured", async () => {
    delete process.env.MAIL_SENDER;

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      contactEmail: "contact@ethniafrica.com",
    });
  });

  // @req REQ-045
  it("says the message did not leave when the transport refuses it", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => "domain not verified",
    });

    const response = await POST(postRequest(validBody));

    expect(response.status).toBe(502);
  });
});

describe("POST /api/contact — per-sender quota", () => {
  const originalFetch = global.fetch;

  function requestFrom(address: string, body: unknown) {
    return new NextRequest("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": `${address}, 10.0.0.1`,
      },
      body: JSON.stringify(body),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: async () => "",
      json: async () => ({ access_token: "tok-test", expires_in: 3600 }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // @req REQ-045
  it("answers 429 with Retry-After once the sender's quota is spent, and sends nothing", async () => {
    vi.mocked(checkContactRateLimit).mockResolvedValueOnce({
      allowed: false,
      retryAfter: 120,
    });

    const response = await POST(requestFrom("203.0.113.9", validBody));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    expect(body.error).toBe("RATE_LIMITED");
    expect(body.message).toContain("Réessayez plus tard");
    expect(checkContactRateLimit).toHaveBeenCalledWith("203.0.113.9");
    expect(graphSendCall()).toBeUndefined();
  });

  // @req REQ-145
  it("says so in English to an English sender", async () => {
    vi.mocked(checkContactRateLimit).mockResolvedValueOnce({
      allowed: false,
      retryAfter: 60,
    });

    const response = await POST(
      requestFrom("203.0.113.9", { ...validBody, language: "en" })
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.message).toContain("Try again later");
  });

  // @req REQ-045
  it("counts a bot that fills the honeypot against its quota too", async () => {
    vi.mocked(checkContactRateLimit).mockResolvedValueOnce({
      allowed: false,
      retryAfter: 60,
    });

    const response = await POST(
      requestFrom("198.51.100.4", { ...validBody, honeypot: "filled" })
    );

    expect(response.status).toBe(429);
  });

  // @req REQ-045
  it("still answers the honeypot as a success while the quota lasts", async () => {
    const response = await POST(
      requestFrom("198.51.100.4", { ...validBody, honeypot: "filled" })
    );

    expect(response.status).toBe(201);
    expect(graphSendCall()).toBeUndefined();
  });
});
