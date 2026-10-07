import type { Meta } from "@storybook/react";

import { NamesBlock } from "@/components/search/answer/NamesBlock";
import {
  answerFixture,
  widthStory,
} from "@/components/search/answer/__fixtures__/answerStories";

const meta = {
  title: "Search/Answer/NamesBlock",
  component: NamesBlock,
} satisfies Meta<typeof NamesBlock>;

export default meta;

const peul = { answer: answerFixture("peul").answer, searchedForm: "peul" };
const camara = {
  answer: answerFixture("camara").answer,
  searchedForm: "camara",
};
const congo = {
  answer: answerFixture("congo", 1).answer,
  groupLabel: "RD Congo",
};

/** A list: who uses each form, the self-given name first. */
// @req REQ-178
export const Peul320 = widthStory(320, peul);
// @req REQ-178
export const Peul430 = widthStory(430, peul);
// @req REQ-178
export const Peul768 = widthStory(768, peul);
// @req REQ-178
export const Peul1280 = widthStory(1280, peul);
/** Pills: spellings of a family name. */
// @req REQ-178
export const Camara320 = widthStory(320, camara);
// @req REQ-178
export const Camara430 = widthStory(430, camara);
// @req REQ-178
export const Camara768 = widthStory(768, camara);
// @req REQ-178
export const Camara1280 = widthStory(1280, camara);
/** A timeline: a country's former names. */
// @req REQ-178
export const Congo320 = widthStory(320, congo);
// @req REQ-178
export const Congo430 = widthStory(430, congo);
// @req REQ-178
export const Congo768 = widthStory(768, congo);
// @req REQ-178
export const Congo1280 = widthStory(1280, congo);
