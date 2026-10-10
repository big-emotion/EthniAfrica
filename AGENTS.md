# Agent instructions

Read [CLAUDE.md](CLAUDE.md) for repository workflow, commands and architecture.
The same project instructions apply to Codex and Claude.

Before writing or reviewing any public text, read the shared
[reader-facing charter](docs/editorial/reader-facing-register.md). Apply it to
site copy, public data fields, captions, scripts, subtitles and accessibility text.
Every writing skill inherits it. Use everyday French and connected sentences;
preserve the source's meaning, actual uncertainty, quotations and African names.
Documentation, comments and commit messages stay in English; public copy is French.

Follow the [plain-language checks](docs/editorial/plain-language-checks.md):
write failing examples before extending a rule, use the smallest implementation,
review the final meaning, run `npm run check:editorial`, and check final publication
files with `npm run check:publication -- <files>`. A pass is a mechanical result,
not a claim of FALC compliance or a substitute for a reader's review.

Use the DITP plain-language approach, selected FALC recommendations and the local
Vale checks. Review meaning, reading order and accessibility directly; do not use
BMAD for this project's work. Do not rewrite a quotation or hide prose in an
excluded field to silence a warning. Do not refresh the legacy baseline to make
new errors pass.

Work test-first and keep solutions simple. Assess responsive presentation on
mobile (320–430px), then tablet (768–1199px), then desktop (1200px and above).

For social production, use `.claude/skills/ethniafrica-social-production/SKILL.md`
(also linked under `.agents/skills/` for Codex). The operator's 10 October 2026
workflow replaces the retired production chain. The accepted Claude Design card
system is in `social/design-system/`; `version.json` records its acceptance.
Verify renderer readiness before visual production.
