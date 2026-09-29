# Editorial voice and audience review — 2026-09-30

Commission: clarify the operator's role as a popular educator, make agent-written
content accessible, preserve oral and written provenance, and define editorial
personas informed by measured site and social audiences.

## Task list

- [x] Read the governing instructions, existing register and audience reports.
- [x] Run the existing narration and skill-contract tests before changes (47 passed).
- [x] Collect current site and social metrics with explicit windows and limitations.
- [x] Correct contradictory writing instructions and connect the writing skills.
- [x] Define evidence-labelled editorial personas and a measurement protocol.
- [x] Review examples for preserved uncertainty and provenance; run relevant gates.

Documentation changes use the existing tests first and a semantic before/after
review. No new keyword test can establish whether prose respects an oral account
or makes a disputed claim sound certain. No application behaviour is changed.

## Diagnosis

1. `CLAUDE.md` already says that scientific method is a verification tool and
   that oral knowledge belongs in the project. It does not clearly introduce the
   operator as a popular educator who seeks specialist collaboration without
   claiming specialist qualifications.
2. Its certainty table still recommends opening with an authority, while its
   register section forbids that opening. Both instructions reach the same agent.
3. The register's rewriting examples move a publication year into an event date
   and remove attribution without preserving evidential limits. A book published
   in 1912 does not establish that a naming practice began or occurred in 1912.
4. `ethniafrica-structure` treats citing a book as an admission of not meeting
   people. Neither inference is warranted: a written reference is useful, and an
   agent must never imply fieldwork or community consultation that did not occur.
5. The old platform reference assigns ages, motives and a diaspora identity to
   platforms. Its historical label does not make those assumptions observations.
6. No dedicated editorial-persona document was found. Existing strategy identifies
   francophone diasporas but leaves their reading needs implicit.

## Deliverables

- [Reader-facing register](reader-facing-register.md): the shared practical guide.
- [Editorial personas](audience-personas.md): reader needs, evidence and unknowns.
- [Audience audit](../audience/audit-2026-09-30.md): fresh observations and handoffs.
- [Measurement protocol](../audience/editorial-measurement.md): what to measure
  next, definitions, denominators and interpretation limits.

The scope is future writing instructions and examples. Existing published pages,
corpus records and social posts are not bulk-rewritten; the audit does not certify
the historical claims printed in a publication title.

## Validation

- Baseline before edits: 15 narration tests and 32 audience/social skill-contract
  tests passed.
- Semantic review: examples preserve disputed status, local scope and the
  distinction between publication and event dates; oral provenance is not invented.
  Placeholder examples are explicitly patterns, not verified historical claims.
- Saved site evidence: 303 page rows match the 303-row appendix; 268 have fewer
  than five visitors. Dates and denominators are explicit in the report.
- `make check` passed with the declared Node 22 runtime: 1,025 Vitest files passed,
  3 skipped; 10,529 tests passed, 21 skipped; all 241 social-tool tests passed.
  Lint reports 35 existing warnings and no errors. The initial Node 25 run was
  stopped after runtime-related errors and was not counted as validation.
- `lint:req`, `check:dead`, `check:skill-parity`, `check:orphan-docs` and
  `check:local-paths` passed. Translation parity reports no findings for this
  documentation-only diff (no corpus records scanned).
- `check:infra-disclosure` passed its available shape checks; its configured-term
  scan was unavailable because `INFRA_DISCLOSURE_TERMS` is not configured locally.
- Formatting and diff whitespace checks passed. No application code, source-tier
  weights, consent configuration or published content was changed.
