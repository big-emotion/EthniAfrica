import { z } from "zod";

/**
 * The public API's page-size contract: twenty rows when a request names no
 * size, a hundred at most. It is what `openapiV2.ts` documents, so it is
 * stated here once rather than beside every endpoint that pages.
 *
 * A leaf module on purpose. `utils/validation.ts` imports the media schema,
 * so a schema reading these numbers from there would import itself in a
 * cycle and meet them uninitialised.
 */
// @req REQ-110
export const DEFAULT_PAGE_SIZE = 20;

// @req REQ-110
export const MAX_PAGE_SIZE = 100;

/*
 * The surfaces below page at their own size. Each keeps the value it shipped
 * with; they are named here, beside the contract they depart from, so a
 * departure is a visible line rather than a number inside a route.
 */

/** Search caps a request at half the API maximum; it defaults like the rest. */
// @req REQ-110
export const SEARCH_MAX_PAGE_SIZE = 50;

/** A page of the name-forms nomenclature (`perPage`). */
// @req REQ-110
export const NAME_FORMS_PAGE_SIZE = 48;

/** The nodes of one people's relation ego network (`limit`). */
// @req REQ-110
export const EGO_NETWORK_PAGE_SIZE = 24;

/** The public reports register: both its first page and its largest page. */
// @req REQ-110
export const PUBLIC_FLAGS_PAGE_SIZE = 50;

/** A `limit` / `perPage` query parameter under the shared contract. */
// @req REQ-110
export const pageSizeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE);
