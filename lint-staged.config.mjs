export default {
  // Generic baseline shared by every Big Emotion project. Projects append
  // their own rows below (custom gates, generated-file checks) and keep these
  // two first, so the baseline stays diff-able against the standard.
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "tsx scripts/lintReqAnnotations.ts --staged",
    // PROJECT-SPECIFIC: new reader-facing French belongs in a dictionary
    // (REQ-145). Staged-scoped and grandfathered, so it blocks only the
    // literals this commit adds.
    "tsx scripts/ci/checkCopyLiterals.ts --staged",
    // Translation parity is deliberately absent: it is reported, never a
    // reason to refuse a commit (REQ-171, DEC-055). Run
    // `npm run check:translation-parity -- --staged` to read the report.
  ],
  "*.{css,md,mjs}": ["prettier --write"],
  "*.json": ["prettier --write"],

  // PROJECT-SPECIFIC: this repo also carries plain JS/JSX (scripts, config)
  // and YAML workflow definitions, both covered by the previous setup.
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{yml,yaml}": ["prettier --write"],
};
