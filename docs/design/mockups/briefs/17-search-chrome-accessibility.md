# Brief 17 — Search chrome: focus, list structure and the 320 px header

Written 2026-10-18 for ETNI-2107. Status: **approved by the operator on 2026-10-18**. This approval covers the board states and the 14 px pill size. The 320 px header is a visual target for ETNI-2004; its code remains out of scope here.

## Reader and outcome

A reader arrives to search a name and leaves knowing where the keyboard focus is, how the next-step links relate to the page, and how to use the page without sideways scrolling on a narrow phone.

## Boards

Draw mobile first at 430 px, then tablet at 768 px, then desktop at 1440 px. Update `search-unknown` and `search-state-typo` at all three widths, add `search-unknown-320` for the narrow-phone state and `search-unknown-215` for the 430 px / 200% zoom state, and extend `Main` with the shared focus examples and the compact header.

The search field, filter pills and links in the « Aller plus loin » section show the charter focus ring when focused by keyboard. The « Aller plus loin » section is a level-2 heading followed by a list of links. Keep the heading wording from ETNI-2107 for operator review against the reader-facing title rule.

Keep filter pills and the « Aller plus loin » links at 14 px, matching the approved search boards. The page's existing 13 px rendering is the discrepancy for the implementation task; this brief does not change source code.

At 320 px, keep all three header controls at 44 × 44 px and show `EthniAfrica` in full. Hide the tagline and reduce the mark and wordmark size using existing roles. ETNI-2004 owns implementation of the header; this brief supplies its visual target only.

## Approval and dependencies

The operator approved these boards on 2026-10-18. The approval covers the visual states and 14 px pill size. The header implementation remains in ETNI-2004. ETNI-2106 still needs coordination before changing `VerdictBlock.tsx`.

## Review checklist

- Confirm the search input, a filter pill and a next-step link each have a visible focus ring.
- Confirm « Aller plus loin » is a level-2 heading and its links are list items.
- Review the complete page at 430, 768 and 1440 px, in that order.
- At 320 px, confirm the full product name, hidden tagline, 44 × 44 px controls and no horizontal overflow.
- At 215 CSS px (430 px at 200% zoom), confirm the title wraps and the header stacks without horizontal overflow; keep all controls at 44 × 44 px.
- Compare the board pills with the 14 px treatment already recorded on the approved search boards.
