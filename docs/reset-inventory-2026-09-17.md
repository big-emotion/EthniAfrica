# Reset inventory — every configuration, documentation and rule file

Compiled 2026-09-17, read-only, from `git ls-files` (5 483 tracked files).
**Nothing was deleted, moved or modified.** This document exists so a decision to
start the configuration from scratch can be taken with the whole list in view.

**The instruction it answers.** Reset all project configuration and
documentation — MD files, CLAUDE.md, rules, skills — and keep everything that is
design, visual or UI. This file lists what that instruction would touch.

**The three things that look like configuration and are not.** Read §7 before
deleting anything: `public/modele-*.json`, `scripts/**` and `.github/**` are
load-bearing. Removing them does not clear the desk — it removes the gates that
are the only reason the corpus stays coherent.

---

## 1. Summary

| Group                          | Files    | Reset verdict                                       |
| ------------------------------ | -------- | --------------------------------------------------- |
| A. Agent instruction files     | 10       | Reset — this is the target                          |
| B. Skills (21 directories)     | 35       | Reset — but see §7.4, four are the publishing chain |
| C. Claude Code / plugin config | 10       | Reset, except two hook targets                      |
| D. Documentation               | 148 (+3) | Reset — the target                                  |
| D-bis. `public/modele-*.json`  | 17       | **Do not delete — data contracts**                  |
| E. Build / tooling config      | 33       | **Do not delete — the build stops**                 |
| F. CI (`.github/`)             | 25       | **Do not delete — see §7.3**                        |
| G. Scripts (`scripts/**`)      | 281      | **Do not delete — see §7.2**                        |
| **Design / UI — preserve**     | **≈236** | Keep, as instructed                                 |

---

## 2. Group A — agent instruction files (10)

| Path                                   | What it defines                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                            | 639-line master instruction: architecture, bilingual rules, Source Tier Policy, gates.        |
| `AGENTS.md`                            | 46-line brief for agents that do not autoload CLAUDE.md (Codex under Ferry).                  |
| `public/DIRECTIVES-AFRIK.md`           | Public AFRIK editorial methodology — decolonial posture rules, binding on editors and agents. |
| `prompts/developer.extra.md`           | Developer-agent overrides appended to Ferry's base prompt.                                    |
| `prompts/dev.claude-code.local.md`     | Open pull requests against `recette`, not the default branch.                                 |
| `prompts/refiner.claude-code.local.md` | The ETNI board columns the refiner must transition through.                                   |
| `prompts/review.claude-code.local.md`  | Disables the CI pre-gate for the reviewer agent.                                              |
| `prompts/review-comment.md`            | The canonical five-axis template every Ferry review comment follows.                          |
| `prompts/iterate.claude-code.local.md` | Best-effort CI fix, then transition back to In Review regardless.                             |
| `prompts/merge.claude-code.local.md`   | The merge agent is the only CI gate.                                                          |

Verified absent: no `.cursorrules`, no `.github/copilot-instructions.md`, no
`.cursor/`, no `GEMINI.md`, no nested `CLAUDE.md`. The root one is the only copy.

---

## 3. Group B — skills (21 directories, 35 files)

### 3.1 `ethniafrica-*` (17 directories, 20 files)

`ethniafrica-audience-audit` · `ethniafrica-audit` · `ethniafrica-bootstrap-confluence` ·
`ethniafrica-content-strategist` (4 files: `SKILL.md` + `reference/launch-plan.md`,
`reference/platforms.md`, `reference/published-state.md`) · `ethniafrica-essai` ·
`ethniafrica-experience-optimizer` · `ethniafrica-idee` · `ethniafrica-infra` ·
`ethniafrica-message` · `ethniafrica-mythe` · `ethniafrica-onomastique` ·
`ethniafrica-produire` · `ethniafrica-release` · `ethniafrica-reseaux-help` ·
`ethniafrica-spec` · `ethniafrica-structure` · `ethniafrica-ticket`.

### 3.2 `afrik-*` (4 directories, 14 files)

| Directory             | Files | Sub-files                                                                              |
| --------------------- | ----- | -------------------------------------------------------------------------------------- |
| `afrik-art-director`  | 2     | `SKILL.md`, `references/capture.md`                                                    |
| `afrik-curator`       | 6     | `SKILL.md`, `reference/{country-enrichment,directives,entities,source-tiers,tools}.md` |
| `afrik-game-designer` | 1     | `SKILL.md`                                                                             |
| `afrik-translator`    | 5     | `SKILL.md`, `reference/{field-classes,glossary,register,review-rules}.md`              |

