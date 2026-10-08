import type { Meta } from "@storybook/react";

import { WhereBars } from "@/components/search/answer/WhereBars";
import {
  ANSWER_LABELS,
  answerFixture,
  widthStory,
} from "@/components/search/answer/__fixtures__/answerStories";

const meta = {
  title: "Search/Answer/WhereBars",
  component: WhereBars,
} satisfies Meta<typeof WhereBars>;

export default meta;

function argsOf(name: Parameters<typeof answerFixture>[0], index = 0) {
  const { answer } = answerFixture(name, index);
  return {
    where: answer.where!,
    kind: answer.kind,
    facts: answer.what.facts,
    labels: ANSWER_LABELS,
  };
}

const lingala = argsOf("lingala");
const camara = argsOf("camara");
const congo = { ...argsOf("congo", 1), heading: "RD Congo" };

/** Speakers in millions, labelled as estimates. */
// @req REQ-178
export const Lingala320 = widthStory(320, lingala);
// @req REQ-178
export const Lingala430 = widthStory(430, lingala);
// @req REQ-178
export const Lingala768 = widthStory(768, lingala);
// @req REQ-178
export const Lingala1280 = widthStory(1280, lingala);
/** A patronyme: country pills, no figures. */
// @req REQ-178
export const Camara320 = widthStory(320, camara);
// @req REQ-178
export const Camara430 = widthStory(430, camara);
// @req REQ-178
export const Camara768 = widthStory(768, camara);
// @req REQ-178
export const Camara1280 = widthStory(1280, camara);
/** A country's shares by people, with what is not yet split. */
// @req REQ-178
export const Congo320 = widthStory(320, congo);
// @req REQ-178
export const Congo430 = widthStory(430, congo);
// @req REQ-178
export const Congo768 = widthStory(768, congo);
// @req REQ-178
export const Congo1280 = widthStory(1280, congo);
