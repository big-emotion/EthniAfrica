"use client";

import { useEffect, useRef, useState } from "react";

import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import type { Language } from "@/types/shared";

import styles from "./CarouselAudioControl.module.css";

interface CarouselAudioControlProps {
  language: Language;
  /** Absent when no licence covers reusing the platform's track here. */
  src: string | undefined;
  /** False while the card is off screen: playback stops and the control leaves the tab order. */
  active: boolean;
}

/**
 * A carousel's original soundtrack, behind one explicit control.
 *
 * REQ-185: never starts on mount, scroll or hover; only one carousel is ever
 * audible, because only the active card's control is reachable and leaving
 * view stops it — the same `active`-gated reset `EmbedFacade` already uses
 * for the video path, applied here to the self-hosted one (DEC-064: no
 * platform embed exists to play it instead).
 */
// @req REQ-185
export function CarouselAudioControl({
  language,
  src,
  active,
}: CarouselAudioControlProps) {
  const copy = discoveriesCopy[language];
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Leaving view stops playback immediately, the same idiom EmbedFacade uses
  // for the equivalent rule on the embedded-video path.
  if (playing && !active) setPlaying(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing]);

  if (!src || unavailable) return null;

  return (
    <>
      {/* An instrumental soundtrack; nothing spoken to caption. */}
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        onError={() => setUnavailable(true)}
      />
      <button
        type="button"
        className={styles.control}
        aria-pressed={playing}
        aria-label={playing ? copy.muteSound : copy.playSound}
        tabIndex={active ? 0 : -1}
        onClick={() => setPlaying((current) => !current)}
      >
        <svg
          viewBox="0 0 24 24"
          className={styles.glyph}
          aria-hidden="true"
          focusable="false"
        >
          <path fill="currentColor" d="M4 9v6h4l5 5V4L8 9H4z" />
          {playing ? (
            <path
              fill="currentColor"
              d="M15.5 12a3.5 3.5 0 0 0-2-3.17v6.34A3.5 3.5 0 0 0 15.5 12z"
            />
          ) : (
            <path
              fill="currentColor"
              d="M18.36 6.64 17 8l2 2-2 2 1.36 1.36L20.36 12l2 2L23.7 12.64l-2-2 2-2L22.36 7.28l-2 2z"
            />
          )}
        </svg>
      </button>
    </>
  );
}
