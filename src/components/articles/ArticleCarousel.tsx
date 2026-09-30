"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";

import { articleMediaUrl } from "@/lib/articles/media";
import type { ArticleFormat } from "@/lib/articles/schema";
import { articlesCopy } from "@/lib/i18n/copy/articles";
import type { Language } from "@/types/shared";

import styles from "./articles.module.css";

type Slide = Extract<ArticleFormat, { kind: "carousel" }>["slides"][number];

interface ArticleCarouselProps {
  language: Language;
  /** The article's title, naming the enlarged view. */
  title: string;
  slides: Slide[];
  /** Called once when a slide's picture fails, so the host can say so. */
  onMediaError?: () => void;
}

/**
 * A published carousel, read slide by slide inside an article.
 *
 * Written for the article page rather than lifted from the Découvertes
 * reader: that one steps frames inside a full-screen vertical deck, and its
 * position state belongs to the deck. What is shared is the approach — a
 * native scroll-snap track, so a finger swipes it the way it swipes any
 * scroller, with buttons and arrow keys for everyone else (W3C carousel
 * tutorial: explicit controls, no automatic rotation).
 *
 * The slides' words are printed as text below the pictures, because the
 * essay a carousel carries must not exist only as pixels.
 */
// @req REQ-114
export function ArticleCarousel({
  language,
  title,
  slides,
  onMediaError,
}: ArticleCarouselProps) {
  const copy = articlesCopy[language].carousel;
  const [current, setCurrent] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const total = slides.length;

  const show = (index: number) => {
    const next = Math.min(Math.max(index, 0), total - 1);
    if (next === current) return;
    setCurrent(next);
    const target = track.current?.children[next] as HTMLElement | undefined;
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    track.current?.scrollTo?.({
      left: target?.offsetLeft ?? 0,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  };

  // A swipe moves the track, not the state: settle on the slide whose left
  // edge is nearest once the scroller stops.
  const settle = () => {
    const node = track.current;
    if (!node) return;
    const frames = Array.from(node.children) as HTMLElement[];
    const nearest = frames.reduce(
      (best, frame, index) =>
        Math.abs(frame.offsetLeft - node.scrollLeft) <
        Math.abs(frames[best].offsetLeft - node.scrollLeft)
          ? index
          : best,
      0
    );
    if (nearest !== current) setCurrent(nearest);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(current + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(current - 1);
    }
  };

  const slide = slides[current];

  return (
    <section
      className={styles.carousel}
      aria-roledescription="carousel"
      aria-label={copy.label}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className={styles.track} ref={track} onScroll={settle}>
        {slides.map((item, index) => (
          <div
            key={item.src}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={copy.slideLabel(index + 1, total)}
          >
            <Image
              className={styles.slideImage}
              src={articleMediaUrl(item.src)}
              alt={item.alt}
              width={item.width}
              height={item.height}
              unoptimized
              onError={onMediaError}
            />
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.carouselButton}
          onClick={() => show(current - 1)}
          disabled={current === 0}
          aria-label={copy.previous}
        >
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <span className={styles.position} aria-hidden="true">
          {copy.position(current + 1, total)}
        </span>
        <DialogPrimitive.Root open={enlarged} onOpenChange={setEnlarged}>
          <DialogPrimitive.Trigger asChild>
            <button type="button" className={styles.enlarge}>
              {copy.enlarge}
            </button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className={styles.overlay} />
            <DialogPrimitive.Content
              className={styles.enlarged}
              aria-describedby={undefined}
            >
              <DialogPrimitive.Title className="sr-only">
                {`${title} — ${copy.slideLabel(current + 1, total)}`}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                className={`${styles.enlarge} ${styles.enlargedClose}`}
              >
                {copy.close}
              </DialogPrimitive.Close>
              <Image
                className={styles.enlargedImage}
                src={articleMediaUrl(slide.src)}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                unoptimized
              />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <button
          type="button"
          className={styles.carouselButton}
          onClick={() => show(current + 1)}
          disabled={current === total - 1}
          aria-label={copy.next}
        >
          <ChevronRight aria-hidden="true" size={20} />
        </button>
      </div>
      {/* Visible count above is for the eye; this line is for the ear, and
          speaks only when the slide changes. */}
      <p className="sr-only" role="status">
        {copy.slideLabel(current + 1, total)}
      </p>

      <details className={styles.disclosure}>
        <summary>{copy.slideTextTitle}</summary>
        <ol>
          {slides.map((item) => (
            <li key={item.src}>{item.text}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
