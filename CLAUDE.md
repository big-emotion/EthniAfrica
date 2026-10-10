# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

EthniAfrica is a Next.js 16 (App Router) site publishing an open, sourced atlas of African
peoples, languages, linguistic families and countries, in French only. `README.md` is the
contributor reference (env vars, data model, API, deploy); this file covers what you need to
work in the code without re-deriving it.

**Read `docs/editorial/doctrine.md` before any work on content, publications or the search
result page.** It is the one statement of what the site is for: a reader searches a name, and
the result page shows its origin, its different names and the history of each — who named whom,
when, and why.

## Plain-language editorial requirement

Read `docs/editorial/reader-facing-register.md` before writing any public text,
including UI labels, database prose and social assets. That is the shared DITP-based
charter for all agents and skills. Write connected, everyday French; preserve
hypotheses, attribution, quotations and African spellings. A specialist audience
never overrides the plain-language requirement.

Before delivery, review the final text for meaning and natural sentences, then run
`npm run check:editorial`. For new or rewritten final publication files, also run
`npm run check:publication -- <files>`; rerun after edits. Use the DITP plain-language
approach and local Vale checks, with a direct review of meaning, structure and
accessibility. Do not use BMAD. The operational scope and remaining manual checks are in
`docs/editorial/plain-language-checks.md`. Never report a skipped check as passed.

For a social publication, start or resume with `/ethniafrica-social-production`.
Its canonical instructions are in `.claude/skills/ethniafrica-social-production/`;
Codex uses the same skill through `.agents/skills/`. The operator's 10 October 2026
workflow replaces the retired production chain. Three human approvals and a
durable per-piece checkpoint govern the work. The accepted Claude Design card
system is in `social/design-system/`; `version.json` records its acceptance.
Renderer integration remains pending; old templates are not a fallback.

## Commands

```bash
npm run dev                          # :3000
make check                           # the local gate: lint + typecheck + format:check + all tests (< 5 min)
npm run lint / npm run typecheck / npm run format

npx vitest run path/to/file.test.ts  # single file
npx vitest run -t "test name"        # single test by name
npm run test:watch
npm run unit-tests                   # src/lib only
npm run api-tests                    # src/app/api/v2 only

npm run e2e                          # Playwright, deliberately outside `make check`
npm run e2e:smoke                    # mobile-430 project, @smoke tag
npm run storybook                    # :6006
npx tsx scripts/validateAfrikData.ts # AFRIK corpus integrity
```

CI (`.github/workflows/ci.yml`) also runs repo-specific `check:*` gates on every PR — run the
ones your change touches before pushing. The ones most easily tripped:

- `lint:req` — every test file needs a `// @req REQ-NNN` annotation, validated against
  `docs/confluence-spec/req-catalog.json`. **Never delete `docs/confluence-spec/*.json` or
  `docs/templates/jira-ticket-template.md`**: with the catalog missing, the gate silently passes.
- `check:copy-literals` — new reader-facing French strings belong in the dictionaries under
  `src/lib/i18n/copy/`, not inline in components (diff-scoped; existing literals are grandfathered).
- `check:local-paths` / `check:infra-disclosure` — public repo: no workstation paths, server
  addresses, SSH ports or hosting-provider names. Both also run in the pre-commit hook.
- `check:dead` (knip, ratcheted), `check:env-example`, `check:migration-files`,
  `check:rls-coverage`, `check:orphan-docs` (a new doc must be linked; `npm run docs:index`).
- `openapi:diff` — breaking changes to `src/lib/api/openapiV2.ts`.

Pre-commit runs `typecheck` + lint-staged (eslint, prettier, `lintReqAnnotations --staged`,
`checkCopyLiterals --staged`). Commits follow Conventional Commits (commitlint).

## Testing reality

TypeScript runs with `strict: false` and `strictNullChecks: false` — the compiler will not catch
nullability, so **tests are the real gate**; write the failing test first. Vitest uses happy-dom,
`@` → `src`, and stubs `server-only`. Custom ESLint rules (`eslint/rules/`, plugin `afh`) have
`.js` RuleTester suites under `eslint/__tests__/`, explicitly included in `vitest.config.ts`.
Files under any `__tests__/known-failing/` directory are quarantined from the run.

## Architecture

### Data flow: git is the source of truth

