import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestHeaders = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => requestHeaders.get(name) ?? null,
  })),
}));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
// next/font/google needs a build-time loader; the face variables are not the
// subject here.
vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "fraunces" }),
  Nunito_Sans: () => ({ variable: "nunito" }),
  JetBrains_Mono: () => ({ variable: "mono" }),
}));
vi.mock("@/index.css", () => ({}));
vi.mock("@/app/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/PlausibleScript", () => ({ default: () => null }));

import RootLayout from "@/app/layout";

const htmlElement = async () =>
  (await RootLayout({ children: null })) as ReactElement<{ lang: string }>;

/**
 * Assistive technology reads `<html lang>` before anything else on the page:
 * a page announced in the wrong language is read with the wrong
 * pronunciation rules from the first word. The site publishes French alone,
 * so the document says so whatever the request carries.
 */
describe("root layout document language", () => {
  beforeEach(() => {
    requestHeaders.clear();
  });

  // @req REQ-140
  it("declares the document French", async () => {
    expect((await htmlElement()).props.lang).toBe("fr");
  });

  // A header is the client's word; it never names the document's language.
  // @req REQ-140
  it("ignores a client-sent locale header", async () => {
    requestHeaders.set("x-locale", "en");
    expect((await htmlElement()).props.lang).toBe("fr");
  });
});
