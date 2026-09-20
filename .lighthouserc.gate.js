// The Lighthouse check a pull request into `recette` can be required to pass.
//
// The nightly matrix (`.lighthouserc.js`) measures 29 URLs three times in
// ~16 minutes, and its performance numbers move with the runner. A required
// check has to be short and has to fail only on something the pull request
// did, so this one asserts the one category a GPU-less, throttled runner
// cannot distort — best practices — as an error, on five routes that cover
// the home, both globe fiches, the search page and the Découvertes reader. Accessibility is asserted
// by axe-core (a11y.yml) on the same routes instead, since ETNI-1948/DEC-054
// — see lighthouseAxeCoverage.test.ts. The performance metrics are still
// collected and printed as warnings, so a regression is visible on the pull
// request without making it unmergeable on runner noise; the nightly matrix
// is where performance blocks.
//
// One run per URL: best-practices audits read the DOM and the console, not
// timings, so a median of three would buy nothing but time.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- the lhci CLI loads this file as CommonJS, like the config it borrows from
const nightly = require("./.lighthouserc.js").ci;

module.exports = {
  ci: {
    collect: {
      ...nightly.collect,
      url: [
        "http://localhost:3000/fr",
        "http://localhost:3000/fr/atlas/pays/SEN",
        "http://localhost:3000/fr/atlas/peuples/PPL_WOLOF",
        "http://localhost:3000/fr/atlas/recherche",
        // The reader that mounts the third-party player facade. The gate never
        // clicks, so it holds the page as served, not the post-click state.
        "http://localhost:3000/fr/decouvertes",
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        // Dropped since ETNI-1948/DEC-054: axe-core (a11y.yml) already audits
        // every route this gate visits — lighthouseAxeCoverage.test.ts holds
        // that precondition — and Lighthouse's accessibility score is the
        // same axe-core engine run a second time on the same DOM. Two audits
        // of one tree bought nothing but the time to run the second one.
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:performance": ["warn", { minScore: 0.85 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 5500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: nightly.upload,
  },
};
