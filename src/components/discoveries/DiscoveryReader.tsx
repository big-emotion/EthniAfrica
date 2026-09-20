"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  Menu,
  Play,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  discoveryPath,
  type DiscoveryPublication,
} from "@/lib/discoveries/catalog";
import { getCountryRoute, getFamilyRoute, getPeopleRoute } from "@/lib/routing";
import {
  DISCOVERIES_SAVED_KEY,
  loadSaved,
  persistSaved,
} from "@/lib/discoveries/saved";
import {
  discoveryShareChoices,
  linkDestination,
  type DiscoverySharePayload,
  type LinkShareChoice,
} from "@/lib/discoveries/sharing";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import { discoveriesCopy } from "@/lib/i18n/copy/discoveries";
import { GeneratedImageBadge } from "@/components/discoveries/GeneratedImageBadge";
import { GeneratedImageDetail } from "@/components/discoveries/GeneratedImageDetail";
import {
  FacebookGlyph,
  InstagramGlyph,
  LinkedinGlyph,
  TiktokGlyph,
  WhatsAppGlyph,
  YoutubeGlyph,
} from "@/components/layout/SocialGlyphs";
import type { Language } from "@/types/shared";

import { DiscoveryDestinations } from "@/components/discoveries/DiscoveryDestinations";
import { DiscoveryDownloads } from "./DiscoveryDownloads";
import styles from "./DiscoveryReader.module.css";

interface DiscoveryReaderProps {
  language: Language;
  publications: readonly DiscoveryPublication[];
  initialId: string;
}

