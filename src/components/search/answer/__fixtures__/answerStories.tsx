import type { Decorator } from "@storybook/react";

import { ANSWER_LABELS } from "@/lib/search/__fixtures__/answerLabels";
import { ANSWER_FIXTURES } from "@/lib/search/__fixtures__/answerFixtures";

export { ANSWER_LABELS };

// @req REQ-178
export function answerFixture(name: keyof typeof ANSWER_FIXTURES, index = 0) {
  const fixture = ANSWER_FIXTURES[name];
  const answer = fixture.answers[index] ?? fixture.wordAnswers?.[index];
  if (!answer) throw new Error(`No answer ${index} in fixture ${name}`);
  return { query: fixture.query, answer };
}

/**
 * A frame at one of the four proofed widths (320, 430, 768, 1280 px), on the
 * page ground: what a block sees in its slot. A horizontal scrollbar here is
 * the 320 px failure.
 */
const atWidth = (width: number): Decorator =>
  function WidthFrame(Story) {
    return (
      <div
        style={{ width }}
        className="bg-afh-bg p-afh-2xl text-afh-text"
        data-proof-width={width}
      >
        <Story />
      </div>
    );
  };

// @req REQ-178
export function widthStory<Args>(width: number, args: Args) {
  return {
    args,
    decorators: [atWidth(width)],
    parameters: { layout: "fullscreen" },
  };
}
