import type { Meta, StoryObj } from "@storybook/react";

import { SearchFeed } from "@/components/search/SearchFeed";
import {
  FEED_CASES,
  type FeedCaseId,
} from "@/lib/search/__fixtures__/feedCases";

/**
 * The ten reviewed-feed fixtures the forty-board Playwright harness
 * (`e2e/search-feed-visual-proof.spec.ts`) measures against, rendered here
 * for a visual and axe pass outside that harness. Each story passes the
 * fixture's own `board.presentation` — the same board-authored data the
 * harness compares pixel for pixel — so what Storybook shows is the
 * approved rendering, not a derived approximation of it.
 *
 * Only the mobile-day composition is covered; the desktop and night
 * variants, and per-block stories for the fifteen feed components, are the
 * remaining scope of `docs/plans/search-result-feed-completion.md` §5 item 4.
 */
function fixture(id: FeedCaseId) {
  const value = FEED_CASES.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing fixture ${id}`);
  return value;
}

function feedPropsFor(id: FeedCaseId) {
  const value = fixture(id);
  const { results, leads } = value.production.search;
  return {
    query: value.query,
    language: "fr" as const,
    state: value.resultState,
    results,
    subjects: results,
    leads,
    companions: value.production.companions,
    presentation: value.board.presentation,
  };
}

const meta = {
  title: "Search/SearchFeed",
  component: SearchFeed,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof SearchFeed>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Mandé — the searched form is not the one the peoples use. */
// @req REQ-180
export const Mande: Story = { args: feedPropsFor("mande") };

/** Peul — many outside names, none its own, one declared pejorative. */
// @req REQ-180
export const Peul: Story = { args: feedPropsFor("peul") };

/** Fang — the ordinary case: four exonyms, not one of them qualified. */
// @req REQ-180
export const Fang: Story = { args: feedPropsFor("fang") };

/** Bassa — one name, three peoples, three language families, no link. */
// @req REQ-180
export const Bassa: Story = { args: feedPropsFor("bassa") };

/** Ekpeye — almost nothing known, declared rather than hidden. */
// @req REQ-180
export const Ekpeye: Story = { args: feedPropsFor("ekpeye") };

/** Nigeria — a colonial-era name with a documented proposer and date. */
// @req REQ-180
export const Nigeria: Story = { args: feedPropsFor("nigeria") };

/** Lingala — a missionary-created language name, colonial-legacy classed. */
// @req REQ-180
export const Lingala: Story = { args: feedPropsFor("lingala") };

/** Traoré — a patronyme's mandingue form and its colonial transcription. */
// @req REQ-180
export const Traore: Story = { args: feedPropsFor("traore") };

/** Introuvable — a typo reaches the right page via near-miss leads. */
// @req REQ-180
export const Introuvable: Story = { args: feedPropsFor("introuvable") };

/** Inconnu — an unknown name gets an admission, not a zero-result count. */
// @req REQ-180
export const Inconnu: Story = { args: feedPropsFor("inconnu") };