Skill files are mirrored and validated by `scripts/ci/checkSkillParity.ts` and
`scripts/setupAgentSkillLinks.ts` — a reset of the skills must reset those two too,
or the gate fails on files that no longer exist.

---

## 4. Group C — Claude Code and plugin config (10)

| Path                                    | What it defines                                                             |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `.claude/settings.json`                 | Two PostToolUse hooks: lint every Write/Edit, provision every new worktree. |
| `scripts/lint-edited-file.sh`           | Hook target — lints a single edited file. **Keep if the hook stays.**       |
| `scripts/setup-worktree.sh`             | Hook target — provisions a new worktree. **Keep if the hook stays.**        |
| `.worktreeinclude`                      | Gitignored env files copied into every worktree.                            |
| `.mcp.json`                             | Three HTTP MCP servers: Atlassian, GitHub, Supabase.                        |
| `ferry.config.yaml`                     | Ferry: ETNI status → agent trigger columns.                                 |
| `ferry.local.yml`                       | Durable Ferry overrides, notably `review.ciGate: disabled`.                 |
| `ferry-jira-automation-rules.beta.json` | Machine-readable Jira Automation rules dispatching statuses to Ferry.       |
| `ferry-jira-automation-setup.md`        | Hand-edited walkthrough for those rules.                                    |
| `.ferry/verifications/ETNI-18.md`       | A dated Ferry verification record.                                          |

Verified absent: no `.claude/agents/`, no `.claude/commands/`, no
`.claude/settings.local.json`.

---

## 5. Group D — documentation (148 tracked + 3 written today)

### 5.1 Root level (7)

`README.md` (232 lines) · `CHANGELOG.md` · `LICENSE.md` · `tracker.md` (legacy
March 2026 enrichment tracker) · `CLAUDE.md` · `AGENTS.md` ·
`ferry-jira-automation-setup.md`.

### 5.2 `docs/` root (3)

`docs/DEPLOYMENT.md` · `docs/PRODUCTION-READINESS-AUDIT.md` (6th revision,
2026-09-14) · `docs/.confluence-bootstrap-complete` (empty sentinel preventing a
second bootstrap run — **deleting it re-arms the bootstrap**).

### 5.3 `docs/adr/` (2)

`README.md` (states ADRs live on Confluence, not here) · `0007-atlas-globe-engine.md`.

### 5.4 `docs/audience/` (4)

`audit-2026-09-07.md` · `audit-2026-09-12.md` · `audit-2026-09-14.md` ·
`message/message-audit-2026-09-13.md`.

**Consequence of a reset:** `ethniafrica-content-strategist` and
`ethniafrica-experience-optimizer` refuse a report older than 30 days. With none
at all, they revert to guessing without saying so.

### 5.5 `docs/confluence-spec/` (3)

`config.json` (cloudId, space, page IDs, ETNI issue types) · `bootstrap-catalog.json` ·
`req-catalog.json`.

**Do not delete `req-catalog.json`.** With the catalog missing,
`lintReqAnnotations.ts` returns early and reports OK while checking nothing — a
silently disarmed gate, which CLAUDE.md names as worse than a red one.

### 5.6 `docs/data-audits/` (2)

`language-tier-audit-glottolog-5.3.md` + its `-manifest.csv`.

### 5.7 `docs/editorial/` (43 tracked + 3 written today)

**Doctrine (11):** `purpose-doctrine.md` · `glossary.md` ·
`reader-facing-register.md` · `ui-copy.md` · `translation-classes.md` ·
`locale-indexing.md` · `classification-status.md` + `-ledger.json` ·
`congo-dossier-publication-notes.md` · `congo-dossier-translation-classification.md`.

**Essays (4 + 1 new):** `essais/README.md` · `pouvoir-de-nommer-2026-09-14.md` ·
`peuples-carrefours-2026-09-16.md` · **`saluer-l-autre-comme-il-se-nomme-2026-09-17.md`** (new).

**Written today (2):** `reponse-commentaires.md` ·
`audit-doctrine-publication-2026-09-17.md`.

**Country enrichment (13):** `country-enrichment/README.md` · `COD.json` ·
`COD-peoples.json` · `COD-languages.json` · `COD-history.json` · `COD-names.json` ·
`COD-culture-review.json` · `COD-source-review.json` · `COD-people-gap-Mbuti.json` ·
`EGY.json` · `EGY-peoples.json` · `sources/COD-glottolog-5.3.json` ·
`sources/COD-van-bulck-1954.json`.

