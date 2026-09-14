import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/layout/SiteFooter";
import * as consentModule from "@/hooks/use-consent";

vi.mock("@/hooks/use-consent", () => ({ useConsent: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

/**
 * A footer link is text in both of its states, so its hover colour owes the
 * same 4.5:1 as its resting one. `hover:text-primary` resolved to #b64d20 on
 * the footer's #f5ede0 — 4.43:1 — and axe-core caught it mid-quiz, because a
 * short question screen leaves the pointer resting on « Jouer ».
 *
 * happy-dom computes no styles, so the classes the footer actually renders are
 * resolved against the token file here: the ground from its `bg-afh-*`, each
 * link's hover ink from its `hover:text-afh-*`. A hover colour that is not an
 * `--afh-*` token cannot be measured and fails for that reason — the shadcn
 * aliases are confined to `ui/` by the brand charter anyway.
 */

const colorCss = readFileSync(
  resolve(process.cwd(), "src/styles/tokens/color.css"),
  "utf8"
);
const rootBlock = colorCss.slice(0, colorCss.indexOf(".dark,"));

function tokenHex(name: string): string | null {
  let current = name;
  for (let hop = 0; hop < 8; hop += 1) {
    const match = rootBlock.match(
      new RegExp(`${current}:\\s*(#[0-9a-f]{6}|var\\(--[a-z0-9-]+\\))`, "i")
    );
    if (!match) return null;
    if (match[1].startsWith("#")) return match[1];
    current = match[1].slice(4, -1);
  }
  return null;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("SiteFooter link hover contrast", () => {
  beforeEach(() => {
    vi.mocked(consentModule.useConsent).mockReturnValue({
      consentState: {
        hasConsented: true,
        preferences: { essential: true, analytics: false, functional: false },
        consentDate: "2026-07-25T00:00:00.000Z",
      },
      acceptAll: vi.fn(),
      rejectAll: vi.fn(),
      updatePreferences: vi.fn(),
      showBanner: false,
      setShowBanner: vi.fn(),
    });
  });

  // @req REQ-088
  it("keeps every hovered footer link at AA contrast on the footer ground", () => {
    render(<SiteFooter language="fr" />);

    const footer = screen.getByTestId("site-footer");
    const groundToken = footer.className.match(/(?:^|\s)bg-(afh-[\w-]+)/)?.[1];
    const ground = groundToken ? tokenHex(`--${groundToken}`) : null;
    expect(ground, "the footer must paint its ground from a token").toMatch(
      /^#[0-9a-f]{6}$/i
    );

    // Text links only. The follow row's icon-only links are non-text content,
    // held to 3:1 by WCAG 1.4.11, which their accent hover already clears.
    const textLinks = [...footer.querySelectorAll("a")].filter((link) =>
      link.textContent?.trim()
    );
    const hoverInks = textLinks.flatMap((link) =>
      [...link.className.matchAll(/(?:^|\s)hover:text-([\w-]+)/g)].map(
        (match) => ({ link: link.textContent?.trim(), utility: match[1] })
      )
    );
    expect(hoverInks.length).toBeGreaterThan(0);

    const failures = hoverInks
      .map(({ link, utility }) => {
        const hex = utility.startsWith("afh-")
          ? tokenHex(`--${utility}`)
          : null;
        if (!hex)
          return `${link}: hover:text-${utility} is not an --afh-* token`;
        const ratio = contrastRatio(hex, ground!);
        return ratio < 4.5
          ? `${link}: hover:text-${utility} is ${ratio.toFixed(2)}:1`
          : null;
      })
      .filter(Boolean);

    expect(failures).toEqual([]);
  });
});
