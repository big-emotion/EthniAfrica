import type { Decorator, Meta, StoryObj } from "@storybook/react";

import { NameTimeline } from "@/components/search/timeline/NameTimeline";
import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";
import { cn } from "@/lib/utils";

/**
 * The « Histoire du nom » lens (ETNI-2012) as the search result page opens
 * on it, at 430 px first. The fixtures are condensed from the lingala and Peul
 * fiches; `…Night` rebinds the tokens the way the night theme does.
 */

const frame: Decorator = (Story, { parameters }) => (
  <div
    className={cn(
      "afh-shell afh-accent-ocre min-w-0 bg-afh-bg-warm py-afh-2xl",
      parameters.night && "dark"
    )}
  >
    <Story />
  </div>
);

const meta = {
  title: "Search/Histoire du nom",
  component: NameTimeline,
  tags: ["autodocs"],
  decorators: [frame],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "ficheMobile430" },
  },
  args: {
    history: LINGALA_HISTORY,
    searched: "lingala",
    subjectType: "language",
    language: "fr",
  },
} satisfies Meta<typeof NameTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A birth, competing origins and what came before the name. */
// @req REQ-198
export const Lingala: Story = {};

/**
 * Searched by a name the people does not give itself: the lead to Fulɓe. With
 * its West African countries, « Pendant ce temps, ailleurs » skips events from
 * West Africa.
 */
// @req REQ-198
export const PeulSearched: Story = {
  args: {
    history: PEUL_HISTORY,
    searched: "Peul",
    subjectType: "people",
    countryIds: ["SEN", "GIN", "MLI"],
  },
};

// @req REQ-198
export const LingalaNight: Story = {
  parameters: { night: true },
};
