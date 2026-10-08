import type { Meta } from "@storybook/react";

import { SourcesLine } from "@/components/search/answer/SourcesLine";
import {
  answerFixture,
  widthStory,
} from "@/components/search/answer/__fixtures__/answerStories";

const meta = {
  title: "Search/Answer/SourcesLine",
  component: SourcesLine,
} satisfies Meta<typeof SourcesLine>;

export default meta;

function argsOf(name: Parameters<typeof answerFixture>[0]) {
  const { answer } = answerFixture(name);
  return {
    count: answer.sources.count,
    accounts: answer.origin?.accounts,
    kind: answer.kind,
    title: answer.title,
  };
}

const lingala = argsOf("lingala");
const peul = argsOf("peul");

/** Two readings: the sheet groups the sources by reading. */
// @req REQ-178
export const Lingala320 = widthStory(320, lingala);
// @req REQ-178
export const Lingala430 = widthStory(430, lingala);
// @req REQ-178
export const Lingala768 = widthStory(768, lingala);
// @req REQ-178
export const Lingala1280 = widthStory(1280, lingala);
// @req REQ-178
export const Peul320 = widthStory(320, peul);
// @req REQ-178
export const Peul430 = widthStory(430, peul);
// @req REQ-178
export const Peul768 = widthStory(768, peul);
// @req REQ-178
export const Peul1280 = widthStory(1280, peul);
