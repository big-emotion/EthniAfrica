import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CarouselAudioControl } from "../CarouselAudioControl";

beforeEach(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe("CarouselAudioControl", () => {
  // @req REQ-185
  it("never plays on mount", () => {
    render(
      <CarouselAudioControl language="fr" src="/audio/lingala.mp3" active />
    );
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  // @req REQ-185
  it("plays only after the explicit control is pressed, and announces its state", () => {
    render(
      <CarouselAudioControl language="fr" src="/audio/lingala.mp3" active />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  // @req REQ-185
  it("stops when the card leaves view, even mid-playback", () => {
    const { rerender } = render(
      <CarouselAudioControl language="fr" src="/audio/lingala.mp3" active />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    rerender(
      <CarouselAudioControl
        language="fr"
        src="/audio/lingala.mp3"
        active={false}
      />
    );

    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  // @req REQ-185
  it("toggles off on a second press, pausing rather than restarting", () => {
    render(
      <CarouselAudioControl language="fr" src="/audio/lingala.mp3" active />
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);

    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  // @req REQ-185
  it("is reachable by keyboard, with a native button and no negative tabIndex when active", () => {
    render(
      <CarouselAudioControl language="fr" src="/audio/lingala.mp3" active />
    );
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    expect(button).not.toHaveAttribute("tabIndex", "-1");
  });

  // @req REQ-185
  it("leaves the control out of the tab order while its card is not active", () => {
    render(
      <CarouselAudioControl
        language="fr"
        src="/audio/lingala.mp3"
        active={false}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("tabIndex", "-1");
  });

  // @req REQ-185
  it("renders no control at all when no source is given", () => {
    render(<CarouselAudioControl language="fr" src={undefined} active />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // @req REQ-185
  it("hides the control on a load error, rather than leaving a broken button", () => {
    render(
      <CarouselAudioControl language="fr" src="/audio/missing.mp3" active />
    );
    const audio = document.querySelector("audio");
    expect(audio).not.toBeNull();
    fireEvent.error(audio as HTMLAudioElement);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