**Demography cleanup (8):** `README.md` · `container-fiches.json` ·
`country-overcount.json` · `cross-check-divergences.json` · `duplicate-clusters.json` ·
`figure-status.json` · `impossible-entries.json` · `macro-groups.json`.

**Other ledgers (6):** `dossiers-realites/README.md` +
`research-collected-2026-09-06.json` · `family-restoration/README.md` +
`FLG_BERBERE.json` · `source-review/README.md` + `source-tier-rulings.json`.

**Warning.** Most of the JSON here is not documentation — it is **editorial state**:
which figures were rejected, which sources were ruled on, which families have been
started. `source-tier-rulings.json` is read by `checkSourceTierCoverage.ts` and
`applySourceTierRulings.ts`; deleting it loses every tier decision already made
and the `NEEDS_REVIEW_RATCHET = 915` becomes unreachable.

### 5.8 `docs/plans/` (1) · `docs/templates/` (1)

`plans/congo-history-dossiers.md` ·
`templates/jira-ticket-template.md` — **do not delete**, `check:jira-template` is
CI-blocking and CLAUDE.md names it explicitly.

### 5.9 `docs/runbooks/` (16)

`afrik-data-sync.md` · `anthroponym-coverage-plan.md` ·
`anthroponym-fiche-research.md` · `bilingual-copy-survey.md` ·
`corpus-translation.md` · `migration-state.md` · `moderation-access.md` ·
`ovh-production-deploy.md` · `person-extraction.md` · `plausible-self-hosted.md` ·
`quiz-bank-regeneration.md` · `restore-procedure.md` ·
`restore-drill-2025-07-14.md` · `revisions-dba-bypass.md` ·
`secret-exposure-audit-2026-09.md` · `v1-removal-cutover-2026-05.md`.

**Warning.** These are the only written record of how production is deployed,
restored and migrated — including the SSH-tunnel DDL procedure that exists nowhere
in code. A reset here is not a documentation reset; it is the loss of the recovery
procedure.

### 5.10 `docs/tasks/` (15 = 3 md + 12 PNG) · elsewhere (11)

`discoveries-content-inventory.md` · `discoveries-implementation.md` ·
`discoveries-social-inventory.md` · `discoveries-captures/*.png` (12, **visual — keep**).

Elsewhere: `e2e/README.md` · `social/harness/README.md` ·
`social/harness/fonts/LICENSES.md` + `OFL-Noto.txt` (**licences — keep**) ·
`social/tools/link-builder/README.md` ·
`public/images/{anecdotes,dossiers,home}/CREDITS.md` (**licences — keep**) ·
`_bmad-output/implementation-artifacts/spec-*.md` (5).

---

## 6. Groups D-bis, E, F, G — the load-bearing groups

### 6.1 `public/modele-*.json` — 17 data contracts

`modele-source.json` · `modele-peuple.json` · `modele-pays.json` ·
`modele-langue.json` · `modele-linguistique.json` · `modele-nom.json` and its five
sub-models (`nom-jamu`, `nom-nisba`, `nom-patronyme`, `nom-patronymique`,
`nom-totemique`) · `modele-relation.json` · `modele-migration.json` ·
`modele-dossier.json` · `modele-media.json` · `modele-recit-oral.json` ·
`modele-frontiere-coloniale.json`.

These are **not** configuration. They fix the mandatory section contract of every
fiche in `dataset/source/afrik/`. Deleting one does not simplify the project; it
makes several thousand fiches unvalidatable.

### 6.2 Build and tooling (33)

`package.json` (60 scripts, 16 `check:*` gates) · `package-lock.json` ·
`tsconfig.json` · `next.config.ts` · `tailwind.config.ts` · `postcss.config.js` ·
`components.json` · `eslint.config.mjs` · `eslint/plugins/afh.js` ·
`eslint/rules/*.js` (3) + `eslint/__tests__/*.test.js` (3) · `knip.json` ·
`vitest.config.ts` · `playwright.config.ts` · `.lighthouserc.js` +
`.lighthouserc.gate.js` + `scripts/lighthouse-setup.cjs` · `.prettierrc.json` +
`.prettierignore` · `.editorconfig` · `commitlint.config.mjs` ·
`lint-staged.config.mjs` · `.husky/pre-commit` + `.husky/commit-msg` · `.npmrc` ·
`.nvmrc` (Node 22) · `Makefile` · `Dockerfile` · `docker-compose.yml` ·
`.dockerignore` · `.env.example` + `e2e/.env.example` · `vercel.json` ·
`.gitleaks.toml` · `.gitignore` · `supabase/config.toml` · `instrumentation.ts` ·
`sentry.{client,server,edge}.config.ts` · `openapi-spec.json` ·
`config/sources/authorized-source-catalog.json` (38 citable domains with tier and
kind) · `config/sources/domain-tier-rulings.json` (353 rulings covering 3 530 of
3 945 URL-bearing citations) · `infra/plausible/**` (6).

