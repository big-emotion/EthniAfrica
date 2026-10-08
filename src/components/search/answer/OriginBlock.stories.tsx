import type { Meta } from "@storybook/react";

import { OriginBlock } from "@/components/search/answer/OriginBlock";
import {
  answerFixture,
  widthStory,
} from "@/components/search/answer/__fixtures__/answerStories";

const meta = {
  title: "Search/Answer/OriginBlock",
  component: OriginBlock,
} satisfies Meta<typeof OriginBlock>;

export default meta;

function argsOf(name: Parameters<typeof answerFixture>[0]) {
  const { answer } = answerFixture(name);
  return { origin: answer.origin!, kind: answer.kind, title: answer.title };
}

const lingala = argsOf("lingala");
const camara = argsOf("camara");
const congo = argsOf("congo");

/** Debated: each reading keeps its own first sentence, none crowned. */
// @req REQ-178
export const Lingala320 = widthStory(320, lingala);
// @req REQ-178
export const Lingala430 = widthStory(430, lingala);
// @req REQ-178
export const Lingala768 = widthStory(768, lingala);
// @req REQ-178
export const Lingala1280 = widthStory(1280, lingala);
/** Several accounts, each labelled by the kind of source. */
// @req REQ-178
export const Camara320 = widthStory(320, camara);
// @req REQ-178
export const Camara430 = widthStory(430, camara);
// @req REQ-178
export const Camara768 = widthStory(768, camara);
// @req REQ-178
export const Camara1280 = widthStory(1280, camara);
/** One undisputed account, cut at three sentences. */
// @req REQ-178
export const Congo320 = widthStory(320, congo);
// @req REQ-178
export const Congo430 = widthStory(430, congo);
// @req REQ-178
export const Congo768 = widthStory(768, congo);
// @req REQ-178
export const Congo1280 = widthStory(1280, congo);