function atlasPath(
  language: Language,
  entity: NonNullable<DiscoveryPublication["detail"]>["entities"][number]
) {
  if (entity.kind === "country") return getCountryRoute(language, entity.id);
  if (entity.kind === "family") return getFamilyRoute(language, entity.id);
  return getPeopleRoute(language, entity.id);
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function syncPublicationHead(language: Language, entry: DiscoveryPublication) {
  const title = entry.title[language];
  const description = entry.description[language];
  const url = `https://${CANONICAL_DOMAIN}${discoveryPath(language, entry)}`;
  // A proverb has no photo; its share card is the site's own image. A series
  // has no photograph elsewhere either, and its first frame is its cover.
  const cover =
    entry.image?.src ?? entry.carousel?.frames[0]?.src ?? "/opengraph-image";
  const image = `https://${CANONICAL_DOMAIN}${cover}`;
  document.title = title;
  const content = [
    ['meta[name="description"]', description],
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
    ['meta[property="og:url"]', url],
    ['meta[property="og:image"]', image],
    ['meta[property="og:image:alt"]', title],
    ['meta[name="twitter:title"]', title],
    ['meta[name="twitter:description"]', description],
    ['meta[name="twitter:image"]', image],
  ] as const;
  for (const [selector, value] of content) {
    document.head.querySelector(selector)?.setAttribute("content", value);
  }
  document.head
    .querySelector('link[rel="canonical"]')
    ?.setAttribute("href", url);
  for (const alternate of document.head.querySelectorAll<HTMLLinkElement>(
    'link[rel="alternate"][hreflang]'
  )) {
    const locale =
      alternate.hreflang === "x-default"
        ? new URL(alternate.href).pathname.startsWith("/en/")
          ? "en"
          : "fr"
        : alternate.hreflang;
    if (locale === "fr" || locale === "en") {
      alternate.href = `https://${CANONICAL_DOMAIN}${discoveryPath(locale, entry)}`;
    }
  }
}

function ShareNetworkIcon({
  id,
}: {
  id: (typeof discoveryShareChoices)[number]["id"];
}) {
  const Glyph = id.startsWith("youtube")
    ? YoutubeGlyph
    : id.startsWith("instagram")
      ? InstagramGlyph
      : id.startsWith("facebook")
        ? FacebookGlyph
        : id === "tiktok-story"
          ? TiktokGlyph
          : id === "whatsapp"
            ? WhatsAppGlyph
            : id === "linkedin"
              ? LinkedinGlyph
              : null;
  const variant = id.endsWith("reels") || id === "youtube-shorts";
  return (
    <span className={styles.shareGlyph} aria-hidden="true">
      {Glyph ? <Glyph /> : <Share2 aria-hidden="true" />}
      {variant ? <Play className={styles.shareVariant} /> : null}
    </span>
  );
}

// @req REQ-156
export function DiscoveryReader({
  language,
  publications,
  initialId,
}: DiscoveryReaderProps) {
  const ordered = useMemo(
    () => [
      ...publications.filter((entry) => entry.id === initialId),
      ...publications.filter((entry) => entry.id !== initialId),
    ],
    [publications, initialId]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(
    () => new Set()
  );
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [sharePayload, setSharePayload] =
    useState<DiscoverySharePayload | null>(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const activeIdRef = useRef(initialId);
  const allowedIds = useMemo(
    () => new Set(publications.map((entry) => entry.id)),
    [publications]
  );
  const feedRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Which frame each series is showing, kept by publication id: the deck
  // mounts every card at once, so a series keeps its place when the reader
  // scrolls past it and comes back.
  const [frameByPublication, setFrameByPublication] = useState<
    Record<string, number>
  >({});
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const active = ordered[activeIndex];
  const words = discoveriesCopy[language];

  useEffect(() => {
    if (active) syncPublicationHead(language, active);
  }, [active, language]);

  useEffect(() => {
    const read = () => {
      const saved = loadSaved(allowedIds, browserStorage());
      setSavedIds(saved.ids);
      setStorageAvailable(saved.available);
    };
    read();
    const onStorage = (event: StorageEvent) => {
      if (event.key === DISCOVERIES_SAVED_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [allowedIds]);

  useEffect(() => {
    const onPopState = () => {
      const index = ordered.findIndex(
        (entry) => discoveryPath(language, entry) === window.location.pathname
      );
      if (index < 0) return;
      activeIdRef.current = ordered[index].id;
      setActiveIndex(index);
      const target = feedRef.current?.children[index] as
        HTMLElement | undefined;
      target?.scrollIntoView({ behavior: "instant", block: "start" });
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [language, ordered]);

  const settle = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const feed = feedRef.current;
      if (!feed) return;
      const children = Array.from(feed.children) as HTMLElement[];
      const index = children.reduce(
        (best, child, current) =>
          Math.abs(child.offsetTop - feed.scrollTop) <
          Math.abs(children[best].offsetTop - feed.scrollTop)
            ? current
            : best,
        0
      );
      if (ordered[index]?.id !== activeIdRef.current) {
        activeIdRef.current = ordered[index].id;
        setActiveIndex(index);
        window.history.pushState(
          {},
          "",
          discoveryPath(language, ordered[index])
        );
      }
    }, 120);
  };

  const move = (index: number) => {
    if (index < 0 || index >= ordered.length) return;
    const target = feedRef.current?.children[index] as HTMLElement | undefined;
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    target?.scrollIntoView({
      behavior: reduceMotion ? "instant" : "smooth",
      block: "start",
    });
    activeIdRef.current = ordered[index].id;
    setActiveIndex(index);
    window.history.pushState({}, "", discoveryPath(language, ordered[index]));
  };

  const showFrame = (entry: DiscoveryPublication, index: number) => {
    const frames = entry.carousel?.frames ?? [];
    const next = Math.min(Math.max(index, 0), frames.length - 1);
    if ((frameByPublication[entry.id] ?? 0) === next) return;
    setFrameByPublication((current) => ({ ...current, [entry.id]: next }));
  };

  // Scrolling the track rather than scrollIntoView: the frame is inside the
  // vertical deck, and asking the browser to bring it into view moves both
  // scrollers at once.
  const stepFrame = (delta: number) => {
    const frames = active.carousel?.frames ?? [];
    if (frames.length === 0) return;
    const current = frameByPublication[active.id] ?? 0;
    const next = Math.min(Math.max(current + delta, 0), frames.length - 1);
    if (next === current) return;
    const track = trackRefs.current[active.id];
    const target = track?.children[next] as HTMLElement | undefined;
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    track?.scrollTo?.({
      left: target?.offsetLeft ?? 0,
      behavior: reduceMotion ? "instant" : "smooth",
    });
    showFrame(active, next);
  };

  const settleFrame = (entry: DiscoveryPublication) => {
    const track = trackRefs.current[entry.id];
    if (!track) return;
    const frames = Array.from(track.children) as HTMLElement[];
    if (frames.length === 0) return;
    const nearest = frames.reduce(
      (best, frame, index) =>
        Math.abs(frame.offsetLeft - track.scrollLeft) <
        Math.abs(frames[best].offsetLeft - track.scrollLeft)
          ? index
          : best,
      0
    );
    showFrame(entry, nearest);
  };

  const toggleSaved = () => {
    const next = savedIds.includes(active.id)
      ? savedIds.filter((id) => id !== active.id)
      : [...savedIds, active.id];
    const durable = persistSaved(next, allowedIds, browserStorage());
    setSavedIds(next);
    setStorageAvailable(durable);
  };

  const openShare = () => {
    setSharePayload({
      id: active.id,
      title: active.title[language],
      description: active.description[language],
      url: `https://${CANONICAL_DOMAIN}${discoveryPath(language, active)}`,
    });
    setShareFeedback("");
  };

  const copyShare = async () => {
    if (!sharePayload) return;
    try {
      await navigator.clipboard.writeText(sharePayload.url);
      setShareFeedback(words.copied);
    } catch {
      setShareFeedback(words.copyFailed);
    }
  };

  const systemShare = async () => {
    if (!sharePayload) return;
    if (!navigator.share) {
      setShareFeedback(words.shareFailed);
      return;
    }
    try {
      await navigator.share({
        title: sharePayload.title,
        text: sharePayload.description,
        url: sharePayload.url,
      });
      setShareFeedback("");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setShareFeedback(words.shareFailed);
    }
  };

  if (!active) return null;

  const isSaved = savedIds.includes(active.id);

  return (
    <main className={styles.stage}>
      <DiscoveryDestinations language={language} className={styles.rail} />

      <div className={styles.main}>
        {/* Below 1200 px the rail has no room, so the frame carries the way
            back and the Parcourir sheet over the picture, as a Reel does. */}
        <div className={styles.topBar}>
          <Button asChild variant="night" size="icon">
            <Link href={`/${language}`} aria-label={words.home}>
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <p className={styles.topTitle}>{words.title}</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="night"
                size="icon"
                aria-label={words.browse}
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className={styles.detailSheet}
              closeLabel={words.close}
            >
              <div className={styles.handle} aria-hidden="true" />
              <SheetTitle className={styles.detailTitle}>
                {words.browse}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {words.title}
              </SheetDescription>
              <DiscoveryDestinations language={language} />
            </SheetContent>
          </Sheet>
        </div>

        <span className="sr-only" aria-live="polite">
          {activeIndex + 1} {words.of} {ordered.length}
        </span>

        <div
          className={styles.feed}
          ref={feedRef}
          onScroll={settle}
          onKeyDown={(event) => {
            // Down and up belong to the deck, right and left to the series
            // inside the publication being read. One handler, two axes.
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(activeIndex + 1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(activeIndex - 1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              stepFrame(1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              stepFrame(-1);
            }
          }}
          tabIndex={0}
          aria-label={words.title}
        >
          {ordered.map((entry, index) => (
            <article
              className={
                entry.image ? styles.card : `${styles.card} ${styles.textCard}`
              }
              key={entry.id}
              data-publication-id={entry.id}
              aria-label={entry.title[language]}
            >
              {entry.carousel && !failedImageIds.has(entry.id) ? (
                <div
                  className={styles.carousel}
                  role="group"
                  aria-label={words.carouselLabel}
                  ref={(node) => {
                    trackRefs.current[entry.id] = node;
                  }}
                  onScroll={() => settleFrame(entry)}
                >
                  {entry.carousel.frames.map((frame) => (
                    <Image
                      className={styles.carouselFrame}
                      key={frame.src}
                      src={frame.src}
                      alt={frame.alt[language]}
                      width={frame.width}
                      height={frame.height}
                      unoptimized
                      priority={index === 0}
                      onError={() =>
                        setFailedImageIds((current) =>
                          new Set(current).add(entry.id)
                        )
                      }
                    />
                  ))}
                </div>
              ) : !entry.image || failedImageIds.has(entry.id) ? (
                <div className={styles.photoFallback} />
              ) : (
                <Image
                  className={styles.photo}
                  src={entry.image.src}
                  alt={entry.image.alt?.[language] ?? ""}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 34rem, 100vw"
                  priority={index === 0}
                  style={{ objectPosition: entry.image.focus ?? "center" }}
                  onError={() =>
                    setFailedImageIds((current) =>
                      new Set(current).add(entry.id)
                    )
                  }
                />
              )}
              <div className={styles.shade} aria-hidden="true" />
              <div className={styles.copy}>
                {entry.carousel && !failedImageIds.has(entry.id) ? (
                  <>
                    <div className={styles.dots} aria-hidden="true">
                      {entry.carousel.frames.map((frame, position) => (
                        <span
                          key={frame.src}
                          className={
                            position === (frameByPublication[entry.id] ?? 0)
                              ? `${styles.dot} ${styles.dotCurrent}`
                              : styles.dot
                          }
                        />
                      ))}
                    </div>
                    <span className="sr-only" aria-live="polite">
                      {`${words.frame} ${(frameByPublication[entry.id] ?? 0) + 1} ${words.of} ${entry.carousel.frames.length}`}
                    </span>
                  </>
                ) : null}
                <p className={styles.kind}>
                  {entry.kind === "image" ? (
                    <GeneratedImageBadge entry={entry} language={language} />
                  ) : entry.kind === "proverb" ? (
                    words.proverb
                  ) : entry.kind === "carousel" ? (
                    words.carousel
                  ) : (
                    words.fact
                  )}
                </p>
                {entry.original ? (
                  <p className={styles.original} lang={entry.original.lang}>
                    {entry.original.text}
                  </p>
                ) : null}
                {index === 0 ? (
                  <h1>{entry.title[language]}</h1>
                ) : (
                  <h2>{entry.title[language]}</h2>
                )}
                {/* A generated image's caption is its opening line; every
                    other publication opens on its description, held to two
                    lines — the rest is one tap away in the details sheet. */}
                {entry.caption ? (
                  <p className={styles.caption}>{entry.caption[language]}</p>
                ) : (
                  <p className={styles.description}>
                    {entry.description[language]}
                  </p>
                )}
                <p className={styles.source}>
                  {entry.source?.tier === "official"
                    ? words.official
                    : words.referenced}
                  {" · "}
                  {entry.source?.shortTitle ?? entry.source?.title}
                </p>
                {/* A generated image is not a photo and has no original file
                    to credit; its provenance lives in the detail sheet. */}
                {!entry.image ||
                entry.kind === "image" ? null : failedImageIds.has(entry.id) ? (
                  <p className={styles.credit} role="status">
                    {words.imageUnavailable}
                  </p>
                ) : (
                  <p className={styles.credit}>
                    {words.image}{" "}
                    {/* A series was rendered here, so there is no file page
                        elsewhere to send the reader to; the credit still is. */}
                    {entry.image.filePage ? (
                      <a
                        href={entry.image.filePage}
                        target="_blank"
                        rel="noreferrer"
                        tabIndex={index === activeIndex ? 0 : -1}
                      >
                        {entry.image.shortCredit?.[language] ??
                          entry.image.credit}
                      </a>
                    ) : (
                      (entry.image.shortCredit?.[language] ??
                      entry.image.credit)
                    )}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        <div role="group" aria-label={words.actions} className={styles.actions}>
          <Button
            type="button"
            variant="night"
            size="stacked"
            aria-pressed={isSaved}
            onClick={toggleSaved}
          >
            <span className={styles.actionGlyph} aria-hidden="true">
              <Bookmark />
            </span>
            <span className={styles.actionLabel}>
              {isSaved ? words.kept : words.keep}
            </span>
          </Button>
          <Button
            type="button"
            variant="night"
            size="stacked"
            onClick={openShare}
          >
            <span className={styles.actionGlyph} aria-hidden="true">
              <Share2 />
            </span>
            <span className={styles.actionLabel}>{words.share}</span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="night"
                size="stacked"
                disabled={!active.detail}
              >
                <span className={styles.actionGlyph} aria-hidden="true">
                  <Info />
                </span>
                <span className={styles.actionLabel}>{words.details}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className={styles.detailSheet}
              closeLabel={words.close}
            >
              <div className={styles.handle} aria-hidden="true" />
              <p className={styles.kicker}>{words.context}</p>
              <SheetTitle className={styles.detailTitle}>
                {active.title[language]}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {active.description[language]}
              </SheetDescription>
              {active.detail?.body[language].map((paragraph) => (
                <p key={paragraph} className={styles.detailBody}>
                  {paragraph}
                </p>
              ))}
              {active.detail?.entities.length ? (
                <section
                  aria-label={words.atlas}
                  className={styles.detailSection}
                >
                  <h3>{words.atlas}</h3>
                  <div className={styles.pills}>
                    {active.detail.entities.map((entity) => (
                      <a
                        key={`${entity.kind}:${entity.id}`}
                        href={atlasPath(language, entity)}
                      >
                        {entity.label[language]}
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
              <section
                aria-label={words.sources}
                className={styles.detailSection}
              >
                <h3>{words.sources}</h3>
                <ul className={styles.sourceList}>
                  {active.detail?.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
              {active.kind === "image" ? (
                <GeneratedImageDetail
                  entry={active}
                  language={language}
                  className={styles.detailSection}
                />
              ) : active.image ? (
                <section className={styles.detailSection}>
                  <p>{active.image.credit}</p>
                  <a
                    href={active.image.filePage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {words.original}
                  </a>
                  {active.image.licenceUrl ? (
                    <a
                      href={active.image.licenceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {words.licence}
                    </a>
                  ) : null}
                </section>
              ) : null}
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="night" size="stacked">
                <span className={styles.actionGlyph} aria-hidden="true">
                  <BookOpen />
                </span>
                <span className={styles.actionLabel}>{words.saved}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className={styles.detailSheet}
              closeLabel={words.close}
            >
              <div className={styles.handle} aria-hidden="true" />
              <SheetTitle className={styles.detailTitle}>
                {words.saved}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {words.saved}
              </SheetDescription>
              {savedIds.length ? (
                <ul className={styles.savedList}>
                  {savedIds.flatMap((id) => {
                    const entry = publications.find(
                      (candidate) => candidate.id === id
                    );
                    return entry
                      ? [
                          <li key={id}>
                            <a href={discoveryPath(language, entry)}>
                              {entry.title[language]}
                            </a>
                          </li>,
                        ]
                      : [];
                  })}
                </ul>
              ) : (
                <p>{words.empty}</p>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* A phone moves by swiping, as a Reel does; from 768 px a pointer
            reader gets the two round controls TikTok and Instagram draw at
            the right edge. The keyboard arrows work at every width. */}
        <div className={styles.stepper}>
          <Button
            type="button"
            variant="night"
            size="icon"
            className={styles.stepButton}
            onClick={() => move(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label={words.previous}
          >
            <ChevronUp aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="night"
            size="icon"
            className={styles.stepButton}
            onClick={() => move(activeIndex + 1)}
            disabled={activeIndex === ordered.length - 1}
            aria-label={words.next}
          >
            <ChevronDown aria-hidden="true" />
          </Button>
        </div>

        <noscript>
          <p className={styles.noScriptNext}>
            <a
              href={
                ordered[1]
                  ? discoveryPath(language, ordered[1])
                  : `/${language}`
              }
            >
              {ordered[1] ? words.next : words.home}
            </a>
          </p>
        </noscript>
        {!storageAvailable ? (
          <p className={styles.storageNotice} role="status">
            {words.temporary}
          </p>
        ) : null}
      </div>

      <Sheet
        open={Boolean(sharePayload)}
        onOpenChange={(open) => {
          if (!open) setSharePayload(null);
        }}
      >
        <SheetContent
          side="bottom"
          className={styles.detailSheet}
          closeLabel={words.close}
        >
          <div className={styles.handle} aria-hidden="true" />
          <SheetTitle className={styles.detailTitle}>{words.share}</SheetTitle>
          <SheetDescription>{sharePayload?.title}</SheetDescription>
          {sharePayload ? (
            <>
              <p className={styles.shareUrl}>{sharePayload.url}</p>
              <Button type="button" onClick={copyShare}>
                {words.copy}
              </Button>
              <div className={styles.shareChoices}>
                {discoveryShareChoices.map((choice) => {
                  const label =
                    choice.id === "system" ? words.systemChoice : choice.label;
                  const status =
                    choice.mode === "link"
                      ? words.linkAvailable
                      : choice.mode === "system"
                        ? words.systemAvailable
                        : choice.mode === "video-unavailable"
                          ? words.videoUnavailable
                          : words.mediaUnavailable;
                  const badge =
                    choice.mode === "link"
                      ? words.linkBadge
                      : choice.mode === "system"
                        ? words.systemBadge
                        : choice.mode === "video-unavailable"
                          ? words.videoBadge
                          : words.mediaBadge;
                  const visual = (
                    <>
                      <ShareNetworkIcon id={choice.id} />
                      <strong>{label}</strong>
                      <span>{badge}</span>
                    </>
                  );
                  if (choice.mode === "link") {
                    return (
                      <a
                        key={choice.id}
                        data-testid={`share-choice-${choice.id}`}
                        href={linkDestination(
                          choice.id as LinkShareChoice,
                          sharePayload
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.shareChoice}
                      >
                        {visual}
                      </a>
                    );
                  }
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      data-testid={`share-choice-${choice.id}`}
                      className={styles.shareChoice}
                      onClick={() =>
                        choice.mode === "system"
                          ? void systemShare()
                          : setShareFeedback(status)
                      }
                    >
                      {visual}
                    </button>
                  );
                })}
              </div>
              <DiscoveryDownloads
                language={language}
                publication={publications.find(
                  (entry) => entry.id === sharePayload.id
                )}
              />
              {shareFeedback ? (
                <p role="status" className={styles.shareFeedback}>
                  {shareFeedback}
                </p>
              ) : null}
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  );
}
