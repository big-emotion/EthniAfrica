import { describe, expect, it } from "vitest";

import { ANSWER_FIXTURES } from "../__fixtures__/answerFixtures";
import { mapWordAnswers } from "../searchEnvelope";

const pharaoh = ANSWER_FIXTURES.pharaon.wordAnswers![0];

describe("mapWordAnswers", () => {
  // @req REQ-184
  it("decodes the answers a response carries on the envelope", () => {
    const decoded = mapWordAnswers({ data: { wordAnswers: [pharaoh] } });

    expect(decoded).toEqual([pharaoh]);
  });

  // @req REQ-184
  it("is empty when the response predates the field, or is not an envelope", () => {
    expect(mapWordAnswers({ data: {} })).toEqual([]);
    expect(mapWordAnswers({ data: [] })).toEqual([]);
    expect(mapWordAnswers(null)).toEqual([]);
    expect(mapWordAnswers({ data: { wordAnswers: "pharaon" } })).toEqual([]);
  });

  // @req REQ-184
  it("drops a malformed answer rather than render half of a claim", () => {
    const { origin: _origin, ...withoutOrigin } = pharaoh;
    const decoded = mapWordAnswers({
      data: {
        wordAnswers: [
          { ...pharaoh, kind: "people" },
          { ...pharaoh, title: "" },
          { ...pharaoh, names: "pharaon" },
          withoutOrigin,
        ],
      },
    });

    // An answer with no origin is still an answer: the block is simply absent.
    expect(decoded).toEqual([withoutOrigin]);
  });
});
