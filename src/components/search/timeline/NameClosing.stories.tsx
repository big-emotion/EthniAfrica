import type { Decorator, Meta, StoryObj } from "@storybook/react";

import {
  NameClosingBand,
  NameFicheSourcesBlock,
  NameNextStep,
} from "@/components/search/timeline/NameClosing";
import { ficheSilences } from "@/lib/fiche/ficheNameClosing";
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
            relation: "family",
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

/**
 * The end of a people fiche (brief 2, approved 2026-10-15; boards
 * people-*.dc.html): the sources grouped by name, the closing band, the next
 * names.
 */
// @req REQ-198
export const FichePeuple: Story = {
  render: () => (
    <>
      <NameFicheSourcesBlock
        history={PEUL_HISTORY}
        subjectType="people"
        language="fr"
      />
      <NameClosingBand
        silences={ficheSilences(PEUL_HISTORY, "people")}
        contributionTarget={{ type: "people", id: "PPL_FULA", name: "Peul" }}
        language="fr"
      />
      <NameNextStep
        cards={[
          {
            relation: "family",
            kind: "Famille de langues",
            name: "Atlantique",
            reason:
              "Le nom atlantique désigne un ensemble de langues de la côte ouest de l’Afrique, du Sénégal à la Sierra Leone, comme le wolof, le peul, le sérère, le diola ou le temné.",
          },
          {
            relation: "patronyme",
            kind: "Nom de famille",
            name: "Ba",
            reason:
              "Le nom Ba, écrit aussi Bâ ou Bah, est un nom de clan des Peuls et des Toucouleurs du Sénégal, de la Mauritanie et de la Guinée.",
          },
        ]}
        language="fr"
      />
    </>
  ),
};