### 6.3 CI — `.github/` (25)

22 workflows: `ci.yml` · `e2e.yml` · `a11y.yml` · `lighthouse.yml` ·
`data-integrity.yml` · `editorial-rules.yml` · `openapi-diff.yml` ·
`confidence-recompute.yml` · `migrate-recette.yml` · `migrations-replay.yml` ·
`deploy-preview-recette.yml` · `deploy-production.yml` · `recette-data-sync.yml` ·
`production-data-sync.yml` · `seed-moderation-allowlist.yml` ·
`storybook-deploy.yml` · `claude.yml` · `claude-code-review.yml` ·
`approve-agent-ci.yml` · `ferry-router.yml` · `ferry-reconcile.yml` ·
`ferry-cost-daily.yml`.

Plus `CODEOWNERS` · `dependabot.yml` · `pull_request_template.md`.

### 6.4 Scripts (281)

| Area                   | Files | What it holds                                                                                                                                                             |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/__tests__/`   | 138   | Vitest suites pinning every gate, migration and corpus rule.                                                                                                              |
| `scripts/lib/`         | 40    | Shared rule libraries: drift, ledgers, tiers, quiz, budgets.                                                                                                              |
| `scripts/afrik/`       | 28    | Corpus operations: tier rulings, country enrichment, ledgers.                                                                                                             |
| `scripts/ci/`          | 22    | The CI gate scripts and their tests.                                                                                                                                      |
| `scripts/audit/`       | 5     | People source-tier audit and report generation.                                                                                                                           |
| `scripts/discoveries/` | 3     | Generated-image derivation and its watermark asset.                                                                                                                       |
| `scripts/codemods/`    | 2     | The tier-string codemod and its test.                                                                                                                                     |
| Other + top-level      | ~43   | `validateAfrikData.ts`, `lintReqAnnotations.ts`, `checkEnvExample.ts`, `checkGithubActionPins.ts`, `checkJiraTemplate.ts`, `runCharterContracts.ts`, `openapi-diff.ts`, … |

---

## 7. What a reset would actually cost

**7.1 — `docs/editorial/**/*.json` is state, not prose.** Eight demography files,
thirteen country-enrichment files, the tier ruling ledger and the family
restoration ledger record decisions a human made once. They cannot be rewritten
from the code; they would have to be re-decided.

**7.2 — Deleting `scripts/**` disarms rather than simplifies.** Three gates fail
**silently** when their input disappears rather than failing red:
`lintReqAnnotations.ts` without `req-catalog.json`, `checkJiraTemplate.ts` without
the template, and `checkSkillParity.ts` against skills that no longer exist. A
disarmed gate reports OK while checking nothing.

**7.3 — Deleting `.github/workflows/` stops production deploys.** Publishing a
GitHub Release is the only thing that deploys production, and it is
`deploy-production.yml` that listens. `production-data-sync.yml` chains off it via
`workflow_run`, which only fires for workflow files on the default branch.

**7.4 — Deleting the skills deletes the publishing chain.** `idee → structure →
produire` plus the three gate skills (`message`, `mythe`, `onomastique`) are the
only written form of the social production method. Note that they are already
incomplete: the three canonical production prompts they specialise live in
`Guides/prompts-production-2026-09-09.md`, which resolves to `social/Guides/` — a
directory that does not exist in this repository (see
`editorial/audit-doctrine-publication-2026-09-17.md` §1, finding 4).

**7.5 — A clean reset is possible for one group only.** Group A (the ten agent
instruction files) and the prose half of group D can be rewritten from scratch
without breaking anything, because nothing executes them. That is the reset that
matches the stated intent: **rewrite the instructions, keep the machinery.**

---

## 8. Design and UI — preserve (≈236 files)

### 8.1 `docs/design/` (43)

**Purely visual (26):** `README.md` · `mockups/README.md` ·
`mockups/pages/{ds,famille,pays,peuple}.html` ·
`mockups/discoveries/discoveries-mobile.html` · `mockups/build.js` ·
`mockups/parts/{globe-shell.css,globe-core.js,nav-core.js,africa-admin0.json,africa-path.txt,corpus.json}` ·
`mockups/.gitignore` · `gabarits-social/tokens/{colors,typography,motion}.css` ·
`gabarits-social/notes/*` (12 rendering-rationale notes).

**Charters — textual doctrine, visually load-bearing (8):** `brand-charter.md` ·
`atlas-charter.md` · `typography-charter.md` · `actions-charter.md` ·
`games-charter.md` · `imagery-collections.md` · `moderation-charter.md` (process) ·
`games-rollout-plan.md` (partly superseded).

**Not visual despite the folder (3):** `name-to-country-linking.md` (IA) ·
`naming-subtype-taxonomy.md` (data contract) ·
`dossier-theme-architecture-proposal.md` (IA).

**Mixed — keep whole (1):** `gabarits-social/GABARITS-SOCIAL.md`. §0–§8 and §9/§9
bis are pixel-contractual; **§7 is editorial and legal** (credits, licences), **§10
is a data contract** consumed by `ethniafrica-structure`, **§11 is process**. The
visual sections cannot be separated from §10 without breaking the render pipeline.

### 8.2 `src/styles/` (38)

Tokens (6): `tokens/{color,type,space,radius,elevation,motion}.css`.
Surface stylesheets (16): `shell`, `site-chrome`, `hero`, `pager`, `dossier`,
`dossier-nommer`, `fiche-parchment`, `fiche-chapter-bar`, `section-heading`,
`facet-hub`, `classification-tree`, `glossaire`, `mobile-text`, `country-tokens`,
`people-tokens`, `swagger-night`.
Charter tests (16): `src/styles/__tests__/*.test.ts`, including
`gabaritsSocialTokenParity.test.ts`, which ties the render engine's token copy to
the site's.
Plus `src/index.css` and 7 CSS modules.

### 8.3 Storybook and design system (58)

`.storybook/{main,preview}.ts` · `src/stories/` (9: `Introduction.mdx`,
`DesignTokens.mdx`, `AutonymExonymHeading.stories.tsx`, and the six
`design-system/` specimens) · 47 `*.stories.tsx` under `src/components/**` ·
`storybook-deploy.yml` · `components.json`, `tailwind.config.ts`,
`postcss.config.js` as the shared token bridge.

### 8.4 Social render engine — `social/harness/` (51, visual)

Composition: `ethni_compose.py`, `ethni_carrousel2.py`, `ethni_montage.py`,
`ethni_render.py`, `ethni_compose_v1.py`.
Visual primitives: `ethni_tokens.py`, `ethni_type.py`, `ethni_plaque.py`,
`ethni_brand.py`, `ethni_soustitre.py`, `gold_burn.py`.
Brand assets: `ethniafrica-logo.png`, `outro-reseaux-sociaux.mp4`, and `fonts/`
(Anton, Fraunces, Montserrat, NotoSans, NotoSansEthiopic, NunitoSans, TikTokSans,
plus their licences).
Visual regression tests (~18) and the audio/pacing chain
(`ethni_audio.py`, `ethni_pauses.py`, `ethni_env.py`, `ethni_paths.py`,
`requirements.txt`).

`social/tools/` (25) is **editorial/pipeline, not design**: `etat-pipeline/` (6),
`library/register-post.mjs`, `link-builder/` (6), `migrate-cards/` (3),
`migrate-scenes/` (1), `prompt-builder/build-prompts.mjs`, `deck-migration.mjs`,
`paths.mjs`.

### 8.5 Other visual material (15)

`docs/tasks/discoveries-captures/*.png` (12) ·
`e2e/__screenshots__/mockup-reference/famille-{430,720,1240}.png` ·
`public/images/{anecdotes,dossiers,home}/CREDITS.md` ·
`scripts/design/captureMockupReferences.mjs` ·
`scripts/discoveries/assets/generated-image-mark.png` +
`render_generated_image_mark.py` · `.claude/skills/afrik-art-director/` (2) ·
`e2e/famille-visual.spec.ts`, `fiche-tile-measure.spec.ts`,
`fiche-section-gap.spec.ts`, `migrations-atlas-colorblind.spec.ts`,
`migrations-atlas-zoom.spec.ts`.
