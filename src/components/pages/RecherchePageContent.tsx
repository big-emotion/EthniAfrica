"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/layout/PageLayout";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { AutonymExonymHeading } from "@/components/ui/AutonymExonymHeading";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchPeopleGroupCard } from "@/components/search/SearchPeopleGroupCard";
import { NameAnswer } from "@/components/search/NameAnswer";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { SourcedHighlightBlock } from "@/components/search/SourcedHighlightBlock";
import { SearchLensBar } from "@/components/search/SearchLensBar";
import { NoNameFicheNote } from "@/components/search/NoNameFicheNote";
import { NoResultsLeads } from "@/components/search/NoResultsLeads";
import { useLanguage } from "@/hooks/use-language";
import { useAutocomplete } from "@/hooks/use-autocomplete";
import { getLocalizedRoute } from "@/lib/routing";
import { cn } from "@/lib/utils";
import {
  compareByRelevance,
  EMPTY_SEARCH_LENS_COUNTS,
  type SearchLensCounts,
} from "@/lib/search/searchEnvelope";
import { search as searchCorpus, searchWithLeads } from "@/lib/afrikLoader";
import {
  readRelation,
  relationSearchParams,
  type SearchRelation,
} from "@/lib/search/relationSearch";
import { selectNameSubject } from "@/lib/search/nameSubject";
import {
  getSearchLabel,
  getSearchPlaceholder,
} from "@/lib/search/searchVocabulary";
import { groupPeopleResults } from "@/lib/search/groupPeopleResults";
import { getCountryCommonName } from "@/lib/countryNames";
import { formatNumber } from "@/lib/languageTag";
import {
  getLocalizedSearchResultFamilyName,
  getLocalizedSearchResultName,
} from "@/lib/search/localizedResult";
import type {
  SearchEntityType,
  SearchLead,
  SearchResult,
} from "@/types/afrik-frontend";

// ── constants ─────────────────────────────────────────────────────────────────

/** Per-kind ceilings the route applies to each ranked query. */
const RESULTS_PER_SEARCH = 20;
const SUGGESTIONS_PER_KEYSTROKE = 6;

// ── types ─────────────────────────────────────────────────────────────────────

// The page renders exactly what the shared envelope adapter emits; it used to
// declare a parallel hit shape, which is how its reader drifted off-contract.
type SearchHit = SearchResult;

/**
 * `idle` — nothing committed yet, the page shows its default head.
 * `loading` — a fetch for the committed query is in flight or has not run.
 * `loaded` — the corpus answered; results reflect what it holds.
 * `failed` — the request never reached the corpus.
 *
 * A `?q=` on arrival used to initialise a `hasSearched` flag straight to
 * `true` before any fetch had run, so the empty-state block could paint on
 * the very first client render — the one SSR HTML is reconciled against —
 * ahead of the results it was supposed to describe (ETNI-1793). Starting in
 * `loading` whenever the URL already commits a query closes that gap: the
 * empty state is gated on `loaded`, which nothing reaches before the fetch
 * itself does.
 *
 * `failed` is separate from `loaded` so the page can tell an outage from a
 * silence. The loader degrades every failure to an empty envelope, which is
 * right for rendering and wrong for what the page then says: its answer to a
 * name it does not find is a confession about the corpus, and an unanswered
 * request is not one.
 */
type SearchStatus = "idle" | "loading" | "loaded" | "failed";

// ── component ─────────────────────────────────────────────────────────────────

