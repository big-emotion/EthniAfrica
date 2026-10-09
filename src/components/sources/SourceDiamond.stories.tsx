import type { Meta, StoryObj } from "@storybook/react";

import { SourceDiamond, SourceDiamondLegend } from "./SourceDiamond";
import type { SourceKind } from "@/types/sources";

const meta: Meta<typeof SourceDiamond> = {
  title: "Sources/SourceDiamond",
  component: SourceDiamond,
  parameters: { viewport: { defaultViewport: "mobile430" } },
};
export default meta;

type Story = StoryObj<typeof SourceDiamond>;

const PASSAGES: { text: string; kinds: SourceKind[] }[] = [
  {
    text: "Le nom Peul viendrait du wolof Pël. L'administration coloniale française l'a repris.",
    kinds: ["academic"],
  },
  {
    text: "Le nom Fulani est la forme haoussa. Il s'est répandu en anglais.",
    kinds: ["oral_tradition", "academic"],
  },
  {
    text: "Le nom Fula vient d'un terme mandingue, passé en anglais.",
    kinds: ["press"],
  },
  {
    text: "Le nom Fellata est le terme arabe du Soudan et du Tchad.",
    kinds: ["archive"],
  },
  {
    text: "Le recensement compte les Peuls parmi les grands groupes du pays.",
    kinds: ["official_statistics"],
  },
  {
    text: "Le nom est noté sans source datée.",
    kinds: ["unknown"],
  },
];

/** One diamond per passage, at the end of its last line, at 430px. */
// @req REQ-198
export const InPassages: Story = {
  render: () => (
    <div className="flex max-w-[430px] flex-col gap-afh-sm bg-afh-bg p-afh-base">
      {PASSAGES.map(({ text, kinds }) => (
        <p key={text} className="afh-tile m-0 text-afh-text">
          {text}
          {" "}
          <SourceDiamond kinds={kinds} language="fr" onOpen={() => undefined} />
        </p>
      ))}
    </div>
  ),
};

/** The key the source sheet shows under the sources. */
// @req REQ-198
export const Legend: Story = {
  render: () => (
    <div className="max-w-[430px] bg-afh-surface p-afh-base">
      <SourceDiamondLegend language="fr" />
    </div>
  ),
};
