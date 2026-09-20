import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessibilityPage from "@/app/[lang]/accessibilite/page";
import LegalNoticePage from "@/app/[lang]/mentions-legales/page";
import DataPolicyPage from "@/app/[lang]/politique-de-donnees/page";

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    language,
  }: {
    children: React.ReactNode;
    language: string;
  }) => <div data-language={language}>{children}</div>,
}));

vi.mock("@/lib/api/logger", () => ({ logger: { error: vi.fn() } }));

const routeParams = (lang: string) => Promise.resolve({ lang });

afterEach(() => {
  vi.unstubAllEnvs();
});

/** The text of one `<section>` as a reader meets it, found from its heading. */
function sectionText(heading: string): string {
  const title = screen.getByRole("heading", { level: 2, name: heading });
  return title.closest("section")?.textContent ?? "";
}

describe("footer destination pages", () => {
  // @req REQ-088
  it("identifies BIG EMOTION as EthniAfrica's publisher", async () => {
    render(await LegalNoticePage({ params: routeParams("fr") }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Mentions légales" })
    ).toBeInTheDocument();
    expect(screen.getByText(/BIG EMOTION, SASU/i)).toBeInTheDocument();
    expect(screen.getAllByText(/hello@big-emotion\.com/i)).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Conception et réalisation",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /La conception et la réalisation du site ont été confiées à l’agence BIG EMOTION\./i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Site web : big-emotion\.com\./i)
    ).toBeInTheDocument();
  });

  // The host is production's own machine, and its name is configuration: the
  // repository is public and does not carry it.
  // @req REQ-088
  it("names the host the environment provides, and no platform the site does not run on", async () => {
    vi.stubEnv("LEGAL_HOST_NAME", "Exemple Hébergement SAS");
    vi.stubEnv("LEGAL_HOST_ADDRESS", "1 rue de l’Exemple, 00000 Ville, Pays");
    const { container } = render(
      await LegalNoticePage({ params: routeParams("fr") })
    );

    const hosting = sectionText("Hébergement");
    expect(hosting).toContain("Exemple Hébergement SAS");
    expect(hosting).toContain("Union européenne");
    expect(container.textContent).not.toMatch(/Vercel/i);
  });

  // @req REQ-088
  it("states the role of the host, without a name, when none is configured", async () => {
    vi.stubEnv("LEGAL_HOST_NAME", "");
    vi.stubEnv("LEGAL_HOST_ADDRESS", "");
    render(await LegalNoticePage({ params: routeParams("fr") }));

    expect(sectionText("Hébergement")).toContain(
      "serveur dédié exploité pour le compte de l’éditeur"
    );
  });

  // @req REQ-088
  it("declares every processor the site contacts about a reader, in both languages", async () => {
    for (const [lang, heading, upstashRegion] of [
      ["fr", "Services et sous-traitants", /Upstash, Inc\.[^.]*Francfort/],
      ["en", "Services and processors", /Upstash, Inc\.[^.]*Frankfurt/],
    ] as const) {
      const { unmount } = render(
        await DataPolicyPage({ params: routeParams(lang) })
      );
      const processors = sectionText(heading);
      // Measured in Upstash's console: the Redis instance is in eu-central-1.
      expect(processors, lang).toMatch(upstashRegion);
      expect(processors, lang).toMatch(/Microsoft/);
      expect(processors, lang).not.toMatch(/Vercel/i);
      unmount();
    }
  });

  // The site contacts Google only after the reader asks for a video, and says
  // so where it names its processors and where it names its legal bases. This
  // stops being true the day ENABLED_EMBED_PROVIDERS is emptied, and the two
  // paragraphs must leave in the same commit.
  // @req REQ-182
  it("declares the YouTube player, and the consent it rests on, in both languages", async () => {
    for (const [lang, processorsHeading, basesHeading, google, consent] of [
      [
        "fr",
        "Services et sous-traitants",
        "Finalités et bases légales",
        /Google Ireland Limited/,
        /repose sur votre consentement/,
      ],
      [
        "en",
        "Services and processors",
        "Purposes and legal bases",
        /Google Ireland Limited/,
        /rests on your consent/,
      ],
    ] as const) {
      const { unmount } = render(
        await DataPolicyPage({ params: routeParams(lang) })
      );
      const processors = sectionText(processorsHeading);
      expect(processors, lang).toMatch(google);
      expect(processors, lang).toMatch(/youtube-nocookie\.com/);
      expect(processors, lang).toMatch(
        lang === "fr"
          ? /aucune requête n’est adressée à Google/
          : /no request is made to Google/
      );
      expect(sectionText(basesHeading), lang).toMatch(consent);
      unmount();
    }
  });

  // @req REQ-088
  it("describes Plausible as self-hosted and shared with the publisher's other site", async () => {
    render(await DataPolicyPage({ params: routeParams("fr") }));

    const processors = sectionText("Services et sous-traitants");
    expect(processors).toMatch(/Plausible[^.]*auto-hébergé/);
    expect(processors).toMatch(/big-emotion\.com/);
  });

  // The consent choice lives in localStorage, and calling it a cookie is what
  // the banner, the footer and this page each did differently.
  // @req REQ-088
  it("has a cookies section that says where the choice is kept", async () => {
    for (const [lang, heading, storage] of [
      ["fr", "Cookies et stockage local", /stockage local/],
      ["en", "Cookies and local storage", /local storage/],
    ] as const) {
      const { unmount } = render(
        await DataPolicyPage({ params: routeParams(lang) })
      );
      const cookies = sectionText(heading);
      expect(cookies, lang).toMatch(storage);
      expect(cookies, lang).toMatch(/ethni-consent/);
      expect(cookies, lang).toMatch(/ethni-locale/);
      unmount();
    }
  });

  // @req REQ-088
  it("describes EthniAfrica's actual data-processing categories", async () => {
    render(await DataPolicyPage({ params: routeParams("fr") }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Politique de données" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Supabase/i)).toBeInTheDocument();
    expect(screen.getByText(/Plausible Analytics/i)).toBeInTheDocument();
  });

  // Sentry has no DSN provisioned anywhere: naming it would declare a
  // processor the site never contacts.
  // @req REQ-088
  it("names no processor that is not active", async () => {
    for (const lang of ["fr", "en"] as const) {
      const { container, unmount } = render(
        await DataPolicyPage({ params: routeParams(lang) })
      );
      expect(container.textContent, lang).not.toMatch(/Sentry/i);
      unmount();
    }
  });

  // @req REQ-090
  it("states accessibility status without claiming an unaudited score", async () => {
    render(await AccessibilityPage({ params: routeParams("fr") }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Accessibilité" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/n’a pas encore fait l’objet d’un audit/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/contact@ethniafrica\.com/i)).toBeInTheDocument();
  });

  // The legal copy is French either way; the chrome around it must follow
  // the route, or an English reader gets a French header on `/en/legal-notice`.
  // @req REQ-140
  it("hand the shell the locale of the route each was served under", async () => {
    for (const Page of [LegalNoticePage, DataPolicyPage, AccessibilityPage]) {
      const { container, unmount } = render(
        await Page({ params: routeParams("en") })
      );
      expect(container.firstElementChild).toHaveAttribute(
        "data-language",
        "en"
      );
      unmount();
    }
  });
});
