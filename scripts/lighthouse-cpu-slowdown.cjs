// The CPU slowdown Lighthouse should apply on the runner that measures.
//
// GitHub's runners are not one machine. Lighthouse benchmarks some near 3 800
// and others near 2 000, and a fixed 4x on both emulated two phones, one twice
// as slow as the other: the same build measured 230 ms of blocking time on one
// and 370 ms on the other, so the budgets failed on whichever runner the job
// drew. Measured on the reports of pull requests #1703, #1711 and #1719
// (2026-10-13), where the same tree passed and failed by runner alone.
//
// Dividing the runner's benchmark by a fixed device benchmark keeps the
// emulated phone constant. The reference is the device the budgets were set
// against: 4x on a ~3 800 runner. The relation is approximate — Lighthouse's
// benchmark is one synthetic loop, assumed here to scale linearly with how
// fast the runner executes the page — but it is far closer than a constant.
const REFERENCE_DEVICE_BENCHMARK = 950;

/** Without a measurement, the 4x this config always used. */
const FALLBACK_SLOWDOWN = 4;

function cpuSlowdownFor(benchmarkIndex) {
  if (!Number.isFinite(benchmarkIndex) || benchmarkIndex <= 0) {
    return FALLBACK_SLOWDOWN;
  }
  const slowdown =
    Math.round((benchmarkIndex / REFERENCE_DEVICE_BENCHMARK) * 10) / 10;
  return Math.max(1, slowdown);
}

module.exports = { cpuSlowdownFor, REFERENCE_DEVICE_BENCHMARK };