// @req REQ-002
export function RecherchePageContent() {
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get("q") ?? "";
  const initialRelation = readRelation(searchParams);

  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [relation, setRelation] = useState<SearchRelation | null>(
    initialRelation
  );

  const [results, setResults] = useState<SearchHit[]>([]);
  const [leads, setLeads] = useState<SearchLead[]>([]);
  const [counts, setCounts] = useState<SearchLensCounts>(
    EMPTY_SEARCH_LENS_COUNTS
  );
  const [activeLens, setActiveLens] = useState<SearchEntityType | "all">("all");
  const [status, setStatus] = useState<SearchStatus>(
    initialQuery || initialRelation ? "loading" : "idle"
  );

  const fetchSuggestionsFromCorpus = useCallback(
    (query: string): Promise<SearchHit[]> =>
      searchCorpus(query, {
        limit: SUGGESTIONS_PER_KEYSTROKE,
        lang: language,
      }),
    [language]
  );

  // ── URL sync ────────────────────────────────────────────────────────────────

  const syncURL = useCallback(
    (q: string, rel: SearchRelation | null) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (rel) params.set(rel.kind, rel.id);
      const route = getLocalizedRoute(language, "search");
      const url = params.toString() ? `${route}?${params}` : route;
      router.replace(url, { scroll: false });
    },
    [language, router]
  );

  // ── main search ─────────────────────────────────────────────────────────────

  const performSearch = useCallback(
    async (q: string, rel: SearchRelation | null) => {
      setActiveLens("all");
      // A relation on its own is a complete search: "the peoples of the Krou
      // family" asks something whole without any free text.
      if (!q.trim() && !rel) {
        setResults([]);
        setLeads([]);
        setCounts(EMPTY_SEARCH_LENS_COUNTS);
        setStatus("idle");
        return;
      }
      setStatus("loading");
      try {
        const {
          results: hits,
          leads: nearMisses,
          counts: lensCounts,
          answered,
        } = await searchWithLeads(q, {
          limit: RESULTS_PER_SEARCH,
          lang: language,
          ...relationSearchParams(rel),
        });
        setResults(hits);
        setLeads(nearMisses);
        setCounts(lensCounts);
        // Reported here rather than from the submit handler, so a query that
        // arrives by URL — a shared link, a bookmark — counts as the search it
        // is. Only the modal used to report, which left every such arrival out.
        //
        // The count is the point: a query returning nothing is what the corpus
        // was asked for and does not hold. The query itself is deliberately
        // absent, on this surface as on the modal.
        //
        // `answered` gates it because the loader degrades every failure to an
        // empty envelope, so a zero here is otherwise indistinguishable from
        // an outage.
        if (answered) {
          trackEvent("search:submit", {
            surface: "serp",
            results: hits.length,
          });
        }
        setStatus(answered ? "loaded" : "failed");
      } catch {
        setResults([]);
        setLeads([]);
        setCounts(EMPTY_SEARCH_LENS_COUNTS);
        setStatus("failed");
      }
    },
    [language]
  );

  // On mount: if the URL carries a query or a relation, search immediately.
  // Later relation changes (e.g. dismissing the chip) re-run the same search
  // and sync the URL — a single effect keyed on `relation` covers both, which
  // is what keeps a `?q=` arrival to exactly one fetch.
  const isFirstRelationRun = useRef(true);
  useEffect(() => {
    if (!committedQuery && !relation) {
      isFirstRelationRun.current = false;
      return;
    }
    performSearch(committedQuery, relation);
    if (!isFirstRelationRun.current) {
      syncURL(committedQuery, relation);
    }
    isFirstRelationRun.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, relation]);

  // ── auto-suggest ────────────────────────────────────────────────────────────

  /**
   * The SERP's own field used to declare `role="searchbox"` over a
   * `role="listbox"` it did not own — a searchbox cannot own suggestions, so
   * under a screen reader the suggestions of the canonical search surface
   * simply did not exist. The shared hook carries the combobox contract the
   * accueil and the compare picker already honoured.
   */
  const suggest = useAutocomplete<SearchHit>({
    fetchSuggestions: fetchSuggestionsFromCorpus,
    onSelect: (hit) => handleSuggestionClick(hit),
    initialQuery,
    limit: SUGGESTIONS_PER_KEYSTROKE,
  });
  const inputValue = suggest.query;

  // ── keyboard shortcut: "/" → focus input (progressive enhancement) ──────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── event handlers ──────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    setCommittedQuery(q);
    suggest.dismiss();
    syncURL(q, relation);
    performSearch(q, relation);
  };

  function handleSuggestionClick(hit: SearchHit) {
    // `commit`, not `setQuery`: the name goes into the field as a resolved
    // query, so the panel does not reopen over the results it just asked for.
    const name = getLocalizedSearchResultName(hit, language);
    suggest.commit(name);
    setCommittedQuery(name);
    syncURL(name, relation);
    performSearch(name, relation);
  }

  /**
   * A search that ran and a search that led somewhere used to be the same
   * event. The rank is what separates them usefully: it says how far down the
   * reader had to go before the page answered, which is the difference between
   * a working ranking and one that buries its own best result.
   *
   * A position and a kind, never the query.
   */
  const trackResultClick = (type: string, rank: number) =>
    trackEvent("search:result_click", { surface: "serp", type, rank });

  // ── derived state ───────────────────────────────────────────────────────────

  const hasActiveFilters = Boolean(relation);

  const lensFilteredResults =
    activeLens === "all"
      ? results
      : results.filter((r) => r.type === activeLens);

  // The envelope groups peoples, then countries, then families; relevance
  // alone is not comparable across kinds, so cross-kind ordering always goes
  // through `compareByRelevance`, which decides on `exactMatch` first.
  const sortedResults = [...lensFilteredResults].sort(compareByRelevance);

  // Every entity that answers to the name, which may be none, one, or —
  // « Bassa » — three unrelated peoples. A relation-scoped list ("the peoples
  // of the Krou family") is a browse rather than a question about a name, so
  // it has no subject at all.
  const nameSubjects = relation
    ? []
    : selectNameSubject(sortedResults, committedQuery, language);

  // The subjects are answered above the list, so the list does not repeat
  // them. Every remaining card keeps its rank from the top of that list.
  const listResults = sortedResults.filter(
    (result) => !nameSubjects.includes(result)
  );
  const firstListRank = 1;

  // A relation-scoped list ("the peoples of the Krou family") has no single
  // answer, so it never gets a pivot.
  const relationLabel = !relation
    ? ""
    : relation.kind === "country"
      ? `${language === "en" ? "Peoples in" : "Peuples du pays"} ${getCountryCommonName(language, relation.id, relation.id)}`
      : `${language === "en" ? "Peoples in the family" : "Peuples de la famille"} ${
          getLocalizedSearchResultFamilyName(
            results.find((r) => r.languageFamilyId === relation.id) ?? {
              type: "languageFamily",
              id: relation.id,
              name: relation.id,
            },
            language
          ) ?? relation.id
        }`;

  const resultCountLabel =
    language === "en"
      ? `${formatNumber(language, sortedResults.length)} result${
          sortedResults.length === 1 ? "" : "s"
        }${committedQuery ? ` for “${committedQuery}”` : ""}`
      : `${formatNumber(language, sortedResults.length)} résultat${
          sortedResults.length > 1 ? "s" : ""
        }${committedQuery ? ` pour « ${committedQuery} »` : ""}`;

  // Only once the fetch has resolved does the page know what it is answering
  // with — showing a head ahead of that paints a stale one for a frame.
  const showQueryHead = status === "loaded";

  // The head is the count, always. It used to be the crowned answer's own
  // name when a pivot existed; DEC-057 retires that, and the name the reader
  // typed is now answered by `NameAnswer` below, where every form it is known
  // by is drawn at the same weight.
  //
  // The brand gradient stays scoped to the literal word "Recherche" (brand
  // charter §5.3): a result count is corpus content, not the brand lockup.
  const heroHead = !showQueryHead ? undefined : (
    <h1 className="afh-hero-title" style={{ fontWeight: 900 }}>
      {resultCountLabel}
    </h1>
  );

  // Named lenses (REQ-124) only mean something once counts have resolved,
  // and a corpus-wide zero would offer nothing but "Tout (0)".
  const showLensBar = status === "loaded" && counts.all > 0;
  const showNoNameFicheNote =
    status === "loaded" && counts.person > 0 && counts.patronyme === 0;

  const resultsList = status === "loaded" && listResults.length > 0 && (
    <ul
      data-testid="search-results-list"
      className="grid grid-cols-1 gap-afh-lg min-[760px]:grid-cols-2"
      aria-label={
        language === "en" ? "Search results" : "Résultats de recherche"
      }
    >
      {groupPeopleResults(listResults).map((entry, i) =>
        entry.type === "peopleGroup" ? (
          <li key={`peopleGroup-${entry.peopleGroupId}-${i}`}>
            <SearchPeopleGroupCard
              group={entry}
              language={language}
              onNavigate={() => trackResultClick(entry.type, firstListRank + i)}
            />
          </li>
        ) : (
          <li key={`${entry.type}-${entry.id}-${i}`}>
            <SearchResultCard
              result={entry}
              language={language}
              onNavigate={() => trackResultClick(entry.type, firstListRank + i)}
            />
          </li>
        )
      )}
    </ul>
  );

  const refinements = (
    <>
      {showLensBar && (
        <SearchLensBar
          language={language}
          active={activeLens}
          counts={counts}
          showCounts
          onChange={setActiveLens}
        />
      )}
      {showNoNameFicheNote && <NoNameFicheNote language={language} />}
    </>
  );

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <PageLayout
      language={language}
      onLanguageChange={setLanguage}
      title={
        showQueryHead ? undefined : language === "en" ? "Search" : "Recherche"
      }
      subtitle={showQueryHead ? undefined : getSearchLabel(language)}
      heroHead={heroHead}
    >
      {/* The SERP's one page-level accent (brand charter §2): everything on
          this route that reads var(--accent) — the lens bar's active pill,
          in particular — resolves it from here rather than each needing its
          own scope. A result card can still narrow to its own entity-type
          accent (SEARCH_ENTITY_ACCENT), which wins locally by nesting. */}
      <div className="afh-shell afh-accent-ocre space-y-afh-5xl">
        {/* ── search form ── */}
        <form
          onSubmit={handleSubmit}
          role="search"
          aria-label={
            language === "en" ? "Search form" : "Formulaire de recherche"
          }
          className="relative flex flex-col md:flex-row gap-afh-md"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-afh-text-muted pointer-events-none"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              type="search"
              {...suggest.comboboxProps}
              aria-label={getSearchLabel(language)}
              placeholder={getSearchPlaceholder(language)}
              value={inputValue}
              onChange={(e) => suggest.setQuery(e.target.value)}
              onKeyDown={suggest.handleKeyDown}
              // The blur is delayed past the option's mousedown on purpose:
              // closing on focus loss alone retracts the panel out from under
              // the click that was landing on it.
              onBlur={() => setTimeout(() => suggest.dismiss(), 150)}
              className="pl-10 h-12 text-afh-small"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="h-12 px-6 shrink-0">
            {language === "en" ? "Search" : "Rechercher"}
          </Button>
          {/* Hung from the form rather than the input: below md the form
              stacks, and a panel under the input alone covered the submit
              button, so a tap meant to submit landed on a suggestion. */}
          {suggest.isOpen && (
            <ul
              id={suggest.listboxId}
              role="listbox"
              aria-label={
                language === "en"
                  ? "Search suggestions"
                  : "Suggestions de recherche"
              }
              className="absolute left-0 top-full z-50 w-full bg-afh-surface border border-afh-border rounded-afh-lg shadow-afh-2 mt-afh-xs overflow-hidden"
            >
              {suggest.options.map((hit, index) => (
                <li
                  key={hit.id}
                  {...suggest.getOptionProps(index)}
                  className={cn(
                    "px-afh-2xl py-afh-md hover:bg-afh-bg-warm cursor-pointer text-afh-small",
                    index === suggest.activeIndex && "bg-afh-bg-warm"
                  )}
                  onMouseDown={() => handleSuggestionClick(hit)}
                >
                  {getLocalizedSearchResultName(hit, language)}
                </li>
              ))}
            </ul>
          )}
        </form>

        {/* ── filter chip row (always visible) ── */}
        <div
          data-testid="filter-chip-row"
          role="group"
          className="flex flex-wrap items-center gap-afh-md min-h-[2rem]"
          aria-label={language === "en" ? "Active filters" : "Filtres actifs"}
        >
          {relation && (
            <Badge
              variant="secondary"
              className="flex items-center gap-afh-xs px-afh-lg py-afh-xs text-afh-small"
            >
              {relationLabel}
              <button
                type="button"
                aria-label={`${language === "en" ? "Remove filter" : "Supprimer le filtre"} ${relationLabel}`}
                onClick={() => setRelation(null)}
                className={cn("ml-afh-xs rounded-full", CHARTER_FOCUS_RING)}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setRelation(null)}
              className="text-afh-small text-afh-fg-muted hover:text-afh-text underline underline-offset-2 ml-auto"
            >
              {language === "en" ? "Clear all" : "Tout effacer"}
            </button>
          )}
        </div>

        {/* ── loading indicator ── */}
        {status === "loading" && (
          <div
            className="flex items-center justify-center h-32"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-afh-text-muted"
              aria-label={
                language === "en" ? "Loading search" : "Chargement en cours"
              }
            />
          </div>
        )}

        {/* Split fiches of the same people (ETNI-1391) are grouped into one
            card here, at display time only — the underlying result order and
            count are unaffected. */}
        {/* Named positively rather than as a list of exclusions, because the
            negative form silently admitted every status nobody had thought of:
            `failed` fell through it and drew the unknown-name answer — an
            confession about the corpus — on a request that never reached it. */}
        {(status === "idle" || (status === "loaded" && results.length > 0)) && (
          <div data-testid="search-results-layout" className="space-y-afh-5xl">
            {/* The answer to the name, then the complete typed result set the
                surviving clauses of REQ-124 still require. One column at every
                width: the side rail asserted a hierarchy the corpus does not
                support, and moving it below would have kept the assertion. */}
            {committedQuery && !relation ? (
              <NameAnswer
                subjects={nameSubjects}
                query={committedQuery}
                language={language}
              />
            ) : null}
            {nameSubjects.length === 1 ? (
              <SourcedHighlightBlock
                result={nameSubjects[0]}
                language={language}
              />
            ) : null}
            {refinements}
            {resultsList}
          </div>
        )}

        {status === "failed" && (
          <div className="bg-afh-bg-warm rounded-afh-lg px-afh-5xl py-afh-7xl text-center">
            <p
              className="text-afh-small text-afh-text-soft mx-auto max-w-sm"
              role="status"
            >
              {nameAnswerCopy[language].searchUnavailable}
            </p>
          </div>
        )}

        {/* ── a search that returned nothing ──
            The boards keep two cases apart here, and so does this. A spelling
            that missed gets the near-misses the engine found; only a name
            nothing came close to gets the confession REQ-178 asks for. Stacking
            them would confess a gap on a query that was merely mistyped.

            What both replace opened on the reader's spelling — a search engine
            apologising for its index, where the doctrine says the silence is
            the atlas's own. */}
        {status === "loaded" && results.length === 0 && (
          <div className="space-y-afh-2xl">
            {leads.length > 0 ? (
              <div className="flex flex-col items-center gap-afh-2xl bg-afh-bg-warm rounded-afh-lg px-afh-5xl py-afh-7xl text-center">
                <p className="text-afh-small text-afh-text-soft max-w-sm">
                  {nameAnswerCopy[language].noExactMatch} « {committedQuery} ».
                </p>
                <NoResultsLeads leads={leads} language={language} />
              </div>
            ) : (
              <NameAnswer
                subjects={[]}
                query={committedQuery}
                language={language}
              />
            )}
            <div className="flex flex-col items-center gap-afh-md text-afh-small">
              <Link
                href={getLocalizedRoute(language, "peoples")}
                className="underline underline-offset-2 hover:text-afh-text transition-colors"
              >
                {nameAnswerCopy[language].browsePeoples}
              </Link>
              <Link
                href={getLocalizedRoute(language, "families")}
                className="underline underline-offset-2 hover:text-afh-text transition-colors"
              >
                {nameAnswerCopy[language].browseFamilies}
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
