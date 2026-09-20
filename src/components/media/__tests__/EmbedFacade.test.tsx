import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmbedFacade } from "@/components/media/EmbedFacade";
import { ConsentProvider, useConsent } from "@/hooks/use-consent";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

const NAME = "« Mandé » n’est le nom propre d’aucun peuple";
const WATCH_URL = "https://www.youtube.com/shorts/vESK91smqxQ";
const PLAYER_SRC =
  "https://www.youtube-nocookie.com/embed/vESK91smqxQ?autoplay=1&rel=0&playsinline=1&modestbranding=1";

const poster = {
  src: "/images/discoveries/videos/mande-nest-pas-un-peuple.jpg",
  width: 540,
  height: 960,
};

/** Stands in for the cookie-settings panel, which is where the choice is withdrawn. */
function ConsentPanel() {
  const { setEmbedsConsent, showBanner } = useConsent();
  return (
    <>
      <output data-testid="banner">{showBanner ? "open" : "closed"}</output>
      <button onClick={() => setEmbedsConsent(false)}>withdraw</button>
      <button onClick={() => setEmbedsConsent(true)}>grant</button>
    </>
  );
}

function renderFacade(
  props: Partial<React.ComponentProps<typeof EmbedFacade>> = {}
) {
  return render(
    <ConsentProvider>
      <EmbedFacade
        language="fr"
        name={NAME}
        poster={poster}
        watchUrl={WATCH_URL}
        embed={{ provider: "youtube", id: "vESK91smqxQ" }}
        {...props}
      />
      <ConsentPanel />
    </ConsentProvider>
  );
}

const playButton = () =>
  screen.getByRole("button", { name: /charge le lecteur de YouTube/i });

describe("EmbedFacade", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  // The whole point of the facade: a page that shows a production asks
  // nothing of any platform, and stores nothing on the device.
  // @req REQ-181
  it("mounts no frame and writes nothing before the reader chooses", () => {
    const { container } = renderFacade();

    expect(container.querySelector("iframe")).toBeNull();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    expect(playButton()).toBeInTheDocument();
  });

  // The reader must hear what the click does before making it, and must be
  // able to decline and still watch: a consent that closes the piece to
  // whoever refuses is a toll gate.
  // @req REQ-181
  it("says what the click loads, and offers the platform first in tab order", () => {
    renderFacade();

    expect(playButton()).toHaveAccessibleName(
      `Regarder sur place : ${NAME} — charge le lecteur de YouTube`
    );
    const linkOut = screen.getByRole("link", { name: /regarder sur youtube/i });
    expect(linkOut).toHaveAttribute("href", WATCH_URL);
    // The link sits beside the button, never inside it, and comes before it.
    expect(playButton().contains(linkOut)).toBe(false);
    expect(
      linkOut.compareDocumentPosition(playButton()) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByText(/dépose des traceurs.*reçoit votre adresse IP/i)
    ).toBeInTheDocument();
  });

  // @req REQ-181
  it("mounts the privacy-enhanced player on the click and moves focus into it", async () => {
    const user = userEvent.setup();
    const { container } = renderFacade();

    await user.click(playButton());

    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute("src", PLAYER_SRC);
    expect(frame).toHaveAttribute("title", NAME);
    expect(frame).toHaveAttribute(
      "allow",
      "autoplay; encrypted-media; picture-in-picture; fullscreen"
    );
    expect(frame).toHaveAttribute(
      "referrerpolicy",
      "strict-origin-when-cross-origin"
    );
    expect(frame).toHaveAttribute("loading", "lazy");
    expect(document.activeElement).toBe(frame);
  });

  // @req REQ-181
  it("stores the embeds choice at the click, and nothing else about the reader", async () => {
    const user = userEvent.setup();
    renderFacade();

    await user.click(playButton());

    const stored = JSON.parse(
      localStorage.getItem(CONSENT_STORAGE_KEY) ?? "{}"
    );
    expect(stored.preferences.embeds).toBe(true);
    expect(stored.preferences.analytics).toBe(false);
    expect(stored.hasConsented).toBe(false);
  });

  // A hidden iframe is a running iframe: closing removes the frame.
  // @req REQ-181
  it("removes the frame from the DOM on close and returns focus to the button", async () => {
    const user = userEvent.setup();
    const { container } = renderFacade();
    await user.click(playButton());

    await user.click(
      screen.getByRole("button", { name: /fermer le lecteur/i })
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(document.activeElement).toBe(playButton());
  });

  // Withdrawal must take effect, and must not leave a switch that re-arms
  // itself: after the reader takes the choice back, granting it again in the
  // panel does not start a video nobody asked to play.
  // @req REQ-181
  it("returns to the facade when the choice is withdrawn, and does not replay on re-consent", async () => {
    const user = userEvent.setup();
    const { container } = renderFacade();
    await user.click(playButton());
    expect(container.querySelector("iframe")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "withdraw" }));
    expect(container.querySelector("iframe")).toBeNull();
    expect(playButton()).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "grant" }));
    expect(container.querySelector("iframe")).toBeNull();
  });

  // @req REQ-181
  it("shows the facade again on a later visit even when the choice is stored", async () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        hasConsented: true,
        preferences: {
          essential: true,
          analytics: false,
          functional: false,
          embeds: true,
        },
        consentDate: new Date().toISOString(),
      })
    );
    const { container } = renderFacade();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector("iframe")).toBeNull();
    expect(playButton()).toBeInTheDocument();
  });

  // The reader is immersive: it has no footer, so the footer's "Gestion des
  // cookies" is not on the page. The notice tells the reader the choice can be
  // withdrawn there, so the notice has to be the way to it.
  // @req REQ-181
  it("opens the cookie settings from the notice, where the page has no footer", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        hasConsented: true,
        preferences: {
          essential: true,
          analytics: false,
          functional: false,
          embeds: false,
        },
        consentDate: new Date().toISOString(),
      })
    );
    renderFacade();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(screen.getByTestId("banner")).toHaveTextContent("closed");

    await user.click(
      screen.getByRole("button", { name: "Gestion des cookies" })
    );

    expect(screen.getByTestId("banner")).toHaveTextContent("open");
  });

  // @req REQ-181
  it.each([
    ["no embed on the record", undefined],
    ["an identifier out of shape", { provider: "youtube", id: "../evil" }],
    ["a platform with no player", { provider: "tiktok", id: "7234567890" }],
  ] as const)("shows only the link out for %s", (_label, embed) => {
    const { container } = renderFacade({
      embed: embed as React.ComponentProps<typeof EmbedFacade>["embed"],
    });

    expect(container.querySelector("iframe")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /sur place/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /regarder sur youtube/i })
    ).toHaveAttribute("href", WATCH_URL);
  });

  // @req REQ-181
  it("speaks English on an English route", () => {
    renderFacade({ language: "en" });

    expect(
      screen.getByRole("button", {
        name: `Watch here: ${NAME} — loads YouTube's player`,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /watch on youtube/i })
    ).toBeInTheDocument();
  });

  // The swap is instant by design: a transition is what would make a
  // reduced-motion branch necessary.
  // @req REQ-181
  it("does not animate the swap", async () => {
    const user = userEvent.setup();
    const { container } = renderFacade();
    await user.click(playButton());

    const frame = container.querySelector("iframe") as HTMLElement;
    expect(frame.style.transition).toBe("");
    expect(frame.style.animation).toBe("");
  });
});
