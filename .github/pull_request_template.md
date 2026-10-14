## Summary

<!-- What changed and why. -->

## Test plan

<!-- How this was validated: tests run, manual checks, screenshots. -->

## Mockups first (any change a reader can see)

See `docs/design/mockup-first-workflow.md`. Leave unchecked and write N/A when
nothing visible changes.

- [ ] The boards were changed first and approved by the operator (canvas link: )
- [ ] `docs/design/mockups/site/` carries the approved boards
- [ ] The rendered pages match the boards at 430, 768 and 1440 px (comparison attached)

## Quiz session — manual a11y pass (release PRs only)

Only relevant if this PR is the release PR shipping Epic 10 (the quiz
journey) or otherwise touches the quiz route (`/fr/jeux/quiz`) and its session loop
(FR71, NFR20, UX-DR43). Leave unchecked/N/A on unrelated PRs.

- [ ] VoiceOver (iOS Safari, FR) — full segment → 8 questions → score journey
- [ ] NVDA (Windows Firefox, FR) — full segment → 8 questions → score journey
- [ ] 200% browser zoom — no horizontal scroll, no clipped content
- [ ] Deuteranopia/protanopia simulation on the verdict states — meaning isn't conveyed by color alone

Notes / issues found:
