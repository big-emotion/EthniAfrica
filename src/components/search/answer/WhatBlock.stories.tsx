import type { Meta } from "@storybook/react";

import { WhatBlock } from "@/components/search/answer/WhatBlock";
import {
  answerFixture,
  widthStory,
} from "@/components/search/answer/__fixtures__/answerStories";

const meta = {
  title: "Search/Answer/WhatBlock",
  component: WhatBlock,
} satisfies Meta<typeof WhatBlock>;

export default meta;

const lingala = { answer: answerFixture("lingala").answer };
const peul = { answer: answerFixture("peul").answer };

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
