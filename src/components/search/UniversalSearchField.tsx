"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { searchFieldCopy } from "@/lib/i18n/copy/searchField";
import { getLocalizedRoute } from "@/lib/routing";
import { foldNameForm } from "@/lib/search/nameAddress";
import {
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
} from "@/lib/search/searchVocabulary";
import type { Language } from "@/types/shared";

export interface NameSuggestion {
  form: string;
  type: string;
  id: string;
  note: string | null;
  href: string;
}

export type SearchSurface = "home" | "modal" | "serp";

interface UniversalSearchFieldProps {
  language: Language;
  surface: SearchSurface;
  onClose?: () => void;
  onNavigate?: (href: string) => void;
  autoFocus?: boolean;
  describedBy?: string;
  trackSubmit?: boolean;
  fetchResults?: (query: string) => Promise<NameSuggestion[]>;
}

async function fetchNameSuggestions(query: string): Promise<NameSuggestion[]> {
  const response = await fetch(
    `/api/v2/names/suggest?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) return [];
  const envelope = await response.json();
  return envelope.data?.suggestions ?? [];
}

// @req REQ-002
export function UniversalSearchField({
  language,
  surface,
  onClose,
  onNavigate,
  autoFocus = false,
  describedBy,
  trackSubmit = true,
  fetchResults = fetchNameSuggestions,
}: UniversalSearchFieldProps) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NameSuggestion[]>([]);
  const [active, setActive] = useState(0);
  const [answered, setAnswered] = useState(false);
  const copy = searchFieldCopy[language];

  useEffect(() => {
    if (query.trim().length < 2) return;
    let current = true;
    const timer = setTimeout(() => {
      fetchResults(query.trim())
        .then((items) => {
          if (current) {
            setSuggestions(items);
            setAnswered(true);
            setActive(0);
          }
        })
        .catch(() => {
          if (current) {
            setSuggestions([]);
            setAnswered(true);
          }
        });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, fetchResults]);

  const submitSearch = (href: string, count = suggestions.length) => {
    if (trackSubmit) {
      trackEvent("search:submit", { surface, suggestions: count });
    }
    (onNavigate ?? router.push)(href);
    onClose?.();
  };
  const openSuggestion = (suggestion: NameSuggestion, rank: number) => {
    trackEvent("search:result_click", { surface, rank, type: suggestion.type });
    (onNavigate ?? router.push)(suggestion.href);
    onClose?.();
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    const exact = suggestions.find(
      (suggestion) => foldNameForm(suggestion.form) === foldNameForm(term)
    );
    submitSearch(
      exact?.href ??
        `${getLocalizedRoute(language, "search")}?${new URLSearchParams({ q: term })}`
    );
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    }
    if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    }
    if (event.key === "Escape" && answered) {
      event.preventDefault();
      setAnswered(false);
      setSuggestions([]);
      setActive(0);
    }
    if (event.key === "Enter" && suggestions[active] && query.trim()) {
      event.preventDefault();
      openSuggestion(suggestions[active], active + 1);
    }
  };

  return (
    <div className="universal-search">
      <form role="search" onSubmit={submit} className="universal-search-form">
        <label htmlFor={id} className="universal-search-label">
          {SEARCH_LABEL}
        </label>
        <div className="universal-search-control">
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-afh-text-soft"
          />
          <input
            ref={input}
            id={id}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={answered}
            aria-controls={`${id}-suggestions`}
            aria-activedescendant={
              suggestions[active] ? `${id}-option-${active}` : undefined
            }
            aria-describedby={describedBy}
            type="search"
            name="q"
            value={query}
            placeholder={SEARCH_PLACEHOLDER}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setSuggestions([]);
              setAnswered(false);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
          />
          {query && (
            <button
              type="button"
              aria-label={copy.clear}
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setAnswered(false);
                input.current?.focus();
              }}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
        <button type="submit" className="universal-search-submit">
          {copy.submit}
        </button>
      </form>
      {answered && (
        <div className="universal-search-panel">
          {suggestions.length ? (
            <ScrollArea className="max-h-80">
              <ul
                id={`${id}-suggestions`}
                role="listbox"
                aria-label={copy.suggestions}
              >
                {suggestions.map((item, index) => (
                  <li
                    key={`${item.type}-${item.id}-${item.form}`}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={index === active}
                  >
                    <a
                      href={item.href}
                      onMouseEnter={() => setActive(index)}
                      onClick={(event) => {
                        event.preventDefault();
                        openSuggestion(item, index + 1);
                      }}
                    >
                      <strong>{item.form}</strong>
                      {item.note && <span>{item.note}</span>}
                      <small>{copy.kinds[item.type] ?? item.type}</small>
                    </a>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      submitSearch(
                        `${getLocalizedRoute(language, "search")}?${new URLSearchParams({ q: query.trim() })}`
                      )
                    }
                  >
                    {copy.allAnswers(query.trim())}
                  </button>
                </li>
              </ul>
            </ScrollArea>
          ) : (
            <p>
              {copy.noPrefix(query.trim())}{" "}
              <button
                type="button"
                onClick={() =>
                  submitSearch(
                    `${getLocalizedRoute(language, "search")}?${new URLSearchParams({ q: query.trim() })}`,
                    0
                  )
                }
              >
                {copy.searchAnyway}
              </button>
            </p>
          )}
        </div>
      )}
      <style jsx>{`
        .universal-search {
          position: relative;
          text-align: left;
        }
        .universal-search-form {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .universal-search-label {
          flex: 0 0 100%;
          margin-bottom: 0;
          font-size: var(--afh-text-small);
          font-weight: 600;
          color: var(--afh-text);
        }
        .universal-search-control {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 100%;
          min-width: 0;
          min-height: 52px;
          padding: 0 14px;
          background: var(--afh-surface);
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg);
        }
        .universal-search-control:focus-within {
          border-color: var(--accent-ink);
          box-shadow: 0 0 0 3px var(--accent-tint);
        }
        .universal-search-control input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          font-size: var(--afh-text-body);
          color: var(--afh-text);
        }
        .universal-search-control input::-webkit-search-cancel-button {
          -webkit-appearance: none;
        }
        .universal-search-control button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 0;
          background: transparent;
          color: var(--afh-text-soft);
        }
        .universal-search-submit {
          min-height: 52px;
          flex: 1 1 8rem;
          border: 0;
          border-radius: var(--afh-radius-lg);
          background: var(--accent);
          color: var(--accent-foreground);
          font-weight: 600;
        }
        .universal-search-panel {
          position: absolute;
          z-index: 30;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: var(--afh-surface);
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg);
          box-shadow: var(--afh-shadow-md);
        }
        .universal-search-panel ul {
          list-style: none;
          padding: 8px;
          margin: 0;
        }
        .universal-search-panel li a {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2px 12px;
          padding: 10px;
          color: var(--afh-text);
          text-decoration: none;
        }
        .universal-search-panel li[aria-selected="true"] a {
          background: var(--afh-bg-warm);
        }
        .universal-search-panel li a span {
          grid-column: 1;
          color: var(--afh-text-soft);
        }
        .universal-search-panel li a small {
          grid-column: 2;
          grid-row: 1/3;
          align-self: center;
          color: var(--afh-text-soft);
        }
        .universal-search-panel li:last-child {
          border-top: 1px solid var(--afh-border);
          padding-top: 6px;
        }
        .universal-search-panel li:last-child button,
        .universal-search-panel p button {
          padding: 8px;
          border: 0;
          background: none;
          text-decoration: underline;
          color: var(--afh-text);
        }
        .universal-search-panel p {
          margin: 0;
          padding: 16px;
          color: var(--afh-text);
        }
        @media (min-width: 768px) {
          .universal-search-control {
            flex-basis: 0;
          }
          .universal-search-submit {
            flex: 0 0 9rem;
          }
        }
      `}</style>
    </div>
  );
}
