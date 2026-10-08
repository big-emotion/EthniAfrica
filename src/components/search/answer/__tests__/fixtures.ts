import { ANSWER_FIXTURES } from "@/lib/search/__fixtures__/answerFixtures";
import type { SearchAnswer } from "@/lib/search/answer";

export { ANSWER_LABELS } from "@/lib/search/__fixtures__/answerLabels";

// @req REQ-178
export function answerOf(
  name: keyof typeof ANSWER_FIXTURES,
  index = 0
): SearchAnswer {
  const fixture = ANSWER_FIXTURES[name];
  const answer = fixture.answers[index] ?? fixture.wordAnswers?.[index];
  if (!answer) throw new Error(`No answer ${index} in fixture ${name}`);
  return answer;
}
