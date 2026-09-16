import type { Meta, StoryObj } from "@storybook/react";

import { ProvenanceBanner } from "./ProvenanceBanner";
import type { ProvenanceCensus } from "@/api/v2/schemas/confidence";

const meta: Meta<typeof ProvenanceBanner> = {
  title: "SourceTransparency/ProvenanceBanner",
  component: ProvenanceBanner,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  // On the parchment ground, because that is the only place the banner ever
  // renders and the ground is load-bearing: below 768 px `body` is centred by
  // the mobile-text charter and `.afh-parchment` is the exemption that puts
  // the fiche back on one left edge. Rendered bare, the story showed the
  // sources link drifting to the middle — a phone bug this component does not
  // actually have.
  decorators: [
    (Story) => (
      <div className="afh-parchment afh-parchment-section">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProvenanceBanner>;

function census(
  standings: ProvenanceCensus["standings"],
  lastHumanAuditAt: string | null = "2026-03-12T00:00:00.000Z"
): ProvenanceCensus {
  return {
    entityType: "country",
    entityId: "CIV",
    assertionCount: Object.values(standings).reduce((a, b) => a + b, 0),
    standings,
    lastHumanAuditAt,
  };
}

/**
 * The norm. Every assertion rests on an official or referenced source, so the
 * banner states the total and stands back — this is the discretion the loud
 * state borrows its salience from.
 */
// @req REQ-019
export const Settled: Story = {
  name: "Quiet — nothing below referenced",
  args: {
    language: "fr",
    census: census({
      official: 4,
      referenced: 11,
      unverified: 0,
      needs_review: 0,
    }),
  },
};

/** One unverified assertion is enough to open the census. */
// @req REQ-019
export const OneWeakStanding: Story = {
  name: "Loud — a single unverified assertion",
  args: {
    language: "fr",
    census: census({
      official: 9,
      referenced: 6,
      unverified: 1,
      needs_review: 0,
    }),
  },
};

/** The worked example from the charter, at 430 px the census wraps. */
// @req REQ-019
export const FullCensus: Story = {
  name: "Loud — all four standings",
  args: {
    language: "fr",
    census: census({
      official: 4,
      referenced: 11,
      unverified: 4,
      needs_review: 2,
    }),
  },
};

/** A fiche nobody has read yet says so, rather than showing a blank date. */
// @req REQ-019
export const NeverReviewed: Story = {
  name: "Loud — never reviewed by a person",
  args: {
    language: "fr",
    census: census(
      { official: 0, referenced: 3, unverified: 2, needs_review: 5 },
      null
    ),
  },
};

// @req REQ-019
export const English: Story = {
  name: "Loud — English",
  args: {
    language: "en",
    census: census({
      official: 4,
      referenced: 11,
      unverified: 4,
      needs_review: 2,
    }),
  },
};

/** No assertion recorded: the component renders nothing at all. */
// @req REQ-019
export const NothingRecorded: Story = {
  name: "Empty census (renders nothing)",
  args: {
    language: "fr",
    census: census(
      { official: 0, referenced: 0, unverified: 0, needs_review: 0 },
      null
    ),
  },
};
