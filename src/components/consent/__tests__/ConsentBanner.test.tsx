// @req REQ-046
// @req REQ-088
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentBanner } from "../ConsentBanner";
import * as useConsentModule from "@/hooks/use-consent";
import { consentCopy } from "@/lib/i18n/copy/consent";
import { FALLBACK_LOCALE } from "@/lib/locale";
import { getStaticPageRoute } from "@/lib/routing";

vi.mock("@/hooks/use-consent", () => ({
  useConsent: vi.fn(),
}));

// The banner is mounted above the `[lang]` segment, so it reads the locale
// off the route params rather than off a prop. Mutable so a case can put the
// banner outside the locale tree.
const routeParams = vi.hoisted(() => ({ current: { lang: "fr" } as object }));

vi.mock("next/navigation", () => ({
  useParams: () => routeParams.current,
}));

// Radix's switch measures itself.
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock;

const STRIP_NAME = "Gestion des cookies";

// The order the strip is read in and tabbed through, at every width
// (brief 12, approval record item 5).
const CONTROL_ORDER = [
  "Personnaliser",
  "Politique de données",
  "Refuser",
  "Accepter",
];

function stripControls() {
  const strip = screen.getByRole("dialog", { name: STRIP_NAME });
  return [
    within(strip).getByRole("button", { name: "Personnaliser" }),
    within(strip).getByRole("link", { name: "Politique de données" }),
    within(strip).getByRole("button", { name: "Refuser" }),
    within(strip).getByRole("button", { name: "Accepter" }),
  ];
}

