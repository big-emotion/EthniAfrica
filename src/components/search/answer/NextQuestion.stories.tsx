import type { Meta } from "@storybook/react";

import { NextQuestion } from "@/components/search/answer/NextQuestion";
import {
  answerFixture,
  widthStory,
} from "@/components/search/answer/__fixtures__/answerStories";

const meta = {
  title: "Search/Answer/NextQuestion",
  component: NextQuestion,
} satisfies Meta<typeof NextQuestion>;

export default meta;

const written = {
  next: answerFixture("lingala").answer.next!,
  kind: "language" as const,
  href: "#",
};
const template = {
  next: answerFixture("civ").answer.next!,
  kind: "country" as const,
};

/** The fiche's own question, as a link. */
// @req REQ-178
export const Written320 = widthStory(320, written);
// @req REQ-178
export const Written430 = widthStory(430, written);
// @req REQ-178
export const Written768 = widthStory(768, written);
// @req REQ-178
export const Written1280 = widthStory(1280, written);
/** The template fallback, with nowhere to lead yet. */
// @req REQ-178
export const Template320 = widthStory(320, template);
// @req REQ-178
export const Template430 = widthStory(430, template);
// @req REQ-178
export const Template768 = widthStory(768, template);
// @req REQ-178
export const Template1280 = widthStory(1280, template);