```
dataset/source/afrik/**.json          editorial source of truth (fiches)
   ↓ src/lib/afrik/loaders/*JsonLoader.ts, scripts/migrateAfrikToDatabase.ts --target=local|recette|production
Supabase afrik_* tables               a projection of the fiches
   ↓ src/api/v2/services/*
/api/v2/*                             the only path by which pages and the browser read the corpus
```

Hierarchy: linguistic family (`FLG_*`) → language (ISO 639-3) → people (`PPL_*`) → country
(ISO 3166-1 alpha-3). Each fiche's shape is fixed by a strict model in `public/modele-*.json`
(the directory is the list) — never skip, rename or invent a section. Every `sources` entry
carries a tier enforced by `scripts/validateAfrikData.ts`. Loading runbook:
`docs/runbooks/afrik-data-sync.md` (`supabase start` + `--target=local` is the contributor path).

### API: route → handler → service

Every `/api/v2` endpoint spans three layers plus the spec; adding one touches all four:

```
src/app/api/v2/{resource}/route.ts   HTTP: parsing, CORS, cache headers
src/api/v2/handlers/{resource}.ts    business logic, serialization
src/api/v2/services/{resource}.ts    Supabase queries — the only layer that talks to the DB
src/lib/api/openapiV2.ts             OpenAPI spec
```

Shared pieces: `src/api/v2/{schemas (zod),serializers,utils}`, `src/lib/api/cors.ts`. V1
(`regions`, `ethnicities`) is gone; anything treating those as entities is stale.

### Supabase clients (`src/lib/supabase/`)

`server.ts` (SSR / server components) and `admin.ts` (service-role, server-only) are not
interchangeable. `auth-client.ts` / `auth-server.ts` handle moderator auth (magic link to an
`admin_allowlist` address); the browser authenticates but never queries the corpus. Migrations
are numbered in `supabase/migrations/`; a merge into `recette` applies them to recette, a
published Release applies them to production. Recette and production are self-hosted stacks —
the Supabase MCP cannot see either.

### `src/proxy.ts` (Next 16's middleware)

Load-bearing and doing several unrelated jobs: CSP with a per-request nonce, locale routing
(`/fr` only; retired English URLs 308 via `src/lib/legacyEnglishPaths.ts`, other two-letter
segments redirect to `/fr`), API-key metering for `/api/v2/*` (anonymous tier by IP from
`src/lib/api/clientIp.ts`; an invalid Bearer key is a 401, not a downgrade; `Origin`/`Referer`
authorise nothing), and Upstash rate limiting (fails closed in production).

### Pages and search

Pages live under `src/app/[lang]/` with French route folders (`atlas`, `comparer`, `jeux`,
`decouvertes`, …); `[lang]` only ever resolves to `fr` (`src/lib/locale.ts`). The search result
page (`/fr/atlas/recherche`) is the central surface — the site answers "where do the names of
Africa's peoples come from". `src/lib/search/naming.ts` is the one module that reads a name's
forms across the five storage shapes (people, country, family, patronyme, language);
`nameSubject.ts` returns every entity answering to a query rather than crowning one. No name
form is promoted over another. Where the reader searched, the searched form comes first and
leads visibly to the autonym; everywhere else the autonym comes first (doctrine §1.1).
Readers see a source's type (`source_kind`), never its tier: the tier is an internal audit field.

### Frontend conventions

Tailwind + shadcn/ui + TanStack Query. Colours come from CSS custom-property tokens in
`src/styles/tokens/`, never literals (asserted by `npm run test:charter-contracts`). Mobile-first:
mobile 430px · tablet `md` 720px · desktop `xl` 800px. Storybook uses `@storybook/react-vite`
(not `@storybook/nextjs`); installs need `--legacy-peer-deps`.

## Workflow

- `recette` is the integration branch, `main` the base; both protected — branch and open a PR.
  `recette ↔ main` sync PRs use a merge commit, not a squash.
- **Publishing a GitHub Release is the only production deploy** (`/ethniafrica-release`). Pushes
  and tags deploy nothing.
- Requirements, decisions and architecture (`REQ-`, `DEC-`, `ARCH-`) live on Confluence, not in
  the repo — see `docs/adr/README.md`. Don't add ADRs here. Tickets are Jira project `ETNI`.
- Project skills live in `.claude/skills/` (canonical; `.agents/skills/` is the gitignored Codex
  mirror, kept in sync by `npm run skills:link` and checked by `check:skill-parity`).
- Claude Code hooks (`.claude/settings.json`) lint each edited file and provision new worktrees
  via `scripts/setup-worktree.sh`.
