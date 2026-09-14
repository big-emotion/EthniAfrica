import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { clearConsent, saveConsent } from "@/lib/consent";
import { getLocalizedRoute } from "@/lib/routing";

describe("Sentry runtime configurations", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(Sentry.init).mockClear();
  });

  // The SDK's default has flipped between majors. Stated explicitly so an
  // upgrade cannot start attaching IPs, cookies and request bodies to every
  // event behind the scrubber's back.
  // @req REQ-057
  it.each([
    ["client", () => import("../../../../sentry.client.config")],
    ["server", () => import("../../../../sentry.server.config")],
    ["edge", () => import("../../../../sentry.edge.config")],
  ])(
    "the %s runtime never sends default PII and always scrubs",
    async (_runtime, load) => {
      await load();

      expect(Sentry.init).toHaveBeenCalledTimes(1);
      const options = vi.mocked(Sentry.init).mock.calls[0][0];
      expect(options?.sendDefaultPii).toBe(false);
      expect(options?.beforeSend).toBeTypeOf("function");
    }
  );

  /**
   * `sentry.client.config.ts` was imported by nothing: Next 16 loads browser
   * instrumentation from an `instrumentation-client.ts` file, and there was
   * none, so the client SDK — and every sample rate written in it — never ran.
   */
  // @req REQ-057
  it("loads the client runtime through Next's instrumentation-client file", async () => {
    const hooks = await import("../../../instrumentation-client");
    const destination = getLocalizedRoute("fr", "quiz");

    expect(Sentry.init).toHaveBeenCalledTimes(1);
    hooks.onRouterTransitionStart(destination, "push");
    expect(Sentry.captureRouterTransitionStart).toHaveBeenCalledWith(
      destination,
      "push"
    );
  });

  /**
   * Browser tracing is what carries Core Web Vitals to Sentry, and it is
   * audience measurement: sampled only for a reader who accepted analytics,
   * the same choice that loads Plausible. Asked per trace, so a refusal made
   * mid-session stops the next page from being measured.
   */
  // @req REQ-046
  it("samples client traces, and the Web Vitals they carry, only under analytics consent", async () => {
    await import("../../../../sentry.client.config");
    const options = vi.mocked(Sentry.init).mock.calls[0][0];
    const sample = () =>
      options?.tracesSampler?.({ name: "/fr", inheritOrSampleWith: () => 0 });

    expect(options?.tracesSampleRate).toBeUndefined();
    expect(options?.beforeSendTransaction).toBeTypeOf("function");

    clearConsent();
    expect(sample()).toBe(0);

    saveConsent({
      hasConsented: true,
      preferences: { essential: true, analytics: true, functional: false },
      consentDate: new Date().toISOString(),
    });
    expect(sample()).toBeGreaterThan(0);
    expect(sample()).toBeLessThanOrEqual(0.1);

    clearConsent();
  });
});
