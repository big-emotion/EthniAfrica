"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { useConsent } from "@/hooks/use-consent";
import { embedPlayerUrl, type EmbedRef } from "@/lib/embeds/providers";
import { consentCopy } from "@/lib/i18n/copy/consent";
import { embedFacadeCopy } from "@/lib/i18n/copy/embedFacade";
import type { Language } from "@/types/shared";

import styles from "./EmbedFacade.module.css";

interface EmbedFacadeProps {
  language: Language;
  /** The piece's name: it titles the frame and tells the reader what the click loads. */
  name: string;
  /** Absent, malformed or for a platform with no player: the link out is all there is. */
  embed?: EmbedRef;
  /** Self-hosted. The facade never reaches for the platform's own thumbnail. */
  poster: { src: string; width: number; height: number };
  watchUrl: string;
  /** False while the card is off screen, so its controls leave the tab order. */
  active?: boolean;
  /**
   * True when the host is already the 9:16 frame (the Découvertes reader's
   * card): the stage takes the whole box instead of keeping its own capped
   * ratio, which would letterbox a card that is already vertical.
   */
  fill?: boolean;
  /**
   * Called each time the player mounts or unmounts. The host owns whatever
   * sits in front of the picture, so it is the one that has to step aside
   * while the video plays.
   */
  onPlayingChange?: (playing: boolean) => void;
}

/**
 * A third-party player behind a click.
 *
 * Until the reader presses the button nothing here contacts a platform or
 * writes to the device. The click is the act of choosing: it records the
 * `embeds` consent and mounts the player, and the copy beside it says what
 * that loads. Everything about the frame is instant on purpose (no transition,
 * so no reduced-motion branch to keep), and closing removes it from the DOM,
 * because a hidden iframe is a running iframe.
 */
// @req REQ-181
export function EmbedFacade({
  language,
  name,
  embed,
  poster,
  watchUrl,
  active = true,
  fill = false,
  onPlayingChange,
}: EmbedFacadeProps) {
  const copy = embedFacadeCopy[language];
  const { consentState, setEmbedsConsent, setShowBanner } = useConsent();
  const [playing, setPlaying] = useState(false);
  const playButton = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const returnFocus = useRef(false);
  const noticeId = useId();
  const tabIndex = active ? 0 : -1;
  const [beforeSettings, afterSettings] = copy.notice.split("{settings}");

  const playerUrl = embed ? embedPlayerUrl(embed) : null;

  // Withdrawing the choice ends playback, and so does the card scrolling out
  // of view: the deck that hosts this facade mounts every card at once, so
  // nothing else would stop the sound of a video nobody is looking at.
  // `playing` is reset rather than merely ignored: otherwise granting consent
  // again in the panel, or scrolling back, would restart it unasked.
  if (playing && (!consentState.preferences.embeds || !active))
    setPlaying(false);

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  useEffect(() => {
    if (playing) frame.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      playButton.current?.focus();
    }
  }, [playing]);

  const linkOut = (
    <a
      className={styles.linkOut}
      href={watchUrl}
      target="_blank"
      rel="noreferrer"
      tabIndex={tabIndex}
      inert={fill && playing}
    >
      {copy.watchOnPlatform}
    </a>
  );

  const layout = fill ? "fill" : "inline";

  if (!playerUrl)
    return (
      <div className={styles.facade} data-layout={layout}>
        {linkOut}
      </div>
    );

  return (
    <div className={styles.facade} data-layout={layout}>
      {linkOut}
      <div className={styles.stage}>
        {playing ? (
          <iframe
            ref={frame}
            className={styles.frame}
            src={playerUrl}
            title={name}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            ref={playButton}
            type="button"
            className={styles.play}
            aria-label={copy.playLabel.replace("{name}", name)}
            aria-describedby={noticeId}
            tabIndex={tabIndex}
            onClick={() => {
              setEmbedsConsent(true);
              setPlaying(true);
            }}
          >
            <Image
              className={styles.poster}
              src={poster.src}
              alt=""
              width={poster.width}
              height={poster.height}
              unoptimized
            />
            <span className={styles.playLabel} aria-hidden="true">
              <svg viewBox="0 0 12 14" className={styles.glyph}>
                <path d="M0 0l12 7-12 7z" fill="currentColor" />
              </svg>
              {copy.play}
            </span>
          </button>
        )}
      </div>
      {playing ? (
        <button
          type="button"
          className={styles.close}
          tabIndex={tabIndex}
          onClick={() => {
            returnFocus.current = true;
            setPlaying(false);
          }}
        >
          {copy.close}
        </button>
      ) : (
        <p className={styles.notice} id={noticeId}>
          {beforeSettings}
          {/* The reader has no footer, so the panel the notice names would
              otherwise be nowhere on the page: withdrawal has to be as easy as
              giving, and a control that lives elsewhere is not. */}
          <button
            type="button"
            className={styles.settingsLink}
            tabIndex={tabIndex}
            onClick={() => setShowBanner(true)}
          >
            {consentCopy[language].title}
          </button>
          {afterSettings}
        </p>
      )}
    </div>
  );
}
