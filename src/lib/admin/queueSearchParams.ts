/**
 * Reading a moderation queue's query string.
 *
 * Both queues (reports, citations awaiting a ruling) take the same kinds of
 * parameter — a filter, a page size, a page number — from an address a reader
 * can edit by hand, so each read validates instead of trusting.
 */
export type QueueSearchParams = Record<string, string | string[] | undefined>;

// @req REQ-042
export const QUEUE_PAGE_SIZES = [25, 50, 100] as const;

// @req REQ-042
export function firstParam(
  params: QueueSearchParams,
  key: string
): string | null {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || null;
}

// @req REQ-042
export function pickOption<T extends string>(
  raw: string | null,
  allowed: readonly { value: string }[]
): T | undefined {
  return allowed.some((option) => option.value === raw)
    ? (raw as T)
    : undefined;
}

// @req REQ-042
export function pageSizeParam(params: QueueSearchParams): number {
  const requested = Number(firstParam(params, "taille"));
  return QUEUE_PAGE_SIZES.includes(
    requested as (typeof QUEUE_PAGE_SIZES)[number]
  )
    ? requested
    : QUEUE_PAGE_SIZES[0];
}
