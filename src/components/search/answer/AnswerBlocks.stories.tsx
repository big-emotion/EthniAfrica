import type { Meta } from "@storybook/react";

import { NamesBlock } from "@/components/search/answer/NamesBlock";
import { NextQuestion } from "@/components/search/answer/NextQuestion";
import { OriginBlock } from "@/components/search/answer/OriginBlock";
import { SourcesLine } from "@/components/search/answer/SourcesLine";
import { WhatBlock } from "@/components/search/answer/WhatBlock";
import { WhereBars } from "@/components/search/answer/WhereBars";
import {
  ANSWER_LABELS,
  answerFixture,
  widthStory,
} from "@/components/search/answer/__fixtures__/answerStories";
import type { ANSWER_FIXTURES } from "@/lib/search/__fixtures__/answerFixtures";

/**
 * The six blocks in the order of the page, one subject at a time, laid out the
 * way the mockup's screens are so a story can be read beside its capture.
 */
function Subject({
  fixture,
  index = 0,
}: {
  fixture: keyof typeof ANSWER_FIXTURES;
  index?: number;
}) {
  const { query, answer } = answerFixture(fixture, index);
  return (
    <div className="flex flex-col gap-afh-6xl">
      <WhatBlock answer={answer} />
      {answer.origin ? (
        <OriginBlock
          origin={answer.origin}
          kind={answer.kind}
          title={answer.title}
        />
      ) : null}
      <NamesBlock answer={answer} searchedForm={query} />
      {answer.where ? (
        <WhereBars
          where={answer.where}
          kind={answer.kind}
          facts={answer.what.facts}
          labels={ANSWER_LABELS}
        />
      ) : null}
      {answer.next ? (
        <NextQuestion next={answer.next} kind={answer.kind} href="#" />
      ) : null}
      <SourcesLine
        count={answer.sources.count}
        accounts={answer.origin?.accounts}
        kind={answer.kind}
        title={answer.title}
      />
    </div>
  );
}

const meta = {
  title: "Search/Answer/AnswerBlocks",
  component: Subject,
} satisfies Meta<typeof Subject>;

export default meta;

const peul = { fixture: "peul" as const };
const lingala = { fixture: "lingala" as const };
const camara = { fixture: "camara" as const };
const congo = { fixture: "congo" as const, index: 1 };
const bantou = { fixture: "bantou" as const };

// @req REQ-178
export const Peul320 = widthStory(320, peul);
// @req REQ-178
export const Peul430 = widthStory(430, peul);
// @req REQ-178
export const Peul768 = widthStory(768, peul);
// @req REQ-178
export const Peul1280 = widthStory(1280, peul);
// @req REQ-178
export const Lingala320 = widthStory(320, lingala);
// @req REQ-178
export const Lingala430 = widthStory(430, lingala);
// @req REQ-178
export const Lingala768 = widthStory(768, lingala);
// @req REQ-178
export const Lingala1280 = widthStory(1280, lingala);
// @req REQ-178
export const Camara320 = widthStory(320, camara);
// @req REQ-178
export const Camara430 = widthStory(430, camara);
// @req REQ-178
export const Camara768 = widthStory(768, camara);
// @req REQ-178
export const Camara1280 = widthStory(1280, camara);
// @req REQ-178
export const Congo320 = widthStory(320, congo);
// @req REQ-178
export const Congo430 = widthStory(430, congo);
// @req REQ-178
export const Congo768 = widthStory(768, congo);
// @req REQ-178
export const Congo1280 = widthStory(1280, congo);
// @req REQ-178
export const Bantou320 = widthStory(320, bantou);
// @req REQ-178
export const Bantou430 = widthStory(430, bantou);
// @req REQ-178
export const Bantou768 = widthStory(768, bantou);
// @req REQ-178
export const Bantou1280 = widthStory(1280, bantou);
