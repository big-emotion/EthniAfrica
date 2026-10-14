import type { Decorator, Meta, StoryObj } from "@storybook/react";

import {
  NameClosingBand,
  NameNextStep,
} from "@/components/search/timeline/NameClosing";
import { NameTimeline } from "@/components/search/timeline/NameTimeline";
import { PEUL_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import { deduceSilences } from "@/lib/search/nameClosing";
import { buildNameTimeline } from "@/lib/search/nameTimeline";

/**
 * The end of the « Histoire du nom » page (brief 1, approved 2026-10-14):
 * the timeline, « Les sources parlent », the closing band and the next step,
 * as the boards docs/design/mockups/site/search-peul-*.dc.html draw them.
 */

const frame: Decorator = (Story) => (
  <div className="afh-shell afh-accent-ocre min-w-0 bg-afh-bg py-afh-2xl">
    <div className="mx-auto flex max-w-[880px] flex-col gap-[var(--afh-section-gap)]">
      <Story />
    </div>
  </div>
);

function PageEnd() {
  const timeline = buildNameTimeline(PEUL_HISTORY, "peul");
  return (
    <>
      <NameTimeline
        history={PEUL_HISTORY}
        searched="peul"
        subjectType="people"
        sourcesOpen
        language="fr"
      />
      <NameClosingBand
        silences={deduceSilences([{ name: timeline.names[0] }])}
        contributionTarget={{ type: "people", id: "PPL_FULA", name: "Peul" }}
        language="fr"
      />
      <NameNextStep
        cards={[
          {
            kind: "Famille de langues",
            name: "Atlantique",
            reason:
              "Le nom atlantique désigne un ensemble de langues de la côte ouest de l’Afrique, du Sénégal à la Sierra Leone, comme le wolof, le peul, le sérère, le diola ou le temné.",
          },
        ]}
        language="fr"
      />
    </>
  );
}

const meta = {
  title: "Search/Fin de page du nom",
  component: PageEnd,
  decorators: [frame],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "ficheMobile430" },
  },
} satisfies Meta<typeof PageEnd>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Searched as « peul »: block 3 open on its first family. */
// @req REQ-198
export const Peul: Story = {};
