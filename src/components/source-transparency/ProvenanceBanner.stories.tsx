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

/** The one state: the total, the last human review, the way to the sources. */
// @req REQ-019
export const Default: Story = {
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
  name: "Never reviewed by a person",
  args: {
    language: "fr",
    census: census(
      { official: 0, referenced: 3, unverified: 2, needs_review: 5 },
      null
    ),
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