describe("ConsentBanner", () => {
  const mockAcceptAll = vi.fn();
  const mockRejectAll = vi.fn();
  const mockUpdatePreferences = vi.fn();
  const mockSetShowBanner = vi.fn();

  const defaultMockContext = {
    consentState: {
      hasConsented: false,
      preferences: {
        essential: true,
        analytics: false,
        functional: false,
        embeds: false,
      },
      consentDate: null,
    },
    acceptAll: mockAcceptAll,
    rejectAll: mockRejectAll,
    updatePreferences: mockUpdatePreferences,
    setEmbedsConsent: vi.fn(),
    showBanner: true,
    setShowBanner: mockSetShowBanner,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConsentModule.useConsent).mockReturnValue(defaultMockContext);
    routeParams.current = { lang: "fr" };
  });

  // @req REQ-046
  it("does not render when showBanner is false", () => {
    vi.mocked(useConsentModule.useConsent).mockReturnValue({
      ...defaultMockContext,
      showBanner: false,
    });

    render(<ConsentBanner />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // The strip has no visible title: it is named by the words of the footer
  // button that reopens it.
  it("is a dialog named « Gestion des cookies », with no heading", () => {
    // @req REQ-046
    render(<ConsentBanner />);

    const strip = screen.getByRole("dialog", { name: STRIP_NAME });
    expect(strip).toHaveAttribute("aria-modal", "false");
    expect(within(strip).queryByRole("heading")).not.toBeInTheDocument();
  });

  it("states what the measurement collects, and leaves the storage detail to « Personnaliser »", async () => {
    // @req REQ-046
    const user = userEvent.setup();
    render(<ConsentBanner />);

    const strip = screen.getByRole("dialog", { name: STRIP_NAME });
    expect(within(strip).getByText(consentCopy.fr.strip)).toBeInTheDocument();
    expect(within(strip).queryByText(/stockage local/)).not.toBeInTheDocument();

    await user.click(
      within(strip).getByRole("button", { name: "Personnaliser" })
    );

    expect(within(strip).getByText(/stockage local/)).toBeInTheDocument();
  });

  // A pre-focused answer is the one a key press gives: refusing must be as
  // easy as accepting, so the strip itself holds the focus.
  it("takes the focus itself on arrival, not one of the two answers", () => {
    // @req REQ-088
    render(<ConsentBanner />);

    expect(screen.getByRole("dialog", { name: STRIP_NAME })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Accepter" })).not.toHaveFocus();
    expect(screen.getByRole("button", { name: "Refuser" })).not.toHaveFocus();
  });

  it("refuses on Escape and gives the focus back to where it was", () => {
    // @req REQ-088
    const before = document.createElement("button");
    document.body.appendChild(before);
    before.focus();

    render(<ConsentBanner />);
    fireEvent.keyDown(screen.getByRole("dialog", { name: STRIP_NAME }), {
      key: "Escape",
      code: "Escape",
    });

    expect(mockRejectAll).toHaveBeenCalledTimes(1);
    expect(before).toHaveFocus();
    before.remove();
  });

  it("puts « Personnaliser », « Politique de données », « Refuser », « Accepter » in that order", () => {
    // @req REQ-046
    render(<ConsentBanner />);

    const controls = stripControls();
    expect(controls.map((control) => control.textContent)).toEqual(
      CONTROL_ORDER
    );
    for (let i = 1; i < controls.length; i += 1) {
      expect(
        controls[i - 1].compareDocumentPosition(controls[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it("tabs from the strip through the four controls in their reading order", async () => {
    // @req REQ-046
    const user = userEvent.setup();
    render(<ConsentBanner />);

    const visited: (string | null)[] = [];
    for (let i = 0; i < CONTROL_ORDER.length; i += 1) {
      await user.tab();
      visited.push(document.activeElement?.textContent ?? null);
    }

    expect(visited).toEqual(CONTROL_ORDER);
  });

  // @req REQ-046
  it("wraps Shift+Tab from the strip to the last control and Tab back to the first", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Accepter" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Personnaliser" })).toHaveFocus();
  });

  // @req REQ-046
  it("wraps focus around the controls when the « Personnaliser » panel is open", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    const strip = screen.getByRole("dialog", { name: STRIP_NAME });
    await user.click(
      within(strip).getByRole("button", { name: "Personnaliser" })
    );
    strip.focus();

    await user.tab({ shift: true });
    expect(
      within(strip).getByRole("button", { name: "Accepter" })
    ).toHaveFocus();

    await user.tab();
    expect(
      within(strip).getByRole("switch", { name: "Cookies analytiques" })
    ).toHaveFocus();
  });

  it("opens the « Personnaliser » panel above the two answers", async () => {
    // @req REQ-046
    const user = userEvent.setup();
    render(<ConsentBanner />);

    const customise = screen.getByRole("button", { name: "Personnaliser" });
    expect(customise).toHaveAttribute("aria-expanded", "false");

    await user.click(customise);

    expect(customise).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(
      customise.getAttribute("aria-controls") ?? ""
    );
    expect(panel).toBeInTheDocument();
    expect(
      panel!.compareDocumentPosition(
        screen.getByRole("button", { name: "Refuser" })
      ) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(within(panel!).getByText("Cookies essentiels")).toBeInTheDocument();
    expect(within(panel!).getByText("Cookies analytiques")).toBeInTheDocument();
    // The functional switch only ever cleared a Sentry user context, and no
    // Sentry runs: a switch that controls nothing is not offered.
    expect(screen.queryByText("Cookies fonctionnels")).not.toBeInTheDocument();
    expect(screen.queryByText(/Sentry/)).not.toBeInTheDocument();
  });

  // @req REQ-088
  it("calls acceptAll when « Accepter » is pressed", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(screen.getByRole("button", { name: "Accepter" }));

    expect(mockAcceptAll).toHaveBeenCalledTimes(1);
  });

  // @req REQ-088
  it("calls rejectAll when « Refuser » is pressed", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(screen.getByRole("button", { name: "Refuser" }));

    expect(mockRejectAll).toHaveBeenCalledTimes(1);
  });

  // @req REQ-046
  it("keeps the essential switch locked on", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(screen.getByRole("button", { name: "Personnaliser" }));

    const essentialSwitch = screen.getByRole("switch", {
      name: /cookies essentiels/i,
    });
    expect(essentialSwitch).toBeDisabled();
    expect(essentialSwitch).toBeChecked();
  });

  // The banner used to point at `/fr/confidentialite`, one of two hand-written
  // privacy pages that restated the canonical one. Those are gone; the link
  // names the page the footer and the site tree already name.
  // @req REQ-046
  it("links to the data policy", () => {
    render(<ConsentBanner />);

    expect(
      screen.getByRole("link", { name: "Politique de données" })
    ).toHaveAttribute("href", getStaticPageRoute("fr", "dataPolicy"));
  });

  // @req REQ-140
  it("falls back to the default locale outside the locale tree", () => {
    routeParams.current = {};
    render(<ConsentBanner />);

    expect(
      screen.getByRole("link", { name: "Politique de données" })
    ).toHaveAttribute(
      "href",
      getStaticPageRoute(FALLBACK_LOCALE, "dataPolicy")
    );
  });

  // @req REQ-046
  it("saves custom preferences when « Enregistrer mes préférences » is pressed", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(screen.getByRole("button", { name: "Personnaliser" }));
    await user.click(
      screen.getByRole("switch", { name: /cookies analytiques/i })
    );
    await user.click(
      screen.getByRole("button", { name: /enregistrer mes préférences/i })
    );

    expect(mockUpdatePreferences).toHaveBeenCalledWith({
      essential: true,
      analytics: true,
      functional: false,
      embeds: false,
    });
  });

  // The panel is where the play click's choice is listed and withdrawn. The
  // arrival banner offers no fourth switch: only the panel carries the row.
  // @req REQ-181
  it("lists the third-party player choice in the panel so it can be withdrawn", async () => {
    const user = userEvent.setup();
    vi.mocked(useConsentModule.useConsent).mockReturnValue({
      ...defaultMockContext,
      consentState: {
        ...defaultMockContext.consentState,
        preferences: {
          ...defaultMockContext.consentState.preferences,
          embeds: true,
        },
      },
    });
    render(<ConsentBanner />);

    expect(
      screen.queryByRole("switch", { name: /vidéos tierces/i })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Personnaliser" }));
    const embedsSwitch = screen.getByRole("switch", {
      name: /vidéos tierces/i,
    });
    expect(embedsSwitch).toBeChecked();

    await user.click(embedsSwitch);
    await user.click(
      screen.getByRole("button", { name: /enregistrer mes préférences/i })
    );

    expect(mockUpdatePreferences).toHaveBeenCalledWith({
      essential: true,
      analytics: false,
      functional: false,
      embeds: false,
    });
  });
});
