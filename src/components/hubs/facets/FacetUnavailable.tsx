/**
 * What a facet hub renders when its read failed (`readFacet` returned `null`).
 *
 * One component because the three hubs had each written their own, and the
 * copies had already parted: two announced the outage as a `status`, the names
 * hub as an `alert`. A failed read is news the reader should hear when they
 * reach it, not an interruption, and it must never read as an empty corpus —
 * so there are no counts and no links here, only the facet's own wording.
 */
// @req REQ-139
export function FacetUnavailable({ message }: { message: string }) {
  return (
    <div className="afh-facet-reading">
      <p role="status" className="afh-facet-reading-lede">
        {message}
      </p>
    </div>
  );
}
