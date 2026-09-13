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
import {
  FacebookGlyph,
  InstagramGlyph,
  LinkedinGlyph,
  TiktokGlyph,
  WhatsAppGlyph,
  YoutubeGlyph,
} from "@/components/layout/SocialGlyphs";
import type { Language } from "@/types/shared";

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
  // A proverb has no photo; its share card is the site's own image.
  const image = `https://${CANONICAL_DOMAIN}${entry.image?.src ?? "/opengraph-image"}`;
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

  return (
    <div className={styles.layout}>
      <div className={styles.intro}>
        <Link
          href={`/${language}`}
          className={styles.back}
          aria-label={words.home}
        >
          <ArrowLeft aria-hidden="true" />
        </Link>
        <p className={styles.eyebrow}>EthniAfrica</p>
        <h2>{words.title}</h2>
        <p>{words.introduction}</p>
        <span className={styles.counter} aria-live="polite">
          {activeIndex + 1} {words.of} {ordered.length}
        </span>
      </div>

      <div className={styles.main}>
        <div
          className={styles.feed}
          ref={feedRef}
          onScroll={settle}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(activeIndex + 1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(activeIndex - 1);
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
              {!entry.image || failedImageIds.has(entry.id) ? (
                <div className={styles.photoFallback} />
              ) : (
                <Image
                  className={styles.photo}
                  src={entry.image.src}
                  alt={entry.image.alt?.[language] ?? ""}
                  fill
                  unoptimized
                  sizes="(min-width: 1200px) 430px, (min-width: 768px) 70vw, 100vw"
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
                <p className={styles.kind}>
                  {entry.kind === "proverb" ? words.proverb : words.fact}
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
                <p className={styles.source}>
                  {entry.source?.tier === "official"
                    ? words.official
                    : words.referenced}
                  {" · "}
                  {entry.source?.shortTitle ?? entry.source?.title}
                </p>
                {!entry.image ? null : failedImageIds.has(entry.id) ? (
                  <p className={styles.credit} role="status">
                    {words.imageUnavailable}
                  </p>
                ) : (
                  <p className={styles.credit}>
                    {words.image}{" "}
                    <a
                      href={entry.image.filePage}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={index === activeIndex ? 0 : -1}
                    >
                      {entry.image.shortCredit?.[language] ??
                        entry.image.credit}
                    </a>
                  </p>
                )}
              </div>
              <div className={styles.watermark} aria-hidden="true">
                <Image src="/africa.png" alt="" width={20} height={20} />
                <span>EthniAfrica</span>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => move(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label={words.previous}
          >
            <ChevronUp aria-hidden="true" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" disabled={!active.detail}>
                <Info aria-hidden="true" />
                {words.details}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className={styles.detailSheet}
              closeLabel={words.close}
            >
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
              {active.image ? (
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
          <Button
            type="button"
            variant="outline"
            size="icon"
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
        <div className={styles.utilities}>
          <Button
            type="button"
            variant="outline"
            aria-pressed={savedIds.includes(active.id)}
            onClick={toggleSaved}
          >
            <Bookmark aria-hidden="true" />
            {savedIds.includes(active.id) ? words.kept : words.keep}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" aria-label={words.saved}>
                <BookOpen aria-hidden="true" />
                <span className={styles.savedLabel}>{words.saved}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className={styles.detailSheet}
              closeLabel={words.close}
            >
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
          <Button
            type="button"
            variant="outline"
            onClick={openShare}
            aria-label={words.share}
          >
            <Share2 aria-hidden="true" />
            <span className={styles.shareActionLabel}>{words.share}</span>
          </Button>
        </div>
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
              {shareFeedback ? (
                <p role="status" className={styles.shareFeedback}>
                  {shareFeedback}
                </p>
              ) : null}
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
