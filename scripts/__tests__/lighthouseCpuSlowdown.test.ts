import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  cpuSlowdownFor,
  REFERENCE_DEVICE_BENCHMARK,
} = require("../lighthouse-cpu-slowdown.cjs");

// GitHub hands the audit either a runner Lighthouse benchmarks near 3 800 or
// one near 2 000. A fixed 4x throttle emulated two different phones, and the
// blocking-time budget failed on the slower one whatever the pull request did.
describe("cpuSlowdownFor", () => {
  // @req REQ-046
  it("keeps the 4x the budgets were set on, on the fast runner", () => {
    expect(cpuSlowdownFor(3800)).toBe(4);
  });

  // @req REQ-046
  it("throttles a slower runner less, so both emulate the same phone", () => {
    expect(cpuSlowdownFor(2000)).toBe(2.1);
    expect(2000 / cpuSlowdownFor(2000)).toBeCloseTo(
      REFERENCE_DEVICE_BENCHMARK,
      -1
    );
  });

  // @req REQ-046
  it("never speeds the page up on a runner slower than the phone itself", () => {
    expect(cpuSlowdownFor(500)).toBe(1);
  });

  // @req REQ-046
  it("falls back to 4x when the runner could not be measured", () => {
    expect(cpuSlowdownFor(undefined)).toBe(4);
    expect(cpuSlowdownFor(Number.NaN)).toBe(4);
    expect(cpuSlowdownFor(0)).toBe(4);
  });
});
