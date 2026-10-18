import "server-only";

import { getCountryHandler } from "@/api/v2/handlers/countries";
import { getLanguageFamilyHandler } from "@/api/v2/handlers/languageFamilies";
import { getLanguageHandler } from "@/api/v2/handlers/languages";
import { getPatronymeHandler } from "@/api/v2/handlers/patronymes";
import { getPeopleHandler } from "@/api/v2/handlers/peoples";
import { ftsSearchHandler } from "@/api/v2/handlers/search";
import { getSearchCompanionsHandler } from "@/api/v2/handlers/searchCompanions";
import {
  DEFAULT_PAGE_SIZE,
  SEARCH_MAX_PAGE_SIZE as MAX_PAGE_SIZE,
} from "@/api/v2/schemas/pagination";
import { searchCompanionsQuerySchema } from "@/api/v2/schemas/searchCompanions";
import { orNotFound, type DetailOutcome } from "@/api/v2/utils/corpusRoute";
import { logger } from "@/lib/api/logger";
import { loadNextSteps, type CorpusTransport } from "@/lib/afrikLoader";
import {
  loadSearchReading,
  type SearchReading,
} from "@/lib/search/searchReading";
import type { Language } from "@/types/shared";

/**
 * The `/api/v2` paths the result page reads, answered by their handlers on
 * the server (REQ-200).
 *
 * The address page has no network path to its own API, and going out through
 * the public host would spend the reader's rate-limit allowance on the
 * server's address. So the same loaders the browser runs are handed this
 * transport instead, and every envelope is mapped by the same code.
 *
 * The search path skips the route's query log on purpose: an address is not
 * a query a reader typed, and crawlers reading addresses would fill the
 * public list of what readers ask.
 */

const FICHE_HANDLERS: Record<string, (id: string) => Promise<DetailOutcome>> = {
  peoples: async (id) =>
    orNotFound(await getPeopleHandler(id), "People not found"),
  countries: async (id) =>
    orNotFound(await getCountryHandler(id), "Country not found"),
  "language-families": async (id) =>
    orNotFound(await getLanguageFamilyHandler(id), "Language family not found"),
  languages: getLanguageHandler,
  patronymes: getPatronymeHandler,
};

const FICHE_PATH = /^\/api\/v2\/([a-z-]+)\/([^/]+)$/;

async function dispatchToHandler(url: URL): Promise<Response> {
  const params = url.searchParams;
  if (url.pathname === "/api/v2/search") {
    const limit = Number.parseInt(params.get("limit") ?? "", 10);
    return Response.json(
      await ftsSearchHandler({
        q: params.get("q") ?? "",
        limit: Math.min(limit > 0 ? limit : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
        offset: 0,
        lang: "fr",
      })
    );
  }
  if (url.pathname === "/api/v2/search/companions") {
    const query = searchCompanionsQuerySchema.safeParse({
      subjects: params.get("subjects") ?? undefined,
      lang: params.get("lang") ?? undefined,
      word: params.get("word") ?? undefined,
    });
    if (!query.success) return new Response(null, { status: 400 });
    return Response.json(await getSearchCompanionsHandler(query.data));
  }
  const fiche = url.pathname.match(FICHE_PATH);
  const resolve = fiche && FICHE_HANDLERS[fiche[1]];
  if (resolve) {
    const outcome = await resolve(decodeURIComponent(fiche[2]));
    return outcome.ok
      ? Response.json(outcome.envelope)
      : new Response(null, { status: 404 });
  }
  return new Response(null, { status: 404 });
}

/** A handler that throws answers 500, as its route would. */
// @req REQ-200
const serverSearchTransport: CorpusTransport = async (path) => {
  // Only the path and query are read; the base is never reached.
  const url = new URL(path, "http://localhost");
  try {
    return await dispatchToHandler(url);
  } catch (error) {
    logger.error("serverSearchTransport: handler failed", error, {
      path: url.pathname,
    });
    return new Response(null, { status: 500 });
  }
};

/**
 * The whole reading of an addressed name, next names included, so the server
 * HTML holds the page the browser would have built from `?q=`.
 *
 * Rejects when the API could not give it, so the error boundary answers 5xx.
 * The browser's `?q=` reading can show the outage with a retry; an address is
 * read by crawlers, and a 200 outage page carrying the address's canonical
 * would be indexed in place of the answer.
 */
// @req REQ-200
export async function readAddressedName(
  spelling: string,
  language: Language
): Promise<SearchReading> {
  const reading = await loadSearchReading(spelling, {
    language,
    transport: serverSearchTransport,
  });
  if (!reading.answered) {
    throw new Error(`readAddressedName: the search did not answer ${spelling}`);
  }
  const nextSteps = await loadNextSteps(
    reading.subjects,
    language,
    undefined,
    reading.nameHistories,
    spelling,
    serverSearchTransport
  );
  return { ...reading, nextSteps };
}
